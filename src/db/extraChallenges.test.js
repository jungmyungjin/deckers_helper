import { describe, expect, it } from 'vitest'
import { extraChallengeProgress, unclearedExtraCombos, unclearedExtraSilverIds } from './runs'

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
  it('counts one successful three-card combination once and ignores failed repeats', () => {
    const runs = [completed, completed, failedRepeat]

    expect(extraChallengeProgress(runs, 'alpha-moby')).toEqual({ completed: 1, total: 1728 })
    expect(extraChallengeProgress(runs, 'alpha-moby', 'gold-blackout')).toEqual({ completed: 1, total: 144 })
    expect(extraChallengeProgress(runs, 'alpha-moby', 'gold-blackout', 'copper-404-not-found'))
      .toEqual({ completed: 1, total: 12 })
  })

  it('offers only silver cards that have not completed the selected boss-gold-copper combination', () => {
    const remaining = unclearedExtraSilverIds(
      [completed],
      'alpha-moby',
      'gold-blackout',
      'copper-404-not-found',
    )

    expect(remaining).toHaveLength(11)
    expect(remaining).not.toContain('silver-access-shutdown')
    expect(remaining).toContain('silver-data-overload')
  })

  it('returns every remaining three-card combination for the selected boss', () => {
    const remaining = unclearedExtraCombos([completed], 'alpha-moby')

    expect(remaining).toHaveLength(1727)
    expect(remaining).not.toContainEqual({
      copperId: 'copper-404-not-found',
      silverId: 'silver-access-shutdown',
      goldId: 'gold-blackout',
    })
    expect(remaining).toContainEqual({
      copperId: 'copper-404-not-found',
      silverId: 'silver-data-overload',
      goldId: 'gold-blackout',
    })
  })
})
