import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  STATUS_LABEL,
  TILE_STATUSES,
  nextTileStatus,
  type TileStatus,
} from '../domain/types.ts'

function Icon({
  children,
  fill = 'none',
  className,
}: {
  children: ReactNode
  fill?: string
  className?: string
}) {
  return (
    <svg
      className={className}
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

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="btn icon-ghost"
      aria-label="Close"
      title="Close"
      onClick={onClick}
    >
      <CloseIcon />
    </button>
  )
}

export function StarIcon({ filled }: { filled: boolean }) {
  return (
    <Icon fill={filled ? 'currentColor' : 'none'}>
      <path d="m12 3.2 2.47 5.01 5.53.8-4 3.9.94 5.5L12 16.9 7.06 18.4l.94-5.5-4-3.9 5.53-.8z" />
    </Icon>
  )
}

export function PriorityIcon({ filled }: { filled: boolean }) {
  return (
    <Icon fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 19V6" />
      <path d="m6 11 6-6 6 6" />
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

function LockGlyph() {
  return (
    <>
      <path className="status-shackle" d="M8 11V8a4 4 0 0 1 8 0v3" />
      <rect
        className="status-body"
        x="4"
        y="11"
        width="16"
        height="10"
        rx="2"
      />
    </>
  )
}

function UnlockGlyph() {
  return (
    <>
      <path className="status-shackle" d="M8 11V8a4 4 0 0 1 7.6-1.1" />
      <rect
        className="status-body"
        x="4"
        y="11"
        width="16"
        height="10"
        rx="2"
      />
    </>
  )
}

function UnseenGlyph() {
  return (
    <>
      <path className="status-slash" d="M2.2 3.2 20.8 21.8" />
      <path
        className="status-eye"
        d="M6.6 6.7C4.5 8.2 3 10.2 2.2 12c1.4 2.8 5.3 7 9.8 7 1.6 0 3.1-.4 4.4-1.1"
      />
      <path
        className="status-eye"
        d="M10.6 6.2A9.5 9.5 0 0 1 12 6c4.8 0 8.2 4.2 9.8 6-.6 1-1.5 2.2-2.7 3.2"
      />
      <circle className="status-eye" cx="12" cy="12" r="3" />
    </>
  )
}

export function LockIcon() {
  return (
    <Icon>
      <LockGlyph />
    </Icon>
  )
}

export function UnseenIcon() {
  return (
    <Icon>
      <UnseenGlyph />
    </Icon>
  )
}

function ChevronDownIcon() {
  return (
    <Icon>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  )
}

export function StatusIcon({
  status,
  play = false,
}: {
  status: TileStatus
  play?: boolean
}) {
  return (
    <span
      className={[
        'status-glyph',
        `status-glyph-${status}`,
        play ? 'status-glyph-play' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon className="status-icon-svg">
        {status === 'unseen' ? <UnseenGlyph /> : null}
        {status === 'locked' ? <LockGlyph /> : null}
        {status === 'unlocked' ? <UnlockGlyph /> : null}
        {status === 'completed' ? (
          <path className="status-check" d="M20 7 10 17l-5-5" />
        ) : null}
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
  const skipPlay = useRef(true)
  const [playId, setPlayId] = useState(0)

  useEffect(() => {
    if (skipPlay.current) {
      skipPlay.current = false
      return
    }
    setPlayId((id) => id + 1)
  }, [value])

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

  const next = nextTileStatus(value)

  return (
    <div className="status-picker" ref={rootRef}>
      <div className="status-picker-split">
        <button
          type="button"
          className="btn icon-ghost status-picker-advance"
          data-status={value}
          aria-label={
            next === value
              ? `Status: ${STATUS_LABEL[value]}`
              : `Advance status to ${STATUS_LABEL[next]}`
          }
          title={
            next === value
              ? STATUS_LABEL[value]
              : `${STATUS_LABEL[value]} → ${STATUS_LABEL[next]}`
          }
          onClick={() => {
            if (next === value) return
            onChange(next)
            onOpenChange(false)
          }}
        >
          {playId > 0 ? (
            <span
              key={playId}
              className={`status-flash status-flash-${value}`}
              aria-hidden="true"
            />
          ) : null}
          <StatusIcon
            key={`${value}-${playId}`}
            status={value}
            play={playId > 0}
          />
        </button>
        <button
          type="button"
          className="btn icon-ghost status-picker-toggle"
          aria-label="Choose status"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          title="Choose status"
          onClick={() => onOpenChange(!open)}
        >
          <ChevronDownIcon />
        </button>
      </div>
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
