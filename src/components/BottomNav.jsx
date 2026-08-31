import { NavLink } from 'react-router-dom'
import { useT } from '../i18n'
import BrandMark from './BrandMark'

// 제품명은 번역하지 않는다 — 세 언어에서 같은 이름으로 불려야 한다.
// 부제는 번역한다(app.subtitle) — 이름이 아니라 설명이기 때문.
const PRODUCT_WORD = 'DECKERS'

// label 은 i18n 키. 탭은 4개까지만 둔다 — iOS 는 5개, Material 은 3~5개가 상한이고
// 6개였을 때는 번역 길이까지 규칙으로 묶어야 했다. 목표 카드는 보드에서, 프로필은
// 헤더 아이콘에서 들어간다.
const items = [
  { to: '/', ico: '🏆', key: 'nav.board', end: true },
  { to: '/history', ico: '📜', key: 'nav.history' },
  { to: '/new', ico: '➕', key: 'nav.new' },
  { to: '/shuffle', ico: '🎲', key: 'nav.shuffle' },
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
