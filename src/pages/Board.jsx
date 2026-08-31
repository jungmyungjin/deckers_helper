import { useNavigate } from 'react-router-dom'
import { useRuns, computeBoard, computeStats } from '../db/runs'
import { useSync } from '../lib/SyncProvider'
import { useT } from '../i18n'
import BossSigil from '../components/BossSigil'
import { cardName, smcName } from '../i18n/content'
import { SMCS, GOLDS } from '../data/gameData'
import ProfileButton from '../components/ProfileButton'

export default function Board() {
  const nav = useNavigate()
  const { t } = useT()
  const runs = useRuns()
  const { hydrated } = useSync()
  const board = computeBoard(runs)
  const stats = computeStats(runs)

  return (
    <div className="page">
      <header className="appbar">
        <div>
          <h1>{t('board.title')}</h1>
          {/* 홈 화면 헤더는 브랜드를 보여주는 자리로 쓴다. 여기 있던 진행률은
              바로 아래 통계와 진행 바에 같은 값이 이미 두 번 나온다. */}
          <div className="sub">{t('app.subtitle')}</div>
        </div>
        <ProfileButton />
      </header>

      <div className="scroll">
        <div className="stat-row">
          <div className="stat c-gold">
            <div className="n">{stats.stamps}</div>
            <div className="l">{t('board.stamps', { total: stats.totalCells })}</div>
          </div>
          <div className="stat c-cyan"><div className="n">{stats.total}</div><div className="l">{t('board.plays')}</div></div>
          <div className="stat c-safe"><div className="n">{stats.perfects}</div><div className="l">{t('board.perfects')}</div></div>
        </div>
        <div className="progress"><i style={{ width: `${(stats.stamps / stats.totalCells) * 100}%` }} /></div>

        <div className="legend">
          <span><i className="cell done sm">✓</i> {t('board.legendClear')}</span>
          <span><i className="cell perfect sm">🥇</i> {t('board.legendPerfect')}</span>
          <span><i className="cell sm" /> {t('board.legendUntried')}</span>
        </div>

        <div className="matrix">
          <table className="mx">
            <thead>
              <tr>
                <th className="corner">{t('board.corner')}</th>
                {/* code 는 언어 무관 — 언어를 바꿔도 84칸 레이아웃이 유지된다.
                    현지 이름은 title 툴팁과 아래 범례에서 보여준다. */}
                {GOLDS.map((g) => <th key={g.id} title={cardName(g.id)}>{g.code}</th>)}
              </tr>
            </thead>
            <tbody>
              {SMCS.map((smc) => (
                <tr key={smc.id}>
                  <th><BossSigil smcId={smc.id} className="rowsig" /><span className="rowname">{smcName(smc.id)}</span></th>
                  {GOLDS.map((g) => {
                    const cell = board[`${smc.id}|${g.id}`]
                    const cls = cell ? (cell.perfect ? 'cell perfect' : 'cell done') : 'cell'
                    return (
                      <td key={g.id}>
                        <button className={cls}
                          onClick={() => nav(`/mission/${smc.id}/${g.id}`)}
                          title={`${cardName(g.id)} × ${smcName(smc.id)}`}>
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
          <b>{t('board.goldKey')}</b> {GOLDS.map((g) => `${g.code} ${cardName(g.id)}`).join(' · ')}
        </p>
        {/* 카드 목록은 하단 탭에서 빠졌다. 표의 약어를 읽다가 전체를 보고 싶어지는
            자리라, 범례 바로 아래에서 잇는다. */}
        <button className="btn ghost" onClick={() => nav('/cards')}>{t('board.allCards')}</button>

        {stats.total === 0 && (
          <div className="empty">{hydrated ? t('board.empty') : t('common.loading')}</div>
        )}
      </div>
    </div>
  )
}
