import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId } from './localDb'
import { calcOutcome } from '../lib/outcome'
import { GOLDS, SMCS } from '../data/gameData'

// ---- 쓰기 ----
export async function saveRun({ smcId, playedAt, note, deckers, objectives }) {
  const outcome = calcOutcome(objectives)
  const run = {
    id: newId(),
    smcId,
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

// 한 런의 최종 Gold 카드 id
export function finalGoldId(run) {
  const f = run.objectives?.find((o) => o.isFinal && o.security === 'gold')
  if (f) return f.objectiveId
  // fallback: 마지막 gold
  const golds = (run.objectives || []).filter((o) => o.security === 'gold')
  return golds.length ? golds[golds.length - 1].objectiveId : null
}

// 미션 보드: key = `${smcId}|${goldId}` → { cleared, perfect, wins }
export function computeBoard(runs) {
  const map = {}
  for (const run of runs) {
    if (run.outcome === 'fail') continue
    const gid = finalGoldId(run)
    if (!gid) continue
    const key = `${run.smcId}|${gid}`
    const cell = map[key] || { cleared: true, perfect: false, wins: 0 }
    cell.wins += 1
    if (run.outcome === 'perfect') cell.perfect = true
    map[key] = cell
  }
  return map
}

// 셀 클릭 상세: 특정 (smcId, goldId)에 도전한 모든 런 (실패 포함), 최신순
export function attemptsFor(runs, smcId, goldId) {
  return runs
    .filter((r) => r.smcId === smcId && finalGoldId(r) === goldId)
    .sort((a, b) => (a.playedAt < b.playedAt ? 1 : -1))
}

// 통계
export function computeStats(runs) {
  const board = computeBoard(runs)
  const stamps = Object.keys(board).length
  const totalCells = SMCS.length * GOLDS.length // 84
  const wins = runs.filter((r) => r.outcome !== 'fail').length
  const perfects = runs.filter((r) => r.outcome === 'perfect').length
  const winRate = runs.length ? Math.round((wins / runs.length) * 100) : 0
  return { stamps, totalCells, total: runs.length, wins, perfects, winRate }
}

// 아직 못 깬 (smc, gold) 조합 목록 — 셔플/챌린지용
export function unclearedCombos(runs) {
  const board = computeBoard(runs)
  const out = []
  for (const smc of SMCS) for (const g of GOLDS) {
    if (!board[`${smc.id}|${g.id}`]) out.push({ smcId: smc.id, goldId: g.id })
  }
  return out
}
