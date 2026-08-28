import { Component } from 'react'
import { collectContext, flushReports, saveReport } from '../db/reports'

// 렌더 중 예외를 잡아 흰 화면 대신 복구 화면을 보여준다.
// SyncProvider 바깥(main.jsx)에 두므로 훅을 쓸 수 없고, Provider 자체가
// 터져도 잡힌다. 전송은 Dexie 큐에 넣은 뒤 best-effort로 밀어보고,
// 실패해도 다음 실행 때 SyncProvider가 보낸다.
export default class ErrorBoundary extends Component {
  state = { error: null, info: null, send: 'idle' } // idle | sending | sent | queued | failed

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  retry = () => this.setState({ error: null, info: null, send: 'idle' })

  goHome = () => {
    window.location.hash = '#/'
    this.retry()
  }

  send = async () => {
    const { error, info } = this.state
    this.setState({ send: 'sending' })
    try {
      const base = await collectContext({ account: 'unknown' })
      await saveReport({
        kind: 'crash',
        message: String(error?.message || error || '알 수 없는 오류'),
        context: {
          ...base,
          errorName: error?.name || null,
          stack: error?.stack?.slice(0, 4000) || null,
          componentStack: info?.componentStack?.slice(0, 4000) || null,
        },
      })
      this.setState({ send: (await flushReports()) ? 'sent' : 'queued' })
    } catch {
      // 저장조차 못 했으면 더 할 수 있는 게 없다
      this.setState({ send: 'failed' })
    }
  }

  render() {
    const { error, send } = this.state
    if (!error) return this.props.children

    return (
      <div className="crash">
        <div className="crashbox">
          <div className="crashicon">⚠</div>
          <h1>문제가 생겼어요</h1>
          <p className="crashsub">
            앱에 예상치 못한 문제가 생겼습니다.<br />
            <b>기록은 이 기기에 그대로 있습니다.</b>
          </p>

          <pre className="crashmsg">{String(error?.message || error)}</pre>

          <button className="btn" onClick={this.retry}>다시 시도</button>
          <button className="btn ghost" onClick={this.goHome}>보드로 돌아가기</button>
          <button className="btn ghost" onClick={this.send} disabled={send !== 'idle'}>
            {send === 'idle' ? '이 오류 개발자에게 보내기'
              : send === 'sending' ? '보내는 중…'
              : send === 'sent' ? '보냈습니다 — 고맙습니다!'
              : send === 'queued' ? '저장됨 · 연결되면 자동 전송'
              : '전송 실패'}
          </button>

          <p className="crashnote">
            오류 내용과 앱 버전, 화면 위치가 함께 전송됩니다.
          </p>
        </div>
      </div>
    )
  }
}
