import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/localDb'
import { unclearedCombos } from '../db/runs'
import { SMC_BY_ID, CARD_BY_ID, COPPERS, SILVERS } from '../data/gameData'

const pick = (a) => a[Math.floor(Math.random() * a.length)]

export default function Shuffle() {
  const nav = useNavigate()
  const runs = useLiveQuery(() => db.runs.toArray(), [], [])
  const uncleared = unclearedCombos(runs)
  const [draw, setDraw] = useState(null)

  function roll() {
    if (uncleared.length === 0) { setDraw(null); return }
    const combo = pick(uncleared)
    setDraw({ ...combo, copper: pick(COPPERS).id, silver: pick(SILVERS).id })
  }

  const d = draw
  const smc = d && SMC_BY_ID[d.smcId]
  const gold = d && CARD_BY_ID[d.goldId]

  return (
    <div className="page">
      <header className="appbar"><div><h1>랜덤 챌린지</h1><div className="sub">미클리어 GOLD 우선</div></div></header>
      <div className="scroll">
        {!d && (
          <div className="challenge">
            <div className="tag">아직 못 깬 조합 {uncleared.length}개</div>
            <div className="boss" style={{ fontSize: '1.1rem', margin: '14px 0' }}>
              {uncleared.length ? '🎲 셔플을 눌러 도전 조합을 뽑아보세요' : '🎉 모든 조합 클리어!'}
            </div>
          </div>
        )}

        {d && (
          <div className="challenge">
            <div className="tag">오늘의 도전</div>
            <div className="boss">{gold.name}</div>
            <div className="vs">vs {smc.name} · 아직 못 깬 Gold</div>
            <div className="deck-strip">
              <span className="mini cop">COPPER<br />{CARD_BY_ID[d.copper].name}</span>
              <span className="mini sil">SILVER<br />{CARD_BY_ID[d.silver].name}</span>
              <span className="mini gol">GOLD<br />{gold.name}</span>
            </div>
          </div>
        )}

        <button className="reshuffle" onClick={roll}>🎲 {d ? '다시 셔플' : '셔플'} — 남은 미클리어 <b>{uncleared.length}</b>칸 중</button>

        {d && (
          <button className="btn ghost" onClick={() =>
            nav(`/new?smc=${d.smcId}&copper=${d.copper}&silver=${d.silver}&gold=${d.goldId}`)}>
            이 셋업으로 기록 시작 →
          </button>
        )}
      </div>
    </div>
  )
}
