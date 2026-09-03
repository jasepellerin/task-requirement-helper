import type { ReactNode } from 'react'
import type { Tile } from '../domain/types.ts'
import { TileCard } from './TileCard.tsx'

type TileColumnProps = {
  title: string
  tiles: Tile[]
  byId: Map<string, Tile>
  empty: string
  isPriority?: (id: string) => boolean
  onOpen: (id: string) => void
  onStar: (id: string, starred: boolean) => void
}

export function TileColumn({
  title,
  tiles,
  byId,
  empty,
  isPriority,
  onOpen,
  onStar,
}: TileColumnProps) {
  return (
    <section className="column">
      <header className="column-header">
        <h2>
          {title} <span>{tiles.length}</span>
        </h2>
      </header>
      <div className="column-body">
        {tiles.length === 0 ? (
          <p className="empty">{empty}</p>
        ) : (
          <ul className="tile-list">
            {tiles.map((tile) => (
              <li key={tile.id}>
                <TileCard
                  tile={tile}
                  byId={byId}
                  priority={isPriority?.(tile.id) ?? false}
                  onOpen={() => onOpen(tile.id)}
                  onStar={(starred) => onStar(tile.id, starred)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export function Columns({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className ? `columns ${className}` : 'columns'}>
      {children}
    </div>
  )
}
