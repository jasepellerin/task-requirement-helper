import { useEffect, useId, useMemo, useState } from 'react'
import { ALL_KINDS, filterTilesByKind } from '../data/osrsCatalog.ts'
import { searchTiles } from '../domain/search.ts'
import { type Tile, type TileStatus } from '../domain/types.ts'
import { KindFilters } from './KindFilters.tsx'
import { StatusButtons } from './StatusPicker.tsx'

type TileFinderProps = {
  tiles: Tile[]
  onStatusChange: (id: string, status: TileStatus) => void
  onCancel: () => void
}

export function TileFinder({
  tiles,
  onStatusChange,
  onCancel,
}: TileFinderProps) {
  const titleId = useId()
  const [query, setQuery] = useState('')
  const [kinds, setKinds] = useState(ALL_KINDS)
  const catalog = useMemo(() => filterTilesByKind(tiles, kinds), [kinds, tiles])
  const results = useMemo(() => searchTiles(catalog, query), [catalog, query])

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
        <KindFilters kinds={kinds} onChange={setKinds} />

        {results.length === 0 ? (
          <p className="empty">No matching tiles.</p>
        ) : (
          <ul className="search-results">
            {results.map((tile) => (
              <li key={tile.id} className="search-result">
                <span className="search-result-name">{tile.name}</span>
                <StatusButtons
                  value={tile.status}
                  name={tile.name}
                  onChange={(status) => onStatusChange(tile.id, status)}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="modal-actions">
          <span />
          <button type="button" className="btn" onClick={onCancel}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
