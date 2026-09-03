import { tileGp } from '../data/osrsCatalog.ts'
import { formatGp } from '../data/questReqs.ts'
import { blockingParentCount } from '../domain/readiness.ts'
import type { Tile } from '../domain/types.ts'

type TileCardProps = {
  tile: Tile
  byId: Map<string, Tile>
  onOpen: () => void
}

function cardStats(tile: Tile, byId: Map<string, Tile>): string | null {
  const gp = tileGp(tile.id)
  const blocking = blockingParentCount(tile, byId)
  const parts: string[] = []
  if (gp !== undefined) parts.push(formatGp(gp))
  if (blocking > 0) {
    parts.push(`Blocked by ${blocking}`)
  }
  return parts.length > 0 ? parts.join(' · ') : null
}

export function TileCard({ tile, byId, onOpen }: TileCardProps) {
  const stats = cardStats(tile, byId)

  return (
    <article className="tile-card">
      <button type="button" className="tile-card-hit" onClick={onOpen}>
        <h3>{tile.name}</h3>
        {stats ? <p className="tile-card-stats">{stats}</p> : null}
      </button>
    </article>
  )
}
