import { ClientResponseError, type RecordModel } from 'pocketbase'
import { useSyncExternalStore } from 'react'
import { getDb, pendingCount, table, TABLES, type Base, type TableName } from './db'
import { pb } from './pb'

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error' | 'auth'

export interface SyncStatus {
  state: SyncState
  pending: number
  lastSync?: number
  error?: string
}

let status: SyncStatus = { state: 'idle', pending: 0 }
const listeners = new Set<() => void>()

function setStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch }
  listeners.forEach((l) => l())
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => status,
  )
}

// Fields that only exist locally or are owned by the server.
const LOCAL_ONLY = new Set(['id', '_dirty', '_rev', 'created', 'updated'])

async function push(name: TableName, errors: string[]) {
  const t = table<Base>(name)
  const dirty = await t.where('_dirty').equals(1).toArray()
  const col = pb.collection(name)
  const body: Record<string, unknown> = {}

  for (const rec of dirty) {
    for (const k of Object.keys(body)) delete body[k]
    body.user = pb.authStore.record!.id
    for (const [k, v] of Object.entries(rec)) if (!LOCAL_ONLY.has(k)) body[k] = v ?? null

    let saved: RecordModel
    try {
      try {
        saved = await col.update(rec.id, body)
      } catch (e) {
        if (!(e instanceof ClientResponseError) || e.status !== 404) throw e
        saved = await col.create({ ...body, id: rec.id })
      }
    } catch (e) {
      // A record the server rejects must not block syncing everything else.
      if (e instanceof ClientResponseError && e.status === 400) {
        errors.push(`${name}/${rec.id}: ${e.message}`)
        continue
      }
      throw e
    }

    await getDb().transaction('rw', t, async () => {
      const cur = await t.get(rec.id)
      if (cur && cur._rev === rec._rev) {
        await t.put({ ...cur, created: saved.created, updated: saved.updated, _dirty: 0 })
      }
    })
  }
}

async function pull(name: TableName) {
  const db = getDb()
  const t = table<Base>(name)
  const key = `cursor:${name}`
  const cursor = (await db.meta.get(key))?.value
  const items = await pb.collection(name).getFullList({
    filter: cursor ? pb.filter('updated >= {:cursor}', { cursor }) : undefined,
    sort: 'updated',
    batch: 500,
  })
  if (!items.length) return

  await db.transaction('rw', t, db.meta, async () => {
    for (const item of items) {
      const cur = await t.get(item.id)
      if (cur?._dirty) continue
      const { collectionId: _c, collectionName: _n, user: _u, expand: _e, ...rest } = item
      await t.put({ ...(rest as Base), _dirty: 0, _rev: cur?._rev ?? 0 })
    }
    await db.meta.put({ key, value: items[items.length - 1].updated })
  })
}

async function syncOnce() {
  if (!pb.authStore.record) return
  if (!navigator.onLine) {
    setStatus({ state: 'offline' })
    return
  }
  setStatus({ state: 'syncing' })
  const errors: string[] = []
  try {
    for (const name of TABLES) await push(name, errors)
    for (const name of TABLES) await pull(name)
    setStatus(
      errors.length
        ? { state: 'error', error: errors.join('\n') }
        : { state: 'idle', error: undefined, lastSync: Date.now() },
    )
  } catch (e) {
    if (e instanceof ClientResponseError && (e.status === 401 || e.status === 403)) {
      setStatus({ state: 'auth', error: 'Session expired, sign in again to sync.' })
    } else if (e instanceof ClientResponseError && e.status === 0) {
      setStatus({ state: 'offline' })
    } else {
      setStatus({ state: 'error', error: String(e instanceof Error ? e.message : e) })
    }
  } finally {
    setStatus({ pending: await pendingCount() })
  }
}

let running = false
let again = false

export async function sync() {
  if (running) {
    again = true
    return
  }
  running = true
  try {
    do {
      again = false
      await syncOnce()
    } while (again)
  } finally {
    running = false
  }
}

let timer: ReturnType<typeof setTimeout> | undefined

export function requestSync(delay = 800) {
  clearTimeout(timer)
  timer = setTimeout(sync, delay)
  pendingCount().then((pending) => setStatus({ pending }))
}

// Sync on start, when connectivity returns, when the app comes back to the
// foreground and periodically while it is open.
export function startSync(): () => void {
  const onVisible = () => document.visibilityState === 'visible' && sync()
  window.addEventListener('online', sync)
  document.addEventListener('visibilitychange', onVisible)
  const interval = setInterval(sync, 60_000)
  sync()
  return () => {
    window.removeEventListener('online', sync)
    document.removeEventListener('visibilitychange', onVisible)
    clearInterval(interval)
    clearTimeout(timer)
  }
}
