import { describe, expect, it } from 'vitest'
import { GOLDS, SMCS, SMC_BY_ID } from '../data/gameData'
import { drawUncleared } from './derive'

// 클리어 1건 = (smcId, 최종 Gold) 조합 하나를 깬 것
const clear = (smcId, goldId) => ({
  smcId,
  outcome: 'success',
  objectives: [{ security: 'gold', objectiveId: goldId, isFinal: true }],
})
const clearAll = (smcId) => GOLDS.map((g) => clear(smcId, g.id))

describe('랜덤 챌린지 · 다음 칸 고르기', () => {
  it('아무것도 안 깼으면 가장 낮은 난도의 첫 Gold', () => {
    expect(drawUncleared([])).toEqual({ smcId: 'alpha-moby', goldId: GOLDS[0].id })
  })

  it('같은 SMC 안에서는 Gold 순서대로 다음 칸', () => {
    const runs = [clear('alpha-moby', GOLDS[0].id)]

    expect(drawUncleared(runs)).toEqual({ smcId: 'alpha-moby', goldId: GOLDS[1].id })
  })

  it('한 SMC 를 다 깨면 그다음 난도로 넘어간다', () => {
    const next = SMCS.find((smc) => smc.id !== 'alpha-moby')
    const combo = drawUncleared(clearAll('alpha-moby'))

    expect(combo).toEqual({ smcId: next.id, goldId: GOLDS[0].id })
    expect(SMC_BY_ID[combo.smcId].difficulty).toBeGreaterThan(1)
  })

  it('중간에 빈 칸이 남아 있으면 어려운 쪽보다 먼저 채운다', () => {
    // 알파-모비의 마지막 Gold 한 칸만 비워두고 그다음 난도를 통째로 깬 상태
    const runs = [
      ...GOLDS.slice(0, -1).map((g) => clear('alpha-moby', g.id)),
      ...clearAll(SMCS[1].id),
    ]

    expect(drawUncleared(runs)).toEqual({ smcId: 'alpha-moby', goldId: GOLDS.at(-1).id })
  })

  it('전부 깼으면 null — 추가 도전으로 넘어갈 시점이다', () => {
    expect(drawUncleared(SMCS.flatMap((smc) => clearAll(smc.id)))).toBe(null)
  })
})
