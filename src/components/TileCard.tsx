import { formatGp, tileGp } from '../data/questReqs.ts'
import { blockingParentCount, tilesById } from '../domain/readiness.ts'
import type { Tile } from '../domain/types.ts'

type TileCardProps = {
  tile: Tile
  tiles: Tile[]
  onOpen: () => void
}

function cardStats(tile: Tile, tiles: Tile[]): string | null {
  const gp = tileGp(tile.id)
  const blocking = blockingParentCount(tile, tilesById(tiles))
  const parts: string[] = []
  if (gp !== undefined) parts.push(formatGp(gp))
  if (blocking > 0) {
    parts.push(`Blocked by ${blocking}`)
  }
  return parts.length > 0 ? parts.join(' · ') : null
}

export function TileCard({ tile, tiles, onOpen }: TileCardProps) {
  const stats = cardStats(tile, tiles)

  return (
    <article className="tile-card">
      <button type="button" className="tile-card-hit" onClick={onOpen}>
        <h3>{tile.name}</h3>
        {stats ? <p className="tile-card-stats">{stats}</p> : null}
      </button>
    </article>
  )
}
