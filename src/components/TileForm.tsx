import { useEffect, useId, useMemo, useState } from 'react'
import { formatGp, tileGp } from '../data/questReqs.ts'
import { requirementViews } from '../data/requirementViews.ts'
import { tileWikiUrl } from '../data/wiki.ts'
import { STATUS_LABEL, type Tile, type TileStatus } from '../domain/types.ts'
import { CloseIcon, ExternalLinkIcon, StatusPicker } from './StatusPicker.tsx'

type TileFormProps = {
  tiles: Tile[]
  tile: Tile
  onCancel: () => void
  onOpenTile?: (id: string) => void
  onStatusChange?: (status: TileStatus) => void
}

export function TileForm({
  tiles,
  tile,
  onCancel,
  onOpenTile,
  onStatusChange,
}: TileFormProps) {
  const titleId = useId()
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const wikiUrl = tileWikiUrl(tile.id)
  const gp = tileGp(tile.id)
  const reqViews = useMemo(() => requirementViews(tile, tiles), [tile, tiles])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (statusMenuOpen) {
        setStatusMenuOpen(false)
        return
      }
      onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, statusMenuOpen])

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal tile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-title-row">
          <h2 id={titleId}>{tile.name}</h2>
          <div className="modal-title-actions">
            <StatusPicker
              value={tile.status}
              open={statusMenuOpen}
              onOpenChange={setStatusMenuOpen}
              onChange={(status) => onStatusChange?.(status)}
            />
            {wikiUrl ? (
              <a
                className="btn icon-ghost"
                href={wikiUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Open wiki"
                title="Wiki"
              >
                <ExternalLinkIcon />
              </a>
            ) : null}
            <button
              type="button"
              className="btn icon-ghost"
              aria-label="Close"
              title="Close"
              onClick={onCancel}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {gp !== undefined ? (
          <p className="tile-gold">Gold {formatGp(gp)}</p>
        ) : null}

        <fieldset className="rel-fieldset">
          <legend>Requirements</legend>
          {reqViews.length === 0 ? (
            <p className="empty">No requirements.</p>
          ) : (
            <ul className="parent-list">
              {reqViews.map((row) => {
                const parent = tiles.find(
                  (candidate) => candidate.id === row.parentId,
                )
                const parentStatus = parent?.status ?? 'unseen'
                const open = Boolean(parent && onOpenTile)
                const className = `req-name req-${parentStatus}`
                const label = `${row.title}, ${STATUS_LABEL[parentStatus]}`
                return (
                  <li key={row.key} className="parent-row">
                    {open ? (
                      <button
                        type="button"
                        className={className}
                        title={label}
                        onClick={() => onOpenTile?.(row.parentId)}
                      >
                        {row.title}
                      </button>
                    ) : (
                      <span className={className} title={label}>
                        {row.title}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </fieldset>
      </div>
    </div>
  )
}
