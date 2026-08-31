import { describe, expect, it } from 'vitest'
import { drawUnclearedExtraCombo, extraChallengeProgress } from './runs'

const completed = {
  smcId: 'alpha-moby',
  outcome: 'success',
  objectives: [
    { security: 'copper', objectiveId: 'copper-404-not-found' },
    { security: 'silver', objectiveId: 'silver-access-shutdown' },
    { security: 'gold', objectiveId: 'gold-blackout', isFinal: true },
  ],
}

const failedRepeat = { ...completed, outcome: 'fail' }

describe('extra challenge progress', () => {
  it('counts one successful setup once and ignores failed repeats', () => {
    const runs = [completed, completed, failedRepeat]

    expect(extraChallengeProgress(runs, 'alpha-moby')).toEqual({ completed: 1, total: 1728 })
  })

  it('counts different objective orders as distinct additional challenges', () => {
    const firstOrder = {
      ...completed,
      smcId: 'logi',
      objectives: [
        { security: 'copper', objectiveId: 'copper-404-not-found' },
        { security: 'copper', objectiveId: 'copper-access-denied' },
        { security: 'silver', objectiveId: 'silver-access-shutdown' },
        { security: 'gold', objectiveId: 'gold-blackout', isFinal: true },
      ],
    }
    const reverseOrder = {
      ...firstOrder,
      objectives: [
        firstOrder.objectives[1], firstOrder.objectives[0], firstOrder.objectives[2], firstOrder.objectives[3],
      ],
    }

    expect(extraChallengeProgress([firstOrder, reverseOrder], 'logi')).toEqual({ completed: 2, total: 19008 })
  })

  it('draws a complete unplayed setup without materializing every combination', () => {
    const draw = drawUnclearedExtraCombo([completed], 'alpha-moby', () => 0)

    expect(draw.objectives).toHaveLength(3)
    expect(draw.objectives.map((objective) => objective.security)).toEqual(['copper', 'silver', 'gold'])
    expect(draw.objectives[2].isFinal).toBe(true)
  })
})
