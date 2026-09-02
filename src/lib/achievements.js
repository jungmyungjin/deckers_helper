import { DECKERS, DECKER_BY_ID, GOLDS, SMCS, SMC_BY_ID } from '../data/gameData'
import { computeBoard, extraChallengeProgress, finalGoldId } from './derive'
import koContent from '../data/content/ko.json'
import enContent from '../data/content/en.json'
import deContent from '../data/content/de.json'

// 업적은 runs에서만 파생된다 — 저장하는 값이 없으므로 기록만 동기화되면
// 어느 기기에서든 같은 결과가 나온다. 목록과 조건은 docs/achievements.md.
//
// 여기서 판정이 어긋나면 화면 전체가 어긋나므로, 화면 코드가 아니라 이 파일에 둔다.
//
// ★ 조건은 "한 번 참이면 계속 참"이어야 한다. 파생 계산이라 상태를 저장하지 않으니,
//   지금 이 순간의 상태(승률 0%, 승패 동수)를 조건으로 쓰면 다음 판에 업적이 사라진다.
//   그래서 그런 것들은 "그런 적이 있었는가"(앞부분 스캔·연속 구간)로 바꿔 판정한다.

const CONTENTS = [koContent, enContent, deContent]

// ---- 런 하나를 읽는 도우미 ----
const won = (run) => run.outcome !== 'fail'
const lost = (run) => run.outcome === 'fail'
const noteOf = (run) => (run.note || '').trim()
const objectivesOf = (run) => run.objectives || []
const deckersOf = (run) => run.deckers || []
const deckerIdsOf = (run) => deckersOf(run).map((d) => d.deckerId).filter(Boolean)
const playerNamesOf = (run) => deckersOf(run).map((d) => (d.playerName || '').trim())
const upgradeOf = (run) => Number(run.smcUpgrade) || 0
const difficultyOf = (run) => SMC_BY_ID[run.smcId]?.difficulty || 0
const timeOf = (run) => new Date(run.playedAt)
const cellKeyOf = (run) => {
  const goldId = finalGoldId(run)
  return goldId ? `${run.smcId}|${goldId}` : null
}
const dayKeyOf = (run) => {
  const d = timeOf(run)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
// 목표가 하나라도 든 판에서, 최종을 뺀 나머지
const midObjectives = (run) => objectivesOf(run).filter((o) => !o.isFinal)

const failedCard = (run, cardId) =>
  objectivesOf(run).some((o) => o.objectiveId === cardId && o.result === 'fail')
const hasCard = (run, cardId) => objectivesOf(run).some((o) => o.objectiveId === cardId)

// ---- 목록 도우미 ----
const ascending = (runs) => [...runs].sort((a, b) => String(a.playedAt).localeCompare(String(b.playedAt)))

function tally(keys) {
  const map = new Map()
  for (const key of keys) if (key != null) map.set(key, (map.get(key) || 0) + 1)
  return map
}

function largest(map) {
  let best = { id: null, value: 0 }
  for (const [id, value] of map) if (value > best.value) best = { id, value }
  return best
}

/** 조건을 만족하는 런이 length 개 이어진 구간이 한 번이라도 있었는가 */
function hadStreak(list, length, ok) {
  let run = 0
  for (const item of list) {
    run = ok(item) ? run + 1 : 0
    if (run >= length) return true
  }
  return false
}

/** 가장 긴 연속 구간의 길이 */
function longestStreak(list, ok) {
  let best = 0
  let run = 0
  for (const item of list) {
    run = ok(item) ? run + 1 : 0
    if (run > best) best = run
  }
  return best
}

/** 바로 이웃한 두 런이 조건을 만족한 적이 있는가 */
function hadPair(list, ok) {
  for (let i = 1; i < list.length; i++) if (ok(list[i - 1], list[i])) return true
  return false
}

const DAY = 86400000
const dayNumber = (run) => {
  const d = timeOf(run)
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / DAY)
}

// ---- 파생 지표 ----

