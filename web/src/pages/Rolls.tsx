import { Link } from 'react-router-dom'
import { CameraIcon, FilmIcon } from '../components/Icons'
import type { Roll } from '../db'
import { byId, rollTitle, useCameras, useFilms, useFrameCounts, useRolls } from '../hooks'
import { formatDate } from '../lib'

const GROUPS: { title: string; match: (r: Roll) => boolean }[] = [
  { title: 'In camera', match: (r) => !r.finished_at },
  { title: 'Waiting for development', match: (r) => !!r.finished_at && !r.developed_at },
  { title: 'Developed', match: (r) => !!r.developed_at },
]

export function Rolls() {
  const rolls = useRolls()
  const films = byId(useFilms())
  const cameras = byId(useCameras())
  const counts = useFrameCounts()

  if (!rolls) return null

  const sorted = [...rolls].sort((a, b) => (b.loaded_at ?? '').localeCompare(a.loaded_at ?? ''))

  return (
    <>
      <div className="page-head">
        <h1>Rolls</h1>
        <Link to="/rolls/new" className="button primary">
          Load roll
        </Link>
      </div>

      {!rolls.length && (
        <p className="empty">
          No rolls yet. Add your cameras and films under <Link to="/gear">Gear</Link>, then load a roll.
        </p>
      )}

      {GROUPS.map(({ title, match }) => {
        const group = sorted.filter(match)
        if (!group.length) return null
        return (
          <section key={title}>
            <h2>{title}</h2>
            <ul className="list">
              {group.map((roll) => {
                const film = roll.film ? films.get(roll.film) : undefined
                const camera = roll.camera ? cameras.get(roll.camera) : undefined
                const iso = roll.shot_iso || film?.iso
                return (
                  <li key={roll.id}>
                    <Link to={`/rolls/${roll.id}`} className="row">
                      <div className="stack">
                        <div className="thumb">
                          <FilmIcon format={film?.format} color={film?.color} kind={film?.kind} />
                        </div>
                        {camera && (
                          <div className="badge">
                            <CameraIcon type={camera.type} size={16} />
                          </div>
                        )}
                      </div>
                      <div className="grow">
                        <div className="title">{rollTitle(roll, film)}</div>
                        <div className="muted small">
                          {[camera?.name, iso && `ISO ${iso}`, formatDate(roll.loaded_at)]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </div>
                      <div className="count">
                        {counts.get(roll.id) ?? 0}
                        {roll.exposures ? `/${roll.exposures}` : ''}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </>
  )
}
