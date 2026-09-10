import { useEffect, useId, useMemo, useState } from 'react'
import { ALL_KINDS, filterTilesByKind } from '../data/osrsCatalog.ts'
import { searchTiles } from '../domain/search.ts'
import { type Tile, type TileStatus } from '../domain/types.ts'
import { FilterBar } from './FilterBar.tsx'
import { CloseButton, StarButton, StatusPicker } from './StatusPicker.tsx'
import { TileUnlockMarks } from './TileUnlockMarks.tsx'

type TileFinderProps = {
  tiles: Tile[]
  paused?: boolean
  onStatusChange: (id: string, status: TileStatus) => void
  onStarChange: (id: string, starred: boolean) => void
  onOpen: (id: string) => void
  onCancel: () => void
}

export function TileFinder({
  tiles,
  paused = false,
  onStatusChange,
  onStarChange,
  onOpen,
  onCancel,
}: TileFinderProps) {
  const titleId = useId()
  const [query, setQuery] = useState('')
  const [kinds, setKinds] = useState(ALL_KINDS)
  const [openStatusId, setOpenStatusId] = useState<string | null>(null)
  const catalog = useMemo(() => filterTilesByKind(tiles, kinds), [kinds, tiles])
  const results = useMemo(() => searchTiles(catalog, query), [catalog, query])

  useEffect(() => {
    if (paused) return
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (openStatusId) {
        setOpenStatusId(null)
        return
      }
      onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, openStatusId, paused])

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
        <FilterBar
          query={query}
          onQueryChange={setQuery}
          kinds={kinds}
          onKindsChange={setKinds}
          searchPlaceholder="Search"
          searchAutoFocus
        />

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
                <StarButton
                  starred={tile.starred}
                  onChange={(starred) => onStarChange(tile.id, starred)}
                />
                <StatusPicker
                  value={tile.status}
                  open={openStatusId === tile.id}
                  onOpenChange={(open) =>
                    setOpenStatusId(open ? tile.id : null)
                  }
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