export function computeMetrics(runs, { deletedCount = 0 } = {}) {
  const asc = ascending(runs)
  const board = computeBoard(asc)
  const wins = asc.filter(won).length
  const perfects = asc.filter((r) => r.outcome === 'perfect').length

  const deckerCounts = tally(asc.flatMap(deckerIdsOf))
  const bossCounts = tally(asc.map((r) => r.smcId))
  const cellCounts = tally(asc.map(cellKeyOf))
  const playerCounts = tally(asc.flatMap((r) => playerNamesOf(r).map((n) => n.toLowerCase()).filter(Boolean)))

  const clearedGoldIds = new Set()
  const clearedBossIds = new Set()
  for (const key of Object.keys(board)) {
    const [smcId, goldId] = key.split('|')
    clearedBossIds.add(smcId)
    clearedGoldIds.add(goldId)
  }

  // 가로줄(보스 하나의 Gold 12칸) / 세로줄(Gold 하나의 7보스) 최대 진행
  const rowBest = Math.max(0, ...SMCS.map((smc) => GOLDS.filter((g) => board[`${smc.id}|${g.id}`]).length))
  const colBest = Math.max(0, ...GOLDS.map((g) => SMCS.filter((smc) => board[`${smc.id}|${g.id}`]).length))

  const extraBest = Math.max(0, ...SMCS.map((smc) => extraChallengeProgress(asc, smc.id).completed))

  const topDecker = largest(deckerCounts)
  const topBoss = largest(bossCounts)
  const topCell = largest(cellCounts)

  return {
    runs: asc,
    board,
    deletedCount,
    total: asc.length,
    wins,
    losses: asc.length - wins,
    perfects,
    stamps: Object.keys(board).length,
    winStreak: longestStreak(asc, won),
    dexBoss: clearedBossIds.size,
    dexGold: clearedGoldIds.size,
    dexDecker: DECKERS.filter((d) => (deckerCounts.get(d.id) || 0) >= 1).length,
    crewBalance: DECKERS.filter((d) => (deckerCounts.get(d.id) || 0) >= 3).length,
    rowBest,
    colBest,
    extraBest,
    topDecker,
    topBoss,
    topCell,
    deckerCounts,
    bossCounts,
    cellCounts,
    playerCounts,
  }
}

// ---- 히든 판정 ----
// 히든은 진행도를 보여주지 않으므로 참/거짓만 있으면 된다. 조건마다 훑는 방식이
// 달라서(런 하나 / 이웃한 둘 / 연속 구간 / 하루 단위 / 칸 단위) 그 축으로 나눈다.

