import { useState } from 'react'
import { SECURITY_COLORS } from '../data/gameData'

// 표시용 라벨. 내부 값(copper/…)은 기록에 저장되므로 그대로 둔다.
const SEC_LABEL = { copper: 'Bronze', silver: 'Silver', gold: 'Gold', ghost: "Mother's Ghost" }

// 목표 카드 뒤집기: 앞면(GOAL/SETUP/RULES) ↔ 뒷면(SUCCESS/FAIL)
export default function FlipCard({ card }) {
  const [flipped, setFlipped] = useState(false)
  const hasBody = card.goal || card.rules || card.setup
  const hasBack = card.success || card.fail
  const c = SECURITY_COLORS[card.security]

  return (
    <div className="flipwrap">
      <div className={'cardstage' + (flipped ? ' flip' : '')} onClick={() => setFlipped((f) => !f)}>
        <div className="card3d">
          <div className="face front" style={{ borderColor: c }}>
            <div className="ctag" style={{ color: c }}>◆ {SEC_LABEL[card.security]} · Goal</div>
            <div className="cnm">{card.name}</div>
            <div className="facebody">
              {card.goal && <div className="sec"><b>Goal</b>{card.goal}</div>}
              {card.setup && <div className="sec"><b>Setup</b>{card.setup}</div>}
              {card.rules && <div className="sec"><b>Rules</b>{card.rules}</div>}
              {!hasBody && <div className="sec empty2">내용 입력 예정<br /><small>실물 카드 참고</small></div>}
            </div>
            <div className="flipmark">{hasBack ? '탭 → 결과 ⟳' : '탭 ⟳'}</div>
          </div>
          <div className="face back">
            <div className="ctag" style={{ color: 'var(--safe)' }}>판정 결과</div>
            <div className="cnm">SUCCESS / FAIL</div>
            <div className="facebody">
              {card.success && <div className="sec"><b style={{ color: 'var(--safe)' }}>Success</b>{card.success}</div>}
              {card.fail && <div className="sec"><b style={{ color: 'var(--danger)' }}>Fail</b>{card.fail}</div>}
              {card.flavor_success && <div className="flavor">“{card.flavor_success}”</div>}
              {!hasBack && <div className="sec empty2">결과면 내용 입력 예정</div>}
            </div>
            <div className="flipmark">탭 → 원면 ⟳</div>
          </div>
        </div>
      </div>
    </div>
  )
}
