import { useEffect, useId, useMemo, useState } from 'react'
import { searchTiles } from '../domain/search.ts'
import { type Tile } from '../domain/types.ts'

type TileFinderProps = {
  tiles: Tile[]
  onSelect: (tile: Tile) => void
  onCancel: () => void
}

export function TileFinder({ tiles, onSelect, onCancel }: TileFinderProps) {
  const titleId = useId()
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchTiles(tiles, query), [query, tiles])

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
                    <strong>{tile.name}</strong>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <p className="empty">Type to find a catalog tile you’ve just seen.</p>
        )}

        <div className="modal-actions">
          <span />
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