function flagsPerRun(asc) {
  const flags = []
  const add = (id) => flags.push(id)
  let comebacks = 0

  for (const run of asc) {
    const objectives = objectivesOf(run)
    const mid = midObjectives(run)
    const deckerIds = deckerIdsOf(run)
    const names = playerNamesOf(run)
    const note = noteOf(run)
    const time = timeOf(run)
    const hour = time.getHours()
    const minute = time.getMinutes()

    if (won(run) && mid.length > 0 && mid.every((o) => o.result === 'fail')) {
      comebacks += 1
      add('comeback')
      if (comebacks >= 3) add('lucky-3')
    }
    if (run.smcId === 'sentinel' && run.outcome === 'perfect') add('sentinel-perfect')
    if (run.outcome === 'perfect' && deckerIds.length === 1) add('solo-perfect')
    if (won(run) && deckerIds.length === 4) add('full-crew')
    if (won(run) && upgradeOf(run) >= 1) add('overload')
    if (won(run) && upgradeOf(run) >= 2 && difficultyOf(run) >= 4 && deckerIds.length === 1) add('suicide-mission')
    if (won(run) && objectives.some((o) => o.security === 'ghost')) add('ghost-seen')
    if (objectives.length >= 4 && objectives.every((o, i) => i === 0 || o.result !== objectives[i - 1].result)) {
      add('rollercoaster')
    }
    if (lost(run) && run.smcId === 'alpha-moby') add('tutorial-fail')
    if (lost(run) && run.smcId === 'mother') add('mother-scold')
    if (objectives.length > 0 && objectives.every((o) => o.result === 'fail')) add('total-failure')

    if (failedCard(run, 'copper-404-not-found')) add('err-404')
    if (failedCard(run, 'copper-access-denied')) add('access-denied')
    if (failedCard(run, 'copper-keycode')) add('wrong-keycode')
    if (failedCard(run, 'copper-shattered-glass')) add('glass-heart')
    if (failedCard(run, 'copper-misdirection')) add('misdirected')
    if (failedCard(run, 'copper-garbage-detail')) add('garbage-fail')

    if (deckerIds.length === 4 && names.every((n) => n && n.toLowerCase() === names[0].toLowerCase())) add('one-man-four')
    if (won(run) && deckerIds.length > 0 && names.every((n) => !n)) add('anonymous')
    if (deckersOf(run).some((d) => d.playerName && isDeckerName(d.deckerId, d.playerName))) add('method-acting')

    if (hour >= 0 && hour < 5) add('night-owl')
    if (hour === 4 && minute === 44) add('clock-444')
    if (hour === 0 && minute === 0) add('cinderella')
    if (time.getMonth() === 11 && time.getDate() === 25) add('christmas')
    if (time.getMonth() === 0 && time.getDate() === 1) add('new-year')
    if (time.getMonth() === 11 && time.getDate() === 31 && hour >= 23) add('year-end')
    if (time.getMonth() === 1 && time.getDate() === 29) add('leap-day')
    if (lost(run) && time.getDate() === 13 && time.getDay() === 5) add('friday-13')
    if (time.getMonth() === 0 && time.getDate() === 1
      && objectivesOf(run).some((o) => o.objectiveId === 'silver-fireworks' && o.result === 'success')) {
      add('fireworks')
    }

    if (note.length >= 300) add('diary')
    if (note.length === 1) add('speechless')
    if (note && LAUGH.test(note)) add('lol-only')
  }
  return flags
}

// 웃음 표기만으로 이루어진 메모. 세 언어를 한 판정에 담는다 —
// 조건은 언어와 무관해야 하고, 이름만 언어별로 다르게 붙인다.
const LAUGH = /^(?:[ㅋㅎ]|ha|he|hi|lol|lmao|xd|:d|😂|🤣|\s)+$/i

function isDeckerName(deckerId, playerName) {
  const typed = playerName.trim().toLowerCase()
  if (!typed) return false
  return CONTENTS.some((bundle) => (bundle.decker?.[deckerId]?.name || '').toLowerCase() === typed)
}

