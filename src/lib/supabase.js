import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// env 없으면 null → 앱은 게스트/로컬 모드로 동작.
// 설정 안내는 콘솔에만 남긴다 — 화면 문구에 서비스명이나 .env가 나오면 안 된다.
export const supabase = url && key ? createClient(url, key) : null
export const hasSupabase = !!supabase

if (!hasSupabase) {
  console.warn(
    '[deckers] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 없어 로그인·동기화가 꺼집니다. ' +
    '.env 를 확인하세요 (docs/supabase-setup.md).'
  )
}
