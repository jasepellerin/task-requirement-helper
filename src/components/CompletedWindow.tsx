import { useEffect, useId, useMemo } from 'react'
import { partitionByKind } from '../data/osrsCatalog.ts'
import type { Tile } from '../domain/types.ts'
import { Columns, TileColumn } from './TileColumn.tsx'

type CompletedWindowProps = {
  byId: Map<string, Tile>
  completed: Tile[]
  onClose: () => void
  onOpen: (id: string) => void
  onStar: (id: string, starred: boolean) => void
}

export function CompletedWindow({
  byId,
  completed,
  onClose,
  onOpen,
  onStar,
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
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
        <Columns>
          <TileColumn
            title="Skills"
            tiles={groups.skill}
            byId={byId}
            empty="No completed skills."
            onOpen={onOpen}
            onStar={onStar}
          />
          <TileColumn
            title="Diaries"
            tiles={groups.diary}
            byId={byId}
            empty="No completed diaries."
            onOpen={onOpen}
            onStar={onStar}
          />
          <TileColumn
            title="Quests"
            tiles={groups.quest}
            byId={byId}
            empty="No completed quests."
            onOpen={onOpen}
            onStar={onStar}
          />
        </Columns>
      </div>
    </div>
  )
}
