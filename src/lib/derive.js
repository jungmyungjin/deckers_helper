// 기록에서 나오는 파생 계산. 보드·통계·업적·챌린지 뽑기가 전부 여기서 나온다.
//
// db/runs.js 와 나눠 둔 이유: 이쪽은 런 배열만 받는 순수 함수라 Dexie도 React도
// 필요 없다. 한 파일에 있을 때는 파생 계산 하나를 쓰려고 IndexedDB 전체를
// 끌고 들어와야 했다 — 업적 판정과 테스트가 먼저 걸려 넘어졌다.
import { buildObjectiveSlots, COPPERS, GOLDS, SILVERS, SMCS } from '../data/gameData'

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

// 다음에 도전할 칸을 정한다. 난도가 낮은 SMC 부터, 그 안에서는 Gold 카드 순서대로
// — 아직 안 깬 첫 칸이다. unclearedCombos 가 이미 SMCS(난도 오름차순) x GOLDS 순으로
// 훑으므로 맨 앞이 곧 그 칸이다.
//
// 남은 것 전체에서 고르게 뽑던 때는 입문 보스를 남겨둔 채 최상급이 걸리곤 했다.
// 뽑기가 도전이 아니라 벽이 됐다.
//
// 무작위는 칸이 아니라 셋업에 남는다 — 같은 칸을 다시 뽑아도 Copper/Silver 목표는
// 매번 다르게 굴러간다.
export function drawUncleared(runs) {
  return unclearedCombos(runs)[0] ?? null
}

function objectiveKey(objectives) {
  return ['copper', 'silver', 'gold']
    .map((security) => `${security}:${objectives.filter((o) => o.security === security).map((o) => o.objectiveId).join(',')}`)
    .join('|')
}

function validExtraSetup(run, smcId) {
  // 추가 도전은 기본 SMC의 모든 조합을 완주하는 단계다. 업그레이드 기록은
  // 별도 난도 기록으로 보관하되 이 진행도를 건너뛰게 하지는 않는다.
  if ((run.smcUpgrade || 0) !== 0) return false
  const slots = buildObjectiveSlots(smcId, run.smcUpgrade || 0)
  if (run.objectives?.length !== slots.length) return false
  return slots.every((slot, index) => run.objectives[index]?.security === slot.security && run.objectives[index]?.objectiveId)
    && ['copper', 'silver', 'gold'].every((security) => {
      const ids = run.objectives.filter((objective) => objective.security === security).map((objective) => objective.objectiveId)
      return ids.length === new Set(ids).size
    })
}

function completedExtraKeys(runs, smcId) {
  const keys = new Set()
  for (const run of runs) {
    if (run.smcId !== smcId || run.outcome === 'fail' || !validExtraSetup(run, smcId)) continue
    keys.add(objectiveKey(run.objectives))
  }
  return keys
}

function permutationsCount(n, length) {
  let result = 1
  for (let i = 0; i < length; i++) result *= n - i
  return result
}

// 추가 도전: 보스의 전체 목표 구성. 같은 색 카드도 순서가 다르면 별도 조합이다.
export function extraChallengeProgress(runs, smcId) {
  const keys = completedExtraKeys(runs, smcId)
  const slots = buildObjectiveSlots(smcId)
  const counts = Object.fromEntries(['copper', 'silver', 'gold'].map((security) => [security, slots.filter((slot) => slot.security === security).length]))
  const total = permutationsCount(COPPERS.length, counts.copper)
    * permutationsCount(SILVERS.length, counts.silver)
    * permutationsCount(GOLDS.length, counts.gold)
  return { completed: keys.size, total }
}

function randomDistinctIds(cards, count, random) {
  const pool = cards.map((card) => card.id)
  const result = []
  for (let i = 0; i < count; i++) {
    const index = Math.min(pool.length - 1, Math.floor(random() * pool.length))
    result.push(pool.splice(index, 1)[0])
  }
  return result
}

export function buildRandomObjectives(smcId, smcUpgrade = 0, random = Math.random, finalGoldId = null) {
  const slots = buildObjectiveSlots(smcId, smcUpgrade)
  const idsBySecurity = {
    copper: randomDistinctIds(COPPERS, slots.filter((slot) => slot.security === 'copper').length, random),
    silver: randomDistinctIds(SILVERS, slots.filter((slot) => slot.security === 'silver').length, random),
    gold: randomDistinctIds(GOLDS, slots.filter((slot) => slot.security === 'gold').length, random),
  }
  if (finalGoldId) {
    const golds = idsBySecurity.gold.filter((id) => id !== finalGoldId)
    idsBySecurity.gold = [...golds.slice(0, -1), finalGoldId]
  }
  const indexes = { copper: 0, silver: 0, gold: 0 }
  return slots.map((slot) => ({ ...slot, objectiveId: idsBySecurity[slot.security][indexes[slot.security]++] }))
}

function *permutations(ids, count, prefix = []) {
  if (prefix.length === count) { yield prefix; return }
  for (const id of ids) yield *permutations(ids.filter((candidate) => candidate !== id), count, [...prefix, id])
}

export function drawUnclearedExtraCombo(runs, smcId, random = Math.random) {
  const keys = completedExtraKeys(runs, smcId)
  const progress = extraChallengeProgress(runs, smcId)
  if (progress.completed >= progress.total) return null
  for (let i = 0; i < 48; i++) {
    const objectives = buildRandomObjectives(smcId, 0, random)
    if (!keys.has(objectiveKey(objectives))) return { objectives }
  }

  const counts = buildObjectiveSlots(smcId)
  const perSecurity = Object.fromEntries(['copper', 'silver', 'gold'].map((security) => [security, counts.filter((slot) => slot.security === security).length]))
  for (const copper of permutations(COPPERS.map((card) => card.id), perSecurity.copper)) {
    for (const silver of permutations(SILVERS.map((card) => card.id), perSecurity.silver)) {
      for (const gold of permutations(GOLDS.map((card) => card.id), perSecurity.gold)) {
        const ids = { copper, silver, gold }
        const index = { copper: 0, silver: 0, gold: 0 }
        const objectives = counts.map((slot) => ({ ...slot, objectiveId: ids[slot.security][index[slot.security]++] }))
        if (!keys.has(objectiveKey(objectives))) return { objectives }
      }
    }
  }
  return null
}
