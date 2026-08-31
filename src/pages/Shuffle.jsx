import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildRandomObjectives, drawUnclearedExtraCombo, extraChallengeProgress, finalGoldId, unclearedCombos, useRuns } from '../db/runs'
import { useSync } from '../lib/SyncProvider'
import { useT } from '../i18n'
import { cardName, smcName } from '../i18n/content'
import { SMCS } from '../data/gameData'
import SelectField from '../components/SelectField'
import BossSigil from '../components/BossSigil'

const pick = (a) => a[Math.floor(Math.random() * a.length)]

export default function Shuffle() {
  const nav = useNavigate()
  const { t } = useT()
  const runs = useRuns()
  const { hydrated } = useSync()
  const uncleared = unclearedCombos(runs)
  const extraUnlocked = uncleared.length === 0
  const showExtra = extraUnlocked || import.meta.env.DEV
  const [extraSmcId, setExtraSmcId] = useState(SMCS[0].id)
  const [draw, setDraw] = useState(null)
  const selectedExtraProgress = extraChallengeProgress(runs, extraSmcId)

  function roll() {
    if (uncleared.length === 0) { setDraw(null); return }
    const combo = pick(uncleared)
    setDraw({ ...combo, objectives: buildRandomObjectives(combo.smcId, 0, Math.random, combo.goldId) })
  }

  function rollExtra() {
    const combo = drawUnclearedExtraCombo(runs, extraSmcId)
    if (!combo) { setDraw(null); return }
    setDraw({ smcId: extraSmcId, ...combo, extra: true })
  }

  const d = draw

  return (
    <div className="page">
      <header className="appbar">
        <div><h1>{t('shuffle.title')}</h1></div>
      </header>
      <div className="scroll">
        {/* 뽑기 전에는 카드 자체가 버튼 — 따로 누를 버튼을 밑에 두지 않는다 */}
        {(!extraUnlocked || import.meta.env.DEV) && !d && (
          hydrated && uncleared.length === 0 ? (
            <div className="challenge">
              <div className="tag">{t('shuffle.doneTag')}</div>
              <div className="boss" style={{ fontSize: '1.3rem', margin: '12px 0 0' }}>
                {t('shuffle.doneMsg')}
              </div>
            </div>
          ) : (
            <button className="challenge tap" onClick={roll} disabled={!hydrated}>
              <span className="tag">
                {hydrated ? t('shuffle.remaining', { count: uncleared.length }) : t('shuffle.syncing')}
              </span>
              <span className="dice">🎲</span>
              <span className="tapmsg">
                {hydrated ? t('shuffle.tapToDraw') : t('common.loading')}
              </span>
            </button>
          )
        )}

        {d && (
          <div className="challenge">
            <div className="tag">{t('shuffle.todayTag')}</div>
            <div className="boss">{cardName(finalGoldId({ objectives: d.objectives }))}</div>
            <div className="vs">{d.extra ? t('shuffle.vsExtra', { name: smcName(d.smcId) }) : t('shuffle.vsUncleared', { name: smcName(d.smcId) })}</div>
            <div className="deck-strip">
              {d.objectives.map((objective) => <span className={'mini ' + objective.security} key={objective.cycleNo}>
                <small>{t(`game.securityShort.${objective.security}`)}</small>{cardName(objective.objectiveId)}
              </span>)}
            </div>
          </div>
        )}

        {d && (
          <>
            <button className="reshuffle" onClick={d.extra ? rollExtra : roll}>
              {d.extra ? t('shuffle.extraReshuffle') : t('shuffle.reshuffle', { count: uncleared.length })}
            </button>
            <button className="btn ghost" onClick={() =>
              nav(`/new?smc=${d.smcId}&objectives=${d.objectives.map((objective) => objective.objectiveId).join(',')}`)}>
              {t('shuffle.startRecord')}
            </button>
          </>
        )}

        {showExtra && <>
          <div className="challenge extra-challenge">
            <div className="tag">{t('extra.title')}</div>
            <div className="boss">{t('shuffle.extraDrawTitle')}</div>
            <div className="vs">{t('extra.intro')}</div>
            <div className="extra-boss-select">
              <SelectField ariaLabel={t('extra.boss')} value={extraSmcId}
                options={SMCS.map((smc) => ({ value: smc.id, label: smcName(smc.id) }))}
                onChange={setExtraSmcId} />
            </div>
            <button className="btn" onClick={rollExtra} disabled={!hydrated || selectedExtraProgress.completed >= selectedExtraProgress.total}>
              {selectedExtraProgress.completed >= selectedExtraProgress.total ? t('extra.complete') : t('shuffle.extraDraw')}
            </button>
          </div>
          <div className="extra-progress-list">
            {SMCS.map((smc) => {
              const progress = extraChallengeProgress(runs, smc.id)
              return <div className="extra-progress-row" key={smc.id}>
                <span className="epname"><BossSigil smcId={smc.id} className="epsig" />{smcName(smc.id)}</span>
                <div className="challenge-progress" role="progressbar"
                  aria-label={t('extra.progressBoss', { name: smcName(smc.id), completed: progress.completed, total: progress.total })}
                  aria-valuemin="0" aria-valuemax={progress.total} aria-valuenow={progress.completed}>
                  <i style={{ width: `${(progress.completed / progress.total) * 100}%` }} />
                </div>
              </div>
            })}
          </div>
        </>}
      </div>
    </div>
  )
}
