import { useNavigate } from 'react-router-dom'
import ReportForm from '../components/ReportForm'
import { APP_VERSION } from '../db/reports'

// 자주 쓰는 화면이 아니라 프로필 안에서 한 단계 들어와 열린다.
export default function Report() {
  const nav = useNavigate()

  return (
    <div className="page">
      <header className="appbar">
        <div className="titlewrap">
          <button className="back" onClick={() => nav(-1)}>‹</button>
          <div>
            <h1>오류 제보</h1>
            <div className="sub">개발자에게 바로 전달됩니다</div>
          </div>
        </div>
      </header>

      <div className="scroll">
        <p className="rintro">
          잘 안 되는 부분을 알려주시면 고치는 데 큰 도움이 됩니다.
          앱 버전과 화면 위치 같은 상황 정보는 자동으로 함께 전송돼요.
        </p>

        <ReportForm />

        <div className="verline">v{APP_VERSION}</div>
      </div>
    </div>
  )
}
