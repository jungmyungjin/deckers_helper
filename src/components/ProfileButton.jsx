import { NavLink } from 'react-router-dom'
import { useSync } from '../lib/SyncProvider'
import { useT } from '../i18n'

// 프로필은 하단 탭에서 빠졌다 — 로그인·언어·제보처럼 자주 열 일이 없는 것들이라
// 여섯 칸을 나눠 쓸 자리로는 비쌌다. 대신 헤더 우측에 상시 둔다.
//
// 로그인했으면 이니셜을, 게스트면 사람 글리프를 보여준다. 하단 탭이었을 때는
// 알 수 없던 "지금 로그인돼 있나"가 어느 화면에서든 보이는 게 덤이다.
export default function ProfileButton() {
  const { t } = useT()
  const { user } = useSync()
  const initial = (user?.email || '')[0]?.toUpperCase()

  return (
    <NavLink to="/profile" className="hdr-profile" aria-label={t('nav.profile')}>
      {initial ? <span className="hp-initial">{initial}</span> : (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="7" r="3.2" />
          <path d="M4 17c0-3.3 2.7-5 6-5s6 1.7 6 5" />
        </svg>
      )}
    </NavLink>
  )
}
