import Dexie, { type EntityTable, type Table } from 'dexie'
import { requestSync } from './sync'

// Local-first storage: every record lives in IndexedDB and is synced to
// PocketBase in the background. `_dirty` marks local changes not yet pushed,
// `_rev` detects edits made while a push was in flight.
export interface Base {
  id: string
  deleted?: boolean
  created?: string
  updated?: string
  _dirty?: 0 | 1
  _rev?: number
}

export interface Camera extends Base {
  name: string
  type?: string
  format?: string
  mount?: string
  slowest_shutter?: string
  fastest_shutter?: string
  bulb?: boolean
  flash_sync?: string
  notes?: string
}

export interface Lens extends Base {
  name: string
  focal_length?: string
  max_aperture?: string
  min_aperture?: string
  mount?: string
  notes?: string
}

export interface Flash extends Base {
  name: string
  guide_number?: number
  notes?: string
}

export interface Film extends Base {
  name: string
  iso?: number
  kind?: string
  color?: string
  format?: string
  notes?: string
}

export interface Roll extends Base {
  name?: string
  camera?: string
  film?: string
  shot_iso?: number
  exposures?: number
  loaded_at?: string
  finished_at?: string
  developed_at?: string
  notes?: string
}

export interface Frame extends Base {
  roll: string
  number?: number
  aperture?: string
  shutter?: string
  lens?: string
  flash?: string
  flash_power?: string
  exposure_comp?: string
  taken_at?: string
  lat?: number
  lng?: number
  notes?: string
  skipped?: boolean
}

export const TABLES = ['cameras', 'lenses', 'flashes', 'films', 'rolls', 'frames'] as const
export type TableName = (typeof TABLES)[number]

export class AnaLogDB extends Dexie {
  cameras!: EntityTable<Camera, 'id'>
  lenses!: EntityTable<Lens, 'id'>
  flashes!: EntityTable<Flash, 'id'>
  films!: EntityTable<Film, 'id'>
  rolls!: EntityTable<Roll, 'id'>
  frames!: EntityTable<Frame, 'id'>
  meta!: EntityTable<{ key: string; value: string }, 'key'>

  constructor(name: string) {
    super(name)
    this.version(1).stores({
      cameras: 'id, _dirty',
      lenses: 'id, _dirty',
      films: 'id, _dirty',
      rolls: 'id, _dirty',
      frames: 'id, _dirty, roll',
      meta: 'key',
    })
    this.version(2).stores({ flashes: 'id, _dirty' })
  }
}

let current: AnaLogDB | null = null

// One database per user so switching Google accounts never mixes data.
export function openDb(userId: string): AnaLogDB {
  if (current?.name !== `ana-log-${userId}`) {
    current?.close()
    current = new AnaLogDB(`ana-log-${userId}`)
    suspended = false
  }
  return current
}

// The database is closed while the app is in the background. Chrome freezes
// hidden pages; a frozen page that is in the middle of reading IndexedDB blocks
// every write from other instances of the app (e.g. the installed app and a
// browser tab) until it is woken up again. Live queries keep showing their last
// result while suspended (see useLive) and rerun on resume.
let suspended = false
let epoch = 0
const epochListeners = new Set<() => void>()

export const isSuspended = () => suspended
export const dbEpoch = () => epoch

export function onDbEpoch(listener: () => void): () => void {
  epochListeners.add(listener)
  return () => epochListeners.delete(listener)
}

export function suspendDb() {
  if (!current || suspended) return
  suspended = true
  current.close({ disableAutoOpen: true })
}

export function resumeDb() {
  if (!current || !suspended) return
  suspended = false
  current.open().catch((e) => console.error('reopening database failed', e))
  epoch++
  epochListeners.forEach((l) => l())
}

export const isClosedError = (e: unknown) => e instanceof Error && e.name === 'DatabaseClosedError'

export function getDb(): AnaLogDB {
  if (!current) throw new Error('database not opened')
  return current
}

export function table<T extends Base>(name: TableName): Table<T, string> {
  return getDb().table(name)
}

export function newId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(15))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

export async function save<T extends Base>(name: TableName, rec: Partial<T>): Promise<string> {
  resumeDb()
  const t = table<Base>(name)
  const id = rec.id ?? newId()
  await getDb().transaction('rw', t, async () => {
    const cur = await t.get(id)
    await t.put({ ...cur, ...rec, id, _dirty: 1, _rev: (cur?._rev ?? 0) + 1 })
  })
  requestSync()
  return id
}

export function remove(name: TableName, id: string): Promise<string> {
  return save(name, { id, deleted: true })
}

export async function pendingCount(): Promise<number> {
  const counts = await Promise.all(TABLES.map((n) => table(n).where('_dirty').equals(1).count()))
  return counts.reduce((a, b) => a + b, 0)
}

export const alive = <T extends Base>(rows: T[]) => rows.filter((r) => !r.deleted)
