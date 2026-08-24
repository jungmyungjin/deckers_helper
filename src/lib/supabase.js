import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// env 없으면 null → 앱은 게스트/로컬 모드로 동작
export const supabase = url && key ? createClient(url, key) : null
export const hasSupabase = !!supabase
