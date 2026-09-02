import { Routes, Route, Navigate } from 'react-router-dom'
import { SyncProvider } from './lib/SyncProvider'
import BottomNav from './components/BottomNav'
import AchievementToaster from './components/AchievementToaster'
import SyncBanner from './components/SyncBanner'
import Board from './pages/Board'
import MissionDetail from './pages/MissionDetail'
import NewRun from './pages/NewRun'
import Shuffle from './pages/Shuffle'
import History from './pages/History'
import Cards from './pages/Cards'
import Profile from './pages/Profile'
import Achievements from './pages/Achievements'
import Report from './pages/Report'

export default function App() {
  return (
    <SyncProvider>
      <div className="app">
        <SyncBanner />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Board />} />
            <Route path="/mission/:smcId/:goldId" element={<MissionDetail />} />
            <Route path="/history" element={<History />} />
            <Route path="/shuffle" element={<Shuffle />} />
            <Route path="/new" element={<NewRun />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/report" element={<Report />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <AchievementToaster />
        <BottomNav />
      </div>
    </SyncProvider>
  )
}
