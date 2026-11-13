import { FLASH_POWERS } from '../lib'

interface Props {
  gn: number
  iso: number
  apertures: string[]
  aperture?: string
  power?: string
  onPick: (aperture: string, power: string) => void
}

const fraction = (p: string) => {
  const [a, b] = p.split('/').map(Number)
  return b ? a / b : a
}

const meters = (d: number) => (d >= 10 ? d.toFixed(0) : d.toFixed(1))

// Subject distance for each aperture and manual power: GN (ISO 100, meters)
// scales with the square root of both film speed and flash output.
export function FlashTable({ gn, iso, apertures, aperture, power, onPick }: Props) {
  // f/1.8 to f/16 so the table fits a phone screen at a readable size.
  const stops = apertures.filter((a) => parseFloat(a) > 1.4 && parseFloat(a) <= 16)
  const isoGn = gn * Math.sqrt(iso / 100)

  return (
    <fieldset className="flash-table">
      <legend>
        Distance in m · GN {gn} at ISO {iso} = {Math.round(isoGn)}
      </legend>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th />
              {stops.map((a) => (
                <th key={a} className={a === aperture ? 'on' : ''}>
                  f/{a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FLASH_POWERS.map((p) => (
              <tr key={p}>
                <th className={p === power ? 'on' : ''}>{p}</th>
                {stops.map((a) => (
                  <td key={a} className={a === aperture && p === power ? 'on' : a === aperture || p === power ? 'cross' : ''}>
                    <button type="button" onClick={() => onPick(a, p)}>
                      {meters((isoGn * Math.sqrt(fraction(p))) / parseFloat(a))}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </fieldset>
  )
}
