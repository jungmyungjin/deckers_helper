import { useNavigate } from 'react-router-dom'
import { useRuns, computeStats } from '../db/runs'
import { useSync } from '../lib/SyncProvider'
import { APP_VERSION, usePendingReportCount } from '../db/reports'

// 업적은 runs에서 파생된다 — 기록만 동기화되면 어느 기기에서든 같은 결과가 나온다.
const ACHIEVEMENTS = [
  { id: 'stamps-1', icon: '🩹', name: '첫 침투', metric: 'stamps', threshold: 1 },
  { id: 'stamps-5', icon: '💾', name: '숙련 데커', metric: 'stamps', threshold: 5 },
  { id: 'stamps-25', icon: '🧬', name: '베테랑', metric: 'stamps', threshold: 25 },
  { id: 'stamps-84', icon: '👑', name: '풀 클리어', metric: 'stamps', threshold: 84 },
  { id: 'perfects-1', icon: '🌟', name: '완벽한 해킹', metric: 'perfects', threshold: 1 },
  { id: 'perfects-10', icon: '💎', name: '퍼펙트 해커', metric: 'perfects', threshold: 10 },
]

export default function Profile() {
  const nav = useNavigate()
  const pendingReports = usePendingReportCount()
  const runs = useRuns()
  const stats = computeStats(runs)
  const val = { stamps: stats.stamps, perfects: stats.perfects }
  const unlocked = ACHIEVEMENTS.filter((a) => val[a.metric] >= a.threshold).length
  const { user, signIn, signOut, enabled, doSync, status, message } = useSync()
  const syncing = status === 'syncing'

  return (
    <div className="page">
      <header className="appbar">
        <div><h1>프로필 · 업적</h1><div className="sub">{user ? '기록이 계정에 저장돼요' : '이 기기에만 저장 중'}</div></div>
      </header>
      <div className="scroll">
        {!user && (
          <>
            <button className="gbtn" onClick={signIn} disabled={!enabled}
              title={enabled ? '' : '지금은 로그인을 사용할 수 없어요'}>
              <span className="g" />Google로 로그인하고 동기화
            </button>
            <div className="guest">
              {enabled
                ? '지금은 이 기기에만 저장돼요 · 로그인하면 지금까지의 기록도 함께 보관됩니다'
                : '지금은 로그인을 사용할 수 없어요 · 기록은 이 기기에 저장됩니다'}
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
            {message && (
              <div className={'syncmsg' + (status === 'error' ? ' bad' : '')}>{message}</div>
            )}
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

        <button className="linkrow" onClick={() => nav('/report')}>
          <span className="lr-ico">🐞</span>
          <span className="lr-body">
            <span className="lr-t">오류 제보</span>
            <span className="lr-s">
              {pendingReports > 0 ? `전송 대기 중 ${pendingReports}건` : '잘 안 되는 부분을 알려주세요'}
            </span>
          </span>
          <span className="lr-arrow">›</span>
        </button>

        <div className="verline">v{APP_VERSION}</div>
      </div>
    </div>
  )
}
