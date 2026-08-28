import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRuns, unclearedCombos } from '../db/runs'
import { useSync } from '../lib/SyncProvider'
import { useT } from '../i18n'
import { cardName, smcName } from '../i18n/content'
import { COPPERS, SILVERS } from '../data/gameData'

const pick = (a) => a[Math.floor(Math.random() * a.length)]

export default function Shuffle() {
  const nav = useNavigate()
  const { t } = useT()
  const runs = useRuns()
  const { hydrated } = useSync()
  const uncleared = unclearedCombos(runs)
  const [draw, setDraw] = useState(null)

  function roll() {
    if (uncleared.length === 0) { setDraw(null); return }
    const combo = pick(uncleared)
    setDraw({ ...combo, copper: pick(COPPERS).id, silver: pick(SILVERS).id })
  }

  const d = draw

  return (
    <div className="page">
      <header className="appbar">
        <div><h1>{t('shuffle.title')}</h1></div>
      </header>
      <div className="scroll">
        {/* 뽑기 전에는 카드 자체가 버튼 — 따로 누를 버튼을 밑에 두지 않는다 */}
        {!d && (
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
            <div className="vs">{t('shuffle.vsUncleared', { name: smcName(d.smcId) })}</div>
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
              {t('shuffle.reshuffle', { count: uncleared.length })}
            </button>
            <button className="btn ghost" onClick={() =>
              nav(`/new?smc=${d.smcId}&copper=${d.copper}&silver=${d.silver}&gold=${d.goldId}`)}>
              {t('shuffle.startRecord')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
