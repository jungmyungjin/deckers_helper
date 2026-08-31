// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Modal from './Modal'

afterEach(cleanup)

describe('Modal', () => {
  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<Modal title="삭제 확인" onClose={onClose}><p>내용</p></Modal>)
    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not close when interacting with the dialog content', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<Modal title="삭제 확인" onClose={onClose}><button>삭제</button></Modal>)
    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(onClose).not.toHaveBeenCalled()
  })
})
