import { useEffect, useId, useMemo, useState } from 'react'
import { formatGp, tileGp } from '../data/questReqs.ts'
import { requirementSummary } from '../data/requirementViews.ts'
import { searchTiles } from '../domain/search.ts'
import { STATUS_LABEL, type Tile } from '../domain/types.ts'

type TileFinderProps = {
  tiles: Tile[]
  onSelect: (tile: Tile) => void
  onCreateCustom: () => void
  onCancel: () => void
}

function resultMeta(tile: Tile, tiles: Tile[]): string {
  const gp = tileGp(tile.id)
  const gold = gp !== undefined ? formatGp(gp) : null
  const parents = requirementSummary(tile, tiles)
  return gold ? `${gold} · ${parents}` : parents
}

export function TileFinder({
  tiles,
  onSelect,
  onCreateCustom,
  onCancel,
}: TileFinderProps) {
  const titleId = useId()
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchTiles(tiles, query), [tiles, query])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>Find a tile</h2>
        <label className="field">
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Agility 21–30"
            autoFocus
          />
        </label>

        {query.trim() ? (
          results.length === 0 ? (
            <p className="empty">No matching tiles.</p>
          ) : (
            <ul className="search-results">
              {results.map((tile) => (
                <li key={tile.id}>
                  <button
                    type="button"
                    className="search-result"
                    onClick={() => onSelect(tile)}
                  >
                    <span className="search-result-top">
                      <strong>{tile.name}</strong>
                      <span>{STATUS_LABEL[tile.status]}</span>
                    </span>
                    <span className="search-result-meta">
                      {resultMeta(tile, tiles)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <p className="empty">Type to find a catalog tile you’ve just seen.</p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={onCreateCustom}
          >
            Create custom tile
          </button>
        </div>
      </div>
    </div>
  )
}
