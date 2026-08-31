import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildRandomObjectives, drawUncleared, drawUnclearedExtraCombo, extraChallengeProgress, finalGoldId, unclearedCombos, useRuns } from '../db/runs'
import { useSync } from '../lib/SyncProvider'
import { useT } from '../i18n'
import { cardName, smcName } from '../i18n/content'
import { SMCS } from '../data/gameData'
import SelectField from '../components/SelectField'
import BossSigil from '../components/BossSigil'
import ProfileButton from '../components/ProfileButton'


export default function Shuffle() {
  const nav = useNavigate()
  const { t } = useT()
  const runs = useRuns()
  const { hydrated } = useSync()
  const uncleared = unclearedCombos(runs)
  const extraUnlocked = uncleared.length === 0
  const showExtra = extraUnlocked || import.meta.env.DEV
  const [extraSmcId, setExtraSmcId] = useState(SMCS[0].id)
  const [pickSmcId, setPickSmcId] = useState(SMCS[0].id)
  const [pickOpen, setPickOpen] = useState(false)
  const leftFor = (smcId) => uncleared.filter((c) => c.smcId === smcId).length
  const [draw, setDraw] = useState(null)
  const selectedExtraProgress = extraChallengeProgress(runs, extraSmcId)

  function roll() {
    const combo = drawUncleared(runs)
    if (!combo) { setDraw(null); return }
    setDraw({ ...combo, objectives: buildRandomObjectives(combo.smcId, 0, Math.random, combo.goldId) })
  }

  // 자동으로 정해지는 다음 칸 말고, 하고 싶은 보스를 직접 고르는 길.
  // 순서는 그대로 따른다 — 그 보스에서 아직 안 깬 첫 Gold.
  function rollFor(smcId) {
    const combo = uncleared.find((c) => c.smcId === smcId)
    if (!combo) return
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
        <ProfileButton />
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
            <div className="tag">{d.extra ? t('extra.title') : t('shuffle.todayTag')}</div>
            {/* SMC 를 상징 + 이름으로 앞세운다. 이 시나리오를 관리하는 쪽이라
                아래 Gold 카드(목표)보다 먼저 온다. 새 기록 화면의 배지와 같은 형식. */}
            <div className="challenge-bossmark">
              <div className="bm-badge"><BossSigil smcId={d.smcId} /></div>
            </div>
            <div className="challenge-smc">{smcName(d.smcId)}</div>
            <div className="boss">{cardName(finalGoldId({ objectives: d.objectives }))}</div>
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
            {/* 다음 칸은 자동으로 정해지지만, 오늘 하고 싶은 보스가 따로 있을 수 있다.
                평소에는 버튼 하나로 접어두고 누를 때만 편다 — 늘 펼쳐두면 '다시 셔플'과
                경쟁해서 어느 쪽이 기본 동작인지 흐려진다. */}
            {!d.extra && (
              <>
                <button className="reshuffle" onClick={() => setPickOpen((v) => !v)}
                  aria-expanded={pickOpen}>
                  🎯 {t('shuffle.pickBoss')} {pickOpen ? '▴' : '▾'}
                </button>
                {pickOpen && (
                  <div className="pickboss">
                    {/* 남은 칸 수를 옵션에 함께 보여줘, 다 깬 보스를 고르고 나서야
                        알게 되는 일이 없게 한다. */}
                    <SelectField ariaLabel={t('shuffle.pickBoss')} value={pickSmcId}
                      options={SMCS.map((smc) => ({
                        value: smc.id,
                        // 남은 칸 수까지 적으니 목록이 시끄러웠다. 이름만 두되 다 깬
                        // 보스는 표시한다 — 안 그러면 고르고 나서야 버튼이 죽은 걸 안다.
                        label: leftFor(smc.id)
                          ? smcName(smc.id)
                          : `${smcName(smc.id)} · ${t('shuffle.bossDone')}`,
                      }))}
                      onChange={setPickSmcId} />
                    <button className="btn ghost" disabled={leftFor(pickSmcId) === 0}
                      onClick={() => { rollFor(pickSmcId); setPickOpen(false) }}>
                      {t('shuffle.pickBossDraw')}
                    </button>
                  </div>
                )}
              </>
            )}
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
            {/* 고른 보스를 바로 아래 드롭다운이 이름으로 말해주므로 배지에는 이름을 붙이지 않는다 */}
            <div className="challenge-bossmark">
              <div className="bm-badge"><BossSigil smcId={extraSmcId} /></div>
            </div>
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
