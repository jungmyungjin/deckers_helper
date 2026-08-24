import { useLiveQuery } from 'dexie-react-hooks'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../db/localDb'
import { attemptsFor } from '../db/runs'
import { SMC_BY_ID, CARD_BY_ID, DECKER_BY_ID, DECKER_COLORS } from '../data/gameData'
import { OUTCOME_META } from '../lib/outcome'

export default function MissionDetail() {
  const { smcId, goldId } = useParams()
  const nav = useNavigate()
  const runs = useLiveQuery(() => db.runs.toArray(), [], [])
  const smc = SMC_BY_ID[smcId]
  const gold = CARD_BY_ID[goldId]
  const attempts = attemptsFor(runs, smcId, goldId)
  const wins = attempts.filter((a) => a.outcome !== 'fail').length
  const perfects = attempts.filter((a) => a.outcome === 'perfect').length
  const fails = attempts.filter((a) => a.outcome === 'fail').length

  if (!smc || !gold) return <div className="page"><div className="scroll">잘못된 미션</div></div>

  return (
    <div className="page">
      <header className="appbar">
        <div className="titlewrap">
          <button className="back" onClick={() => nav(-1)}>‹</button>
          <div><h1>{gold.name}</h1><div className="sub">vs {smc.name.toUpperCase()}</div></div>
        </div>
      </header>

      <div className="scroll">
        <div className="mhead">
          <div className="mt">◆ Gold Mission × SMC</div>
          <div className="mn">{gold.name}</div>
          <div className="mvs">vs {smc.name}</div>
          <div className="mstate">
            {wins > 0 ? (perfects > 0 ? '🥇 클리어 · 대성공 달성' : '✓ 클리어') : '미도전'}
          </div>
        </div>

        <div className="mstats">
          <div><div className="v" style={{ color: 'var(--cyan)' }}>{attempts.length}</div><div className="k">도전</div></div>
          <div><div className="v" style={{ color: 'var(--safe)' }}>{wins}</div><div className="k">승리</div></div>
          <div><div className="v" style={{ color: 'var(--gold)' }}>{perfects}</div><div className="k">대성공</div></div>
          <div><div className="v" style={{ color: 'var(--danger)' }}>{fails}</div><div className="k">실패</div></div>
        </div>

        <div className="label">도전 히스토리 · 각 조합</div>
        {attempts.length === 0 && <div className="empty">아직 이 미션에 도전한 기록이 없어요.</div>}

        {attempts.map((run) => {
          const om = OUTCOME_META[run.outcome]
          const copper = run.objectives.find((o) => o.security === 'copper')
          const silver = run.objectives.find((o) => o.security === 'silver')
          return (
            <div className="attempt" key={run.id}>
              <div className="arow">
                <span className={'abadge ab-' + run.outcome}>{om.icon}</span>
                <span className="ares">{om.label}</span>
                <span className="adate">{fmt(run.playedAt)}</span>
              </div>
              <div className="trio">
                <span className="tchip c"><small>COPPER</small>{copper ? CARD_BY_ID[copper.objectiveId]?.name ?? '—' : '—'}</span>
                <span className="tchip s"><small>SILVER</small>{silver ? CARD_BY_ID[silver.objectiveId]?.name ?? '—' : '—'}</span>
                <span className="tchip g"><small>GOLD</small>{gold.name}</span>
              </div>
              <div className="wholine">
                {run.deckers.length === 0 && <span className="p">덱커 미기록</span>}
                {run.deckers.map((d, i) => {
                  const dk = DECKER_BY_ID[d.deckerId]
                  return (
                    <span className="p" key={i}>
                      <span className="dk" style={{ background: DECKER_COLORS[dk?.color] || '#888' }} />
                      {dk?.name || d.deckerId}{d.playerName ? '·' + d.playerName : ''}
                    </span>
                  )
                })}
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
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`
}
