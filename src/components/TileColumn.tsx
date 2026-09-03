import type { ReactNode } from 'react'
import type { Tile } from '../domain/types.ts'
import { TileCard } from './TileCard.tsx'

type TileColumnProps = {
  title: string
  tiles: Tile[]
  byId: Map<string, Tile>
  empty: string
  onOpen: (id: string) => void
}

export function TileColumn({
  title,
  tiles,
  byId,
  empty,
  onOpen,
}: TileColumnProps) {
  return (
    <section className="column">
      <header className="column-header">
        <h2>
          {title} <span>{tiles.length}</span>
        </h2>
      </header>
      {tiles.length === 0 ? (
        <p className="empty">{empty}</p>
      ) : (
        <ul className="tile-list">
          {tiles.map((tile) => (
            <li key={tile.id}>
              <TileCard
                tile={tile}
                byId={byId}
                onOpen={() => onOpen(tile.id)}
              />
            </li>
          ))}
        </ul>
      )}
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
