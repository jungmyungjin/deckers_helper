// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SelectField from './SelectField'

const options = [
  { value: 'alpha', label: 'Alpha-Moby' },
  { value: 'spider', label: 'Spider' },
]

afterEach(cleanup)

describe('SelectField', () => {
  it('choosing an option reports its value and closes the list', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<SelectField ariaLabel="보스" value="alpha" options={options} onChange={onChange} />)

    await user.click(screen.getByRole('combobox', { name: '보스' }))
    await user.click(screen.getByRole('option', { name: 'Spider' }))

    expect(onChange).toHaveBeenCalledWith('spider')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('closes an open list when Escape is pressed', async () => {
    const user = userEvent.setup()

    render(<SelectField ariaLabel="보스" value="alpha" options={options} onChange={() => {}} />)

    await user.click(screen.getByRole('combobox', { name: '보스' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
