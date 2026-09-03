import {
  isTileStatus,
  STATUS_LABEL,
  type Tile,
  type TileStatus,
} from '../domain/types.ts'

type TileCardProps = {
  tile: Tile
  tiles: Tile[]
  onEdit: () => void
  onStatus: (status: TileStatus) => void
}

export function TileCard({ tile, tiles, onEdit, onStatus }: TileCardProps) {
  const parents = tile.parentIds
    .map(
      (id) => tiles.find((candidate) => candidate.id === id)?.name ?? 'Missing',
    )
    .join(', ')

  return (
    <article className="tile-card">
      <div className="tile-card-top">
        <h3>{tile.name}</h3>
        <select
          className="status-select"
          aria-label={`Status for ${tile.name}`}
          value={tile.status}
          onChange={(event) => {
            const value = event.target.value
            if (isTileStatus(value)) onStatus(value)
          }}
        >
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <dl className="tile-meta">
        <div>
          <dt>Parents</dt>
          <dd>{parents || 'None'}</dd>
        </div>
      </dl>
      <button type="button" className="btn ghost" onClick={onEdit}>
        Edit
      </button>
    </article>
  )
}
