import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase, hasSupabase, oauthUrlError } from './supabase'
import { syncAll } from './sync'
import { pendingReportCount } from '../db/reports'
import { t } from '../i18n'

// 인증 + 동기화를 앱 루트 한 곳에서 관리한다.
// 예전에는 Profile 페이지가 마운트될 때만 동기화가 돌아서, 다른 기기에서
// 앱을 열면 프로필 탭을 누르기 전까지 보드가 비어 보였다.
const Ctx = createContext(null)

export function useSync() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSync()는 <SyncProvider> 안에서만 쓸 수 있습니다')
  return ctx
}

export function SyncProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!hasSupabase)
  const [status, setStatus] = useState('idle')   // idle | syncing | done | error
  const [message, setMessage] = useState('')
  // 로컬 데이터를 화면에 그대로 믿고 보여줘도 되는 시점인지.
  // 로그인 세션이 있는데 첫 pull이 끝나기 전이면 false — 이때의 "기록 없음"은
  // 진짜 빈 상태가 아니라 아직 안 받아온 상태다.
  const [hydrated, setHydrated] = useState(!hasSupabase)
  // 로그인 자체가 실패했을 때 보여줄 문구의 i18n 키. 동기화 오류(message)와 섞지
  // 않는다 — 배너의 '재시도'가 동기화를 다시 도는 버튼이라, 로그인 실패에는 맞지 않는다.
  const [authErrorKey, setAuthErrorKey] = useState(oauthUrlError ? 'auth.callbackFailed' : null)

  const userId = user?.id ?? null

  useEffect(() => {
    if (!hasSupabase) return
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const u = data.session?.user ?? null
      setUser(u)
      setAuthReady(true)
      if (!u) setHydrated(true)   // 게스트는 로컬이 곧 전부
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      setAuthReady(true)
      if (u) setAuthErrorKey(null)
      else { setHydrated(true); setStatus('idle'); setMessage('') }
    })

    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  // 게스트여도 돈다 — 큐에 쌓인 제보는 로그인과 무관하게 보내야 하기 때문.
  // 보낼 게 없으면 Dexie 조회 한 번으로 끝나 비용이 없다.
  const doSync = useCallback(async () => {
    if (!hasSupabase) return
    // 게스트인데 보낼 제보도 없으면 할 일이 없다 — 괜히 배너를 띄우지 않는다
    if (!userId && (await pendingReportCount()) === 0) return

    setStatus('syncing')
    setMessage('')
    try {
      const r = await syncAll(userId)
      // 올린/받은 건수는 내부 동작이라 보여주지 않는다. 같은 기록이 push 직후
      // pull에도 잡혀 숫자가 부풀기도 해서, 결과만 문장으로 알린다.
      const parts = []
      if (userId) parts.push(t(r.pushed || r.pulled ? 'sync.done' : 'sync.upToDate'))
      if (r.reported) parts.push(t('sync.reportsSent', { count: r.reported }))
      setStatus('done')
      setMessage(parts.join(' · '))
    } catch (e) {
      setStatus('error')
      setMessage(e.message || t('sync.failed'))
    } finally {
      // 실패해도 로컬 데이터는 보여줘야 한다 — 영원히 로딩에 갇히지 않도록
      setHydrated(true)
    }
  }, [userId])

  // 세션 확인이 끝나면 어느 화면에 있든 자동으로 1회
  useEffect(() => { if (authReady) doSync() }, [authReady, doSync])

  // 다시 온라인이 되면 밀린 변경과 제보를 올린다
  useEffect(() => {
    if (!hasSupabase) return
    const onOnline = () => doSync()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [doSync])

  // 성공하면 이 함수가 끝나기 전에 브라우저가 Google로 떠난다.
  // 여기서 error가 잡히는 건 아예 출발하지 못한 경우 — 조용히 삼키면
  // 사용자에게는 '버튼을 눌렀는데 아무 일도 없는' 화면이 된다.
  const signIn = useCallback(async () => {
    if (!supabase) return
    setAuthErrorKey(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      console.warn('[deckers] Google 로그인을 시작하지 못했습니다', error)
      setAuthErrorKey('auth.signInFailed')
    }
  }, [])

  const signOut = useCallback(() => {
    setAuthErrorKey(null)
    return supabase?.auth.signOut()
  }, [])

  return (
    <Ctx.Provider value={{
      user, authReady, hydrated, status, message, authErrorKey,
      doSync, signIn, signOut, enabled: hasSupabase,
    }}>
      {children}
    </Ctx.Provider>
  )
}
