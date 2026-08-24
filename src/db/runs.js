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
    synced: 0,
    deckers: deckers || [],
    objectives: objectives || [],
  }
  await db.runs.add(run)
  return run
}

export async function deleteRun(id) {
  await db.runs.delete(id)
}

// ---- 조회 ----
export async function allRuns() {
  return db.runs.orderBy('playedAt').reverse().toArray()
}

// 한 런의 최종 Gold 카드 id
export function finalGoldId(run) {
  const f = run.objectives?.find((o) => o.isFinal && o.security === 'gold')
  if (f) return f.objectiveId
  // fallback: 마지막 gold
  const golds = (run.objectives || []).filter((o) => o.security === 'gold')
  return golds.length ? golds[golds.length - 1].objectiveId : null
}

// 도장 보드: key = `${smcId}|${goldId}` → { cleared, perfect, wins }
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
