import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRuns, unclearedCombos } from '../db/runs'
import { useSync } from '../lib/SyncProvider'
import { SMC_BY_ID, CARD_BY_ID, COPPERS, SILVERS } from '../data/gameData'

const pick = (a) => a[Math.floor(Math.random() * a.length)]

export default function Shuffle() {
  const nav = useNavigate()
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
  const smc = d && SMC_BY_ID[d.smcId]
  const gold = d && CARD_BY_ID[d.goldId]

  return (
    <div className="page">
      <header className="appbar"><div><h1>랜덤 챌린지</h1><div className="sub">미클리어 GOLD 우선</div></div></header>
      <div className="scroll">
        {/* 뽑기 전에는 카드 자체가 버튼 — 따로 누를 버튼을 밑에 두지 않는다 */}
        {!d && (
          hydrated && uncleared.length === 0 ? (
            <div className="challenge">
              <div className="tag">완주</div>
              <div className="boss" style={{ fontSize: '1.3rem', margin: '12px 0 0' }}>
                🎉 모든 조합 클리어!
              </div>
            </div>
          ) : (
            <button className="challenge tap" onClick={roll} disabled={!hydrated}>
              <span className="tag">
                {hydrated ? `아직 못 깬 조합 ${uncleared.length}개` : '기록 동기화 중'}
              </span>
              <span className="dice">🎲</span>
              <span className="tapmsg">
                {hydrated ? '눌러서 도전 조합 뽑기' : '기록을 불러오는 중…'}
              </span>
            </button>
          )
        )}

        {d && (
          <div className="challenge">
            <div className="tag">오늘의 도전</div>
            <div className="boss">{gold.name}</div>
            <div className="vs">vs {smc.name} · 아직 못 깬 Gold</div>
            <div className="deck-strip">
              <span className="mini cop">BRONZE<br />{CARD_BY_ID[d.copper].name}</span>
              <span className="mini sil">SILVER<br />{CARD_BY_ID[d.silver].name}</span>
              <span className="mini gol">GOLD<br />{gold.name}</span>
            </div>
          </div>
        )}

        {d && (
          <>
            <button className="reshuffle" onClick={roll}>
              🎲 다시 셔플 — 남은 미클리어 <b>{uncleared.length}</b>칸 중
            </button>
            <button className="btn ghost" onClick={() =>
              nav(`/new?smc=${d.smcId}&copper=${d.copper}&silver=${d.silver}&gold=${d.goldId}`)}>
              이 셋업으로 기록 시작 →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
