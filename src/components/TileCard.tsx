import {
  tileGp,
  tileSlayerMaster,
  tileSlayerMonsters,
} from '../data/osrsCatalog.ts'
import { formatGp } from '../data/questReqs.ts'
import { blockingParentCount } from '../domain/readiness.ts'
import type { Tile } from '../domain/types.ts'
import { SlayerMasterMark } from './SlayerMasterMark.tsx'
import { SlayerMonsterMark } from './SlayerMonsterMark.tsx'
import { StarButton } from './StatusPicker.tsx'

type TileCardProps = {
  tile: Tile
  byId: Map<string, Tile>
  onOpen: () => void
  onStar: (starred: boolean) => void
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

export function TileCard({ tile, byId, onOpen, onStar }: TileCardProps) {
  const stats = cardStats(tile, byId)
  const slayerMaster = tileSlayerMaster(tile.id)
  const slayerMonsters = tileSlayerMonsters(tile.id)

  return (
    <article className="tile-card">
      <button type="button" className="tile-card-hit" onClick={onOpen}>
        <h3>
          <span>{tile.name}</span>
          {slayerMaster ? <SlayerMasterMark master={slayerMaster} /> : null}
          {slayerMonsters.length > 0 ? (
            <SlayerMonsterMark monsters={slayerMonsters} />
          ) : null}
        </h3>
        {stats ? <p className="tile-card-stats">{stats}</p> : null}
      </button>
      <StarButton starred={tile.starred} onChange={onStar} />
    </article>
  )
}
