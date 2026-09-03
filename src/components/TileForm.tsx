import { useEffect, useId, useMemo, useState } from 'react'
import { formatGp, tileGp } from '../data/questReqs.ts'
import { requirementViews } from '../data/requirementViews.ts'
import { tileWikiUrl } from '../data/wiki.ts'
import { wouldCreateCycle } from '../domain/graph.ts'
import { parentIsSatisfied } from '../domain/readiness.ts'
import { searchTiles } from '../domain/search.ts'
import {
  isTileStatus,
  STATUS_LABEL,
  TILE_STATUSES,
  type Tile,
  type TileInput,
  type TileStatus,
} from '../domain/types.ts'

type TileFormProps = {
  tiles: Tile[]
  tile?: Tile
  error: string | null
  onSubmit: (input: TileInput) => void
  onCancel: () => void
  onDelete?: () => void
  deleteLabel?: string
  deleteDanger?: boolean
  onOpenTile?: (id: string) => void
}

function parentStatusText(parent: Tile | undefined, blocking: boolean): string {
  if (!parent) return 'Missing · blocking'
  return `${STATUS_LABEL[parent.status]}${blocking ? ' · blocking' : ''}`
}

export function TileForm({
  tiles,
  tile,
  error,
  onSubmit,
  onCancel,
  onDelete,
  deleteLabel = 'Delete',
  deleteDanger = true,
  onOpenTile,
}: TileFormProps) {
  const titleId = useId()
  const [name, setName] = useState(tile?.name ?? '')
  const [status, setStatus] = useState<TileStatus>(tile?.status ?? 'locked')
  const [parentIds, setParentIds] = useState(tile?.parentIds ?? [])
  const [parentQuery, setParentQuery] = useState('')
  const wikiUrl = tile ? tileWikiUrl(tile.id) : undefined
  const gp = tile ? tileGp(tile.id) : undefined

  const parentResults = useMemo(() => {
    const pool = tiles.filter((candidate) => {
      if (candidate.id === tile?.id) return false
      if (parentIds.includes(candidate.id)) return false
      if (tile && wouldCreateCycle(tiles, tile.id, candidate.id)) return false
      return true
    })
    return searchTiles(pool, parentQuery)
  }, [parentIds, parentQuery, tile, tiles])

  const reqViews = useMemo(() => {
    const current: Tile = tile
      ? { ...tile, parentIds }
      : { id: '', name, status, parentIds }
    return requirementViews(current, tiles)
  }, [name, parentIds, status, tile, tiles])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  function addParent(id: string) {
    setParentIds((current) =>
      current.includes(id) ? current : [...current, id],
    )
    setParentQuery('')
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit({ name, status, parentIds })
        }}
      >
        <div className="modal-title-row">
          <h2 id={titleId}>{tile ? tile.name : 'New tile'}</h2>
          {wikiUrl ? (
            <a
              className="wiki-link"
              href={wikiUrl}
              target="_blank"
              rel="noreferrer"
            >
              Wiki
            </a>
          ) : null}
        </div>

        {gp !== undefined ? (
          <p className="tile-gold">Gold {formatGp(gp)}</p>
        ) : null}

        <label className="field">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
          />
        </label>

        <label className="field">
          Status
          <select
            value={status}
            onChange={(event) => {
              const value = event.target.value
              if (isTileStatus(value)) setStatus(value)
            }}
          >
            {TILE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABEL[value]}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="rel-fieldset">
          <legend>Required</legend>
          {reqViews.length === 0 ? (
            <p className="empty">No requirements.</p>
          ) : (
            <ul className="parent-list">
              {reqViews.map((row) => {
                const parent = tiles.find(
                  (candidate) => candidate.id === row.parentId,
                )
                const blocking = !parentIsSatisfied(parent?.status)
                const statusText = parentStatusText(parent, blocking)
                const open = Boolean(parent && onOpenTile)
                return (
                  <li key={row.key} className="parent-row">
                    <div className="req-main">
                      {row.coverLabel ? (
                        <>
                          <span className="req-title">{row.title}</span>
                          <span
                            className={blocking ? 'req-blocking' : 'req-met'}
                          >
                            {open ? (
                              <button
                                type="button"
                                className="req-cover"
                                onClick={() => onOpenTile?.(row.parentId)}
                              >
                                {row.coverLabel}
                              </button>
                            ) : (
                              row.coverLabel
                            )}
                            {` · ${statusText}`}
                          </span>
                        </>
                      ) : (
                        <>
                          {open ? (
                            <button
                              type="button"
                              className="req-name"
                              onClick={() => onOpenTile?.(row.parentId)}
                            >
                              {row.title}
                            </button>
                          ) : (
                            <span className="req-title">{row.title}</span>
                          )}
                          <span
                            className={blocking ? 'req-blocking' : 'req-met'}
                          >
                            {statusText}
                          </span>
                        </>
                      )}
                    </div>
                    {row.catalog ? null : (
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() =>
                          setParentIds((current) =>
                            current.filter((item) => item !== row.parentId),
                          )
                        }
                      >
                        Remove
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          <label className="field">
            Add requirement
            <input
              value={parentQuery}
              onChange={(event) => setParentQuery(event.target.value)}
              placeholder="Agility 11–20"
            />
          </label>

          {parentQuery.trim() ? (
            parentResults.length === 0 ? (
              <p className="empty">No matching tiles.</p>
            ) : (
              <ul className="search-results">
                {parentResults.map((candidate) => (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      className="search-result"
                      onClick={() => addParent(candidate.id)}
                    >
                      <span className="search-result-top">
                        <strong>{candidate.name}</strong>
                        <span>{STATUS_LABEL[candidate.status]}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </fieldset>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="modal-actions">
          {onDelete ? (
            <button
              type="button"
              className={deleteDanger ? 'btn danger' : 'btn'}
              onClick={onDelete}
            >
              {deleteLabel}
            </button>
          ) : (
            <span />
          )}
          <div className="modal-actions-end">
            <button type="button" className="btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn primary">
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
