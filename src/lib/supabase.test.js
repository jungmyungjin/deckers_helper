// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// OAuth 콜백 실패는 화면에 알려야 한다. 값을 읽는 시점이 핵심이라 — HashRouter가
// 해시를 갈아치우기 전, 모듈 로드 시점 — 매번 모듈을 새로 불러 확인한다.
async function loadWith(url) {
  vi.resetModules()
  window.history.replaceState({}, '', url)
  return import('./supabase')
}

describe('oauthUrlError', () => {
  beforeEach(() => { vi.spyOn(console, 'warn').mockImplementation(() => {}) })
  afterEach(() => { vi.restoreAllMocks() })

  it('정상 진입에서는 없다', async () => {
    const { oauthUrlError } = await loadWith('/')
    expect(oauthUrlError).toBe(null)
  })

  it('쿼리로 돌아온 실패를 읽고 주소를 정리한다', async () => {
    const { oauthUrlError } = await loadWith('/?error=access_denied&error_description=User+denied')
    expect(oauthUrlError).toEqual({ code: 'access_denied', description: 'User denied' })
    expect(window.location.search).toBe('')
  })

  it('해시로 돌아온 실패도 읽는다', async () => {
    const { oauthUrlError } = await loadWith('/#error=server_error&error_code=500')
    expect(oauthUrlError?.code).toBe('server_error')
  })

  it('라우트 해시를 오류로 착각하지 않는다', async () => {
    const { oauthUrlError } = await loadWith('/#/profile')
    expect(oauthUrlError).toBe(null)
  })
})
