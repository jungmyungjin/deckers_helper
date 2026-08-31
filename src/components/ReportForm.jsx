import { useState } from 'react'
import { db } from '../db/localDb'
import { collectContext, describeContext, saveReport, usePendingReportCount } from '../db/reports'
import { useSync } from '../lib/SyncProvider'
import { useT } from '../i18n'

const MAX = 2000

export default function ReportForm() {
  const { t } = useT()
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
        placeholder={t('report.placeholder')}
      />

      <div className="rmeta">
        <button type="button" className="rlink" onClick={togglePreview}>
          {preview ? t('report.hideContext') : t('report.showContext')}
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
        {busy ? t('report.sending') : t('report.send')}
      </button>

      {result === 'sent' && <div className="rnote ok">{t('report.sent')}</div>}
      {result === 'queued' && <div className="rnote wait">{t('report.queued')}</div>}
      {!enabled && <div className="rnote wait">{t('report.disabled')}</div>}
      {pending > 0 && <div className="rnote wait">{t('report.pending', { count: pending })}</div>}
    </form>
  )
}
