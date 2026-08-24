import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', ico: '🏆', label: '보드', end: true },
  { to: '/shuffle', ico: '🎲', label: '챌린지' },
  { to: '/new', ico: '➕', label: '기록' },
  { to: '/profile', ico: '👤', label: '프로필' },
]

export default function BottomNav() {
  return (
    <nav className="nav">
      <div className="nav-brand">
        <span className="nav-logo">◈</span>
        <span className="nav-word">DECKERS<small>도장깨기 헬퍼</small></span>
      </div>
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end}
          className={({ isActive }) => 'nav-item' + (isActive ? ' on' : '')}>
          <span className="ico">{it.ico}</span>
          {it.label}
        </NavLink>
      ))}
    </nav>
  )
}
