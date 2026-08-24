import { Routes, Route, Navigate } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Board from './pages/Board'
import MissionDetail from './pages/MissionDetail'
import NewRun from './pages/NewRun'
import Shuffle from './pages/Shuffle'
import Profile from './pages/Profile'

export default function App() {
  return (
    <div className="app">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Board />} />
          <Route path="/mission/:smcId/:goldId" element={<MissionDetail />} />
          <Route path="/shuffle" element={<Shuffle />} />
          <Route path="/new" element={<NewRun />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
