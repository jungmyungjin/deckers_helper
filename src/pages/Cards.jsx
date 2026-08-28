import { useState } from 'react'
import { OBJECTIVE_CARDS, SECURITY_COLORS } from '../data/gameData'
import FlipCard from '../components/FlipCard'

const TABS = [
  { key: 'copper', label: 'Bronze' },
  { key: 'silver', label: 'Silver' },
  { key: 'gold', label: 'Gold' },
  { key: 'ghost', label: "Mother's Ghost" },
]

export default function Cards() {
  const [tab, setTab] = useState('gold')
  const [active, setActive] = useState(null)
  const list = OBJECTIVE_CARDS.filter((c) => c.security === tab)
  const filled = OBJECTIVE_CARDS.filter((c) => c.goal || c.success).length

  return (
    <div className="page">
      <header className="appbar">
        <div><h1>목표 카드</h1><div className="sub">40장 · 전문 {filled}장 확보</div></div>
      </header>
      <div className="scroll">
        <div className="segtabs">
          {TABS.map((t) => (
            <button key={t.key} className={'segtab' + (tab === t.key ? ' on' : '')}
              style={tab === t.key ? { color: SECURITY_COLORS[t.key], borderColor: SECURITY_COLORS[t.key] } : {}}
              onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        {active && (
          <div className="cardmodal" onClick={() => setActive(null)}>
            <div className="cardmodal-inner" onClick={(e) => e.stopPropagation()}>
              <FlipCard card={active} />
              <button className="closebtn" onClick={() => setActive(null)}>닫기</button>
            </div>
          </div>
        )}

        <div className="cardgrid">
          {list.map((c) => {
            const col = SECURITY_COLORS[c.security]
            const hasText = c.goal || c.success
            return (
              <button key={c.id} className="cardtile" style={{ borderColor: col }} onClick={() => setActive(c)}>
                <span className="cardtile-tag" style={{ color: col }}>◆</span>
                <span className="cardtile-name">{c.name}</span>
                <span className={'cardtile-badge' + (hasText ? ' has' : '')}>{hasText ? '전문' : '이름'}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
