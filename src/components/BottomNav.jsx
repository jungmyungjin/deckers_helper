import { NavLink } from 'react-router-dom'
import { useT } from '../i18n'
import BrandMark from './BrandMark'

// 제품명은 번역하지 않는다 — 세 언어에서 같은 이름으로 불려야 한다.
// 부제는 번역한다(app.subtitle) — 이름이 아니라 설명이기 때문.
const PRODUCT_WORD = 'DECKERS'

// label 은 i18n 키. 하단 탭 6개가 480px를 나눠 쓰므로 어느 언어에서든
// 8자를 넘지 않게 번역할 것 (i18n/de.json 주석 참고).
const items = [
  { to: '/', ico: '🏆', key: 'nav.board', end: true },
  { to: '/history', ico: '📜', key: 'nav.history' },
  { to: '/new', ico: '➕', key: 'nav.new' },
  { to: '/shuffle', ico: '🎲', key: 'nav.shuffle' },
  { to: '/cards', ico: '🃏', key: 'nav.cards' },
  { to: '/profile', ico: '👤', key: 'nav.profile' },
]

export default function BottomNav() {
  const { t } = useT()
  return (
    <nav className="nav">
      <div className="nav-brand">
        <BrandMark className="nav-logo" />
        <span className="nav-word">{PRODUCT_WORD}<small>{t('app.subtitle')}</small></span>
      </div>
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end}
          className={({ isActive }) => 'nav-item' + (isActive ? ' on' : '')}>
          <span className="ico">{it.ico}</span>
          {t(it.key)}
        </NavLink>
      ))}
    </nav>
  )
}
