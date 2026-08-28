import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extraChallengeProgress, unclearedCombos, unclearedExtraCombos, useRuns } from '../db/runs'
import { useSync } from '../lib/SyncProvider'
import { useT } from '../i18n'
import { cardName, smcName } from '../i18n/content'
import { COPPERS, SILVERS, SMCS } from '../data/gameData'
import SelectField from '../components/SelectField'

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
  const extraCombos = unclearedExtraCombos(runs, extraSmcId)

  function roll() {
    if (uncleared.length === 0) { setDraw(null); return }
    const combo = pick(uncleared)
    setDraw({ ...combo, copper: pick(COPPERS).id, silver: pick(SILVERS).id })
  }

  function rollExtra() {
    if (extraCombos.length === 0) { setDraw(null); return }
    const combo = pick(extraCombos)
    setDraw({ smcId: extraSmcId, copper: combo.copperId, silver: combo.silverId, goldId: combo.goldId, extra: true })
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
            <div className="boss">{cardName(d.goldId)}</div>
            <div className="vs">{d.extra ? t('shuffle.vsExtra', { name: smcName(d.smcId) }) : t('shuffle.vsUncleared', { name: smcName(d.smcId) })}</div>
            <div className="deck-strip">
              <span className="mini cop"><small>{t('game.securityShort.copper')}</small>{cardName(d.copper)}</span>
              <span className="mini sil"><small>{t('game.securityShort.silver')}</small>{cardName(d.silver)}</span>
              <span className="mini gol"><small>{t('game.securityShort.gold')}</small>{cardName(d.goldId)}</span>
            </div>
          </div>
        )}

        {d && (
          <>
            <button className="reshuffle" onClick={roll}>
              {d.extra ? t('shuffle.extraReshuffle') : t('shuffle.reshuffle', { count: uncleared.length })}
            </button>
            <button className="btn ghost" onClick={() =>
              nav(`/new?smc=${d.smcId}&copper=${d.copper}&silver=${d.silver}&gold=${d.goldId}`)}>
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
            <button className="btn" onClick={rollExtra} disabled={!hydrated || extraCombos.length === 0}>
              {extraCombos.length === 0 ? t('extra.complete') : t('shuffle.extraDraw')}
            </button>
          </div>
          <div className="extra-progress-list">
            {SMCS.map((smc) => {
              const progress = extraChallengeProgress(runs, smc.id)
              return <div className="extra-progress-row" key={smc.id}>
                <span>{smcName(smc.id)}</span>
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
