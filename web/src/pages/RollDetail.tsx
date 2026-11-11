import { Link, useParams } from 'react-router-dom'
import { FrameForm } from '../components/FrameForm'
import { CameraIcon, FilmIcon } from '../components/Icons'
import { save, type Frame, type Roll } from '../db'
import { byId, lensesForCamera, rollTitle, useCameras, useFilms, useFrames, useLenses, useRoll } from '../hooks'
import { formatDate, formatDateTime, hasLocation, today } from '../lib'

type Gap = { gap: true; from: number; to: number }

// Frames in order, with a gap entry wherever frame numbers jump.
function withGaps(frames: Frame[]): (Frame | Gap)[] {
  const out: (Frame | Gap)[] = []
  let expected = 1
  for (const f of frames) {
    const n = f.number ?? 0
    if (n > expected) out.push({ gap: true, from: expected, to: n - 1 })
    out.push(f)
    expected = Math.max(expected, n + 1)
  }
  return out
}

export function RollDetail() {
  const { id } = useParams()
  const roll = useRoll(id)
  const frames = useFrames(id)
  const films = byId(useFilms())
  const cameras = byId(useCameras())
  const allLenses = useLenses()
  const lensById = byId(allLenses)

  if (roll === undefined || frames === undefined) return null
  if (roll === null) return <p className="empty">Roll not found.</p>

  const film = roll.film ? films.get(roll.film) : undefined
  const camera = roll.camera ? cameras.get(roll.camera) : undefined
  const nextNumber = (frames[frames.length - 1]?.number ?? 0) + 1
  const last = frames.findLast((f) => !f.skipped)
  const lenses = lensesForCamera(allLenses, camera, last?.lens)

  // Carry over the last logged frame's settings: most frames on a roll differ only slightly.
  const draft: Partial<Frame> & { roll: string } = {
    roll: roll.id,
    number: nextNumber,
    aperture: last?.aperture,
    shutter: last?.shutter,
    lens: last?.lens,
  }

  const mark = (field: keyof Pick<Roll, 'finished_at' | 'developed_at'>) =>
    save<Roll>('rolls', { id: roll.id, [field]: today() })

  return (
    <>
      <div className="page-head">
        <div className="roll-icons">
          <div>
            <FilmIcon format={film?.format} color={film?.color} kind={film?.kind} size={40} />
          </div>
          {camera && (
            <div>
              <CameraIcon type={camera.type} size={40} />
            </div>
          )}
        </div>
        <div className="grow">
          <h1>{rollTitle(roll, film)}</h1>
          <div className="muted small">
            {[
              camera?.name,
              film && roll.name ? film.name : null,
              (roll.shot_iso || film?.iso) && `ISO ${roll.shot_iso || film?.iso}`,
              roll.loaded_at && `loaded ${formatDate(roll.loaded_at)}`,
              roll.finished_at && `finished ${formatDate(roll.finished_at)}`,
              roll.developed_at && `developed ${formatDate(roll.developed_at)}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
        <Link to={`/rolls/${roll.id}/edit`} className="button">
          Edit
        </Link>
      </div>

      {roll.notes && <p className="notes">{roll.notes}</p>}

      {!roll.finished_at ? (
        <>
          {camera?.mount && !lenses.length && allLenses.length > 0 && (
            <p className="hint">No lenses with mount {camera.mount} yet. Set the mount on your lenses under <Link to="/gear">Gear</Link>.</p>
          )}
          {/* key resets the form to the new draft after each save */}
          <FrameForm key={`new-${nextNumber}`} frame={draft} lenses={lenses} camera={camera} isNew />
          <button className="link" onClick={() => mark('finished_at')}>
            Mark roll as finished
          </button>
        </>
      ) : (
        !roll.developed_at && (
          <button className="primary" onClick={() => mark('developed_at')}>
            Mark as developed today
          </button>
        )
      )}

      <section>
        <h2>
          Frames <span className="muted">{nextNumber - 1}{roll.exposures ? ` / ${roll.exposures}` : ''}</span>
        </h2>
        {!frames.length && <p className="empty">No frames logged yet.</p>}
        <ul className="list">
          {withGaps(frames).reverse().map((f) =>
            'gap' in f ? (
              <li key={`gap-${f.from}`} className="gap">
                {f.from === f.to ? `Frame ${f.from}` : `Frames ${f.from}–${f.to}`} not logged
              </li>
            ) : f.skipped ? (
              <li key={f.id}>
                <Link to={`/rolls/${roll.id}/frames/${f.id}`} className="row skipped">
                  <div className="frame-no">{f.number}</div>
                  <div className="grow">Skipped</div>
                </Link>
              </li>
            ) : (
              <li key={f.id}>
                <Link to={`/rolls/${roll.id}/frames/${f.id}`} className="row">
                  <div className="frame-no">{f.number}</div>
                  <div className="grow">
                    <div className="title">
                      {[f.aperture && `f/${f.aperture}`, f.shutter, f.exposure_comp && `${f.exposure_comp} EV`]
                        .filter(Boolean)
                        .join('  ·  ') || <span className="muted">—</span>}
                    </div>
                    <div className="muted small">
                      {[f.lens && lensById.get(f.lens)?.name, formatDateTime(f.taken_at), hasLocation(f) && '📍']
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    {f.notes && <div className="small">{f.notes}</div>}
                  </div>
                </Link>
              </li>
            ),
          )}
        </ul>
      </section>
    </>
  )
}
