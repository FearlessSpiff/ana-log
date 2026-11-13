import type { Camera, Lens } from './db'

export const APERTURES =['1', '1.2', '1.4', '1.8', '2', '2.8', '3.5', '4', '5.6', '8', '11', '16', '22', '32']

export const SHUTTERS = [
  'B', '30s', '15s', '8s', '4s', '2s', '1s', '1/2', '1/4', '1/8', '1/15', '1/30',
  '1/60', '1/125', '1/250', '1/500', '1/1000', '1/2000', '1/4000',
]

const cleanAperture = (a?: string) => (a ?? '').trim().replace(/^f\/?/i, '')

// Full stops between the lens's widest and smallest aperture. Odd end points
// such as f/1.7 or f/4.5 are offered as well.
export function apertureOptions(lens?: Lens): string[] {
  const wide = cleanAperture(lens?.max_aperture)
  const narrow = cleanAperture(lens?.min_aperture)
  const max = parseFloat(wide)
  const min = parseFloat(narrow)
  if (!max && !min) return APERTURES
  const options = APERTURES.filter((a) => (!max || +a >= max) && (!min || +a <= min))
  if (max && !options.includes(wide)) options.unshift(wide)
  if (min && !options.includes(narrow)) options.push(narrow)
  return options
}

// Accepts "1/125", "2s", '2"' and bare dial numbers, where "125" means 1/125.
export function shutterSeconds(s: string): number {
  const v = s.trim()
  if (/s$|"$/.test(v)) return parseFloat(v)
  if (v.includes('/')) {
    const [a, b] = v.split('/').map(Number)
    return a / b
  }
  return 1 / Number(v)
}

// Speeds between the camera's slowest and fastest setting, plus B if it has bulb.
export function shutterOptions(camera?: Camera): string[] {
  const slow = camera?.slowest_shutter?.trim()
  const fast = camera?.fastest_shutter?.trim()
  if (!slow && !fast && !camera?.bulb) return SHUTTERS
  const min = fast ? shutterSeconds(fast) : 0
  const max = slow ? shutterSeconds(slow) : Infinity
  const options = SHUTTERS.filter((s) => s !== 'B' && shutterSeconds(s) >= min && shutterSeconds(s) <= max)
  if (camera?.bulb) options.unshift('B')
  return options
}

export function describeRange(from?: string, to?: string, prefix = ''): string {
  const a = from?.trim()
  const b = to?.trim()
  if (a && b) return `${prefix}${a}–${b}`
  return a ? `${prefix}${a}` : b ? `${prefix}${b}` : ''
}

export const EXPOSURE_COMP = ['-2', '-1.5', '-1', '-0.5', '+0.5', '+1', '+1.5', '+2']

// Manual flash output as a fraction of full power.
export const FLASH_POWERS = ['1/1', '1/2', '1/4', '1/8', '1/16', '1/32', '1/64', '1/128']

export const FORMATS = ['35mm', '120', '4x5', '110', 'Instant']

export const MOUNTS = [
  'Canon EF', 'Canon FD', 'Contax/Yashica', 'Hasselblad V', 'Leica M', 'Leica R', 'M39', 'M42',
  'Mamiya 645', 'Mamiya RB67', 'Minolta SR', 'Nikon F', 'Olympus OM', 'Pentax 67', 'Pentax K',
]

export const CAMERA_TYPES = [
  { value: 'slr', label: 'SLR' },
  { value: 'rangefinder', label: 'Rangefinder' },
  { value: 'tlr', label: 'Twin-lens reflex' },
  { value: 'medium', label: 'Medium format' },
  { value: 'compact', label: 'Compact' },
  { value: 'instant', label: 'Instant' },
  { value: 'large', label: 'Large format' },
]

// Film colors are theme tokens (--film-<value> and --film-<value>-band in index.css).
export const FILM_COLORS = [
  { value: 'yellow', label: 'Yellow' },
  { value: 'black', label: 'Black' },
  { value: 'blue', label: 'Blue' },
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
  { value: 'silver', label: 'Silver' },
]

const KIND_COLORS: Record<string, string> = { color: 'yellow', bw: 'black', slide: 'blue' }

export function filmColor(color?: string, kind?: string): string {
  if (color && FILM_COLORS.some((c) => c.value === color)) return color
  return KIND_COLORS[kind ?? ''] ?? 'silver'
}

export type FilmShape = '35mm' | '120' | 'sheet' | 'instant'

export function filmShape(format?: string): FilmShape {
  const f = (format ?? '').toLowerCase()
  if (/4\s*x\s*5|5\s*x\s*7|8\s*x\s*10|sheet|large/.test(f)) return 'sheet'
  if (/120|220|medium|6\s*x\s*\d|645/.test(f)) return '120'
  if (/instant|polaroid|instax/.test(f)) return 'instant'
  return '35mm'
}

export const FILM_KINDS = [
  { value: 'color', label: 'Color negative' },
  { value: 'bw', label: 'Black & white' },
  { value: 'slide', label: 'Slide' },
]

export const today = () => toDateInput(new Date())

export function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// <input type="datetime-local"> works in local time without a zone.
export function toDateTimeInput(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${toDateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromDateTimeInput(value: string): string {
  return value ? new Date(value).toISOString() : ''
}

export function formatDateTime(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatDate(date?: string): string {
  if (!date) return ''
  return new Date(date + 'T00:00').toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export function hasLocation(r: { lat?: number; lng?: number }): boolean {
  return !!r.lat || !!r.lng
}

const GPS_KEY = 'ana-log:gps'

export function gpsEnabled(): boolean {
  try {
    return localStorage.getItem(GPS_KEY) === '1'
  } catch {
    return false
  }
}

export function setGpsEnabled(on: boolean) {
  try {
    localStorage.setItem(GPS_KEY, on ? '1' : '0')
  } catch {
    // Not persisted in private mode; the toggle still applies to this session.
  }
}

export const THEMES = [
  { value: 'auto', label: 'Amber (follow system)' },
  { value: 'amber-light', label: 'Amber light' },
  { value: 'amber-dark', label: 'Amber dark' },
  { value: 'dracula', label: 'Dracula' },
]

// Also read by the inline script in index.html, which applies the theme
// before the first paint.
const THEME_KEY = 'ana-log:theme'

export function getTheme(): string {
  try {
    return localStorage.getItem(THEME_KEY) || 'auto'
  } catch {
    return 'auto'
  }
}

export function setTheme(theme: string) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Not persisted in private mode; still applied for this session.
  }
  applyTheme(theme)
}

export function applyTheme(theme: string) {
  const root = document.documentElement
  if (theme === 'auto') delete root.dataset.theme
  else root.dataset.theme = theme
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim()
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
}
