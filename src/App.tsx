import { useMemo, useState } from 'react'
import { CompletedWindow } from './components/CompletedWindow.tsx'
import { KindFilters } from './components/KindFilters.tsx'
import { Columns, TileColumn } from './components/TileColumn.tsx'
import { StatsWindow } from './components/StatsWindow.tsx'
import { TileFinder } from './components/TileFinder.tsx'
import { TileDetail } from './components/TileDetail.tsx'
import { Toolbar } from './components/Toolbar.tsx'
import { ALL_KINDS, filterTilesByKind } from './data/osrsCatalog.ts'
import { useTiles } from './hooks/useTiles.ts'

type Overlay =
  | { mode: 'find' }
  | { mode: 'detail'; id: string }
  | { mode: 'stats' }
  | { mode: 'completed' }

export default function App() {
  const {
    tiles,
    byId,
    groups,
    setStatus,
    setStarred,
    exportStore,
    importStore,
  } = useTiles()
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [kinds, setKinds] = useState(ALL_KINDS)

  const detailTile =
    overlay?.mode === 'detail' ? byId.get(overlay.id) : undefined
  const board = useMemo(
    () => ({
      ready: filterTilesByKind(groups.ready, kinds),
      possible: filterTilesByKind(groups.possible, kinds),
      blocked: filterTilesByKind(groups.blocked, kinds),
      unlocked: filterTilesByKind(groups.unlocked, kinds),
    }),
    [groups, kinds],
  )
  const boardCount =
    groups.ready.length +
    groups.possible.length +
    groups.blocked.length +
    groups.unlocked.length
  const visibleCount =
    board.ready.length +
    board.possible.length +
    board.blocked.length +
    board.unlocked.length

  function openFind() {
    setOverlay({ mode: 'find' })
  }

  function openDetail(id: string) {
    setOverlay({ mode: 'detail', id })
  }

  function closeOverlay() {
    setOverlay(null)
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
        onNew={openFind}
        onStats={openStats}
        onCompleted={openCompleted}
        onExport={exportStore}
        onImport={importStore}
      />

      {boardCount > 0 ? (
        <KindFilters kinds={kinds} onChange={setKinds} label="Filter board" />
      ) : null}

      {boardCount === 0 ? (
        <p className="hero-empty">Find a tile you’ve just seen.</p>
      ) : visibleCount === 0 ? (
        <p className="hero-empty">No matching tiles.</p>
      ) : (
        <Columns className="board-columns">
          <TileColumn
            title="Ready"
            tiles={board.ready}
            byId={byId}
            empty="Nothing ready."
            onOpen={openDetail}
            onStar={setStarred}
          />
          <TileColumn
            title="Possible"
            tiles={board.possible}
            byId={byId}
            empty="Nothing possible."
            onOpen={openDetail}
            onStar={setStarred}
          />
          <TileColumn
            title="Blocked"
            tiles={board.blocked}
            byId={byId}
            empty="Nothing blocked."
            onOpen={openDetail}
            onStar={setStarred}
          />
          <TileColumn
            title="Unlocked"
            tiles={board.unlocked}
            byId={byId}
            empty="Nothing unlocked."
            onOpen={openDetail}
            onStar={setStarred}
          />
        </Columns>
      )}

      {overlay?.mode === 'completed' ? (
        <CompletedWindow
          byId={byId}
          completed={groups.completed}
          onClose={closeOverlay}
          onOpen={openDetail}
          onStar={setStarred}
        />
      ) : null}

      {overlay?.mode === 'stats' ? (
        <StatsWindow
          tiles={tiles}
          onClose={closeOverlay}
          onOpenTile={openDetail}
        />
      ) : null}

      {overlay?.mode === 'find' ? (
        <TileFinder
          tiles={tiles}
          onStatusChange={setStatus}
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