function flagsFromSequence(asc) {
  const flags = []
  const add = (id) => flags.push(id)

  if (asc[0]?.outcome === 'perfect') add('first-perfect')
  if (asc[0] && lost(asc[0])) add('first-loss')
  if (asc[12] && lost(asc[12])) add('unlucky-13')
  if (asc.length >= 42) add('run-42')
  if (asc.length >= 84) add('run-84')
  if (asc.length >= 100) add('run-100')

  // 첫 10판이 전부 패배 — "지금 승률 0%"는 다음 승리에 사라지므로 앞부분으로 본다
  if (asc.length >= 10 && asc.slice(0, 10).every(lost)) add('zero-percent')

  // 승과 패가 같아진 순간이 한 번이라도 있었는가
  let wins = 0
  for (let i = 0; i < asc.length; i++) {
    if (won(asc[i])) wins += 1
    const played = i + 1
    if (played >= 20 && wins * 2 === played) { add('balance'); break }
  }

  if (hadStreak(asc, 3, (r) => r.outcome === 'perfect')) add('flawless-3')
  if (hadStreak(asc, 20, (r) => r.smcId === 'alpha-moby')) add('safe-zone')
  if (hadStreak(asc, 10, (r) => difficultyOf(r) >= 4)) add('ordeal')
  if (hadStreak(asc, 20, (r) => deckerIdsOf(r).length === 1)) add('loner')
  if (hadStreak(asc, 10, (r) => !!noteOf(r))) add('diligent')
  if (hadStreak(asc, 50, (r) => !noteOf(r))) add('silent-decker')

  // 최종 Gold가 같은 카드로 5연속
  let sameGold = 0
  let previousGold = null
  for (const run of asc) {
    const goldId = finalGoldId(run)
    sameGold = goldId && goldId === previousGold ? sameGold + 1 : 1
    previousGold = goldId
    if (goldId && sameGold >= 5) { add('one-road'); break }
  }

  // 덱커 구성이 매번 바뀐 10판
  let varied = 0
  let previousCrew = null
  for (const run of asc) {
    const crew = deckerIdsOf(run).slice().sort().join(',')
    varied = crew && crew !== previousCrew ? varied + 1 : 1
    previousCrew = crew
    if (varied >= 10) { add('whimsical'); break }
  }

  if (hadPair(asc, (a, b) => a.outcome === 'perfect' && lost(b))) add('hubris')
  if (hadPair(asc, (a, b) => hasCard(a, 'copper-double-switch') && hasCard(b, 'copper-double-switch'))) add('double-switch')
  if (hadPair(asc, (a, b) => noteOf(a) && noteOf(a) === noteOf(b))) add('copypaste')
  if (hadPair(asc, (a, b) => timeOf(b) - timeOf(a) < 60000)) add('time-traveler')
  if (hadPair(asc, (a, b) => timeOf(b) - timeOf(a) >= 90 * DAY)) add('return-90')
  if (hadPair(asc, (a, b) => timeOf(a).getHours() === 23 && timeOf(b).getHours() === 0
    && timeOf(b) - timeOf(a) < 2 * 3600000)) add('all-nighter')

  if (asc.length >= 2 && timeOf(asc[asc.length - 1]) - timeOf(asc[0]) >= 365 * DAY) add('anniversary')
  if (asc.length >= 2) {
    const first = dayNumber(asc[0])
    if (asc.some((run) => dayNumber(run) - first === 365)) add('one-year')
  }

  // 업그레이드 2단계 첫 도전이 패배였는가
  const firstUpgraded = asc.find((run) => upgradeOf(run) >= 2)
  if (firstUpgraded && lost(firstUpgraded)) add('greed')
  const firstSentinel = asc.find((run) => run.smcId === 'sentinel')
  if (firstSentinel && won(firstSentinel)) add('by-the-book')

  return flags
}

