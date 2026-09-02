// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Profile from './Profile'

// db 접근만 막으면 된다 — 파생 계산(lib/derive)은 순수 함수라 그대로 돌려도 된다
vi.mock('../db/runs', () => ({
  useRuns: () => [],
  useDeletedRunCount: () => 0,
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
