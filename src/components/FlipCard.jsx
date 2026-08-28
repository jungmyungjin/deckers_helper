import { useState } from 'react'
import { SECURITY_COLORS } from '../data/gameData'
import { useT } from '../i18n'
import { cardName, cardText } from '../i18n/content'

// 목표 카드 뒤집기: 앞면(GOAL/SETUP/RULES) ↔ 뒷면(SUCCESS/FAIL)
// card 는 뼈대({ id, security, code })만 받고, 이름·본문은 현재 언어로 조회한다.
export default function FlipCard({ card }) {
  const { t } = useT()
  const [flipped, setFlipped] = useState(false)
  const text = cardText(card.id)
  const hasBody = text.goal || text.rules || text.setup
  const hasBack = text.success || text.fail
  const c = SECURITY_COLORS[card.security]

  return (
    <div className="flipwrap">
      <div className={'cardstage' + (flipped ? ' flip' : '')} onClick={() => setFlipped((f) => !f)}>
        <div className="card3d">
          <div className="face front" style={{ borderColor: c }}>
            <div className="ctag" style={{ color: c }}>
              {t('flipCard.goalTag', { security: t(`game.security.${card.security}`) })}
            </div>
            <div className="cnm">{cardName(card.id)}</div>
            <div className="facebody">
              {text.goal && <div className="sec"><b>{t('flipCard.goal')}</b>{text.goal}</div>}
              {text.setup && <div className="sec"><b>{t('flipCard.setup')}</b>{text.setup}</div>}
              {text.rules && <div className="sec"><b>{t('flipCard.rules')}</b>{text.rules}</div>}
              {!hasBody && (
                <div className="sec empty2">
                  {t('flipCard.bodyPending')}<br /><small>{t('flipCard.seePhysical')}</small>
                </div>
              )}
            </div>
            <div className="flipmark">{hasBack ? t('flipCard.tapToResult') : t('flipCard.tap')}</div>
          </div>
          <div className="face back">
            <div className="ctag" style={{ color: 'var(--safe)' }}>{t('flipCard.resultTag')}</div>
            <div className="cnm">{t('flipCard.resultTitle')}</div>
            <div className="facebody">
              {text.success && (
                <div className="sec"><b style={{ color: 'var(--safe)' }}>{t('flipCard.success')}</b>{text.success}</div>
              )}
              {text.fail && (
                <div className="sec"><b style={{ color: 'var(--danger)' }}>{t('flipCard.fail')}</b>{text.fail}</div>
              )}
              {text.flavor_success && <div className="flavor">“{text.flavor_success}”</div>}
              {!hasBack && <div className="sec empty2">{t('flipCard.resultPending')}</div>}
            </div>
            <div className="flipmark">{t('flipCard.tapToFront')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
