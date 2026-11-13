import type { CSSProperties, ReactNode } from 'react'
import { filmColor, filmShape, type FilmShape } from '../lib'

// Line icons on a 48 unit grid. Outlines follow the text color, lens glass
// uses the theme accent and films are filled with their color tokens.
const CAMERA_SVG: Record<string, ReactNode> = {
  slr: (
    <>
      <path d="M7 17h8l3-7h12l3 7h8a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V20a3 3 0 0 1 3-3z" />
      <circle cx="24" cy="27" r="8" />
      <circle className="glass" cx="24" cy="27" r="4.5" />
      <path d="M36 17v-3h4v3" />
    </>
  ),
  rangefinder: (
    <>
      <rect x="4" y="14" width="40" height="24" rx="3" />
      <rect x="8" y="18" width="7" height="5" rx="1" />
      <rect x="33" y="18" width="7" height="5" rx="1" />
      <circle cx="24" cy="28" r="7" />
      <circle className="glass" cx="24" cy="28" r="3.5" />
      <path d="M29 14v-3h5v3M8 14v-2h5v2" />
    </>
  ),
  tlr: (
    <>
      <rect x="12" y="8" width="24" height="36" rx="3" />
      <path d="M14 8l2-4h16l2 4M12 25.5h24M36 14h3v6h-3" />
      <circle cx="24" cy="17" r="5.5" />
      <circle className="glass" cx="24" cy="17" r="2.5" />
      <circle cx="24" cy="34" r="6.5" />
      <circle className="glass" cx="24" cy="34" r="3" />
    </>
  ),
  medium: (
    <>
      <rect x="9" y="14" width="30" height="28" rx="2.5" />
      <path d="M12 14V8h24v6M15 11h18M39 23h3v8h-3" />
      <circle cx="24" cy="28" r="10" />
      <circle cx="24" cy="28" r="6.5" />
      <circle className="glass" cx="24" cy="28" r="3.5" />
    </>
  ),
  compact: (
    <>
      <rect x="4" y="15" width="40" height="22" rx="7" />
      <circle cx="24" cy="26" r="6.5" />
      <circle className="glass" cx="24" cy="26" r="3" />
      <rect x="9" y="19" width="6" height="3.5" rx="1" />
      <rect x="34" y="19" width="5" height="3.5" rx="1" />
      <path d="M33 15v-2.5h5V15" />
    </>
  ),
  instant: (
    <>
      <rect x="6" y="5" width="36" height="29" rx="4" />
      <circle cx="18" cy="18" r="6.5" />
      <circle className="glass" cx="18" cy="18" r="3" />
      <rect x="28" y="11" width="9" height="5" rx="1" />
      <rect x="29" y="20" width="7" height="4" rx="1" />
      <path d="M14 34v9h20v-9" />
      <rect className="glass" x="17" y="34" width="14" height="5" stroke="none" />
    </>
  ),
  large: (
    <>
      <path d="M6 42h36M14 34v8M34 39v3" />
      <rect x="31" y="9" width="6" height="30" rx="1" />
      <rect x="12" y="16" width="4" height="18" rx="1" />
      <rect x="6" y="21" width="6" height="8" rx="1" />
      <rect className="glass" x="7.5" y="22.5" width="3" height="5" stroke="none" />
      <path d="M16 17l15-6M16 33l15 6M20 15.4v19.2M24 13.8v22.4M28 12.2v25.6" />
    </>
  ),
}

const LENS_SVG = (
  <>
    <rect x="6" y="15" width="6" height="18" rx="1" />
    <rect x="12" y="11" width="24" height="26" rx="2" />
    <path d="M18 11v26M22 11v26M26 11v26" />
    <path className="glass" d="M36 13c4.5 3 4.5 19 0 22z" />
  </>
)

const FLASH_SVG = (
  <>
    <rect x="13" y="4" width="22" height="13" rx="2" />
    <rect className="glass" x="16" y="7" width="16" height="7" rx="1" stroke="none" />
    <path d="M17 17l-2 6h18l-2-6" />
    <rect x="15" y="23" width="18" height="15" rx="2" />
    <path d="M25.5 26l-4 6h5l-4 5" />
    <path d="M18 38v3h12v-3M16 44h16" />
  </>
)

const FILM_SVG: Record<FilmShape, ReactNode> = {
  '35mm': (
    <>
      <rect className="f-body" x="13" y="12" width="20" height="26" />
      <rect className="f-band" x="13" y="19" width="20" height="10" stroke="none" />
      <path d="M13 19h20M13 29h20" />
      <rect x="20" y="3" width="6" height="5" rx="1" />
      <rect x="11" y="8" width="24" height="4" rx="1.5" />
      <rect x="11" y="38" width="24" height="4" rx="1.5" />
      <path d="M33 15h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />
      <rect className="solid" x="36" y="18" width="2.4" height="2.4" rx="0.5" />
      <rect className="solid" x="36" y="23" width="2.4" height="2.4" rx="0.5" />
      <rect className="solid" x="36" y="28" width="2.4" height="2.4" rx="0.5" />
    </>
  ),
  '120': (
    <>
      <rect className="f-body" x="12" y="12" width="24" height="24" />
      <rect className="f-band" x="12" y="20" width="24" height="7" stroke="none" />
      <path d="M12 20h24M12 27h24" />
      <rect x="8" y="8" width="32" height="4" rx="1.5" />
      <rect x="8" y="36" width="32" height="4" rx="1.5" />
      <path d="M36 15l6 2v14l-6 2" />
    </>
  ),
  sheet: (
    <>
      <rect x="8" y="9" width="32" height="35" rx="2" />
      <rect className="f-body" x="13" y="3" width="22" height="7" rx="1.5" />
      <rect className="f-band" x="13" y="15" width="22" height="24" rx="1" />
      <path d="M8 13h32" />
    </>
  ),
  instant: (
    <>
      <rect x="9" y="4" width="30" height="40" rx="2" />
      <rect className="f-body" x="13" y="8" width="22" height="24" />
      <path d="M15 38c2-1.5 4 1.5 6 0s4 1.5 6 0" />
    </>
  ),
}

function Svg({ size, style, children }: { size: number; style?: CSSProperties; children: ReactNode }) {
  // Thicker strokes at small sizes keep the icons legible.
  const weight = size <= 24 ? 'sm' : size >= 64 ? 'lg' : ''
  return (
    <svg className={`icon ${weight}`} viewBox="0 0 48 48" width={size} height={size} style={style} aria-hidden="true">
      {children}
    </svg>
  )
}

export function CameraIcon({ type, size = 30 }: { type?: string; size?: number }) {
  return <Svg size={size}>{CAMERA_SVG[type ?? ''] ?? CAMERA_SVG.slr}</Svg>
}

export function LensIcon({ size = 30 }: { size?: number }) {
  return <Svg size={size}>{LENS_SVG}</Svg>
}

export function FlashIcon({ size = 30 }: { size?: number }) {
  return <Svg size={size}>{FLASH_SVG}</Svg>
}

export function FilmIcon({
  format,
  color,
  kind,
  size = 30,
}: {
  format?: string
  color?: string
  kind?: string
  size?: number
}) {
  const c = filmColor(color, kind)
  const style = { '--film': `var(--film-${c})`, '--film-band': `var(--film-${c}-band)` } as CSSProperties
  return (
    <Svg size={size} style={style}>
      {FILM_SVG[filmShape(format)]}
    </Svg>
  )
}
