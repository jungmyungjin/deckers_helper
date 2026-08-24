import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/localDb'
import { computeStats } from '../db/runs'
import { hasSupabase } from '../lib/supabase'

const ACHIEVEMENTS = [
  { id: 'stamps-1', icon: '🩹', name: '첫 침투', metric: 'stamps', threshold: 1 },
  { id: 'stamps-5', icon: '💾', name: '숙련 데커', metric: 'stamps', threshold: 5 },
  { id: 'stamps-25', icon: '🧬', name: '베테랑', metric: 'stamps', threshold: 25 },
  { id: 'stamps-84', icon: '👑', name: '풀 클리어', metric: 'stamps', threshold: 84 },
  { id: 'perfects-1', icon: '🌟', name: '완벽한 해킹', metric: 'perfects', threshold: 1 },
  { id: 'perfects-10', icon: '💎', name: '퍼펙트 해커', metric: 'perfects', threshold: 10 },
]

export default function Profile() {
  const runs = useLiveQuery(() => db.runs.toArray(), [], [])
  const stats = computeStats(runs)
  const val = { stamps: stats.stamps, perfects: stats.perfects }
  const unlocked = ACHIEVEMENTS.filter((a) => val[a.metric] >= a.threshold).length

  return (
    <div className="page">
      <header className="appbar"><div><h1>프로필 · 업적</h1><div className="sub">게스트 모드</div></div></header>
      <div className="scroll">
        <button className="gbtn" disabled title={hasSupabase ? '' : 'Supabase 미설정'}>
          <span className="g" />Google로 로그인하고 동기화
        </button>
        <div className="guest">지금은 이 기기에만 저장 중 · 로그인 시 병합 {hasSupabase ? '' : '(Supabase 설정 필요)'}</div>

        <div className="stat-row" style={{ marginTop: 12 }}>
          <div className="stat c-gold"><div className="n">{stats.stamps}<span className="sub2">/{stats.totalCells}</span></div><div className="l">Gold 도장</div></div>
          <div className="stat c-safe"><div className="n">{stats.winRate}%</div><div className="l">승률</div></div>
        </div>

        <div className="label">업적 {ACHIEVEMENTS.length}개 중 {unlocked}</div>
        <div className="achgrid">
          {ACHIEVEMENTS.map((a) => {
            const on = val[a.metric] >= a.threshold
            return (
              <div className={'ach' + (on ? ' on' : ' lock')} key={a.id}>
                <div className="ai">{a.icon}</div>
                <div className="an">{a.name}</div>
                <div className="ap">{a.metric === 'stamps' ? '도장' : '대성공'} {a.threshold}{!on ? ` · ${val[a.metric]}/${a.threshold}` : ''}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