function flagsFromCells(asc) {
  const flags = []
  const add = (id) => flags.push(id)

  // 칸(보스 × 최종 Gold) 단위로 도전 순서를 되짚는다
  const byCell = new Map()
  for (const run of asc) {
    const key = cellKeyOf(run)
    if (!key) continue
    if (!byCell.has(key)) byCell.set(key, [])
    byCell.get(key).push(run)
  }

  let firstTryClears = 0
  for (const attempts of byCell.values()) {
    if (won(attempts[0])) firstTryClears += 1

    const firstWin = attempts.findIndex(won)
    const failsBefore = firstWin === -1 ? attempts.length : firstWin
    if (firstWin !== -1 && failsBefore >= 3) add('persistence')
    if (firstWin !== -1 && failsBefore >= 5) add('breakthrough')
    if (hadStreak(attempts, 5, lost)) add('the-wall')
  }
  if (firstTryClears >= 20) add('one-shot')

  // 미션 카드(최종 Gold) 하나에서 누적 5패 — 보스는 따지지 않는다
  const cardFails = tally(asc.filter(lost).map(finalGoldId))
  if (largest(cardFails).value >= 5) add('nemesis-card')

  // 보스별 순서로 연패를 본다
  const byBoss = new Map()
  for (const run of asc) {
    if (!byBoss.has(run.smcId)) byBoss.set(run.smcId, [])
    byBoss.get(run.smcId).push(run)
  }
  for (const [smcId, list] of byBoss) {
    if (hadStreak(list, 5, lost)) add('unbeaten-boss')
    if (smcId === 'alpha-moby' && list.filter(lost).length >= 3) add('whale-phobia')
  }
  if (SMCS.every((smc) => (byBoss.get(smc.id) || []).some(lost))) add('beaten-by-all')

  // 같은 덱커로 대성공 5판
  const perfectDeckers = tally(asc.filter((r) => r.outcome === 'perfect').flatMap(deckerIdsOf))
  if (largest(perfectDeckers).value >= 5) add('perfect-partner')

  // 같은 플레이어 이름으로 30판
  const players = tally(asc.flatMap((r) => playerNamesOf(r).map((n) => n.toLowerCase()).filter(Boolean)))
  if (largest(players).value >= 30) add('same-player-30')

  // 같은 프로필의 앞면과 뒷면을 모두 써봤는가
  const sidesByProfile = new Map()
  for (const id of asc.flatMap(deckerIdsOf)) {
    const decker = DECKER_BY_ID[id]
    if (!decker) continue
    if (!sidesByProfile.has(decker.profileId)) sidesByProfile.set(decker.profileId, new Set())
    sidesByProfile.get(decker.profileId).add(decker.side)
  }
  if ([...sidesByProfile.values()].some((sides) => sides.size >= 2)) add('double-life')

  if (asc.filter((r) => !!noteOf(r)).length >= 20) add('chronicler')

  return flags
}

function flagsFromDays(asc) {
  const flags = []
  const add = (id) => flags.push(id)

  const byDay = new Map()
  for (const run of asc) {
    const key = dayKeyOf(run)
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key).push(run)
  }

  for (const list of byDay.values()) {
    if (list.length >= 3) add('marathon')
    if (list.length >= 7) add('seven-a-day')
    if (list.length >= 5 && list.every(won)) add('on-fire')
    if (new Set(list.map((r) => r.smcId)).size >= SMCS.length) add('full-course')
    if (new Set(list.flatMap(deckerIdsOf)).size >= 8) add('revolving-door')
  }

  // 며칠 이어서 기록했는가
  const days = [...new Set(asc.map(dayNumber))].sort((a, b) => a - b)
  let streak = 0
  let best = 0
  for (let i = 0; i < days.length; i++) {
    streak = i > 0 && days[i] - days[i - 1] === 1 ? streak + 1 : 1
    if (streak > best) best = streak
  }
  if (best >= 3) add('days-3')
  if (best >= 7) add('days-7')

  return flags
}

function flagsFromBoard(board) {
  const flags = []
  const cleared = (smcIndex, goldIndex) => !!board[`${SMCS[smcIndex].id}|${GOLDS[goldIndex].id}`]

  if (SMCS.every((_, i) => cleared(i, i))) flags.push('diagonal')
  if ([[0, 0], [0, GOLDS.length - 1], [SMCS.length - 1, 0], [SMCS.length - 1, GOLDS.length - 1]]
    .every(([s, g]) => cleared(s, g))) flags.push('corners')

  outer: for (let s = 0; s < SMCS.length - 1; s++) {
    for (let g = 0; g < GOLDS.length - 1; g++) {
      if (cleared(s, g) && cleared(s + 1, g) && cleared(s, g + 1) && cleared(s + 1, g + 1)) {
        flags.push('block')
        break outer
      }
    }
  }
  return flags
}

/** 해금된 히든 업적의 id 집합 */
export function computeFlags(metrics) {
  const { runs: asc, board, deletedCount } = metrics
  const flags = new Set([
    ...flagsPerRun(asc),
    ...flagsFromSequence(asc),
    ...flagsFromCells(asc),
    ...flagsFromDays(asc),
    ...flagsFromBoard(board),
  ])
  if (deletedCount >= 5) flags.add('undo-5')
  return flags
}

