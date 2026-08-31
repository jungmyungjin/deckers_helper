import { supabase, hasSupabase } from './supabase'
import { db, getMeta, setMeta } from '../db/localDb'
import { t } from '../i18n'

// 오프라인 퍼스트 동기화.
//   · run.id(클라이언트 uuid)를 양쪽 PK로 써서 upsert가 idempotent
//   · 런 1건 = 행 1개(자식은 JSONB)라 부분 실패가 없다
//   · 삭제는 deleted_at tombstone으로 전파
//   · pull은 updated_at 커서 기준 증분. 커서는 유저별로 따로 둬서
//     같은 기기에서 계정을 바꿔도 남의 커서를 물려받지 않는다.

const cursorKey = (userId) => `lastPulledAt:${userId}`

// 서버 원문 에러(영문 PostgREST 메시지)는 콘솔에만 남기고,
// 화면에는 사람이 읽을 수 있는 문장만 올린다.
function fail(userMessage, error) {
  console.error('[sync]', userMessage, error)
  throw new Error(userMessage)
}

export async function syncAll(userId) {
  if (!hasSupabase) return { pushed: 0, pulled: 0, reported: 0, ok: false }

  // 제보는 로그인과 무관하게 보낸다 — 게스트 모드도 정식 사용 경로라
  // 게스트가 만난 오류야말로 개발자에게 닿아야 한다.
  const reported = await pushReports(userId)

  if (!userId) return { pushed: 0, pulled: 0, reported, ok: true }
  const pushed = await pushLocal(userId)
  const pulled = await pullCloud(userId)
  return { pushed, pulled, reported, ok: true }
}

// 큐에 쌓인 오류 제보 전송. 건수가 적어 한 건씩 보낸다.
export async function pushReports(userId) {
  const pending = await db.reports.where('dirty').equals(1).sortBy('createdAt')
  let n = 0
  for (const r of pending) {
    const { error } = await supabase.from('reports').insert({
      id: r.id,
      user_id: userId || null,
      kind: r.kind,
      message: r.message,
      context: r.context || {},
    })
    // 23505 = PK 중복. 이미 들어갔는데 응답만 유실된 재시도이므로 전송된 것으로 본다.
    if (error && error.code !== '23505') {
      fail(t('sync.reportFailed'), error)
    }
    await db.reports.update(r.id, { dirty: 0 })
    n++
  }
  return n
}

async function pushLocal(userId) {
  const pending = await db.runs.where('dirty').equals(1).toArray()
  if (pending.length === 0) return 0

  // 한 번의 upsert로 전부. 실패하면 dirty가 그대로 남아 다음 동기화에서 재시도된다.
  const { data, error } = await supabase
    .from('runs')
    .upsert(pending.map((r) => ({
      id: r.id,
      user_id: userId,
      smc_id: r.smcId,
      smc_upgrade: r.smcUpgrade || 0,
      played_at: r.playedAt,
      outcome: r.outcome,
      note: r.note || '',
      deckers: r.deckers || [],
      objectives: r.objectives || [],
      deleted_at: r.deletedAt || null,
    })))
    .select('id, updated_at')

  if (error) fail(t('sync.pushFailed'), error)

  // 서버가 확인해준 행만 dirty 해제 + 서버 시계 기준 updated_at 저장
  await db.transaction('rw', db.runs, async () => {
    for (const row of data) {
      await db.runs.update(row.id, { dirty: 0, updatedAt: row.updated_at })
    }
  })
  return data.length
}

async function pullCloud(userId) {
  const since = await getMeta(cursorKey(userId))

  let q = supabase.from('runs').select('*').eq('user_id', userId)
  if (since) q = q.gt('updated_at', since)

  const { data, error } = await q.order('updated_at', { ascending: true })
  if (error) fail(t('sync.pullFailed'), error)
  if (!data.length) return 0

  let n = 0
  await db.transaction('rw', db.runs, async () => {
    for (const r of data) {
      const local = await db.runs.get(r.id)
      // 아직 못 올린 로컬 변경이 있으면 로컬을 남긴다.
      // 다음 push에서 서버가 갱신되므로 결국 양쪽이 수렴한다.
      if (local?.dirty) continue
      await db.runs.put({
        id: r.id,
        smcId: r.smc_id,
        smcUpgrade: r.smc_upgrade || 0,
        playedAt: r.played_at,
        outcome: r.outcome,
        note: r.note || '',
        deckers: r.deckers || [],
        objectives: r.objectives || [],
        deletedAt: r.deleted_at || null,
        updatedAt: r.updated_at,
        dirty: 0,
      })
      n++
    }
  })

  // 오름차순으로 받았으므로 마지막이 최댓값
  await setMeta(cursorKey(userId), data[data.length - 1].updated_at)
  return n
}
