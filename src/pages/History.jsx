import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DECKER_BY_ID, DECKER_COLORS } from '../data/gameData'
import { useRuns, deleteRun, finalGoldId } from '../db/runs'
import { useSync } from '../lib/SyncProvider'
import { useT } from '../i18n'
import { cardName, deckerName, smcName } from '../i18n/content'
import { formatDateGroup, formatDateTimeStacked, groupRunsByCalendarDay } from '../lib/format'
import { OUTCOME_META } from '../lib/outcome'
import Modal from '../components/Modal'
import BossSigil from '../components/BossSigil'
import ProfileButton from '../components/ProfileButton'

export default function History() {
  const nav = useNavigate()
  const { t } = useT()
  const runs = useRuns()
  const { hydrated } = useSync()
  const groups = groupRunsByCalendarDay(runs)
  const [deleting, setDeleting] = useState(null)

  return (
    <div className="page">
      <header className="appbar">
        <div><h1>{t('history.title')}</h1><div className="sub">{t('history.runs', { count: runs.length })}</div></div>
        <ProfileButton />
      </header>
      <div className="scroll">
        {runs.length > 0 && <div className="history-summary">
          <span>{t('history.runs', { count: runs.length })}</span>
          <span>{t('history.lastPlayed', { date: formatDateGroup(runs[0].playedAt) })}</span>
        </div>}

        {runs.length === 0 && (
          <div className="empty">{hydrated ? t('history.empty') : t('common.loading')}</div>
        )}

        {groups.map((group) => <section className="history-day" key={group.key}>
          <h2>{formatDateGroup(group.runs[0].playedAt)}</h2>
          {group.runs.map((run) => {
          const om = OUTCOME_META[run.outcome]
          const gid = finalGoldId(run)
          return (
            <div className="runcard" key={run.id}
              onClick={() => gid && nav(`/mission/${run.smcId}/${gid}`)}>
              <span className={'runbadge ab-' + run.outcome}>{om.icon}</span>
              <div className="runinfo">
                <div className="runtitle">
                  <BossSigil smcId={run.smcId} className="tsig" />
                  {smcName(run.smcId)} <span className="rungold">· {gid ? cardName(gid) : '—'}</span>
                </div>
                {/* 덱커 이름에만 고유색을 준다. 조종한 사람 이름은 회색 그대로 — 색은
                    "어느 덱커였나"를 가리키는 표식이지 사람을 가리키는 게 아니다. */}
                <div className="runwho">
                  {run.deckers.length === 0 ? t('common.noDecker') :
                    run.deckers.map((d, i) => (
                      <span key={i}>
                        {i > 0 && ' / '}
                        <span style={{ color: DECKER_COLORS[DECKER_BY_ID[d.deckerId]?.color] }}>
                          {deckerName(d.deckerId)}
                        </span>
                        {d.playerName ? '·' + d.playerName : ''}
                      </span>
                    ))}
                </div>
              </div>
              <div className="runmeta">
                <div className="runtime">{formatDateTimeStacked(run.playedAt)}</div>
                <button className="delx" onClick={(e) => {
                  e.stopPropagation()
                  setDeleting(run)
                }} aria-label={t('history.delete')}>
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 3h6m-8 3h10m-8 0v9h6V6m-4-3v3m-2-3v3" /></svg>
                </button>
              </div>
            </div>
          )
          })}
        </section>)}
        {deleting && <Modal className="confirm-modal" title={t('history.deleteTitle')} onClose={() => setDeleting(null)}>
          <div className="confirm-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20"><path d="M7 3h6m-8 3h10m-8 0v9h6V6m-4-3v3m-2-3v3" /></svg>
          </div>
          <h2>{t('history.deleteTitle')}</h2>
          <p className="confirm-target">{smcName(deleting.smcId)} · {cardName(finalGoldId(deleting) || '')}</p>
          <p className="confirm-copy">{t('history.deleteCopy')}</p>
          <div className="confirm-actions">
            <button className="modal-btn ghost" onClick={() => setDeleting(null)}>{t('common.cancel')}</button>
            <button className="modal-btn danger" onClick={() => { deleteRun(deleting.id); setDeleting(null) }}>{t('history.delete')}</button>
          </div>
        </Modal>}
      </div>
    </div>
  )
}
