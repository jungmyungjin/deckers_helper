// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Profile from './Profile'

vi.mock('../db/runs', () => ({
  useRuns: () => [],
  computeStats: () => ({ stamps: 0, perfects: 0, totalCells: 84, winRate: 0, total: 0 }),
}))
vi.mock('../lib/SyncProvider', () => ({
  useSync: () => ({ user: null, signIn: vi.fn(), enabled: true, doSync: vi.fn(), status: 'idle', message: '' }),
}))
vi.mock('../i18n', () => ({ useT: () => ({ t: (key) => key }) }))
vi.mock('../db/reports', () => ({ APP_VERSION: 'test', usePendingReportCount: () => 0 }))
vi.mock('../components/LanguageSelect', () => ({ default: () => null }))

afterEach(cleanup)

describe('Profile', () => {
  it('labels the Google brand icon for the sign-in button', () => {
    render(<MemoryRouter><Profile /></MemoryRouter>)

    expect(screen.getByRole('img', { name: 'Google' })).toBeTruthy()
  })
})
