import { tileGp } from '../data/osrsCatalog.ts'
import { formatGp } from '../data/questReqs.ts'
import { blockingParentCount } from '../domain/readiness.ts'
import type { Tile } from '../domain/types.ts'
import { LockIcon, StarButton } from './StatusPicker.tsx'
import { TileUnlockMarks } from './TileUnlockMarks.tsx'

type TileCardProps = {
  tile: Tile
  byId: Map<string, Tile>
  onOpen: () => void
  onStar: (starred: boolean) => void
}

export function TileCard({ tile, byId, onOpen, onStar }: TileCardProps) {
  const gp = tileGp(tile.id)
  const blocking = blockingParentCount(tile, byId)

  return (
    <article className="tile-card">
      <button type="button" className="tile-card-hit" onClick={onOpen}>
        <h3>
          <span>{tile.name}</span>
          <TileUnlockMarks tileId={tile.id} />
        </h3>
        {gp !== undefined || blocking > 0 ? (
          <p className="tile-card-stats">
            {gp !== undefined ? (
              <span className="tile-gold">{formatGp(gp)}</span>
            ) : null}
            {blocking > 0 ? (
              <span
                className="tile-card-blocked"
                title={`Blocked by ${blocking}`}
              >
                <LockIcon />
                <span className="sr-only">Blocked by </span>
                {blocking}
              </span>
            ) : null}
          </p>
        ) : null}
      </button>
      <StarButton starred={tile.starred} onChange={onStar} />
    </article>
  )
}
