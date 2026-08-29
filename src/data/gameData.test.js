import { describe, expect, it } from 'vitest'
import { availableDeckersFor, buildObjectiveSlots, objectiveCountsFor } from './gameData'

describe('game setup rules', () => {
  it('uses each boss-specific objective count and adds Gold objectives for an upgraded SMC', () => {
    expect(objectiveCountsFor('sentinel', 0)).toEqual({ copper: 2, silver: 2, gold: 1 })
    expect(objectiveCountsFor('mother', 2)).toEqual({ copper: 1, silver: 2, gold: 3 })
    expect(buildObjectiveSlots('logi', 1)).toEqual([
      { cycleNo: 1, security: 'copper', isFinal: false },
      { cycleNo: 2, security: 'copper', isFinal: false },
      { cycleNo: 3, security: 'silver', isFinal: false },
      { cycleNo: 4, security: 'gold', isFinal: false },
      { cycleNo: 5, security: 'gold', isFinal: true },
    ])
  })

  it('does not offer either side of a profile card already selected by another player', () => {
    const choices = availableDeckersFor(['oshin-noro'])

    expect(choices.map((decker) => decker.id)).not.toContain('angel-nitrate')
    expect(choices.map((decker) => decker.id)).toContain('monty-quantum')
  })
})
