import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getDb, remove, save, type Roll } from '../db'
import { useCameras, useFilms, useRoll } from '../hooks'
import { today } from '../lib'

export function RollForm() {
  const { id } = useParams()
  const existing = useRoll(id)

  if (id && existing === undefined) return null
  if (id && existing === null) return <p className="empty">Roll not found.</p>
  // The form copies the roll into its own state once, so syncs don't reset edits.
  return <RollFormFields key={id ?? 'new'} id={id} initial={existing ?? { loaded_at: today(), exposures: 36 }} />
}

function RollFormFields({ id, initial }: { id?: string; initial: Partial<Roll> }) {
  const navigate = useNavigate()
  const cameras = useCameras()
  const films = useFilms()
  const [roll, setRoll] = useState(initial)

  const set = <K extends keyof Roll>(key: K, value: Roll[K]) => setRoll((r) => ({ ...r, [key]: value }))

  const onFilm = (filmId: string) => {
    const film = films.find((f) => f.id === filmId)
    setRoll((r) => ({ ...r, film: filmId, shot_iso: film?.iso || r.shot_iso }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const savedId = await save<Roll>('rolls', roll)
    navigate(`/rolls/${savedId}`, { replace: true })
  }

  const onDelete = async () => {
    if (!id || !window.confirm('Delete this roll and all its frames?')) return
    const frames = await getDb().frames.where('roll').equals(id).toArray()
    for (const f of frames) await remove('frames', f.id)
    await remove('rolls', id)
    navigate('/', { replace: true })
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h1>{id ? 'Edit roll' : 'Load roll'}</h1>

      {(!cameras.length || !films.length) && (
        <p className="hint">
          Tip: add cameras and films under <Link to="/gear">Gear</Link> to pick them here.
        </p>
      )}

      <label>
        Camera
        <select value={roll.camera ?? ''} onChange={(e) => set('camera', e.target.value)}>
          <option value="">—</option>
          {cameras.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Film
        <select value={roll.film ?? ''} onChange={(e) => onFilm(e.target.value)}>
          <option value="">—</option>
          {films.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
              {f.iso ? ` (ISO ${f.iso})` : ''}
            </option>
          ))}
        </select>
      </label>

      <div className="grid2">
        <label>
          Shot at ISO
          <input
            type="number"
            inputMode="numeric"
            value={roll.shot_iso || ''}
            onChange={(e) => set('shot_iso', Number(e.target.value) || 0)}
          />
        </label>
        <label>
          Exposures
          <input
            type="number"
            inputMode="numeric"
            value={roll.exposures || ''}
            onChange={(e) => set('exposures', Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <label>
        Name <span className="muted">(optional)</span>
        <input value={roll.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Summer in Ticino" />
      </label>

      <label>
        Loaded
        <input type="date" value={roll.loaded_at ?? ''} onChange={(e) => set('loaded_at', e.target.value)} />
      </label>

      {id && (
        <div className="grid2">
          <label>
            Finished
            <input type="date" value={roll.finished_at ?? ''} onChange={(e) => set('finished_at', e.target.value)} />
          </label>
          <label>
            Developed
            <input type="date" value={roll.developed_at ?? ''} onChange={(e) => set('developed_at', e.target.value)} />
          </label>
        </div>
      )}

      <label>
        Notes
        <textarea rows={3} value={roll.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
      </label>

      <div className="actions">
        <button type="submit" className="primary">
          Save
        </button>
        <button type="button" onClick={() => navigate(-1)}>
          Cancel
        </button>
        {id && (
          <button type="button" className="danger" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </form>
  )
}
