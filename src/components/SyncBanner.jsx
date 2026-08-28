import { useSync } from '../lib/SyncProvider'

// 동기화 중 / 실패만 알린다. 성공은 조용히 지나가고 프로필에서 확인할 수 있다.
export default function SyncBanner() {
  const { status, message, doSync } = useSync()
  if (status !== 'syncing' && status !== 'error') return null

  return (
    <div className={'syncbar ' + status}>
      {status === 'syncing' ? (
        <span>기록 동기화 중…</span>
      ) : (
        <>
          <span>{message}</span>
          <button onClick={doSync}>재시도</button>
        </>
      )}
    </div>
  )
}
