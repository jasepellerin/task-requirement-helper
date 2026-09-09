import { useId, useRef } from 'react'
import { CloseIcon } from './StatusPicker.tsx'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  autoFocus?: boolean
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Filter tiles',
  label,
  autoFocus,
}: SearchBarProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  function clear() {
    onChange('')
    inputRef.current?.focus()
  }

  const input = (
    <div className="search-bar">
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label ? undefined : placeholder}
        autoFocus={autoFocus}
      />
      {value ? (
        <button
          type="button"
          className="btn icon-ghost search-bar-clear"
          aria-label="Clear search"
          title="Clear"
          onMouseDown={(event) => event.preventDefault()}
          onClick={clear}
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  )

  if (!label) return input

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      {input}
    </div>
  )
}
