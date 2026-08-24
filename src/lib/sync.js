import { supabase, hasSupabase } from './supabase'
import { db } from '../db/localDb'

// 오프라인 퍼스트 동기화. run.id(로컬 생성 uuid)를 양쪽 PK로 써서 idempotent upsert.
// 병합 정책: union by id (같은 id면 중복 안 만듦). 로그인 시 자동 + 수동 버튼.

export async function syncAll(userId) {
  if (!hasSupabase || !userId) return { pushed: 0, pulled: 0, ok: false }
  const pushed = await pushLocal(userId)
  const pulled = await pullCloud(userId)
  return { pushed, pulled, ok: true }
}

async function pushLocal(userId) {
  const local = await db.runs.toArray()
  let n = 0
  for (const run of local) {
    if (run.synced) continue
    const { error } = await supabase.from('runs').upsert({
      id: run.id,
      user_id: userId,
      smc_id: run.smcId,
      played_at: run.playedAt,
      outcome: run.outcome,
      note: run.note || null,
      client_id: run.id,
      updated_at: new Date().toISOString(),
    })
    if (error) { console.warn('[sync] push run 실패:', error.message); continue }

    // 자식은 delete → insert (개인용 규모)
    await supabase.from('run_deckers').delete().eq('run_id', run.id)
    if (run.deckers?.length) {
      await supabase.from('run_deckers').insert(
        run.deckers.map((d) => ({ run_id: run.id, decker_id: d.deckerId, player_name: d.playerName || null }))
      )
    }
    await supabase.from('run_objectives').delete().eq('run_id', run.id)
    if (run.objectives?.length) {
      await supabase.from('run_objectives').insert(
        run.objectives.map((o) => ({
          run_id: run.id, cycle_no: o.cycleNo, objective_id: o.objectiveId,
          security: o.security, result: o.result, is_final: !!o.isFinal,
        }))
      )
    }
    await db.runs.update(run.id, { synced: 1 })
    n++
  }
  return n
}

async function pullCloud(userId) {
  const { data: runs, error } = await supabase.from('runs').select('*').eq('user_id', userId)
  if (error || !runs) { if (error) console.warn('[sync] pull 실패:', error.message); return 0 }
  let n = 0
  for (const r of runs) {
    const existing = await db.runs.get(r.id)
    if (existing) continue // union by id
    const { data: dks } = await supabase.from('run_deckers').select('*').eq('run_id', r.id)
    const { data: obs } = await supabase.from('run_objectives').select('*').eq('run_id', r.id)
    await db.runs.put({
      id: r.id, smcId: r.smc_id, playedAt: r.played_at, outcome: r.outcome, note: r.note || '', synced: 1,
      deckers: (dks || []).map((d) => ({ deckerId: d.decker_id, playerName: d.player_name || '' })),
      objectives: (obs || []).map((o) => ({
        cycleNo: o.cycle_no, objectiveId: o.objective_id, security: o.security, result: o.result, isFinal: o.is_final,
      })),
    })
    n++
  }
  return n
}
