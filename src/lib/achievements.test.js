import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, evaluate, summarize } from './achievements'
import ko from '../i18n/ko.json'
import en from '../i18n/en.json'
import de from '../i18n/de.json'
import { GOLDS, SMCS } from '../data/gameData'

// 로컬 시각으로 만든다 — 시계·달력 업적은 사용자의 시간대를 따른다.
const at = (y, m, d, h = 14, min = 0) => new Date(y, m, d, h, min).toISOString()

let serial = 0
function makeRun(overrides = {}) {
  serial += 1
  return {
    id: `run-${serial}`,
    smcId: 'alpha-moby',
    smcUpgrade: 0,
    playedAt: at(2026, 0, 5),
    outcome: 'success',
    note: '',
    deckers: [{ deckerId: 'oshin-noro', playerName: 'Luna' }],
    objectives: [
      { cycleNo: 1, security: 'copper', objectiveId: 'copper-keycode', result: 'success', isFinal: false },
      { cycleNo: 2, security: 'gold', objectiveId: 'gold-blackout', result: 'success', isFinal: true },
    ],
    deletedAt: null,
    ...overrides,
  }
}

const idsOf = (runs, options) => new Set(evaluate(runs, options).filter((a) => a.unlocked).map((a) => a.id))
const find = (runs, id) => evaluate(runs).find((a) => a.id === id)

