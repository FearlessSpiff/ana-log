import { useEffect, useState, type FormEvent } from 'react'
import { save, type Camera, type Flash, type Frame, type Lens } from '../db'
import {
  EXPOSURE_COMP,
  FLASH_POWERS,
  apertureOptions,
  fromDateTimeInput,
  gpsEnabled,
  hasLocation,
  shutterOptions,
  toDateTimeInput,
} from '../lib'
import { ChipPicker } from './ChipPicker'
import { FlashTable } from './FlashTable'

interface Props {
  frame: Partial<Frame> & { roll: string }
  lenses: Lens[]
  flashes: Flash[]
  camera?: Camera
  iso?: number
  isNew: boolean
  onSaved?: (frame: Frame) => void
  children?: React.ReactNode
}

type GpsState = 'off' | 'locating' | 'ok' | 'failed'

export function FrameForm({ frame: initial, lenses, flashes, camera, iso, isNew, onSaved, children }: Props) {
  const [frame, setFrame] = useState(initial)
  const [gps, setGps] = useState<GpsState>(hasLocation(initial) ? 'ok' : 'off')
  const [showMore, setShowMore] = useState(!isNew || !!initial.exposure_comp || !!initial.flash_power)

  const lens = lenses.find((l) => l.id === frame.lens)
  const flash = flashes.find((f) => f.id === frame.flash)

  const set = <K extends keyof Frame>(key: K, value: Frame[K]) => setFrame((f) => ({ ...f, [key]: value }))

  const locate = () => {
    if (!navigator.geolocation) return setGps('failed')
    setGps('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFrame((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }))
        setGps('ok')
      },
      () => setGps('failed'),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    )
  }

  useEffect(() => {
    if (isNew && gpsEnabled()) locate()
  }, [isNew])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    // Saving a skipped frame with details logs it.
    const data = { ...frame, skipped: false }
    if (isNew) data.taken_at = new Date().toISOString()
    const id = await save<Frame>('frames', data)
    onSaved?.({ ...data, id } as Frame)
  }

  const onSkip = async () => {
    const data = { roll: frame.roll, number: frame.number, skipped: true, taken_at: new Date().toISOString() }
    const id = await save<Frame>('frames', data)
    onSaved?.({ ...data, id })
  }

  return (
    <form className="form frame-form" onSubmit={onSubmit}>
      {initial.skipped && <p className="hint">This frame was skipped. Save it with settings to log it.</p>}
      <div className="frame-head">
        <label className="frame-number">
          Frame
          <input
            type="number"
            inputMode="numeric"
            value={frame.number ?? ''}
            onChange={(e) => set('number', Number(e.target.value) || 0)}
          />
        </label>
        {lenses.length > 0 && (
          <label className="grow">
            Lens
            <select value={frame.lens ?? ''} onChange={(e) => set('lens', e.target.value)}>
              <option value="">—</option>
              {lenses.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {flashes.length === 1 && !(frame.flash && frame.flash !== flashes[0].id) ? (
        <label className="toggle">
          <input
            type="checkbox"
            checked={frame.flash === flashes[0].id}
            onChange={(e) => setFrame((f) => ({ ...f, flash: e.target.checked ? flashes[0].id : '', flash_power: e.target.checked ? f.flash_power : '' }))}
          />
          Flash ({flashes[0].name})
        </label>
      ) : (
        flashes.length > 0 && (
          <label>
            Flash
            <select
              value={frame.flash ?? ''}
              onChange={(e) => setFrame((f) => ({ ...f, flash: e.target.value, flash_power: e.target.value ? f.flash_power : '' }))}
            >
              <option value="">No flash</option>
              {flashes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
        )
      )}

      <ChipPicker label="Aperture" prefix="f/" options={apertureOptions(lens)} value={frame.aperture} onChange={(v) => set('aperture', v)} />
      <ChipPicker label="Shutter" options={shutterOptions(camera)} value={frame.shutter} onChange={(v) => set('shutter', v)} />

      {showMore ? (
        <>
          <ChipPicker
            label="Exposure compensation"
            options={EXPOSURE_COMP}
            value={frame.exposure_comp}
            onChange={(v) => set('exposure_comp', v)}
          />
          {frame.flash && (
            <ChipPicker
              label="Flash power (manual)"
              options={FLASH_POWERS}
              value={frame.flash_power}
              onChange={(v) => set('flash_power', v)}
            />
          )}
          {flash &&
            (flash.guide_number && iso ? (
              <FlashTable
                gn={flash.guide_number}
                iso={iso}
                apertures={apertureOptions(lens)}
                aperture={frame.aperture}
                power={frame.flash_power}
                onPick={(aperture, flash_power) => setFrame((f) => ({ ...f, aperture, flash_power }))}
              />
            ) : (
              <p className="hint">
                {flash.guide_number ? 'Set the ISO on the roll or film' : `Set the guide number of ${flash.name} under Gear`} to see
                flash distances.
              </p>
            ))}
          <label>
            Notes
            <textarea rows={2} value={frame.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </label>
          {!isNew && (
            <label>
              Taken
              <input
                type="datetime-local"
                value={toDateTimeInput(frame.taken_at)}
                onChange={(e) => set('taken_at', fromDateTimeInput(e.target.value))}
              />
            </label>
          )}
        </>
      ) : (
        <button type="button" className="link" onClick={() => setShowMore(true)}>
          + Notes, exposure compensation{frame.flash ? ', flash power' : ''}
        </button>
      )}

      <div className="gps">
        {gps === 'ok' && hasLocation(frame) ? (
          <>
            <a href={`https://www.openstreetmap.org/?mlat=${frame.lat}&mlon=${frame.lng}#map=16/${frame.lat}/${frame.lng}`} target="_blank" rel="noreferrer">
              📍 {frame.lat?.toFixed(4)}, {frame.lng?.toFixed(4)}
            </a>
            <button type="button" className="link" onClick={() => { setFrame((f) => ({ ...f, lat: 0, lng: 0 })); setGps('off') }}>
              Remove
            </button>
          </>
        ) : gps === 'locating' ? (
          <span className="muted">Locating…</span>
        ) : (
          <button type="button" className="link" onClick={locate}>
            {gps === 'failed' ? 'Location failed, retry' : 'Add location'}
          </button>
        )}
      </div>

      <div className="actions">
        <button type="submit" className="primary big">
          {isNew ? `Save frame ${frame.number ?? ''}` : 'Save'}
        </button>
        {isNew && (
          <button type="button" onClick={onSkip}>
            Skip
          </button>
        )}
        {children}
      </div>
    </form>
  )
}
