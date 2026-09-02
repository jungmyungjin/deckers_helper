// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AchievementToaster from './AchievementToaster'
import en from '../i18n/en.json'
import { setLocale } from '../i18n'

let seen = null
let account = { user: null, authReady: true }
const touchedKeys = []
vi.mock('../db/localDb', () => ({
  getMeta: async (key) => { touchedKeys.push(key); return seen },
  setMeta: async (_key, value) => { seen = value },
}))
vi.mock('../lib/SyncProvider', () => ({ useSync: () => account }))

let runs = []
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn) => (fn.name === 'deletedRunCount' ? 0 : runs),
}))
vi.mock('../db/runs', () => ({
  allRuns: () => runs,
  deletedRunCount: function deletedRunCount() { return 0 },
}))

const makeRun = (i) => ({
  id: `r${i}`, smcId: 'alpha-moby', smcUpgrade: 0,
  playedAt: new Date(2026, 0, 1 + i, 12).toISOString(),
  outcome: 'perfect', note: '', deckers: [{ deckerId: 'oshin-noro', playerName: 'A' }],
  objectives: [{ cycleNo: 1, security: 'gold', objectiveId: 'gold-blackout', result: 'success', isFinal: true }],
})

setLocale('en')
afterEach(cleanup)

describe('해금 토스트', () => {
  it('한꺼번에 많이 열리면 개수 한 줄로 합친다', async () => {
    seen = []
    account = { user: null, authReady: true }
    runs = Array.from({ length: 6 }, (_, i) => makeRun(i))
    render(<MemoryRouter><AchievementToaster /></MemoryRouter>)

    const merged = await screen.findByText(/\d+ achievements/)
    expect(merged).toBeTruthy()
    expect(screen.getByText(en.achievements.unlocked)).toBeTruthy()
  })

  it('계정마다 본 목록을 따로 둔다', async () => {
    touchedKeys.length = 0
    seen = null
    account = { user: { id: 'user-a' }, authReady: true }
    runs = [makeRun(0)]
    render(<MemoryRouter><AchievementToaster /></MemoryRouter>)
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(touchedKeys).toContain('seenAchievements:user-a')
    expect(touchedKeys).not.toContain('seenAchievements:guest')
  })

  it('로그인 확인 전에는 아무것도 하지 않는다', async () => {
    seen = null
    account = { user: null, authReady: false }
    runs = [makeRun(0)]
    render(<MemoryRouter><AchievementToaster /></MemoryRouter>)
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(seen).toBeNull()
  })

  it('처음 실행에서는 조용히 넘어간다', async () => {
    account = { user: null, authReady: true }
    seen = null
    runs = Array.from({ length: 6 }, (_, i) => makeRun(i))
    const { container } = render(<MemoryRouter><AchievementToaster /></MemoryRouter>)
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(container.querySelector('.toaststack')).toBeNull()
  })
})
