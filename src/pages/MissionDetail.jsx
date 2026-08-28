import { useParams, useNavigate } from 'react-router-dom'
import { useRuns, attemptsFor } from '../db/runs'
import { useSync } from '../lib/SyncProvider'
import { useT } from '../i18n'
import { cardName, deckerName, smcName } from '../i18n/content'
import { formatDateTime } from '../lib/format'
import { SMC_BY_ID, CARD_BY_ID, DECKER_BY_ID, DECKER_COLORS } from '../data/gameData'
import { OUTCOME_META } from '../lib/outcome'

export default function MissionDetail() {
  const { smcId, goldId } = useParams()
  const nav = useNavigate()
  const { t } = useT()
  const runs = useRuns()
  const { hydrated } = useSync()
  const smc = SMC_BY_ID[smcId]
  const gold = CARD_BY_ID[goldId]
  const attempts = attemptsFor(runs, smcId, goldId)
  const wins = attempts.filter((a) => a.outcome !== 'fail').length
  const perfects = attempts.filter((a) => a.outcome === 'perfect').length
  const fails = attempts.filter((a) => a.outcome === 'fail').length

  if (!smc || !gold) return <div className="page"><div className="scroll">{t('mission.invalid')}</div></div>

  return (
    <div className="page">
      <header className="appbar">
        <div className="titlewrap">
          <button className="back" onClick={() => nav(-1)}>‹</button>
          <div>
            <h1>{cardName(goldId)}</h1>
            <div className="sub">{t('mission.vs', { name: smcName(smcId) })}</div>
          </div>
        </div>
      </header>

      <div className="scroll">
        <div className="mhead">
          <div className="mt">{t('mission.kicker')}</div>
          <div className="mn">{cardName(goldId)}</div>
          <div className="mvs">{t('mission.vs', { name: smcName(smcId) })}</div>
          <div className="mstate">
            {wins > 0
              ? (perfects > 0 ? t('mission.statePerfect') : t('mission.stateClear'))
              : t('mission.stateUntried')}
          </div>
        </div>

        <div className="mstats">
          <div><div className="v" style={{ color: 'var(--cyan)' }}>{attempts.length}</div><div className="k">{t('mission.attempts')}</div></div>
          <div><div className="v" style={{ color: 'var(--safe)' }}>{wins}</div><div className="k">{t('mission.wins')}</div></div>
          <div><div className="v" style={{ color: 'var(--gold)' }}>{perfects}</div><div className="k">{t('mission.perfects')}</div></div>
          <div><div className="v" style={{ color: 'var(--danger)' }}>{fails}</div><div className="k">{t('mission.fails')}</div></div>
        </div>

        <div className="label">{t('mission.listLabel')}</div>
        {attempts.length === 0 && (
          <div className="empty">{hydrated ? t('mission.empty') : t('common.loading')}</div>
        )}

        {attempts.map((run) => {
          const om = OUTCOME_META[run.outcome]
          const copper = run.objectives.find((o) => o.security === 'copper')
          const silver = run.objectives.find((o) => o.security === 'silver')
          return (
            <div className="attempt" key={run.id}>
              <div className="arow">
                <span className={'abadge ab-' + run.outcome}>{om.icon}</span>
                <span className="ares">{t(`outcome.${run.outcome}`)}</span>
                <span className="adate">{formatDateTime(run.playedAt)}</span>
              </div>
              <div className="trio">
                <span className="tchip c"><small>{t('game.securityShort.copper')}</small>{copper ? cardName(copper.objectiveId) : '—'}</span>
                <span className="tchip s"><small>{t('game.securityShort.silver')}</small>{silver ? cardName(silver.objectiveId) : '—'}</span>
                <span className="tchip g"><small>{t('game.securityShort.gold')}</small>{cardName(goldId)}</span>
              </div>
              <div className="wholine">
                {run.deckers.length === 0 && <span className="p">{t('common.noDecker')}</span>}
                {run.deckers.map((d, i) => (
                  <span className="p" key={i}>
                    <span className="dk" style={{ background: DECKER_COLORS[DECKER_BY_ID[d.deckerId]?.color] || '#888' }} />
                    {deckerName(d.deckerId)}{d.playerName ? '·' + d.playerName : ''}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
