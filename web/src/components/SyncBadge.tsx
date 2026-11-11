import { sync, useSyncStatus } from '../sync'

const LABELS = {
  idle: 'Synced',
  syncing: 'Syncing…',
  offline: 'Offline',
  error: 'Sync error',
  auth: 'Signed out',
}

export function SyncBadge() {
  const { state, pending, error } = useSyncStatus()
  const label = state === 'idle' && pending ? `${pending} pending` : LABELS[state]
  return (
    <button className={`sync sync-${state}`} title={error ?? 'Sync now'} onClick={() => sync()}>
      <span className="dot" />
      {label}
      {state !== 'idle' && pending > 0 && <span className="muted"> · {pending}</span>}
    </button>
  )
}
