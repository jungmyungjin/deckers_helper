import { useNavigate } from 'react-router-dom'
import { useRuns, computeStats } from '../db/runs'
import { useSync } from '../lib/SyncProvider'
import { useT } from '../i18n'
import { APP_VERSION, usePendingReportCount } from '../db/reports'
import LanguageSelect from '../components/LanguageSelect'

// 업적은 runs에서 파생된다 — 기록만 동기화되면 어느 기기에서든 같은 결과가 나온다.
// 이름은 i18n(achievements.*)에서 가져온다.
const ACHIEVEMENTS = [
  { id: 'stamps-1', icon: '🩹', metric: 'stamps', threshold: 1 },
  { id: 'stamps-5', icon: '💾', metric: 'stamps', threshold: 5 },
  { id: 'stamps-25', icon: '🧬', metric: 'stamps', threshold: 25 },
  { id: 'stamps-84', icon: '👑', metric: 'stamps', threshold: 84 },
  { id: 'perfects-1', icon: '🌟', metric: 'perfects', threshold: 1 },
  { id: 'perfects-10', icon: '💎', metric: 'perfects', threshold: 10 },
]

export default function Profile() {
  const nav = useNavigate()
  const { t } = useT()
  const pendingReports = usePendingReportCount()
  const runs = useRuns()
  const stats = computeStats(runs)
  const val = { stamps: stats.stamps, perfects: stats.perfects }
  const unlocked = ACHIEVEMENTS.filter((a) => val[a.metric] >= a.threshold).length
  const { user, signIn, signOut, enabled, doSync, status, message, authErrorKey } = useSync()
  const syncing = status === 'syncing'

  return (
    <div className="page">
      <header className="appbar">
        {/* 하단 탭에서 빠져 헤더 아이콘으로 들어오는 하위 화면이 됐다 — 돌아갈 길을 준다 */}
        <div className="titlewrap">
          <button className="back" onClick={() => nav(-1)}>‹</button>
          <div>
            <h1>{t('profile.title')}</h1>
            <div className="sub">{user ? t('profile.subSignedIn') : t('profile.subGuest')}</div>
          </div>
        </div>
      </header>
      <div className="scroll">
        {!user && (
          <>
            <button className="gbtn" onClick={signIn} disabled={!enabled}
              title={enabled ? '' : t('profile.signInDisabledHint')}>
              <svg className="g" viewBox="0 0 24 24" role="img" aria-label="Google">
                <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.2c1.9-1.8 3.1-4.4 3.1-7.4Z" />
                <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9v2.6A10 10 0 0 0 12 22Z" />
                <path fill="#FBBC05" d="M6.2 13.7A6 6 0 0 1 5.9 12c0-.6.1-1.2.3-1.7V7.7H2.9A10 10 0 0 0 2 12c0 1.6.4 3.1.9 4.3l3.3-2.6Z" />
                <path fill="#EA4335" d="M12 6c1.6 0 3 .6 4.1 1.6l3.1-3A10 10 0 0 0 2.9 7.7l3.3 2.6C7 7.8 9.3 6 12 6Z" />
              </svg>
              {t('profile.signIn')}
            </button>
            {authErrorKey && <div className="syncmsg bad">{t(authErrorKey)}</div>}
            <div className="guest">
              {enabled ? t('profile.guestNote') : t('profile.guestNoteDisabled')}
            </div>
          </>
        )}
        {user && (
          <div className="userbox">
            <div className="userrow">
              <div className="uavatar">{(user.email || 'U')[0].toUpperCase()}</div>
              <div className="uinfo">
                <div className="uname">{user.user_metadata?.name || user.email}</div>
                <div className="uemail">{user.email}</div>
              </div>
            </div>
            <div className="userbtns">
              <button className="minibtn" onClick={doSync} disabled={syncing}>
                {syncing ? t('profile.syncing') : t('profile.sync')}
              </button>
              <button className="minibtn ghost" onClick={signOut}>{t('profile.signOut')}</button>
            </div>
            {message && (
              <div className={'syncmsg' + (status === 'error' ? ' bad' : '')}>{message}</div>
            )}
          </div>
        )}

        <div className="stat-row" style={{ marginTop: 12 }}>
          <div className="stat c-gold">
            <div className="n">{stats.stamps}<span className="sub2">/{stats.totalCells}</span></div>
            <div className="l">{t('profile.stamps')}</div>
          </div>
          <div className="stat c-safe"><div className="n">{stats.winRate}%</div><div className="l">{t('profile.winRate')}</div></div>
          <div className="stat c-cyan"><div className="n">{stats.total}</div><div className="l">{t('profile.plays')}</div></div>
        </div>

        <div className="label">{t('profile.achievements', { total: ACHIEVEMENTS.length, unlocked })}</div>
        <div className="achgrid">
          {ACHIEVEMENTS.map((a) => {
            const on = val[a.metric] >= a.threshold
            const unit = t(a.metric === 'stamps' ? 'achievements.unitStamps' : 'achievements.unitPerfects')
            return (
              <div className={'ach' + (on ? ' on' : ' lock')} key={a.id}>
                <div className="ai">{a.icon}</div>
                <div className="an">{t(`achievements.${a.id}`)}</div>
                <div className="ap">
                  {unit} {a.threshold}{!on ? ` · ${val[a.metric]}/${a.threshold}` : ''}
                </div>
              </div>
            )
          })}
        </div>

        <div className="label">{t('profile.languageRow')}</div>
        <LanguageSelect />
        <div className="guest">{t('profile.languageSub')}</div>

        <button className="linkrow" onClick={() => nav('/report')}>
          <span className="lr-ico">🐞</span>
          <span className="lr-body">
            <span className="lr-t">{t('profile.reportRow')}</span>
            <span className="lr-s">
              {pendingReports > 0
                ? t('profile.reportRowPending', { count: pendingReports })
                : t('profile.reportRowSub')}
            </span>
          </span>
          <span className="lr-arrow">›</span>
        </button>

        <div className="verline">v{APP_VERSION}</div>
      </div>
    </div>
  )
}
