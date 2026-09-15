import { useMemo, useState } from 'react'
import { CompletedWindow } from './components/CompletedWindow.tsx'
import { FilterBar } from './components/FilterBar.tsx'
import {
  Columns,
  TileColumn,
  type TileColumnTone,
} from './components/TileColumn.tsx'
import { StatsWindow } from './components/StatsWindow.tsx'
import { TileFinder } from './components/TileFinder.tsx'
import { TileDetail } from './components/TileDetail.tsx'
import { Toolbar } from './components/Toolbar.tsx'
import { ALL_KINDS, filterTilesByKind } from './data/osrsCatalog.ts'
import { tileMatchesPrioritySkills } from './data/prioritySkills.ts'
import {
  closeOverlayState,
  openDetailOverlay,
  type Overlay,
} from './domain/overlay.ts'
import { filterTilesByQuery } from './domain/search.ts'
import { useTiles } from './hooks/useTiles.ts'

const BOARD_COLUMNS: {
  title: string
  tone: TileColumnTone
  key: 'unlocked' | 'ready' | 'possible' | 'blocked'
}[] = [
  { title: 'Unlocked', tone: 'unlocked', key: 'unlocked' },
  { title: 'Ready', tone: 'ready', key: 'ready' },
  { title: 'Possible', tone: 'possible', key: 'possible' },
  { title: 'Blocked', tone: 'blocked', key: 'blocked' },
]

export default function App() {
  const {
    tiles,
    byId,
    groups,
    prioritySkills,
    setStatus,
    setStarred,
    setPrioritySkill,
    exportStore,
    importStore,
  } = useTiles()
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [kinds, setKinds] = useState(ALL_KINDS)
  const [query, setQuery] = useState('')

  const detailTile =
    overlay?.mode === 'detail' ? byId.get(overlay.id) : undefined
  const board = useMemo(() => {
    function filterBoard(tiles: typeof groups.ready) {
      return filterTilesByQuery(filterTilesByKind(tiles, kinds), query)
    }
    return {
      ready: filterBoard(groups.ready),
      possible: filterBoard(groups.possible),
      blocked: filterBoard(groups.blocked),
      unlocked: filterBoard(groups.unlocked),
    }
  }, [groups, kinds, query])
  const boardCount =
    groups.ready.length +
    groups.possible.length +
    groups.blocked.length +
    groups.unlocked.length

  function openFind() {
    setOverlay({ mode: 'find' })
  }

  function openDetail(id: string) {
    setOverlay((prev) => openDetailOverlay(prev, id))
  }

  function closeOverlay() {
    setOverlay(closeOverlayState)
  }

  function openStats() {
    setOverlay({ mode: 'stats' })
  }

  function openCompleted() {
    setOverlay({ mode: 'completed' })
  }

  return (
    <div className="app">
      <Toolbar
        activeView={
          overlay?.mode === 'stats'
            ? 'stats'
            : overlay?.mode === 'completed' ||
                (overlay?.mode === 'detail' && overlay.from === 'completed')
              ? 'completed'
              : null
        }
        onNew={openFind}
        onStats={openStats}
        onCompleted={openCompleted}
        onExport={exportStore}
        onImport={importStore}
      >
        {boardCount > 0 ? (
          <FilterBar
            query={query}
            onQueryChange={setQuery}
            kinds={kinds}
            onKindsChange={setKinds}
            kindsLabel="Filter board"
          />
        ) : null}
      </Toolbar>

      {boardCount === 0 ? (
        <p className="hero-empty">Add your tiles with the + button above.</p>
      ) : (
        <Columns className="board-columns">
          {BOARD_COLUMNS.map((column) => (
            <TileColumn
              key={column.key}
              title={column.title}
              tone={column.tone}
              tiles={board[column.key]}
              byId={byId}
              empty="No matching tiles."
              isPriority={(id) => tileMatchesPrioritySkills(id, prioritySkills)}
              onOpen={openDetail}
              onStar={setStarred}
              onStatus={setStatus}
            />
          ))}
        </Columns>
      )}

      {overlay?.mode === 'completed' ||
      (overlay?.mode === 'detail' && overlay.from === 'completed') ? (
        <CompletedWindow
          completed={groups.completed}
          paused={overlay.mode === 'detail'}
          onClose={closeOverlay}
          onOpen={openDetail}
        />
      ) : null}

      {overlay?.mode === 'stats' ? (
        <StatsWindow
          tiles={tiles}
          prioritySkills={prioritySkills}
          onPriorityChange={setPrioritySkill}
          onClose={closeOverlay}
        />
      ) : null}

      {overlay?.mode === 'find' ||
      (overlay?.mode === 'detail' && overlay.from === 'find') ? (
        <TileFinder
          tiles={tiles}
          paused={overlay.mode === 'detail'}
          onStatusChange={setStatus}
          onStarChange={setStarred}
          onOpen={openDetail}
          onCancel={closeOverlay}
        />
      ) : null}

      {overlay?.mode === 'detail' && detailTile ? (
        <TileDetail
          key={overlay.id}
          byId={byId}
          tile={detailTile}
          onCancel={closeOverlay}
          onOpenTile={openDetail}
          onStatusChange={(status) => {
            setStatus(overlay.id, status)
            if (status === 'unseen') closeOverlay()
          }}
          onStarChange={(starred) => setStarred(overlay.id, starred)}
        />
      ) : null}
    </div>
  )
}
