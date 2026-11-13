import { useState, type FormEvent, type ReactNode } from 'react'
import { CameraIcon, FilmIcon, FlashIcon, LensIcon } from '../components/Icons'
import { remove, save, type Base, type Camera, type Film, type Flash, type Lens, type TableName } from '../db'
import { useCameras, useFilms, useFlashes, useLenses } from '../hooks'
import {
  APERTURES,
  CAMERA_TYPES,
  FILM_COLORS,
  FILM_KINDS,
  FORMATS,
  MOUNTS,
  SHUTTERS,
  describeRange,
  filmColor,
} from '../lib'

interface Field {
  key: string
  label: string
  type?: 'text' | 'number' | 'textarea' | 'checkbox' | 'camera-type' | 'film-color'
  options?: { value: string; label: string }[]
  suggestions?: string[]
  placeholder?: string
}

const SPEEDS = SHUTTERS.filter((s) => s !== 'B')

const CAMERA_FIELDS: Field[] = [
  { key: 'name', label: 'Name', placeholder: 'e.g. Nikon FM2' },
  { key: 'type', label: 'Type', type: 'camera-type' },
  { key: 'format', label: 'Format', suggestions: FORMATS },
  { key: 'mount', label: 'Lens mount', suggestions: MOUNTS, placeholder: 'Nikon F' },
  { key: 'slowest_shutter', label: 'Slowest shutter speed', suggestions: SPEEDS, placeholder: '1s' },
  { key: 'fastest_shutter', label: 'Fastest shutter speed', suggestions: SPEEDS, placeholder: '1/1000' },
  { key: 'bulb', label: 'Has bulb (B)', type: 'checkbox' },
  { key: 'flash_sync', label: 'Flash sync speed', suggestions: SPEEDS, placeholder: '1/125' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
]

const LENS_FIELDS: Field[] = [
  { key: 'name', label: 'Name', placeholder: 'e.g. Nikkor 50mm f/1.4 AI-S' },
  { key: 'focal_length', label: 'Focal length', placeholder: '50mm' },
  { key: 'max_aperture', label: 'Widest aperture', suggestions: APERTURES, placeholder: '1.4' },
  { key: 'min_aperture', label: 'Smallest aperture', suggestions: APERTURES, placeholder: '16' },
  { key: 'mount', label: 'Mount', suggestions: MOUNTS, placeholder: 'Nikon F' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
]

const FLASH_FIELDS: Field[] = [
  { key: 'name', label: 'Name', placeholder: 'e.g. Minolta 2800AF' },
  { key: 'guide_number', label: 'Guide number (ISO 100, m)', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
]

const FILM_FIELDS: Field[] = [
  { key: 'name', label: 'Name', placeholder: 'e.g. Kodak Portra 400' },
  { key: 'iso', label: 'ISO', type: 'number' },
  { key: 'kind', label: 'Type', options: FILM_KINDS },
  { key: 'format', label: 'Format', suggestions: FORMATS },
  { key: 'color', label: 'Color', type: 'film-color' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
]

const TABS = [
  { key: 'cameras', label: 'Cameras' },
  { key: 'lenses', label: 'Lenses' },
  { key: 'flashes', label: 'Flashes' },
  { key: 'films', label: 'Films' },
] as const

export function Gear() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('cameras')
  const cameras = useCameras()
  const lenses = useLenses()
  const flashes = useFlashes()
  const films = useFilms()
  // Offer mounts already typed in, so cameras and lenses end up spelled alike.
  const suggest = {
    mount: [...new Set([...MOUNTS, ...[...cameras, ...lenses].map((r) => r.mount?.trim() ?? '')].filter(Boolean))].sort(),
  }

  return (
    <>
      <h1>Gear</h1>
      <div className="segmented">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'cameras' && (
        <GearList<Camera> table="cameras" noun="camera" rows={cameras} fields={CAMERA_FIELDS} suggest={suggest} thumb={(c) => <CameraIcon type={c.type} />} describe={(c) =>
            [c.format, c.mount, describeRange(c.slowest_shutter, c.fastest_shutter), c.bulb && 'B', c.flash_sync && `⚡ ${c.flash_sync}`].filter(Boolean).join(' · ')
          }
        />
      )}
      {tab === 'lenses' && (
        <GearList<Lens>
          table="lenses"
          noun="lens"
          rows={lenses}
          fields={LENS_FIELDS}
          suggest={suggest}
          thumb={() => <LensIcon />}
          describe={(l) => [l.focal_length, describeRange(l.max_aperture, l.min_aperture, 'f/'), l.mount].filter(Boolean).join(' · ')}
        />
      )}
      {tab === 'flashes' && (
        <GearList<Flash>
          table="flashes"
          noun="flash"
          rows={flashes}
          fields={FLASH_FIELDS}
          thumb={() => <FlashIcon />}
          describe={(f) => (f.guide_number ? `GN ${f.guide_number}` : undefined)}
        />
      )}
      {tab === 'films' && (
        <GearList<Film>
          table="films"
          noun="film"
          rows={films}
          fields={FILM_FIELDS}
          thumb={(f) => <FilmIcon format={f.format} color={f.color} kind={f.kind} />}
          describe={(f) =>
            [f.iso && `ISO ${f.iso}`, FILM_KINDS.find((k) => k.value === f.kind)?.label, f.format]
              .filter(Boolean)
              .join(' · ')
          }
        />
      )}
    </>
  )
}

interface ListProps<T> {
  table: TableName
  noun: string
  rows: T[]
  fields: Field[]
  suggest?: Record<string, string[]>
  thumb: (row: T) => ReactNode
  describe: (row: T) => string | undefined
}

function GearList<T extends Base & { name: string }>({ table, noun, rows, fields, suggest, thumb, describe }: ListProps<T>) {
  const [editing, setEditing] = useState<Partial<T> | null>(null)

  return (
    <>
      {editing ? (
        <GearForm
          key={editing.id ?? 'new'}
          table={table}
          noun={noun}
          fields={fields}
          suggest={suggest}
          initial={editing}
          onDone={() => setEditing(null)}
        />
      ) : (
        <button className="primary" onClick={() => setEditing({} as Partial<T>)}>
          Add {noun}
        </button>
      )}
      {!rows.length && !editing && <p className="empty">No {noun === 'lens' ? 'lenses' : noun === 'flash' ? 'flashes' : `${noun}s`} yet.</p>}
      <ul className="list">
        {rows.map((r) => (
          <li key={r.id}>
            <button className="row" onClick={() => setEditing(r)}>
              <div className="thumb">{thumb(r)}</div>
              <div className="grow">
                <div className="title">{r.name}</div>
                <div className="muted small">{describe(r)}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

interface FormProps<T> {
  table: TableName
  noun: string
  fields: Field[]
  suggest?: Record<string, string[]>
  initial: Partial<T>
  onDone: () => void
}

function GearForm<T extends Base>({ table, noun, fields, suggest, initial, onDone }: FormProps<T>) {
  const [values, setValues] = useState<Record<string, unknown>>(initial)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await save(table, values)
    onDone()
  }

  const onDelete = async () => {
    if (!window.confirm(`Delete ${String(values.name)}?`)) return
    await remove(table, values.id as string)
    onDone()
  }

  return (
    <form className="form card" onSubmit={onSubmit}>
      <h2>{initial.id ? `Edit ${noun}` : `New ${noun}`}</h2>
      {fields.map((f) => {
        const value = values[f.key] ?? ''
        const set = (v: unknown) => setValues((s) => ({ ...s, [f.key]: v }))
        const suggestions = suggest?.[f.key] ?? f.suggestions
        if (f.type === 'camera-type') {
          return (
            <fieldset key={f.key} className="picker">
              <legend>{f.label}</legend>
              <div className="tiles">
                {CAMERA_TYPES.map((t) => (
                  <button
                    type="button"
                    key={t.value}
                    className={(value || 'slr') === t.value ? 'tile on' : 'tile'}
                    onClick={() => set(t.value)}
                  >
                    <CameraIcon type={t.value} size={36} />
                    {t.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )
        }
        if (f.type === 'film-color') {
          const current = filmColor(value as string, values.kind as string)
          return (
            <fieldset key={f.key} className="picker">
              <legend>{f.label}</legend>
              <div className="swatches">
                {FILM_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c.value}
                    className={current === c.value ? 'swatch on' : 'swatch'}
                    onClick={() => set(c.value)}
                  >
                    <FilmIcon format={values.format as string} color={c.value} size={36} />
                    {c.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )
        }
        return (
          f.type === 'checkbox' ? (
            <label key={f.key} className="toggle">
              <input type="checkbox" checked={!!value} onChange={(e) => set(e.target.checked)} />
              {f.label}
            </label>
          ) : (
            <label key={f.key}>
              {f.label}
              {f.type === 'textarea' ? (
                <textarea rows={2} value={String(value)} onChange={(e) => set(e.target.value)} />
              ) : f.options ? (
                <select value={String(value)} onChange={(e) => set(e.target.value)}>
                  <option value="">—</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    type={f.type ?? 'text'}
                    inputMode={f.type === 'number' ? 'numeric' : undefined}
                    required={f.key === 'name'}
                    placeholder={f.placeholder}
                    list={suggestions ? `${table}-${f.key}` : undefined}
                    value={f.type === 'number' ? String(value || '') : String(value)}
                    onChange={(e) => set(f.type === 'number' ? Number(e.target.value) || 0 : e.target.value)}
                  />
                  {suggestions && (
                    <datalist id={`${table}-${f.key}`}>
                      {suggestions.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  )}
                </>
              )}
            </label>
          )
        )
      })}
      <div className="actions">
        <button type="submit" className="primary">
          Save
        </button>
        <button type="button" onClick={onDone}>
          Cancel
        </button>
        {initial.id && (
          <button type="button" className="danger" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </form>
  )
}
