import { useEffect, useId, useMemo, useState } from 'react'
import { wouldCreateCycle } from '../domain/graph.ts'
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
}

function tileName(tiles: Tile[], id: string): string {
  return tiles.find((candidate) => candidate.id === id)?.name ?? 'Missing'
}

export function TileForm({
  tiles,
  tile,
  error,
  onSubmit,
  onCancel,
  onDelete,
}: TileFormProps) {
  const titleId = useId()
  const [name, setName] = useState(tile?.name ?? '')
  const [status, setStatus] = useState<TileStatus>(tile?.status ?? 'locked')
  const [parentIds, setParentIds] = useState(tile?.parentIds ?? [])
  const [parentQuery, setParentQuery] = useState('')

  const parentResults = useMemo(() => {
    const pool = tiles.filter((candidate) => {
      if (candidate.id === tile?.id) return false
      if (parentIds.includes(candidate.id)) return false
      if (tile && wouldCreateCycle(tiles, tile.id, candidate.id)) return false
      return true
    })
    return searchTiles(pool, parentQuery)
  }, [parentIds, parentQuery, tile, tiles])

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
        <h2 id={titleId}>{tile ? 'Edit tile' : 'New tile'}</h2>

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
          <legend>Parents</legend>
          {parentIds.length === 0 ? (
            <p className="empty">No parents yet.</p>
          ) : (
            <ul className="parent-list">
              {parentIds.map((id) => (
                <li key={id} className="parent-row">
                  <span>{tileName(tiles, id)}</span>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() =>
                      setParentIds((current) =>
                        current.filter((item) => item !== id),
                      )
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label className="field">
            Add parent
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
            <button type="button" className="btn danger" onClick={onDelete}>
              Delete
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
