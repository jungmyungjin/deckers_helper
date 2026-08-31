import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SMCS, DECKERS, DECKER_BY_ID, DECKER_COLORS, SMC_BY_ID, buildObjectiveSlots, CARD_BY_ID, COPPERS, SILVERS, GOLDS, tierKey } from '../data/gameData'
import { useT } from '../i18n'
import { cardNameFull, deckerNameFull, smcName, smcNameFull } from '../i18n/content'
import { calcOutcome, OUTCOME_META } from '../lib/outcome'
import { saveRun } from '../db/runs'
import SelectField from '../components/SelectField'
import BossSigil from '../components/BossSigil'

const cardsFor = { copper: COPPERS, silver: SILVERS, gold: GOLDS }
const validSmc = (id) => SMC_BY_ID[id] ? id : SMCS[0].id
const clampUpgrade = (value) => Math.min(2, Math.max(0, Number(value) || 0))

function makeCycles(smcId, upgrade, savedIds = []) {
  const used = { copper: new Set(), silver: new Set(), gold: new Set() }
  return buildObjectiveSlots(smcId, upgrade).map((slot, index) => {
    const preferred = savedIds[index]
    const chosen = cardsFor[slot.security].find((card) => card.id === preferred && !used[slot.security].has(card.id))
      || cardsFor[slot.security].find((card) => !used[slot.security].has(card.id))
    used[slot.security].add(chosen.id)
    return { ...slot, objectiveId: chosen.id, result: null }
  })
}

