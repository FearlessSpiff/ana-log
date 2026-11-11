import { useState } from 'react'
import { getDb, pendingCount, TABLES } from '../db'
import { pb } from '../pb'
import { sync, useSyncStatus } from '../sync'
import { THEMES, formatDateTime, getTheme, gpsEnabled, setGpsEnabled, setTheme } from '../lib'

export function Settings() {
  const [gps, setGps] = useState(gpsEnabled())
  const [theme, setThemeState] = useState(getTheme())
  const status = useSyncStatus()
  const user = pb.authStore.record

  const toggleGps = (on: boolean) => {
    setGpsEnabled(on)
    setGps(on)
    // Ask for permission right away rather than on the first frame.
    if (on) navigator.geolocation?.getCurrentPosition(() => {}, () => {})
  }

  const changeTheme = (value: string) => {
    setTheme(value)
    setThemeState(value)
  }

  const exportJson = async () => {
    const db = getDb()
    const data: Record<string, unknown[]> = {}
    for (const name of TABLES) {
      data[name] = (await db.table(name).toArray())
        .filter((r) => !r.deleted)
        .map(({ _dirty: _d, _rev: _r, deleted: _x, ...r }) => r)
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ana-log-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const signOut = async () => {
    const pending = await pendingCount()
    if (pending && !window.confirm(`${pending} changes are not synced yet. They stay on this device until you sign in again. Sign out anyway?`)) return
    pb.authStore.clear()
  }

  return (
    <>
      <h1>Settings</h1>

      <section className="card form">
        <label>
          Theme
          <select value={theme} onChange={(e) => changeTheme(e.target.value)}>
            {THEMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={gps} onChange={(e) => toggleGps(e.target.checked)} />
          Record location for new frames
        </label>
      </section>

      <section className="card">
        <h2>Sync</h2>
        <p className="small">
          {status.lastSync ? `Last synced ${formatDateTime(new Date(status.lastSync).toISOString())}` : 'Not synced this session'}
          {status.pending > 0 && ` · ${status.pending} pending`}
        </p>
        {status.error && <pre className="error small">{status.error}</pre>}
        <button onClick={() => sync()}>Sync now</button>
      </section>

      <section className="card">
        <h2>Data</h2>
        <button onClick={exportJson}>Export as JSON</button>
      </section>

      <section className="card">
        <h2>Account</h2>
        <p className="small">{user?.email}</p>
        <button className="danger" onClick={signOut}>
          Sign out
        </button>
      </section>
    </>
  )
}