// ---- 목록 ----
// 오픈은 지표 하나와 목표치로 정의한다(기존 { metric, threshold } 구조를 그대로 잇는다).
// target 은 "대상별 최대값"인 지표에서 그게 누구인지 화면에 함께 보여주기 위한 것이다
// — 전담 요원 12/30 만으로는 어느 덱커 얘기인지 알 수 없다.
//
// 히든은 목표치가 없다. 진행도를 보여주는 순간 조건이 새기 때문에 참/거짓뿐이다.

const open = (id, icon, section, metric, goal, target) => ({ id, icon, section, metric, goal, target })
const secret = (id, icon) => ({ id, icon, hidden: true })

export const ACHIEVEMENTS = [
  open('stamps-1', '🩹', 'run', 'stamps', 1),
  open('stamps-5', '💾', 'run', 'stamps', 5),
  open('stamps-25', '🧬', 'run', 'stamps', 25),
  open('stamps-50', '🗺️', 'run', 'stamps', 50),
  open('stamps-84', '👑', 'run', 'stamps', 84),
  open('perfects-1', '🌟', 'run', 'perfects', 1),
  open('perfects-10', '💎', 'run', 'perfects', 10),
  open('perfects-30', '🏆', 'run', 'perfects', 30),
  open('plays-1', '🔌', 'run', 'total', 1),
  open('plays-25', '📻', 'run', 'total', 25),
  open('plays-100', '⚔️', 'run', 'total', 100),

  open('streak-3', '📈', 'streak', 'winStreak', 3),
  open('streak-5', '🔥', 'streak', 'winStreak', 5),
  open('streak-10', '🚀', 'streak', 'winStreak', 10),

  open('dex-boss', '👹', 'dex', 'dexBoss', SMCS.length),
  open('dex-gold', '🔑', 'dex', 'dexGold', GOLDS.length),
  open('dex-decker', '🎭', 'dex', 'dexDecker', DECKERS.length),
  open('crew-balance', '⚖️', 'dex', 'crewBalance', DECKERS.length),

  open('board-row', '➖', 'board', 'rowBest', GOLDS.length),
  open('board-col', '🗝️', 'board', 'colBest', SMCS.length),

  open('main-decker-10', '🎯', 'favorite', 'topDecker', 10, 'decker'),
  open('main-decker-30', '🎬', 'favorite', 'topDecker', 30, 'decker'),
  open('main-decker-60', '👥', 'favorite', 'topDecker', 60, 'decker'),
  open('nemesis-10', '😈', 'favorite', 'topBoss', 10, 'boss'),
  open('nemesis-25', '🌀', 'favorite', 'topBoss', 25, 'boss'),
  open('nemesis-50', '🗡️', 'favorite', 'topBoss', 50, 'boss'),
  open('one-cell-15', '⛏️', 'favorite', 'topCell', 15, 'cell'),

  open('extra-10', '🏁', 'extra', 'extraBest', 10),
  open('extra-50', '🧩', 'extra', 'extraBest', 50),
  open('extra-200', '🕸️', 'extra', 'extraBest', 200),

  // 승부의 모양
  secret('comeback', '🩸'),
  secret('lucky-3', '🎲'),
  secret('first-perfect', '✨'),
  secret('flawless-3', '🪞'),
  secret('sentinel-perfect', '🛡️'),
  secret('solo-perfect', '🕶️'),
  secret('full-crew', '👨‍👩‍👧‍👦'),
  secret('overload', '⚡'),
  secret('suicide-mission', '☠️'),
  secret('ghost-seen', '👻'),
  secret('rollercoaster', '🎢'),
  secret('one-road', '🛣️'),
  secret('by-the-book', '📏'),
  secret('one-shot', '🎯'),

  // 벽과 집념
  secret('persistence', '🧗'),
  secret('breakthrough', '🩹'),
  secret('the-wall', '🧱'),
  secret('nemesis-card', '😾'),
  secret('unbeaten-boss', '💔'),

  // 보드 도형
  secret('diagonal', '🪜'),
  secret('block', '🧊'),
  secret('corners', '📐'),

  // 굴욕
  secret('first-loss', '🫥'),
  secret('tutorial-fail', '🐋'),
  secret('whale-phobia', '🫠'),
  secret('mother-scold', '👵'),
  secret('beaten-by-all', '🥊'),
  secret('total-failure', '🕳️'),
  secret('zero-percent', '📉'),
  secret('hubris', '🍿'),
  secret('greed', '💸'),
  secret('unlucky-13', '🐈‍⬛'),

  // 카드가 사람을 놀린다
  secret('err-404', '🔍'),
  secret('access-denied', '⛔'),
  secret('wrong-keycode', '🔢'),
  secret('glass-heart', '🪟'),
  secret('misdirected', '🙈'),
  secret('garbage-fail', '🗑️'),
  secret('double-switch', '🔁'),
  secret('fireworks', '🎆'),

  // 보스 편식
  secret('full-course', '🍽️'),
  secret('safe-zone', '🛖'),
  secret('ordeal', '⛓️'),

  // 크루가 이상하다
  secret('perfect-partner', '🤝'),
  secret('double-life', '🎬'),
  secret('revolving-door', '🚪'),
  secret('loner', '🧘'),
  secret('whimsical', '🌪️'),
  secret('same-player-30', '💞'),
  secret('one-man-four', '🎭'),
  secret('method-acting', '🥸'),
  secret('anonymous', '👤'),

  // 시계와 달력
  secret('night-owl', '🌙'),
  secret('clock-444', '🕓'),
  secret('cinderella', '🕛'),
  secret('all-nighter', '🌒'),
  secret('time-traveler', '⏱️'),
  secret('marathon', '🏃'),
  secret('seven-a-day', '🍚'),
  secret('on-fire', '🌊'),
  secret('christmas', '🎄'),
  secret('new-year', '🎍'),
  secret('year-end', '🌇'),
  secret('leap-day', '🗓️'),
  secret('friday-13', '🔪'),
  secret('days-3', '📅'),
  secret('days-7', '🗂️'),
  secret('one-year', '🎂'),
  secret('return-90', '🔄'),
  secret('anniversary', '⏳'),

  // 입력창을 가지고 논다
  secret('chronicler', '✍️'),
  secret('silent-decker', '🤐'),
  secret('diligent', '📝'),
  secret('diary', '📔'),
  secret('speechless', '🤏'),
  secret('copypaste', '📋'),
  secret('lol-only', '😹'),

  // 숫자 농담
  secret('run-42', '🌌'),
  secret('run-84', '🔲'),
  secret('run-100', '💯'),
  secret('balance', '🫰'),
  secret('undo-5', '🧹'),
]

