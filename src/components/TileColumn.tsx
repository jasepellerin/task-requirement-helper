import type { ReactNode } from 'react'
import type { Tile, TileStatus } from '../domain/types.ts'
import { TileCard } from './TileCard.tsx'

type TileColumnProps = {
  title: string
  hint: string
  tiles: Tile[]
  allTiles: Tile[]
  empty: string
  onEdit: (id: string) => void
  onStatus: (id: string, status: TileStatus) => void
}

export function TileColumn({
  title,
  hint,
  tiles,
  allTiles,
  empty,
  onEdit,
  onStatus,
}: TileColumnProps) {
  return (
    <section className="column">
      <header className="column-header">
        <h2>
          {title} <span>{tiles.length}</span>
        </h2>
        <p>{hint}</p>
      </header>
      {tiles.length === 0 ? (
        <p className="empty">{empty}</p>
      ) : (
        <ul className="tile-list">
          {tiles.map((tile) => (
            <li key={tile.id}>
              <TileCard
                tile={tile}
                tiles={allTiles}
                onEdit={() => onEdit(tile.id)}
                onStatus={(status) => onStatus(tile.id, status)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function Columns({ children }: { children: ReactNode }) {
  return <div className="columns">{children}</div>
}
