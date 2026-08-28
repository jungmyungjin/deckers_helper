import { useNavigate } from 'react-router-dom'
import ReportForm from '../components/ReportForm'
import { APP_VERSION } from '../db/reports'
import { useT } from '../i18n'

// 자주 쓰는 화면이 아니라 프로필 안에서 한 단계 들어와 열린다.
export default function Report() {
  const nav = useNavigate()
  const { t } = useT()

  return (
    <div className="page">
      <header className="appbar">
        <div className="titlewrap">
          <button className="back" onClick={() => nav(-1)}>‹</button>
          <div>
            <h1>{t('report.title')}</h1>
            <div className="sub">{t('report.sub')}</div>
          </div>
        </div>
      </header>

      <div className="scroll">
        <p className="rintro">{t('report.intro')}</p>
        <ReportForm />
        <div className="verline">v{APP_VERSION}</div>
      </div>
    </div>
  )
}
