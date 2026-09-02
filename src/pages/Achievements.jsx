import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import { useDeletedRunCount, useRuns } from '../db/runs'
import { OPEN_SECTIONS, evaluate, summarize } from '../lib/achievements'
import { cardName, deckerName, smcName } from '../i18n/content'
import { useT } from '../i18n'

// 업적은 runs에서 파생된다 — 목록과 조건은 docs/achievements.md, 판정은 lib/achievements.js.
//
// 이 화면의 규칙 하나: **잠긴 히든은 개별로 그리지 않는다.** 이름도 조건도 진행도도
// 내보내지 않고, 남은 개수만 카드 하나로 접는다. ??? 타일 수십 칸은 화면을 죽은
// 칸으로 덮을 뿐이고, 진행도를 보여주는 순간 조건이 새기 때문이다.

function targetLabel(item) {
  if (!item.targetId) return ''
  if (item.target === 'decker') return deckerName(item.targetId)
  if (item.target === 'boss') return smcName(item.targetId)
  if (item.target === 'cell') {
    const [smcId, goldId] = item.targetId.split('|')
    return `${smcName(smcId)} · ${cardName(goldId)}`
  }
  return ''
}

function Tile({ item, onOpen }) {
  const { t } = useT()
  const name = t(`achievements.list.${item.id}.name`)
  const target = targetLabel(item)

  if (item.hidden) {
    return (
      <button className="ach hid" onClick={() => onOpen(item)}>
        <span className="ai" aria-hidden="true">{item.icon}</span>
        <span className="an">{name}</span>
        <span className="ap">{t(`achievements.list.${item.id}.desc`)}</span>
      </button>
    )
  }

  const value = Math.min(item.value, item.goal)
  return (
    <button className={'ach' + (item.unlocked ? ' on' : ' lock')} onClick={() => onOpen(item)}>
      <span className="ai" aria-hidden="true">{item.icon}</span>
      <span className="an">{name}</span>
      <span className="abar"><i style={{ width: `${(value / item.goal) * 100}%` }} /></span>
      <span className="ap">{target ? `${target} ` : ''}{value} / {item.goal}</span>
    </button>
  )
}

export default function Achievements() {
  const nav = useNavigate()
  const { t } = useT()
  const runs = useRuns()
  const deletedCount = useDeletedRunCount()
  const [active, setActive] = useState(null)

  const items = useMemo(() => evaluate(runs, { deletedCount }), [runs, deletedCount])
  const summary = summarize(items)
  const hiddenFound = items.filter((a) => a.hidden && a.unlocked)
  const hiddenLeft = summary.hidden.total - summary.hidden.unlocked

  return (
    <div className="page">
      <header className="appbar">
        <div className="titlewrap">
          <button className="back" onClick={() => nav(-1)}>‹</button>
          <div>
            <h1>{t('achievements.title')}</h1>
            <div className="sub">{t('achievements.sub')}</div>
          </div>
        </div>
      </header>

      <div className="scroll">
        <div className="achgauge">
          <div className="agrow">
            <span className="agk">{t('achievements.open')}</span>
            <span className="agv">{summary.open.unlocked} <small>/ {summary.open.total}</small></span>
          </div>
          <div className="agbar">
            <i style={{ width: `${(summary.open.unlocked / summary.open.total) * 100}%` }} />
          </div>
          <div className="agsep" />
          <div className="agrow g">
            <span className="agk">{t('achievements.hidden')}</span>
            <span className="agv">{summary.hidden.unlocked} <small>/ {summary.hidden.total}</small></span>
          </div>
          <div className="agbar g">
            <i style={{ width: `${(summary.hidden.unlocked / summary.hidden.total) * 100}%` }} />
          </div>
        </div>

        {OPEN_SECTIONS.map((section) => (
          <div key={section}>
            <div className="label">{t(`achievements.sec.${section}`)}</div>
            <div className="achgrid">
              {items.filter((a) => a.section === section).map((item) => (
                <Tile key={item.id} item={item} onOpen={setActive} />
              ))}
            </div>
          </div>
        ))}

        <div className="label">
          {t('achievements.sec.hidden')} {summary.hidden.unlocked} / {summary.hidden.total}
        </div>
        {hiddenFound.length > 0 && (
          <div className="achgrid">
            {hiddenFound.map((item) => <Tile key={item.id} item={item} onOpen={setActive} />)}
          </div>
        )}
        {hiddenLeft > 0 && (
          <div className="hidlock">
            <div className="hl-ico" aria-hidden="true">🔒</div>
            <div className="hl-b">
              <div className="hl-t">{t('achievements.lockedTitle')}</div>
              <div className="hl-s">{t('achievements.lockedSub')}</div>
            </div>
            <div className="hl-n">{hiddenLeft}</div>
          </div>
        )}
      </div>

      {active && (
        <Modal
          className={'achmodal' + (active.hidden ? ' hid' : '')}
          title={t(`achievements.list.${active.id}.name`)}
          onClose={() => setActive(null)}
        >
          <div className="am-icon" aria-hidden="true">{active.icon}</div>
          <h2>{t(`achievements.list.${active.id}.name`)}</h2>
          <p className="am-copy">{t(`achievements.list.${active.id}.desc`)}</p>
          {!active.hidden && (
            <>
              <div className="am-bar">
                <i style={{ width: `${(Math.min(active.value, active.goal) / active.goal) * 100}%` }} />
              </div>
              <div className="am-num">
                <span>{targetLabel(active) || ''} {Math.min(active.value, active.goal)}</span>
                <span>{active.goal}</span>
              </div>
            </>
          )}
          <button className="closebtn" onClick={() => setActive(null)}>{t('achievements.close')}</button>
        </Modal>
      )}
    </div>
  )
}
