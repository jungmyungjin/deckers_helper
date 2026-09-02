import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId } from './localDb'
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

// 서버에 올라간 적 있는 런은 tombstone으로 남겨야 삭제가 다른 기기로 전파된다.
// 한 번도 올라간 적 없으면 지울 것이 서버에 없으므로 그냥 없앤다.
export async function deleteRun(id) {
  const run = await db.runs.get(id)
  if (!run) return
  if (!run.updatedAt) {
    await db.runs.delete(id)
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
