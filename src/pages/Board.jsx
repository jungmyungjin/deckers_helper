import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/localDb'
import { computeBoard, computeStats } from '../db/runs'
import { SMCS, GOLDS } from '../data/gameData'

export default function Board() {
  const nav = useNavigate()
  const runs = useLiveQuery(() => db.runs.toArray(), [], [])
  const board = computeBoard(runs)
  const stats = computeStats(runs)

  return (
    <div className="page">
      <header className="appbar">
        <div>
          <h1>도장깨기 보드</h1>
          <div className="sub">GOLD × SMC · {stats.stamps} / {stats.totalCells}</div>
        </div>
        <div className="avatar">M</div>
      </header>

      <div className="scroll">
        <div className="stat-row">
          <div className="stat c-gold"><div className="n">{stats.stamps}</div><div className="l">도장 / {stats.totalCells}</div></div>
          <div className="stat c-cyan"><div className="n">{stats.total}</div><div className="l">플레이</div></div>
          <div className="stat c-safe"><div className="n">{stats.perfects}</div><div className="l">대성공</div></div>
        </div>
        <div className="progress"><i style={{ width: `${(stats.stamps / stats.totalCells) * 100}%` }} /></div>

        <div className="legend">
          <span><i className="cell done sm">✓</i> 클리어</span>
          <span><i className="cell perfect sm">🥇</i> 대성공</span>
          <span><i className="cell sm" /> 미도전</span>
        </div>

        <div className="matrix">
          <table className="mx">
            <thead>
              <tr>
                <th className="corner">SMC ＼ Gold</th>
                {GOLDS.map((g) => <th key={g.id} title={g.name}>{g.code}</th>)}
              </tr>
            </thead>
            <tbody>
              {SMCS.map((smc) => (
                <tr key={smc.id}>
                  <th>{smc.name}</th>
                  {GOLDS.map((g) => {
                    const cell = board[`${smc.id}|${g.id}`]
                    const cls = cell ? (cell.perfect ? 'cell perfect' : 'cell done') : 'cell'
                    return (
                      <td key={g.id}>
                        <button className={cls}
                          onClick={() => nav(`/mission/${smc.id}/${g.id}`)}
                          title={`${g.name} × ${smc.name}`}>
                          {cell ? (cell.perfect ? '🥇' : '✓') : ''}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="goldkey">
          <b>Gold 코드</b> {GOLDS.map((g) => `${g.code} ${g.name}`).join(' · ')}
        </p>

        {stats.total === 0 && (
          <div className="empty">아직 기록이 없어요. 하단 <b>➕ 기록</b>에서 첫 판을 남겨보세요.</div>
        )}
      </div>
    </div>
  )
}
