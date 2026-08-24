import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/localDb'
import { deleteRun, finalGoldId } from '../db/runs'
import { SMC_BY_ID, CARD_BY_ID, DECKER_BY_ID, DECKER_COLORS, SMCS } from '../data/gameData'
import { OUTCOME_META } from '../lib/outcome'

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'perfect', label: '🥇 대성공' },
  { key: 'success', label: '✓ 성공' },
  { key: 'fail', label: '✕ 실패' },
]

export default function History() {
  const nav = useNavigate()
  const runs = useLiveQuery(() => db.runs.orderBy('playedAt').reverse().toArray(), [], [])
  const [filter, setFilter] = useState('all')
  const [smc, setSmc] = useState('all')

  const filtered = runs.filter((r) =>
    (filter === 'all' || r.outcome === filter) && (smc === 'all' || r.smcId === smc)
  )

  return (
    <div className="page">
      <header className="appbar">
        <div><h1>히스토리</h1><div className="sub">{runs.length} RUNS</div></div>
      </header>
      <div className="scroll">
        <div className="segtabs">
          {FILTERS.map((f) => (
            <button key={f.key} className={'segtab sm' + (filter === f.key ? ' on' : '')}
              onClick={() => setFilter(f.key)}>{f.label}</button>
          ))}
        </div>
        <select className="csel" style={{ marginBottom: 12 }} value={smc} onChange={(e) => setSmc(e.target.value)}>
          <option value="all">모든 보스</option>
          {SMCS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        {filtered.length === 0 && <div className="empty">해당하는 기록이 없어요.</div>}

        {filtered.map((run) => {
          const om = OUTCOME_META[run.outcome]
          const smcInfo = SMC_BY_ID[run.smcId]
          const gid = finalGoldId(run)
          const gold = gid ? CARD_BY_ID[gid] : null
          return (
            <div className="runcard" key={run.id}
              onClick={() => gid && nav(`/mission/${run.smcId}/${gid}`)}>
              <span className={'runbadge ab-' + run.outcome}>{om.icon}</span>
              <div className="runinfo">
                <div className="runtitle">{smcInfo?.name} <span className="rungold">· {gold?.name || '—'}</span></div>
                <div className="runwho">
                  {run.deckers.length === 0 ? '덱커 미기록' :
                    run.deckers.map((d) => {
                      const dk = DECKER_BY_ID[d.deckerId]
                      return `${dk?.name || d.deckerId}${d.playerName ? '·' + d.playerName : ''}`
                    }).join(' / ')}
                </div>
              </div>
              <div className="runmeta">
                <div className="runtime">{fmt(run.playedAt)}</div>
                <button className="delx" onClick={(e) => { e.stopPropagation(); if (confirm('이 기록을 삭제할까요?')) deleteRun(run.id) }}>✕</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function fmt(iso) {
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()}\n${p(d.getHours())}:${p(d.getMinutes())}`
}
