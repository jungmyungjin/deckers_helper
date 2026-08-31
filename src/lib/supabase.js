import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// env 없으면 null → 앱은 게스트/로컬 모드로 동작.
// 설정 안내는 콘솔에만 남긴다 — 화면 문구에 서비스명이나 .env가 나오면 안 된다.
export const supabase = url && key ? createClient(url, key, {
  auth: {
    // PKCE. 기본값(implicit)은 토큰을 URL 프래그먼트(#access_token=…)로 돌려주는데
    // 이 앱은 HashRouter라 프래그먼트가 곧 라우트다. 두 주인이 같은 자리를 두고
    // 다투는 구조라, 로그인 성공 직후 supabase가 해시를 지우면 히스토리에 빈
    // 항목이 끼고 뒤로가기가 이상해진다. PKCE는 ?code= 쿼리로 돌아와 라우터와
    // 겹치지 않고, 토큰이 주소창·히스토리에 남지도 않는다.
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
}) : null
export const hasSupabase = !!supabase

// OAuth가 실패하면 GoTrue는 error / error_description을 붙여 앱으로 되돌려보낸다.
// (예: Redirect URLs에 이 도메인이 없거나, 사용자가 동의 화면에서 취소한 경우)
// 이 값은 모듈 로드 시점 — React가 그리기 전 — 에 읽어야 한다. HashRouter가 첫
// 렌더에서 해시를 '#/'로 갈아치우기 때문에, 컴포넌트 안에서는 이미 늦는다.
export const oauthUrlError = readOAuthError()

function readOAuthError() {
  if (typeof window === 'undefined') return null
  const pick = (raw) => {
    const p = new URLSearchParams(String(raw).replace(/^[#?]/, ''))
    const code = p.get('error') || p.get('error_code')
    return code ? { code, description: p.get('error_description') || '' } : null
  }
  const found = pick(window.location.search) || pick(window.location.hash)
  if (!found) return null

  console.warn('[deckers] Google 로그인이 실패로 돌아왔습니다:', found.code, found.description)
  // 새로고침할 때마다 다시 뜨지 않게 주소에서 지운다. 해시는 라우터 소관이라 두고,
  // 쿼리만 정리한다. supabase 클라이언트는 위에서 이미 URL을 읽은 뒤다.
  try {
    const u = new URL(window.location.href)
    for (const k of ['error', 'error_code', 'error_description']) u.searchParams.delete(k)
    window.history.replaceState(window.history.state, '', u.toString())
  } catch { /* 주소 정리는 실패해도 로그인 흐름과 무관하다 */ }

  return found
}

if (!hasSupabase) {
  console.warn(
    '[deckers] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 없어 로그인·동기화가 꺼집니다. ' +
    '.env 를 확인하세요 (docs/supabase-setup.md).'
  )
}
