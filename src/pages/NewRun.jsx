import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SMCS, DECKERS, COPPERS, SILVERS, GOLDS, DECKER_COLORS, DECKER_BY_ID, tierKey } from '../data/gameData'
import { useT } from '../i18n'
import { deckerName, cardName, smcName } from '../i18n/content'
import { calcOutcome, OUTCOME_META } from '../lib/outcome'
import { saveRun } from '../db/runs'

const CYCLE_DEFS = [
  ['copper', COPPERS, 'game.securityShort.copper'],
  ['silver', SILVERS, 'game.securityShort.silver'],
  ['gold', GOLDS, 'newRun.goldTag'],
]

export default function NewRun() {
  const nav = useNavigate()
  const { t } = useT()
  const [sp] = useSearchParams()
  const [smcId, setSmcId] = useState(SMCS[0].id)
  const [deckers, setDeckers] = useState([{ deckerId: DECKERS[0].id, playerName: '' }])
  // result는 null로 시작한다 — 성공이 미리 골라져 있으면 실제로 확인하지 않고
  // 저장해버리기 쉽다. 세 개를 모두 고르기 전에는 판정도 저장도 하지 않는다.
  const [cycles, setCycles] = useState({
    copper: { objectiveId: sp.get('copper') || COPPERS[0].id, result: null },
    silver: { objectiveId: sp.get('silver') || SILVERS[0].id, result: null },
    gold: { objectiveId: sp.get('gold') || GOLDS[0].id, result: null },
  })

  // 초기값: 챌린지에서 넘어온 보스
  useMemo(() => { const s = sp.get('smc'); if (s) setSmcId(s) }, []) // eslint-disable-line

  const objectives = [
    { cycleNo: 1, security: 'copper', ...cycles.copper, isFinal: false },
    { cycleNo: 2, security: 'silver', ...cycles.silver, isFinal: false },
    { cycleNo: 3, security: 'gold', ...cycles.gold, isFinal: true },
  ]
  const allChosen = CYCLE_DEFS.every(([sec]) => cycles[sec].result)
  const outcome = allChosen ? calcOutcome(objectives) : null
  const om = outcome ? OUTCOME_META[outcome] : null

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
    if (!allChosen) return
    await saveRun({ smcId, deckers, objectives })
    nav('/')
  }

  const CardSelect = ({ sec, list }) => (
    <select className="csel" value={cycles[sec].objectiveId} onChange={(e) => setCard(sec, e.target.value)}>
      {list.map((c) => <option key={c.id} value={c.id}>{cardName(c.id)}</option>)}
    </select>
  )

  return (
    <div className="page">
      <header className="appbar">
        <div><h1>{t('newRun.title')}</h1><div className="sub">{t('newRun.sub')}</div></div>
      </header>

      <div className="scroll">
        <div className="field">
          <div className="k">{t('newRun.boss')}</div>
          <select className="csel big" value={smcId} onChange={(e) => setSmcId(e.target.value)}>
            {SMCS.map((s) => (
              <option key={s.id} value={s.id}>
                {smcName(s.id)} · {t(`game.tier.${tierKey(s.difficulty)}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <div className="k">{t('newRun.deckers')}</div>
          {deckers.map((d, i) => (
            <div className="drow" key={i}>
              <span className="dk" style={{ background: DECKER_COLORS[DECKER_BY_ID[d.deckerId]?.color] }} />
              <select className="csel" value={d.deckerId} onChange={(e) => updDecker(i, { deckerId: e.target.value })}>
                {DECKERS.map((x) => <option key={x.id} value={x.id}>{deckerName(x.id)}</option>)}
              </select>
              <input className="cinput" placeholder={t('newRun.playerPlaceholder')} value={d.playerName}
                onChange={(e) => updDecker(i, { playerName: e.target.value })} />
              {deckers.length > 1 && <button className="rm" onClick={() => rmDecker(i)}>×</button>}
            </div>
          ))}
          {deckers.length < DECKERS.length && (
            <button className="addbtn" onClick={addDecker}>{t('newRun.addDecker')}</button>
          )}
        </div>

        <div className="label">{t('newRun.cyclesLabel')}</div>
        <div className="cyclelist">
          {CYCLE_DEFS.map(([sec, list, tagKey]) => (
            <div className="cyc" key={sec}>
              <span className={'tier ' + sec} />
              <div className="cyc-body">
                <CardSelect sec={sec} list={list} />
                <small>{t(tagKey)}</small>
              </div>
              <span className="toggle">
                <button className={'s' + (cycles[sec].result === 'success' ? ' on' : '')}
                  onClick={() => setResult(sec, 'success')}>{t('newRun.success')}</button>
                <button className={'f' + (cycles[sec].result === 'fail' ? ' on' : '')}
                  onClick={() => setResult(sec, 'fail')}>{t('newRun.fail')}</button>
              </span>
            </div>
          ))}
        </div>

        {/* 결과를 다 고르기 전에는 판정 박스를 띄우지 않는다 */}
        {outcome && (
          <div className={'outcome ' + outcome}>
            <div className="big" style={{ color: om.color }}>{om.icon} {t(`outcome.${outcome}`)}</div>
            <div className="desc">
              {t('newRun.verdictNote', {
                result: t(cycles.gold.result === 'success' ? 'newRun.success' : 'newRun.fail'),
              })}
            </div>
          </div>
        )}

        <button className="btn" onClick={save} disabled={!allChosen}>{t('newRun.save')}</button>
      </div>
    </div>
  )
}
