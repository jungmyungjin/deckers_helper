import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { allRuns, deletedRunCount } from '../db/runs'
import { getMeta, setMeta } from '../db/localDb'
import { ACHIEVEMENTS, evaluate } from '../lib/achievements'
import { useSync } from '../lib/SyncProvider'
import { useT } from '../i18n'

const ICONS = new Map(ACHIEVEMENTS.map((a) => [a.id, a.icon]))
const HIDDEN_IDS = new Set(ACHIEVEMENTS.filter((a) => a.hidden).map((a) => a.id))

// 동기화 커서(lastPulledAt:{userId})와 같은 방식으로 계정별로 나눈다. 계정을 바꾸면
// 그 계정에서 본 적 없는 것이 새 해금이 되어야 맞다. 게스트는 별도 칸을 쓴다.
const seenKey = (userId) => `seenAchievements:${userId || 'guest'}`
const MERGE_ABOVE = 3
const LINGER = 4200

// 업적은 runs에서 파생되므로 "언제 땄는지"가 어디에도 없다(docs/data-model.md).
// 해금 연출을 하려면 이번에 새로 뜬 게 무엇인지 알아야 하는데, 그 상태는 로컬에만
// 둔다 — 기기마다 따로 뜨는 대신 서버 스키마를 건드리지 않는다.
//
// 처음 실행에서는 조용히 도장만 찍는다. 이미 84칸을 깬 사람에게 토스트 수십 개를
// 쏟아붓지 않기 위해서다.
export default function AchievementToaster() {
  const { t } = useT()
  const nav = useNavigate()
  const { user, authReady } = useSync()
  // 기본값을 주지 않는다 — 로딩 중(undefined)과 기록이 없는 상태([])를 구분해야
  // 첫 렌더의 빈 목록을 "아무것도 해금 안 됨"으로 오해하지 않는다.
  const runs = useLiveQuery(allRuns)
  const deleted = useLiveQuery(deletedRunCount)
  const [queue, setQueue] = useState([])
  const busy = useRef(false)

  const unlocked = useMemo(() => (
    runs === undefined || deleted === undefined
      ? null
      : evaluate(runs, { deletedCount: deleted }).filter((a) => a.unlocked).map((a) => a.id)
  ), [runs, deleted])
  const signature = unlocked ? unlocked.join(',') : ''

  useEffect(() => {
    // 로그인 확인 전에는 어느 칸에 도장을 찍어야 할지 모른다
    if (!authReady || !unlocked || busy.current) return
    busy.current = true
    let cancelled = false

    ;(async () => {
      const key = seenKey(user?.id)
      const seen = await getMeta(key, null)
      if (cancelled) return
      if (seen === null) {
        await setMeta(key, unlocked)
      } else {
        const fresh = unlocked.filter((id) => !seen.includes(id))
        await setMeta(key, unlocked)
        if (fresh.length && !cancelled) setQueue(fresh)
      }
      busy.current = false
    })()

    return () => { cancelled = true; busy.current = false }
  }, [signature, authReady, user?.id])

  useEffect(() => {
    if (!queue.length) return undefined
    const timer = setTimeout(() => setQueue([]), LINGER)
    return () => clearTimeout(timer)
  }, [queue])

  if (!queue.length) return null

  const open = () => { setQueue([]); nav('/achievements') }

  // 동기화로 한꺼번에 열리면 이름을 하나씩 띄우는 게 의미가 없다 — 방금 친 판이
  // 아니라 다른 기기에서 쌓아온 것들이라, 개수만 알리고 목록으로 보낸다.
  if (queue.length > MERGE_ABOVE) {
    return (
      <div className="toaststack" role="status" aria-live="polite">
        <button className="toast" onClick={open}>
          <span className="ti" aria-hidden="true">🏆</span>
          <span className="tb">
            <span className="tk">{t('achievements.unlocked')}</span>
            <span className="tn">{t('achievements.unlockedCount', { count: queue.length })}</span>
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="toaststack" role="status" aria-live="polite">
      {queue.map((id) => {
        const hidden = HIDDEN_IDS.has(id)
        return (
          <button className={'toast' + (hidden ? ' g' : '')} key={id} onClick={open}>
            <span className="ti" aria-hidden="true">{ICONS.get(id)}</span>
            <span className="tb">
              <span className="tk">{t(hidden ? 'achievements.unlockedHidden' : 'achievements.unlocked')}</span>
              <span className="tn">{t(`achievements.list.${id}.name`)}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
