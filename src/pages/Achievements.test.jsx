// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Achievements from './Achievements'
import en from '../i18n/en.json'
import { setLocale } from '../i18n'
import { ACHIEVEMENTS } from '../lib/achievements'

const runs = []
vi.mock('../db/runs', () => ({
  useRuns: () => runs,
  useDeletedRunCount: () => 0,
}))

setLocale('en')
afterEach(cleanup)

describe('업적 화면', () => {
  it('잠긴 히든의 이름은 화면 어디에도 나가지 않는다', () => {
    render(<MemoryRouter><Achievements /></MemoryRouter>)
    const text = document.body.textContent

    // 이름이 숫자뿐인 것(84, 4:44)은 진행도 숫자와 구별할 수 없으므로 뺀다
    const named = ACHIEVEMENTS.filter((a) => a.hidden)
      .map((a) => en.achievements.list[a.id].name)
      .filter((name) => /\p{L}/u.test(name))

    for (const name of named) expect(text, name).not.toContain(name)
  })

  it('남은 히든은 개수로만 알려준다', () => {
    render(<MemoryRouter><Achievements /></MemoryRouter>)
    const hidden = ACHIEVEMENTS.filter((a) => a.hidden).length

    expect(screen.getByText(en.achievements.lockedTitle)).toBeTruthy()
    expect(screen.getByText(String(hidden))).toBeTruthy()
  })

  it('오픈 업적은 잠겨 있어도 이름과 진행도를 보여준다', () => {
    render(<MemoryRouter><Achievements /></MemoryRouter>)

    expect(screen.getByText(en.achievements.list['stamps-84'].name)).toBeTruthy()
    expect(screen.getByText('0 / 84')).toBeTruthy()
  })
})
