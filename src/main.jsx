import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { syncDocumentLang } from './i18n'
import './styles.css'

// <html lang> 을 현재 언어로. CSS의 :lang(ko) 분기와 스크린 리더가 이 값을 본다.
syncDocumentLang()

// ErrorBoundary는 SyncProvider(App 안)보다 바깥에 둔다 — Provider가 터져도 잡히도록.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
