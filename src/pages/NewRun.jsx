import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SMCS, DECKERS, COPPERS, SILVERS, GOLDS, DECKER_COLORS } from '../data/gameData'
import { calcOutcome, OUTCOME_META } from '../lib/outcome'
import { saveRun } from '../db/runs'

export default function NewRun() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [smcId, setSmcId] = useState(SMCS[0].id)
  const [deckers, setDeckers] = useState([{ deckerId: DECKERS[0].id, playerName: '' }])
  const [cycles, setCycles] = useState({
    copper: { objectiveId: sp.get('copper') || COPPERS[0].id, result: 'success' },
    silver: { objectiveId: sp.get('silver') || SILVERS[0].id, result: 'success' },
    gold: { objectiveId: sp.get('gold') || GOLDS[0].id, result: 'success' },
  })

  // 초기값: 챌린지에서 넘어온 보스
  useMemo(() => { const s = sp.get('smc'); if (s) setSmcId(s) }, []) // eslint-disable-line

  const objectives = [
    { cycleNo: 1, security: 'copper', ...cycles.copper, isFinal: false },
    { cycleNo: 2, security: 'silver', ...cycles.silver, isFinal: false },
    { cycleNo: 3, security: 'gold', ...cycles.gold, isFinal: true },
  ]
  const outcome = calcOutcome(objectives)
  const om = OUTCOME_META[outcome]

  function setResult(sec, result) {
    setCycles((c) => ({ ...c, [sec]: { ...c[sec], result } }))
  }
  function setCard(sec, objectiveId) {
    setCycles((c) => ({ ...c, [sec]: { ...c[sec], objectiveId } }))
  }
  function addDecker() {
    const used = new Set(deckers.map((d) => d.deckerId))
    const next = DECKERS.find((d) => !used.has(d.id)) || DECKERS[0]
    setDeckers((d) => [...d, { deckerId: next.id, playerName: '' }])
  }
  function updDecker(i, patch) {
    setDeckers((d) => d.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  }
  function rmDecker(i) {
    setDeckers((d) => d.filter((_, idx) => idx !== i))
  }

  async function save() {
    await saveRun({ smcId, deckers, objectives })
    nav('/')
  }

  const CardSelect = ({ sec, list }) => (
    <select className="csel" value={cycles[sec].objectiveId} onChange={(e) => setCard(sec, e.target.value)}>
      {list.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  )

  return (
    <div className="page">
      <header className="appbar"><div><h1>새 기록</h1><div className="sub">NEW RUN</div></div></header>

      <div className="scroll">
        <div className="field">
          <div className="k">보스 (SMC)</div>
          <select className="csel big" value={smcId} onChange={(e) => setSmcId(e.target.value)}>
            {SMCS.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.tier}</option>)}
          </select>
        </div>

        <div className="field">
          <div className="k">덱커 · 조종한 사람</div>
          {deckers.map((d, i) => (
            <div className="drow" key={i}>
              <span className="dk" style={{ background: DECKER_COLORS[DECKERS.find((x) => x.id === d.deckerId)?.color] }} />
              <select className="csel" value={d.deckerId} onChange={(e) => updDecker(i, { deckerId: e.target.value })}>
                {DECKERS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
              <input className="cinput" placeholder="플레이어" value={d.playerName}
                onChange={(e) => updDecker(i, { playerName: e.target.value })} />
              {deckers.length > 1 && <button className="rm" onClick={() => rmDecker(i)}>×</button>}
            </div>
          ))}
          {deckers.length < DECKERS.length && <button className="addbtn" onClick={addDecker}>＋ 덱커 추가</button>}
        </div>

        <div className="label">사이클별 목표 · 결과</div>
        <div className="cyclelist">
          {[['copper', COPPERS, 'COPPER'], ['silver', SILVERS, 'SILVER'], ['gold', GOLDS, 'GOLD · 최종 → 도장 기준']].map(
            ([sec, list, tag]) => (
              <div className="cyc" key={sec}>
                <span className={'tier ' + sec} />
                <div className="cyc-body">
                  <CardSelect sec={sec} list={list} />
                  <small>{tag}</small>
                </div>
                <span className="toggle">
                  <button className={'s' + (cycles[sec].result === 'success' ? ' on' : '')} onClick={() => setResult(sec, 'success')}>성공</button>
                  <button className={'f' + (cycles[sec].result === 'fail' ? ' on' : '')} onClick={() => setResult(sec, 'fail')}>실패</button>
                </span>
              </div>
            )
          )}
        </div>

        <div className={'outcome ' + outcome}>
          <div className="big" style={{ color: om.color }}>{om.icon} {om.label}</div>
          <div className="desc">최종 Gold {cycles.gold.result === 'success' ? '성공' : '실패'} 기준 자동 판정</div>
        </div>

        <button className="btn" onClick={save}>기록 저장</button>
      </div>
    </div>
  )
}