describe('목록', () => {
  it('id 가 겹치지 않는다 — i18n 키이자 seenAchievements 의 키다', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('세 언어 모두 이름과 조건이 있다', () => {
    for (const bundle of [ko, en, de]) {
      for (const { id } of ACHIEVEMENTS) {
        expect(bundle.achievements.list[id]?.name, `${id} name`).toBeTruthy()
        expect(bundle.achievements.list[id]?.desc, `${id} desc`).toBeTruthy()
      }
    }
  })
})

describe('오픈 업적', () => {
  it('클리어한 칸 수로 단계가 열린다', () => {
    const runs = [makeRun()]
    expect(find(runs, 'stamps-1').unlocked).toBe(true)
    expect(find(runs, 'stamps-5').unlocked).toBe(false)
    expect(find(runs, 'stamps-5').value).toBe(1)
  })

  it('편애 업적은 대상이 누구인지 함께 알려준다', () => {
    const runs = Array.from({ length: 10 }, () => makeRun())
    const agent = find(runs, 'main-decker-10')
    expect(agent.unlocked).toBe(true)
    expect(agent.targetId).toBe('oshin-noro')
  })

  it('덱커는 판이 아니라 출전 단위로 센다', () => {
    const runs = [makeRun({ deckers: [
      { deckerId: 'oshin-noro', playerName: 'A' },
      { deckerId: 'monty-quantum', playerName: 'B' },
    ] })]
    expect(find(runs, 'dex-decker').value).toBe(2)
  })
})

describe('히든 업적', () => {
  it('잠긴 히든은 이름 말고 아무것도 들고 나가지 않는다', () => {
    const locked = evaluate([]).filter((a) => a.hidden && !a.unlocked)
    expect(locked.length).toBeGreaterThan(0)
    for (const achievement of locked) {
      expect(achievement.value).toBeUndefined()
      expect(achievement.goal).toBeUndefined()
    }
  })

  it('중간 목표를 전부 놓치고 이기면 역전', () => {
    const runs = [makeRun({ objectives: [
      { cycleNo: 1, security: 'copper', objectiveId: 'copper-keycode', result: 'fail', isFinal: false },
      { cycleNo: 2, security: 'silver', objectiveId: 'silver-swarm', result: 'fail', isFinal: false },
      { cycleNo: 3, security: 'gold', objectiveId: 'gold-blackout', result: 'success', isFinal: true },
    ] })]
    expect(idsOf(runs)).toContain('comeback')
  })

  it('입문 보스에게 지면 튜토리얼 실패', () => {
    expect(idsOf([makeRun({ outcome: 'fail' })])).toContain('tutorial-fail')
  })

  it('새벽에 남긴 기록을 알아본다', () => {
    const ids = idsOf([makeRun({ playedAt: at(2026, 0, 5, 4, 44) })])
    expect(ids).toContain('night-owl')
    expect(ids).toContain('clock-444')
  })

  it('네 자리 이름이 같으면 1인 4역', () => {
    const runs = [makeRun({ deckers: [
      { deckerId: 'oshin-noro', playerName: '루나' },
      { deckerId: 'monty-quantum', playerName: '루나' },
      { deckerId: 'tilda-sweet', playerName: '루나' },
      { deckerId: 'hettie-magnetic', playerName: '루나' },
    ] })]
    expect(idsOf(runs)).toContain('one-man-four')
  })

  it('웃음만 적힌 메모를 세 언어 모두에서 알아본다', () => {
    for (const note of ['ㅋㅋㅋㅋ', 'lol lol', 'haha']) {
      expect(idsOf([makeRun({ note })])).toContain('lol-only')
    }
    expect(idsOf([makeRun({ note: '오늘은 잘 풀렸다' })])).not.toContain('lol-only')
  })

  it('대각선 일곱 칸을 채우면 계단', () => {
    const runs = SMCS.map((smc, i) => makeRun({
      smcId: smc.id,
      objectives: [{ cycleNo: 1, security: 'gold', objectiveId: GOLDS[i].id, result: 'success', isFinal: true }],
    }))
    expect(idsOf(runs)).toContain('diagonal')
  })

  it('삭제한 기록 수는 밖에서 받아온다 — tombstone 은 allRuns 에서 걸러진다', () => {
    expect(idsOf([makeRun()], { deletedCount: 5 })).toContain('undo-5')
    expect(idsOf([makeRun()], { deletedCount: 4 })).not.toContain('undo-5')
  })
})

// 파생 계산이라 저장된 상태가 없다. "지금 그렇다"를 조건으로 쓰면 다음 판에 업적이
// 사라지므로, 그런 조건은 전부 "그런 적이 있었는가"로 판정해야 한다.
describe('한 번 해금되면 풀리지 않는다', () => {
  it('첫 열 판을 다 지고 나서 이겨도 그대로다', () => {
    const losses = Array.from({ length: 10 }, () => makeRun({ outcome: 'fail' }))
    expect(idsOf(losses)).toContain('zero-percent')
    expect(idsOf([...losses, makeRun({ outcome: 'perfect' })])).toContain('zero-percent')
  })

  it('승패가 같아진 적이 있으면 이후 균형이 깨져도 그대로다', () => {
    const even = [
      ...Array.from({ length: 10 }, () => makeRun({ outcome: 'success' })),
      ...Array.from({ length: 10 }, () => makeRun({ outcome: 'fail' })),
    ]
    expect(idsOf(even)).toContain('balance')
    expect(idsOf([...even, makeRun({ outcome: 'success' })])).toContain('balance')
  })
})

// 경계에서 틀리기 쉬운 것들. 보드 도형은 좌표 계산, 벽/집념은 "몇 번 지고 나서"의
// 기준선, 달력은 월 인덱스와 요일 계산이 각각 조용히 어긋난다.
describe('경계', () => {
  const clear = (smcIndex, goldIndex) => makeRun({
    smcId: SMCS[smcIndex].id,
    objectives: [{ cycleNo: 1, security: 'gold', objectiveId: GOLDS[goldIndex].id, result: 'success', isFinal: true }],
  })

  it('맞닿은 네 칸이라야 블록이다', () => {
    const square = [clear(0, 0), clear(0, 1), clear(1, 0), clear(1, 1)]
    expect(idsOf(square)).toContain('block')

    const apart = [clear(0, 0), clear(0, 2), clear(1, 0), clear(1, 2)]
    expect(idsOf(apart)).not.toContain('block')
  })

  it('네 귀퉁이는 보드의 끝이다', () => {
    const last = { smc: SMCS.length - 1, gold: GOLDS.length - 1 }
    const corners = [clear(0, 0), clear(0, last.gold), clear(last.smc, 0), clear(last.smc, last.gold)]
    expect(idsOf(corners)).toContain('corners')
    expect(idsOf(corners.slice(0, 3))).not.toContain('corners')
  })

  const attempt = (outcome) => makeRun({
    outcome,
    objectives: [{ cycleNo: 1, security: 'gold', objectiveId: 'gold-blackout', result: outcome === 'fail' ? 'fail' : 'success', isFinal: true }],
  })

  it('벽은 같은 칸 5연패부터다', () => {
    expect(idsOf(Array.from({ length: 4 }, () => attempt('fail')))).not.toContain('the-wall')
    expect(idsOf(Array.from({ length: 5 }, () => attempt('fail')))).toContain('the-wall')
  })

  it('집념은 3패 뒤, 끝내 뚫었다는 5패 뒤 클리어다', () => {
    const three = [...Array.from({ length: 3 }, () => attempt('fail')), attempt('success')]
    expect(idsOf(three)).toContain('persistence')
    expect(idsOf(three)).not.toContain('breakthrough')

    const five = [...Array.from({ length: 5 }, () => attempt('fail')), attempt('success')]
    expect(idsOf(five)).toContain('breakthrough')
  })

  it('지기만 해서는 집념이 되지 않는다 — 끝내 이겨야 한다', () => {
    expect(idsOf(Array.from({ length: 5 }, () => attempt('fail')))).not.toContain('persistence')
  })

  it('2월 29일', () => {
    expect(idsOf([makeRun({ playedAt: at(2028, 1, 29) })])).toContain('leap-day')
    expect(idsOf([makeRun({ playedAt: at(2027, 1, 28) })])).not.toContain('leap-day')
  })

  it('올해의 마지막 해킹은 12월 31일 23시부터다', () => {
    expect(idsOf([makeRun({ playedAt: at(2026, 11, 31, 23, 10) })])).toContain('year-end')
    expect(idsOf([makeRun({ playedAt: at(2026, 11, 31, 22, 59) })])).not.toContain('year-end')
  })

  it('13일의 금요일은 그날 졌을 때만', () => {
    const friday = at(2026, 1, 13) // 2026-02-13 은 금요일
    expect(idsOf([makeRun({ playedAt: friday, outcome: 'fail' })])).toContain('friday-13')
    expect(idsOf([makeRun({ playedAt: friday, outcome: 'success' })])).not.toContain('friday-13')
    expect(idsOf([makeRun({ playedAt: at(2026, 2, 13), outcome: 'fail' })])).toContain('friday-13') // 3월 13일도 금요일
    expect(idsOf([makeRun({ playedAt: at(2026, 0, 13), outcome: 'fail' })])).not.toContain('friday-13')
  })

  it('며칠 이어서 기록했는지', () => {
    const days = (list) => list.map((day) => makeRun({ playedAt: at(2026, 5, day) }))
    expect(idsOf(days([1, 2, 3]))).toContain('days-3')
    expect(idsOf(days([1, 2, 4]))).not.toContain('days-3')
    expect(idsOf(days([1, 2, 3, 4, 5, 6, 7]))).toContain('days-7')
  })
})

describe('요약', () => {
  it('히든은 개수만 밖으로 나간다', () => {
    const summary = summarize(evaluate([]))
    expect(summary.open.unlocked).toBe(0)
    expect(summary.hidden.total).toBe(ACHIEVEMENTS.filter((a) => a.hidden).length)
  })
})
