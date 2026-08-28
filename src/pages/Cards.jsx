import { useState } from 'react'
import { OBJECTIVE_CARDS, SECURITY_COLORS } from '../data/gameData'
import { useT } from '../i18n'
import { cardName, hasCardBody, hasCardResult } from '../i18n/content'
import FlipCard from '../components/FlipCard'

const TABS = ['copper', 'silver', 'gold', 'ghost']

export default function Cards() {
  const { t } = useT()
  const [tab, setTab] = useState('gold')
  const [active, setActive] = useState(null)
  const list = OBJECTIVE_CARDS.filter((c) => c.security === tab)
  // 현재 언어로 전문이 들어온 카드 수 — 언어를 바꾸면 이 숫자도 따라 바뀐다
  const filled = OBJECTIVE_CARDS.filter((c) => hasCardBody(c.id) || hasCardResult(c.id)).length

  return (
    <div className="page">
      <header className="appbar">
        <div>
          <h1>{t('cards.title')}</h1>
          <div className="sub">{t('cards.sub', { count: filled })}</div>
        </div>
      </header>
      <div className="scroll">
        <div className="segtabs">
          {TABS.map((key) => (
            <button key={key} className={'segtab' + (tab === key ? ' on' : '')}
              style={tab === key ? { color: SECURITY_COLORS[key], borderColor: SECURITY_COLORS[key] } : {}}
              onClick={() => setTab(key)}>{t(`game.security.${key}`)}</button>
          ))}
        </div>

        {active && (
          <div className="cardmodal" onClick={() => setActive(null)}>
            <div className="cardmodal-inner" onClick={(e) => e.stopPropagation()}>
              <FlipCard card={active} />
              <button className="closebtn" onClick={() => setActive(null)}>{t('common.close')}</button>
            </div>
          </div>
        )}

        <div className="cardgrid">
          {list.map((c) => {
            const col = SECURITY_COLORS[c.security]
            const hasText = hasCardBody(c.id) || hasCardResult(c.id)
            return (
              <button key={c.id} className="cardtile" style={{ borderColor: col }} onClick={() => setActive(c)}>
                <span className="cardtile-tag" style={{ color: col }}>◆</span>
                <span className="cardtile-name">{cardName(c.id)}</span>
                <span className={'cardtile-badge' + (hasText ? ' has' : '')}>
                  {hasText ? t('cards.badgeFull') : t('cards.badgeNameOnly')}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
