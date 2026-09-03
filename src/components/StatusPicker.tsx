import { useEffect, useId, useRef, type ReactNode } from 'react'
import {
  STATUS_LABEL,
  TILE_STATUSES,
  type TileStatus,
} from '../domain/types.ts'

function Icon({
  children,
  fill = 'none',
}: {
  children: ReactNode
  fill?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill={fill}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function ExternalLinkIcon() {
  return (
    <Icon>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </Icon>
  )
}

export function CloseIcon() {
  return (
    <Icon>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  )
}

export function StarIcon({ filled }: { filled: boolean }) {
  return (
    <Icon fill={filled ? 'currentColor' : 'none'}>
      <path d="m12 3.2 2.47 5.01 5.53.8-4 3.9.94 5.5L12 16.9 7.06 18.4l.94-5.5-4-3.9 5.53-.8z" />
    </Icon>
  )
}

export function StarButton({
  starred,
  onChange,
}: {
  starred: boolean
  onChange: (starred: boolean) => void
}) {
  return (
    <button
      type="button"
      className="btn icon-ghost star-btn"
      aria-label={starred ? 'Unstar' : 'Star'}
      aria-pressed={starred}
      title={starred ? 'Unstar' : 'Star'}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onChange(!starred)}
    >
      <StarIcon filled={starred} />
    </button>
  )
}

export function StatusIcon({ status }: { status: TileStatus }) {
  return (
    <span className={`status-glyph status-glyph-${status}`}>
      <Icon>
        {status === 'unseen' ? (
          <>
            <path d="M2.2 3.2 20.8 21.8" />
            <path d="M6.6 6.7C4.5 8.2 3 10.2 2.2 12c1.4 2.8 5.3 7 9.8 7 1.6 0 3.1-.4 4.4-1.1" />
            <path d="M10.6 6.2A9.5 9.5 0 0 1 12 6c4.8 0 8.2 4.2 9.8 6-.6 1-1.5 2.2-2.7 3.2" />
            <circle cx="12" cy="12" r="3" />
          </>
        ) : null}
        {status === 'locked' ? (
          <>
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </>
        ) : null}
        {status === 'unlocked' ? (
          <>
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 7.6-1.1" />
          </>
        ) : null}
        {status === 'completed' ? <path d="M20 7 10 17l-5-5" /> : null}
      </Icon>
    </span>
  )
}

type StatusButtonsProps = {
  value: TileStatus
  name: string
  onChange: (status: TileStatus) => void
}

export function StatusButtons({ value, name, onChange }: StatusButtonsProps) {
  return (
    <div
      className="status-buttons"
      role="radiogroup"
      aria-label={`${name} status`}
    >
      {TILE_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          className="btn icon-ghost"
          role="radio"
          aria-checked={status === value}
          aria-label={STATUS_LABEL[status]}
          title={STATUS_LABEL[status]}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onChange(status)}
        >
          <StatusIcon status={status} />
        </button>
      ))}
    </div>
  )
}

type StatusPickerProps = {
  value: TileStatus
  open: boolean
  onOpenChange: (open: boolean) => void
  onChange: (status: TileStatus) => void
}

export function StatusPicker({
  value,
  open,
  onOpenChange,
  onChange,
}: StatusPickerProps) {
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open, onOpenChange])

  return (
    <div className="status-picker" ref={rootRef}>
      <button
        type="button"
        className="btn icon-ghost"
        aria-label={`Status: ${STATUS_LABEL[value]}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title={STATUS_LABEL[value]}
        onClick={() => onOpenChange(!open)}
      >
        <StatusIcon status={value} />
      </button>
      {open ? (
        <div className="status-menu" id={menuId} role="menu">
          {TILE_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              className="status-menu-item"
              role="menuitemradio"
              aria-checked={status === value}
              onClick={() => {
                onChange(status)
                onOpenChange(false)
              }}
            >
              <StatusIcon status={status} />
              {STATUS_LABEL[status]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