export const OPEN_SECTIONS = ['run', 'streak', 'dex', 'board', 'favorite', 'extra']

/**
 * 화면이 그대로 그릴 수 있는 형태로 평가한다.
 *
 *  오픈 → { unlocked, value, goal, targetId }
 *  히든 → { unlocked } (잠겨 있으면 이름조차 화면에 나가지 않는다)
 */
export function evaluate(runs, options) {
  const metrics = computeMetrics(runs, options)
  const flags = computeFlags(metrics)

  return ACHIEVEMENTS.map((achievement) => {
    if (achievement.hidden) return { ...achievement, unlocked: flags.has(achievement.id) }

    const raw = metrics[achievement.metric]
    const value = typeof raw === 'object' ? raw.value : raw
    return {
      ...achievement,
      unlocked: value >= achievement.goal,
      value,
      targetId: typeof raw === 'object' ? raw.id : null,
    }
  })
}

/** 게이지용 요약. 히든은 개수만 밖으로 나간다 — 그게 유일한 노출이다. */
export function summarize(evaluated) {
  const count = (list) => ({ unlocked: list.filter((a) => a.unlocked).length, total: list.length })
  return {
    open: count(evaluated.filter((a) => !a.hidden)),
    hidden: count(evaluated.filter((a) => a.hidden)),
  }
}
