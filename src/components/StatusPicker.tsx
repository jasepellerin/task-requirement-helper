import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import {
  STATUS_LABEL,
  TILE_STATUSES,
  nextTileStatus,
  type TileStatus,
} from '../domain/types.ts'
import { ChevronDownIcon, StatusIcon } from './icons.tsx'

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
  const menuRef = useRef<HTMLDivElement>(null)
  const [playId, setPlayId] = useState(0)
  const [menuBox, setMenuBox] = useState<CSSProperties | null>(null)

  function select(status: TileStatus) {
    if (status !== value) setPlayId((id) => id + 1)
    onChange(status)
    onOpenChange(false)
  }

  useLayoutEffect(() => {
    if (!open) return
    function place() {
      const root = rootRef.current
      if (!root) return
      const rect = root.getBoundingClientRect()
      const flip = window.innerHeight - rect.bottom < 196
      setMenuBox({
        right: window.innerWidth - rect.right,
        ...(flip
          ? { bottom: window.innerHeight - rect.top + 6, top: 'auto' }
          : { top: rect.bottom + 6, bottom: 'auto' }),
      })
    }
    place()
    window.addEventListener('resize', place)
    document.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      document.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onPointer(event: PointerEvent) {
      const target = event.target as Node
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      onOpenChange(false)
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
            select(next)
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
      {open && menuBox
        ? createPortal(
            <div
              ref={menuRef}
              className="status-menu"
              id={menuId}
              role="menu"
              style={menuBox}
            >
              {TILE_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  className="status-menu-item"
                  role="menuitemradio"
                  aria-checked={status === value}
                  onClick={() => {
                    select(status)
                  }}
                >
                  <StatusIcon status={status} />
                  {STATUS_LABEL[status]}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
