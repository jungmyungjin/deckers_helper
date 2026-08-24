import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/localDb'
import { computeStats } from '../db/runs'
import { useAuth } from '../lib/useAuth'
import { syncAll } from '../lib/sync'

const ACHIEVEMENTS = [
  { id: 'stamps-1', icon: '🩹', name: '첫 침투', metric: 'stamps', threshold: 1 },
  { id: 'stamps-5', icon: '💾', name: '숙련 데커', metric: 'stamps', threshold: 5 },
  { id: 'stamps-25', icon: '🧬', name: '베테랑', metric: 'stamps', threshold: 25 },
  { id: 'stamps-84', icon: '👑', name: '풀 클리어', metric: 'stamps', threshold: 84 },
  { id: 'perfects-1', icon: '🌟', name: '완벽한 해킹', metric: 'perfects', threshold: 1 },
  { id: 'perfects-10', icon: '💎', name: '퍼펙트 해커', metric: 'perfects', threshold: 10 },
]

export default function Profile() {
  const runs = useLiveQuery(() => db.runs.toArray(), [], [])
  const stats = computeStats(runs)
  const val = { stamps: stats.stamps, perfects: stats.perfects }
  const unlocked = ACHIEVEMENTS.filter((a) => val[a.metric] >= a.threshold).length
  const { user, signIn, signOut, enabled } = useAuth()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  // 로그인되면 자동 동기화 1회
  useEffect(() => { if (user) doSync() }, [user]) // eslint-disable-line

  async function doSync() {
    if (!user) return
    setSyncing(true); setSyncMsg('')
    try {
      const r = await syncAll(user.id)
      setSyncMsg(`동기화 완료 · 업로드 ${r.pushed} · 다운로드 ${r.pulled}`)
    } catch (e) {
      setSyncMsg('동기화 오류: ' + e.message)
    } finally { setSyncing(false) }
  }

  return (
    <div className="page">
      <header className="appbar">
        <div><h1>프로필 · 업적</h1><div className="sub">{user ? '동기화 모드' : '게스트 모드'}</div></div>
      </header>
      <div className="scroll">
        {!user && (
          <>
            <button className="gbtn" onClick={signIn} disabled={!enabled} title={enabled ? '' : 'Supabase 미설정'}>
              <span className="g" />Google로 로그인하고 동기화
            </button>
            <div className="guest">
              지금은 이 기기에만 저장 중 · 로그인 시 병합
              {!enabled && ' (Supabase 설정 필요 — .env)'}
            </div>
          </>
        )}
        {user && (
          <div className="userbox">
            <div className="userrow">
              <div className="uavatar">{(user.email || 'U')[0].toUpperCase()}</div>
              <div className="uinfo"><div className="uname">{user.user_metadata?.name || user.email}</div><div className="uemail">{user.email}</div></div>
            </div>
            <div className="userbtns">
              <button className="minibtn" onClick={doSync} disabled={syncing}>{syncing ? '동기화 중…' : '🔄 동기화'}</button>
              <button className="minibtn ghost" onClick={signOut}>로그아웃</button>
            </div>
            {syncMsg && <div className="syncmsg">{syncMsg}</div>}
          </div>
        )}

        <div className="stat-row" style={{ marginTop: 12 }}>
          <div className="stat c-gold"><div className="n">{stats.stamps}<span className="sub2">/{stats.totalCells}</span></div><div className="l">Gold 도장</div></div>
          <div className="stat c-safe"><div className="n">{stats.winRate}%</div><div className="l">승률</div></div>
          <div className="stat c-cyan"><div className="n">{stats.total}</div><div className="l">플레이</div></div>
        </div>

        <div className="label">업적 {ACHIEVEMENTS.length}개 중 {unlocked}</div>
        <div className="achgrid">
          {ACHIEVEMENTS.map((a) => {
            const on = val[a.metric] >= a.threshold
            return (
              <div className={'ach' + (on ? ' on' : ' lock')} key={a.id}>
                <div className="ai">{a.icon}</div>
                <div className="an">{a.name}</div>
                <div className="ap">{a.metric === 'stamps' ? '도장' : '대성공'} {a.threshold}{!on ? ` · ${val[a.metric]}/${a.threshold}` : ''}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
