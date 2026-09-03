import { useEffect, useId, useMemo } from 'react'
import { partitionByKind } from '../data/osrsCatalog.ts'
import type { Tile } from '../domain/types.ts'
import { Columns, TileColumn } from './TileColumn.tsx'

type CompletedWindowProps = {
  tiles: Tile[]
  completed: Tile[]
  onClose: () => void
  onOpen: (id: string) => void
}

export function CompletedWindow({
  tiles,
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
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
        <Columns>
          <TileColumn
            title="Skills"
            tiles={groups.skill}
            allTiles={tiles}
            empty="No completed skills."
            onOpen={onOpen}
          />
          <TileColumn
            title="Diaries"
            tiles={groups.diary}
            allTiles={tiles}
            empty="No completed diaries."
            onOpen={onOpen}
          />
          <TileColumn
            title="Quests"
            tiles={groups.quest}
            allTiles={tiles}
            empty="No completed quests."
            onOpen={onOpen}
          />
          {groups.custom.length > 0 ? (
            <TileColumn
              title="Other"
              tiles={groups.custom}
              allTiles={tiles}
              empty="No completed tiles."
              onOpen={onOpen}
            />
          ) : null}
        </Columns>
      </div>
    </div>
  )
}
