import { describe, expect, it } from 'vitest'
import { groupRunsByCalendarDay } from './format'

describe('groupRunsByCalendarDay', () => {
  it('keeps chronologically adjacent runs from the same calendar day together', () => {
    const groups = groupRunsByCalendarDay([
      { id: 'newest', playedAt: '2026-08-28T19:30:00+09:00' },
      { id: 'same-day', playedAt: '2026-08-28T12:00:00+09:00' },
      { id: 'previous-day', playedAt: '2026-08-27T22:00:00+09:00' },
    ])

    expect(groups).toHaveLength(2)
    expect(groups[0].runs.map((run) => run.id)).toEqual(['newest', 'same-day'])
    expect(groups[1].runs.map((run) => run.id)).toEqual(['previous-day'])
  })
})
