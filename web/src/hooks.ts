import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useSyncExternalStore } from 'react'
import { alive, dbEpoch, getDb, isClosedError, isSuspended, onDbEpoch, type Camera, type Film, type Flash, type Frame, type Lens, type Roll } from './db'

// useLiveQuery that survives the database being suspended in the background:
// while it is closed the last result is kept, and the query resubscribes when
// the database is reopened.
export function useLive<T>(query: () => Promise<T>, deps: unknown[]): T | undefined
export function useLive<T, D>(query: () => Promise<T>, deps: unknown[], initial: D): T | D
export function useLive<T, D>(query: () => Promise<T>, deps: unknown[], initial?: D): T | D | undefined {
  const epoch = useSyncExternalStore(onDbEpoch, dbEpoch)
  const last = useRef<T | D | undefined>(initial)
  return useLiveQuery(
    async () => {
      if (isSuspended()) return last.current
      try {
        return (last.current = await query())
      } catch (e) {
        if (isClosedError(e)) return last.current
        throw e
      }
    },
    [...deps, epoch],
    last.current,
  )
}

export function useCameras(): Camera[] {
  return useLive(() => getDb().cameras.toArray().then(alive), [], []).sort(byName)
}

export function useLenses(): Lens[] {
  return useLive(() => getDb().lenses.toArray().then(alive), [], []).sort(byName)
}

export function useFlashes(): Flash[] {
  return useLive(() => getDb().flashes.toArray().then(alive), [], []).sort(byName)
}

export function useFilms(): Film[] {
  return useLive(() => getDb().films.toArray().then(alive), [], []).sort(byName)
}

export function useRolls(): Roll[] | undefined {
  return useLive(() => getDb().rolls.toArray().then(alive), [])
}

export function useRoll(id?: string): Roll | null | undefined {
  return useLive(async () => {
    const roll = id ? await getDb().rolls.get(id) : undefined
    return roll && !roll.deleted ? roll : null
  }, [id])
}

export function useFrames(rollId?: string): Frame[] | undefined {
  return useLive(
    async () =>
      rollId
        ? alive(await getDb().frames.where('roll').equals(rollId).toArray()).sort(
            (a, b) => (a.number ?? 0) - (b.number ?? 0),
          )
        : [],
    [rollId],
  )
}

export function useFrameCounts(): Map<string, number> {
  return useLive(
    async () => {
      // Highest frame number, so skipped and unlogged frames count as used.
      const counts = new Map<string, number>()
      for (const f of alive(await getDb().frames.toArray())) {
        counts.set(f.roll, Math.max(counts.get(f.roll) ?? 0, f.number ?? 0))
      }
      return counts
    },
    [],
    new Map(),
  )
}

export function byId<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((r) => [r.id, r]))
}

function byName(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name)
}

const normalizeMount = (mount?: string) => (mount ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')

// Lenses that fit the camera. A camera without a mount accepts every lens; the
// lens already chosen for a frame stays selectable even if it doesn't match.
export function lensesForCamera(lenses: Lens[], camera?: Camera, selected?: string): Lens[] {
  const mount = normalizeMount(camera?.mount)
  if (!mount) return lenses
  return lenses.filter((l) => normalizeMount(l.mount) === mount || l.id === selected)
}

export function rollTitle(roll: Roll, film?: Film): string {
  return roll.name || film?.name || 'Untitled roll'
}
