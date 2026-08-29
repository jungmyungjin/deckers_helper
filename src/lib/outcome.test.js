import { describe, expect, it } from 'vitest'
import { calcOutcome } from './outcome'

describe('calcOutcome', () => {
  const objectives = [
    { security: 'copper', result: 'fail', isFinal: false },
    { security: 'gold', result: 'success', isFinal: true },
  ]

  it('keeps an ordinary run successful when only a non-final objective failed', () => {
    expect(calcOutcome(objectives)).toBe('success')
  })

  it('makes every failed objective a loss for Sentinel', () => {
    expect(calcOutcome(objectives, { requireAllObjectives: true })).toBe('fail')
  })
})
