import { useState } from 'react'
import { db } from '../db/localDb'
import {
  collectContext, describeContext, saveReport, usePendingReportCount,
} from '../db/reports'
import { useSync } from '../lib/SyncProvider'

const MAX = 2000

export default function ReportForm() {
  const { user, status, message: syncMessage, doSync, enabled } = useSync()
  const pending = usePendingReportCount()

  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)   // null | 'sent' | 'queued'
  const [preview, setPreview] = useState(null) // 함께 보낼 정보 (펼쳤을 때만 수집)

  async function togglePreview() {
    if (preview) { setPreview(null); return }
    setPreview(await collectContext({ user, syncStatus: status, syncMessage }))
  }

  async function submit(e) {
    e.preventDefault()
    const body = text.trim()
    if (!body || busy) return

    setBusy(true)
    setResult(null)
    try {
      const context = await collectContext({ user, syncStatus: status, syncMessage })
      const saved = await saveReport({ kind: 'bug', message: body, context })
      setText('')
      setPreview(null)

      // 온라인이면 바로 보내고, 아니면 큐에 남아 다음 동기화에 실려 나간다
      if (enabled && navigator.onLine) await doSync()
      const still = await db.reports.get(saved.id)
      setResult(still?.dirty ? 'queued' : 'sent')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="report" onSubmit={submit}>
      <textarea
        className="cinput rtext"
        rows={4}
        maxLength={MAX}
        value={text}
        onChange={(e) => { setText(e.target.value); setResult(null) }}
        placeholder="어떤 화면에서 무엇을 하다가 어떻게 됐는지 적어주세요."
      />

      <div className="rmeta">
        <button type="button" className="rlink" onClick={togglePreview}>
          {preview ? '▾ 함께 보내는 정보' : '▸ 함께 보내는 정보'}
        </button>
        <span className="rcount">{text.length}/{MAX}</span>
      </div>

      {preview && (
        <dl className="ctxbox">
          {describeContext(preview).map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>
          ))}
        </dl>
      )}

      <button className="btn" type="submit" disabled={!text.trim() || busy}>
        {busy ? '보내는 중…' : '개발자에게 보내기'}
      </button>

      {result === 'sent' && <div className="rnote ok">보냈습니다. 확인하고 반영할게요 — 고맙습니다!</div>}
      {result === 'queued' && (
        <div className="rnote wait">
          지금은 보내지 못해 이 기기에 저장해뒀어요. 연결되면 자동으로 전송됩니다.
        </div>
      )}

      {!enabled && (
        <div className="rnote wait">
          지금은 제보를 보낼 수 없어요. 이 기기에 저장해뒀다가 가능해지면 보낼게요.
        </div>
      )}

      {pending > 0 && (
        <div className="rnote wait">전송 대기 중인 제보 {pending}건</div>
      )}
    </form>
  )
}
