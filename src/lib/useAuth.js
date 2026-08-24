import { useState, useEffect } from 'react'
import { supabase, hasSupabase } from './supabase'

// Supabase 미설정이면 항상 게스트(user=null). 설정되면 Google 세션 추적.
export function useAuth() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!hasSupabase)

  useEffect(() => {
    if (!hasSupabase) return
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setUser(data.session?.user ?? null)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  const signIn = () =>
    supabase?.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  const signOut = () => supabase?.auth.signOut()

  return { user, ready, signIn, signOut, enabled: hasSupabase }
}
