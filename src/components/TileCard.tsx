import type { ReactNode } from 'react'
import { tileGp } from '../data/osrsCatalog.ts'
import { formatGp } from '../data/questReqs.ts'
import { blockingParentCounts } from '../domain/readiness.ts'
import type { Tile } from '../domain/types.ts'
import {
  LockIcon,
  PriorityIcon,
  StarButton,
  UnseenIcon,
} from './StatusPicker.tsx'
import { TileUnlockMarks } from './TileUnlockMarks.tsx'

type TileCardProps = {
  tile: Tile
  byId: Map<string, Tile>
  priority?: boolean
  onOpen: () => void
  onStar: (starred: boolean) => void
}

function BlockerCount({
  count,
  label,
  icon,
  className,
}: {
  count: number
  label: string
  icon: ReactNode
  className: string
}) {
  if (count === 0) return null
  return (
    <span className={className} title={`${count} ${label}`}>
      {icon}
      {count}
      <span className="sr-only"> {label}</span>
    </span>
  )
}

export function TileCard({
  tile,
  byId,
  priority = false,
  onOpen,
  onStar,
}: TileCardProps) {
  const gp = tileGp(tile.id)
  const { locked, unseen } = blockingParentCounts(tile, byId)

  return (
    <article
      className={priority ? 'tile-card tile-card-priority' : 'tile-card'}
    >
      <button type="button" className="tile-card-hit" onClick={onOpen}>
        <h3>
          <span>{tile.name}</span>
          <TileUnlockMarks tileId={tile.id} />
        </h3>
        {gp !== undefined || locked > 0 || unseen > 0 ? (
          <p className="tile-card-stats">
            {gp !== undefined ? (
              <span className="tile-gold">{formatGp(gp)}</span>
            ) : null}
            <BlockerCount
              count={locked}
              label="locked"
              icon={<LockIcon />}
              className="tile-card-blockers tile-card-blockers-locked"
            />
            <BlockerCount
              count={unseen}
              label="unseen"
              icon={<UnseenIcon />}
              className="tile-card-blockers tile-card-blockers-unseen"
            />
          </p>
        ) : null}
      </button>
      <div className="tile-card-marks">
        {priority ? (
          <span className="tile-card-priority-mark" aria-label="Priority skill">
            <PriorityIcon filled />
          </span>
        ) : null}
        <StarButton starred={tile.starred} onChange={onStar} />
      </div>
    </article>
  )
}
