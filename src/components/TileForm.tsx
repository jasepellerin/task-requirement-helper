import { useEffect, useId, useMemo, useState } from 'react'
import { formatGp, tileGp } from '../data/questReqs.ts'
import { requirementViews } from '../data/requirementViews.ts'
import { tileWikiUrl } from '../data/wiki.ts'
import { wouldCreateCycle } from '../domain/graph.ts'
import { parentIsSatisfied } from '../domain/readiness.ts'
import { searchTiles } from '../domain/search.ts'
import {
  STATUS_LABEL,
  type Tile,
  type TileInput,
  type TileStatus,
} from '../domain/types.ts'
import { PencilIcon, StatusPicker } from './StatusPicker.tsx'

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
  onStatusChange?: (status: TileStatus) => void
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
  onStatusChange,
}: TileFormProps) {
  const titleId = useId()
  const [editing, setEditing] = useState(!tile)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
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
      if (event.key !== 'Escape') return
      if (statusMenuOpen) {
        setStatusMenuOpen(false)
        return
      }
      if (editing && tile) {
        setName(tile.name)
        setParentIds(tile.parentIds)
        setParentQuery('')
        setEditing(false)
        return
      }
      onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, onCancel, statusMenuOpen, tile])

  function addParent(id: string) {
    setParentIds((current) =>
      current.includes(id) ? current : [...current, id],
    )
    setParentQuery('')
  }

  function revertEdit() {
    setName(tile?.name ?? '')
    setParentIds(tile?.parentIds ?? [])
    setParentQuery('')
    setEditing(false)
  }

  function changeStatus(next: TileStatus) {
    setStatus(next)
    onStatusChange?.(next)
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
          if (!editing) return
          onSubmit({ name, status, parentIds })
        }}
      >
        <div className="modal-title-row">
          {editing ? (
            <input
              id={titleId}
              className="modal-title-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              required
              placeholder="Tile name"
            />
          ) : (
            <h2 id={titleId}>{name}</h2>
          )}
          <div className="modal-title-actions">
            <StatusPicker
              value={status}
              open={statusMenuOpen}
              onOpenChange={setStatusMenuOpen}
              onChange={changeStatus}
            />
            {tile && !editing ? (
              <button
                type="button"
                className="btn icon-ghost"
                aria-label="Edit tile"
                title="Edit"
                onClick={() => setEditing(true)}
              >
                <PencilIcon />
              </button>
            ) : null}
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
        </div>

        {gp !== undefined ? (
          <p className="tile-gold">Gold {formatGp(gp)}</p>
        ) : null}

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
                    {editing && !row.catalog ? (
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
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}

          {editing ? (
            <>
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
            </>
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
            {editing ? (
              <>
                <button
                  type="button"
                  className="btn"
                  onClick={tile ? revertEdit : onCancel}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Save
                </button>
              </>
            ) : (
              <button type="button" className="btn" onClick={onCancel}>
                Close
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
