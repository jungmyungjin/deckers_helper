import { useLiveQuery } from 'dexie-react-hooks'
import { db, getMeta, newId, setMeta } from './localDb'
import { calcOutcome } from '../lib/outcome'
import { SMC_BY_ID } from '../data/gameData'

// ---- 쓰기 ----
export async function saveRun({ smcId, smcUpgrade = 0, playedAt, note, deckers, objectives }) {
  const outcome = calcOutcome(objectives, { requireAllObjectives: SMC_BY_ID[smcId]?.requireAllObjectives })
  const run = {
    id: newId(),
    smcId,
    smcUpgrade,
    playedAt: playedAt || new Date().toISOString(),
    outcome,
    note: note || '',
    deckers: deckers || [],
    objectives: objectives || [],
    deletedAt: null,
    updatedAt: null,
    dirty: 1,
  }
  await db.runs.add(run)
  return run
}

// 물리 삭제한 런의 누적 횟수. 기기 로컬 값이고 동기화되지 않는다.
const PURGED_KEY = 'purgedRunCount'

// 서버에 올라간 적 있는 런은 tombstone으로 남겨야 삭제가 다른 기기로 전파된다.
// 한 번도 올라간 적 없으면 지울 것이 서버에 없으므로 그냥 없앤다.
export async function deleteRun(id) {
  const run = await db.runs.get(id)
  if (!run) return
  if (!run.updatedAt) {
    await db.runs.delete(id)
    // 행이 사라지면 지웠다는 사실도 함께 사라진다. 업적 '없던 일로'가 셀 수 있도록
    // 횟수만 남긴다 — 기록 자체가 아니라 삭제했다는 사실만이라 meta 로 충분하다.
    await setMeta(PURGED_KEY, (await getMeta(PURGED_KEY, 0)) + 1)
    return
  }
  await db.runs.update(id, { deletedAt: new Date().toISOString(), dirty: 1 })
}

// ---- 조회 ----
// 화면에 쓰이는 런은 항상 이 함수를 거친다 (tombstone 제외, 최신순)
export async function allRuns() {
  const rows = await db.runs.orderBy('playedAt').reverse().toArray()
  return rows.filter((r) => !r.deletedAt)
}

export function useRuns() {
  return useLiveQuery(allRuns, [], [])
}

// 삭제한 기록 수 (업적 '없던 일로'). allRuns()가 tombstone을 걸러내므로 원본에서 센다.
// tombstone 은 다른 기기에서 지운 것까지 포함하고, 물리 삭제분은 이 기기의 카운터에서
// 온다. 한 런은 둘 중 한 경로만 타므로 겹쳐 세지 않는다.
export async function deletedRunCount() {
  const rows = await db.runs.toArray()
  const tombstones = rows.filter((run) => !!run.deletedAt).length
  return tombstones + (await getMeta(PURGED_KEY, 0))
}

export function useDeletedRunCount() {
  return useLiveQuery(deletedRunCount, [], 0)
}
