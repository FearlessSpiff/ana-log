interface Props {
  label: string
  options: string[]
  value?: string
  onChange: (value: string) => void
  prefix?: string
}

// Tap-friendly single choice. Tapping the selected chip clears it; "…"
// allows values outside the list (e.g. half stops or odd shutter speeds).
export function ChipPicker({ label, options, value, onChange, prefix = '' }: Props) {
  const custom = value && !options.includes(value) ? value : null

  const askCustom = () => {
    const v = window.prompt(label, value ?? '')
    if (v !== null) onChange(v.trim())
  }

  return (
    <fieldset className="chips">
      <legend>{label}</legend>
      <div className="chip-row">
        {options.map((o) => (
          <button
            type="button"
            key={o}
            className={o === value ? 'chip on' : 'chip'}
            onClick={() => onChange(o === value ? '' : o)}
          >
            {prefix}
            {o}
          </button>
        ))}
        <button type="button" className={custom ? 'chip on' : 'chip'} onClick={askCustom}>
          {custom ? prefix + custom : '…'}
        </button>
      </div>
    </fieldset>
  )
}
