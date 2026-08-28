import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRuns, deleteRun, finalGoldId } from '../db/runs'
import { useSync } from '../lib/SyncProvider'
import { useT } from '../i18n'
import { cardName, deckerName, smcName } from '../i18n/content'
import { formatDateTimeStacked } from '../lib/format'
import { SMCS } from '../data/gameData'
import { OUTCOME_META } from '../lib/outcome'
import SelectField from '../components/SelectField'

const FILTERS = [
  { key: 'all', label: 'history.filterAll' },
  { key: 'perfect', label: 'history.filterPerfect' },
  { key: 'success', label: 'history.filterSuccess' },
  { key: 'fail', label: 'history.filterFail' },
]

export default function History() {
  const nav = useNavigate()
  const { t } = useT()
  const runs = useRuns()
  const { hydrated } = useSync()
  const [filter, setFilter] = useState('all')
  const [smc, setSmc] = useState('all')

  const filtered = runs.filter((r) =>
    (filter === 'all' || r.outcome === filter) && (smc === 'all' || r.smcId === smc)
  )

  return (
    <div className="page">
      <header className="appbar">
        <div><h1>{t('history.title')}</h1><div className="sub">{t('history.runs', { count: runs.length })}</div></div>
      </header>
      <div className="scroll">
        <div className="segtabs">
          {FILTERS.map((f) => (
            <button key={f.key} className={'segtab sm' + (filter === f.key ? ' on' : '')}
              onClick={() => setFilter(f.key)}>{t(f.label)}</button>
          ))}
        </div>
        <SelectField
          ariaLabel={t('history.allBosses')}
          style={{ marginBottom: 12 }}
          value={smc}
          options={[
            { value: 'all', label: t('history.allBosses') },
            ...SMCS.map((smcItem) => ({ value: smcItem.id, label: smcName(smcItem.id) })),
          ]}
          onChange={setSmc}
        />

        {filtered.length === 0 && (
          <div className="empty">{hydrated ? t('history.empty') : t('common.loading')}</div>
        )}

        {filtered.map((run) => {
          const om = OUTCOME_META[run.outcome]
          const gid = finalGoldId(run)
          return (
            <div className="runcard" key={run.id}
              onClick={() => gid && nav(`/mission/${run.smcId}/${gid}`)}>
              <span className={'runbadge ab-' + run.outcome}>{om.icon}</span>
              <div className="runinfo">
                <div className="runtitle">
                  {smcName(run.smcId)} <span className="rungold">· {gid ? cardName(gid) : '—'}</span>
                </div>
                <div className="runwho">
                  {run.deckers.length === 0 ? t('common.noDecker') :
                    run.deckers.map((d) =>
                      `${deckerName(d.deckerId)}${d.playerName ? '·' + d.playerName : ''}`
                    ).join(' / ')}
                </div>
              </div>
              <div className="runmeta">
                <div className="runtime">{formatDateTimeStacked(run.playedAt)}</div>
                <button className="delx" onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(t('history.confirmDelete'))) deleteRun(run.id)
                }}>✕</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
