import { useEffect, useId, useMemo, useState } from 'react'
import { ALL_KINDS, filterTilesByKind } from '../data/osrsCatalog.ts'
import { searchTiles } from '../domain/search.ts'
import { type Tile, type TileStatus } from '../domain/types.ts'
import { KindFilters } from './KindFilters.tsx'
import { CloseButton, StatusButtons } from './StatusPicker.tsx'
import { TileUnlockMarks } from './TileUnlockMarks.tsx'

type TileFinderProps = {
  tiles: Tile[]
  paused?: boolean
  onStatusChange: (id: string, status: TileStatus) => void
  onOpen: (id: string) => void
  onCancel: () => void
}

export function TileFinder({
  tiles,
  paused = false,
  onStatusChange,
  onOpen,
  onCancel,
}: TileFinderProps) {
  const titleId = useId()
  const [query, setQuery] = useState('')
  const [kinds, setKinds] = useState(ALL_KINDS)
  const catalog = useMemo(() => filterTilesByKind(tiles, kinds), [kinds, tiles])
  const results = useMemo(() => searchTiles(catalog, query), [catalog, query])

  useEffect(() => {
    if (paused) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, paused])

  if (paused) return null

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal finder-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-title-row">
          <h2 id={titleId}>Find a tile</h2>
          <div className="modal-title-actions">
            <CloseButton onClick={onCancel} />
          </div>
        </div>
        <label className="field">
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter tiles"
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
                <button
                  type="button"
                  className="search-result-name"
                  onClick={() => onOpen(tile.id)}
                >
                  <span>{tile.name}</span>
                  <TileUnlockMarks tileId={tile.id} />
                </button>
                <StatusButtons
                  value={tile.status}
                  name={tile.name}
                  onChange={(status) => onStatusChange(tile.id, status)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
