import type { ReactNode } from 'react'
import type { TileStatus } from '../domain/types.ts'

export function Icon({
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

function RevealedGlyph() {
  return (
    <>
      <path d="M2.2 12C3.8 9.2 7.2 6 12 6s8.2 3.2 9.8 6c-1.6 2.8-5 6-9.8 6s-8.2-3.2-9.8-6Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  )
}

export function RevealedIcon() {
  return (
    <Icon>
      <RevealedGlyph />
    </Icon>
  )
}

export function ChevronDownIcon() {
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
