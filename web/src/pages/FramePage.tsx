import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { FrameForm } from '../components/FrameForm'
import { getDb, remove } from '../db'
import { lensesForCamera, useCameras, useLenses, useRoll } from '../hooks'

export function FramePage() {
  const { id, frameId } = useParams()
  const navigate = useNavigate()
  const allLenses = useLenses()
  const cameras = useCameras()
  const roll = useRoll(id)
  // FrameForm copies this into its own state once, so syncs don't reset edits.
  const frame = useLiveQuery(async () => (frameId ? ((await getDb().frames.get(frameId)) ?? null) : null), [frameId])

  if (frame === undefined || roll === undefined) return null
  if (frame === null || frame.deleted) return <p className="empty">Frame not found.</p>

  const camera = cameras.find((c) => c.id === roll?.camera)
  const lenses = lensesForCamera(allLenses, camera, frame.lens)

  const back = () => navigate(`/rolls/${id}`, { replace: true })

  const onDelete = async () => {
    if (!window.confirm(`Delete frame ${frame.number}?`)) return
    await remove('frames', frame.id)
    back()
  }

  return (
    <>
      <h1>Frame {frame.number}</h1>
      <FrameForm key={frame.id} frame={frame} lenses={lenses} camera={camera} isNew={false} onSaved={back}>
        <button type="button" onClick={back}>
          Cancel
        </button>
        <button type="button" className="danger" onClick={onDelete}>
          Delete
        </button>
      </FrameForm>
    </>
  )
}