export default function NewRun() {
  const nav = useNavigate()
  const { t } = useT()
  const [sp] = useSearchParams()
  const querySmcId = validSmc(sp.get('smc'))
  const queryUpgrade = clampUpgrade(sp.get('upgrade'))
  const queryIds = sp.get('objectives')?.split(',').filter((id) => CARD_BY_ID[id])
    || [sp.get('copper'), sp.get('silver'), sp.get('gold')].filter((id) => CARD_BY_ID[id])
  const [smcId, setSmcId] = useState(querySmcId)
  const [smcUpgrade, setSmcUpgrade] = useState(queryUpgrade)
  const [deckers, setDeckers] = useState([{ deckerId: DECKERS[0].id, playerName: '' }])
  const [cycles, setCycles] = useState(() => makeCycles(querySmcId, queryUpgrade, queryIds))

  const outcome = cycles.every((cycle) => cycle.result)
    ? calcOutcome(cycles, { requireAllObjectives: SMC_BY_ID[smcId]?.requireAllObjectives }) : null
  const om = outcome ? OUTCOME_META[outcome] : null

  function changeSetup(nextSmcId, nextUpgrade) {
    setSmcId(nextSmcId)
    setSmcUpgrade(nextUpgrade)
    setCycles((previous) => makeCycles(nextSmcId, nextUpgrade, previous.map((cycle) => cycle.objectiveId)))
  }

  function setResult(index, result) {
    setCycles((items) => items.map((cycle, i) => i === index ? { ...cycle, result } : cycle))
  }
  function setCard(index, objectiveId) {
    setCycles((items) => items.map((cycle, i) => i === index ? { ...cycle, objectiveId } : cycle))
  }
  function addDecker() {
    const usedProfiles = new Set(deckers.map((decker) => DECKER_BY_ID[decker.deckerId]?.profileId))
    const next = DECKERS.find((decker) => !usedProfiles.has(decker.profileId))
    if (next) setDeckers((items) => [...items, { deckerId: next.id, playerName: '' }])
  }
  function updDecker(index, patch) {
    setDeckers((items) => items.map((decker, i) => i === index ? { ...decker, ...patch } : decker))
  }
  function rmDecker(index) {
    setDeckers((items) => items.filter((_, i) => i !== index))
  }
  async function save() {
    if (!outcome) return
    await saveRun({ smcId, smcUpgrade, deckers, objectives: cycles })
    nav('/')
  }

  const finalResult = cycles.find((cycle) => cycle.isFinal)?.result

  return <div className="page">
    <header className="appbar"><div><h1>{t('newRun.title')}</h1><div className="sub">{t('newRun.sub')}</div></div></header>
    <div className="scroll">
      <div className="bossmark">
        <div className="bm-badge"><BossSigil smcId={smcId} /></div>
        <div className="bm-name">{smcName(smcId)}</div>
        <div className="bm-meta">{t('newRun.bossMeta', {
          tier: t(`game.tier.${tierKey(SMC_BY_ID[smcId].difficulty)}`),
          cycles: SMC_BY_ID[smcId].cycles,
        })}</div>
      </div>
      <div className="field">
        <div className="k">{t('newRun.boss')}</div>
        <SelectField ariaLabel={t('newRun.boss')} className="big" value={smcId}
          options={SMCS.map((smc) => ({ value: smc.id, label: `${smcNameFull(smc.id)} · ${t(`game.tier.${tierKey(smc.difficulty)}`)}` }))}
          onChange={(nextSmcId) => changeSetup(nextSmcId, smcUpgrade)} />
      </div>
      <div className="field">
        <div className="k">{t('newRun.upgrade')}</div>
        <SelectField ariaLabel={t('newRun.upgrade')} value={String(smcUpgrade)}
          options={[0, 1, 2].map((level) => ({ value: String(level), label: t(`newRun.upgrade${level}`) }))}
          onChange={(level) => changeSetup(smcId, clampUpgrade(level))} />
        <small className="fieldhint">{t('newRun.upgradeHint')}</small>
      </div>
      <div className="field">
        <div className="k">{t('newRun.deckers')}</div>
        {deckers.map((decker, index) => {
          const selectedElsewhere = deckers.filter((_, i) => i !== index).map((item) => item.deckerId)
          const options = DECKERS.filter((candidate) => candidate.id === decker.deckerId
            || !selectedElsewhere.some((id) => DECKER_BY_ID[id]?.profileId === candidate.profileId))
          return <div className="drow" key={index}>
            <span className="dk" style={{ background: DECKER_COLORS[DECKER_BY_ID[decker.deckerId]?.color] }} />
            <SelectField ariaLabel={t('newRun.deckers')} value={decker.deckerId}
              options={options.map((candidate) => ({ value: candidate.id, label: deckerNameFull(candidate.id) }))}
              onChange={(deckerId) => updDecker(index, { deckerId })} />
            <input className="cinput" placeholder={t('newRun.playerPlaceholder')} value={decker.playerName}
              onChange={(event) => updDecker(index, { playerName: event.target.value })} />
            {deckers.length > 1 && <button className="rm" onClick={() => rmDecker(index)} aria-label={t('common.close')}>×</button>}
          </div>
        })}
        {deckers.length < 4 && <button className="addbtn" onClick={addDecker}>{t('newRun.addDecker')}</button>}
      </div>
      <div className="label">{t('newRun.cyclesLabel')}</div>
      <div className="cyclelist">
        {cycles.map((cycle, index) => {
          const used = new Set(cycles.filter((item, i) => i !== index && item.security === cycle.security).map((item) => item.objectiveId))
          return <div className="cyc" key={cycle.cycleNo}>
            <span className={'tier ' + cycle.security} />
            <div className="cyc-body">
              <SelectField ariaLabel={t(`game.securityShort.${cycle.security}`)} value={cycle.objectiveId}
                options={cardsFor[cycle.security].filter((card) => !used.has(card.id) || card.id === cycle.objectiveId)
                  .map((card) => ({ value: card.id, label: cardNameFull(card.id) }))}
                onChange={(objectiveId) => setCard(index, objectiveId)} />
              <small>{cycle.isFinal ? t('newRun.goldTag') : `${t(`game.securityShort.${cycle.security}`)} · ${cycle.cycleNo}`}</small>
            </div>
            <span className="toggle">
              <button className={'s' + (cycle.result === 'success' ? ' on' : '')} onClick={() => setResult(index, 'success')}>{t('newRun.success')}</button>
              <button className={'f' + (cycle.result === 'fail' ? ' on' : '')} onClick={() => setResult(index, 'fail')}>{t('newRun.fail')}</button>
            </span>
          </div>
        })}
      </div>
      {outcome && <div className={'outcome ' + outcome}>
        <div className="big" style={{ color: om.color }}>{om.icon} {t(`outcome.${outcome}`)}</div>
        <div className="desc">{SMC_BY_ID[smcId]?.requireAllObjectives
          ? t('newRun.verdictAll')
          : t('newRun.verdictNote', { result: t(finalResult === 'success' ? 'newRun.success' : 'newRun.fail') })}</div>
      </div>}
      <button className="btn" onClick={save} disabled={!outcome}>{t('newRun.save')}</button>
    </div>
  </div>
}
