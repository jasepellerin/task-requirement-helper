import { useEffect, useId, useMemo } from 'react'
import { partitionByKind } from '../data/osrsCatalog.ts'
import type { Tile } from '../domain/types.ts'
import { CloseButton } from './StatusPicker.tsx'

type CompletedWindowProps = {
  completed: Tile[]
  onClose: () => void
  onOpen: (id: string) => void
}

type CompletedListProps = {
  title: string
  tiles: Tile[]
  empty: string
  onOpen: (id: string) => void
}

function CompletedList({ title, tiles, empty, onOpen }: CompletedListProps) {
  return (
    <section className="completed-pane">
      <header className="completed-pane-header">
        <h3>{title}</h3>
        <span>{tiles.length}</span>
      </header>
      {tiles.length === 0 ? (
        <p className="empty">{empty}</p>
      ) : (
        <ul className="completed-list">
          {tiles.map((tile) => (
            <li key={tile.id}>
              <button
                type="button"
                className="completed-item"
                onClick={() => onOpen(tile.id)}
              >
                {tile.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function CompletedWindow({
  completed,
  onClose,
  onOpen,
}: CompletedWindowProps) {
  const titleId = useId()
  const groups = useMemo(() => partitionByKind(completed), [completed])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal completed-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-title-row">
          <h2 id={titleId}>Completed</h2>
          <div className="modal-title-actions">
            <CloseButton onClick={onClose} />
          </div>
        </div>
        <div className="completed-columns">
          <CompletedList
            title="Skills"
            tiles={groups.skill}
            empty="No completed skills."
            onOpen={onOpen}
          />
          <CompletedList
            title="Diaries"
            tiles={groups.diary}
            empty="No completed diaries."
            onOpen={onOpen}
          />
          <CompletedList
            title="Quests"
            tiles={groups.quest}
            empty="No completed quests."
            onOpen={onOpen}
          />
        </div>
      </div>
    </div>
  )
}
