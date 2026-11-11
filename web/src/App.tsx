import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { SyncBadge } from './components/SyncBadge'
import { openDb } from './db'
import { Gear } from './pages/Gear'
import { FramePage } from './pages/FramePage'
import { Login } from './pages/Login'
import { RollDetail } from './pages/RollDetail'
import { RollForm } from './pages/RollForm'
import { Rolls } from './pages/Rolls'
import { Settings } from './pages/Settings'
import { pb, signIn } from './pb'
import { startSync, useSyncStatus } from './sync'

export default function App() {
  const [user, setUser] = useState(pb.authStore.record)
  useEffect(() => pb.authStore.onChange((_, record) => setUser(record)), [])

  // An expired token still shows local data; only syncing needs a new login.
  if (!user) return <Login />
  return <Shell key={user.id} userId={user.id} />
}

function Shell({ userId }: { userId: string }) {
  openDb(userId)
  const status = useSyncStatus()

  useEffect(() => {
    if (navigator.onLine && pb.authStore.isValid) {
      pb.collection('users').authRefresh().catch(() => {})
    }
    return startSync()
  }, [userId])

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand">
          ana-log
        </NavLink>
        <SyncBadge />
      </header>
      {status.state === 'auth' && (
        <div className="banner">
          {status.error}{' '}
          <button className="link" onClick={() => signIn().catch(() => {})}>
            Sign in
          </button>
        </div>
      )}
      <main>
        <Routes>
          <Route path="/" element={<Rolls />} />
          <Route path="/rolls/new" element={<RollForm />} />
          <Route path="/rolls/:id" element={<RollDetail />} />
          <Route path="/rolls/:id/edit" element={<RollForm />} />
          <Route path="/rolls/:id/frames/:frameId" element={<FramePage />} />
          <Route path="/gear" element={<Gear />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Rolls />} />
        </Routes>
      </main>
      <nav className="tabbar">
        <NavLink to="/" end>
          Rolls
        </NavLink>
        <NavLink to="/gear">Gear</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
    </div>
  )
}
