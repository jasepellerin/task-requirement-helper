import { useState } from 'react'
import { CompletedWindow } from './components/CompletedWindow.tsx'
import { Columns, TileColumn } from './components/TileColumn.tsx'
import { StatsWindow } from './components/StatsWindow.tsx'
import { TileFinder } from './components/TileFinder.tsx'
import { TileDetail } from './components/TileDetail.tsx'
import { Toolbar } from './components/Toolbar.tsx'
import { useTiles } from './hooks/useTiles.ts'

type Overlay =
  | { mode: 'find' }
  | { mode: 'detail'; id: string }
  | { mode: 'stats' }
  | { mode: 'completed' }

export default function App() {
  const { tiles, byId, groups, setStatus, exportStore, importStore } =
    useTiles()
  const [overlay, setOverlay] = useState<Overlay | null>(null)

  const detailTile =
    overlay?.mode === 'detail' ? byId.get(overlay.id) : undefined
  const visibleCount =
    groups.ready.length +
    groups.possible.length +
    groups.blocked.length +
    groups.unlocked.length

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

      {visibleCount === 0 ? (
        <p className="hero-empty">Find a tile you’ve just seen.</p>
      ) : (
        <Columns className="board-columns">
          <TileColumn
            title="Ready"
            tiles={groups.ready}
            byId={byId}
            empty="Nothing ready."
            onOpen={openDetail}
          />
          <TileColumn
            title="Possible"
            tiles={groups.possible}
            byId={byId}
            empty="Nothing possible."
            onOpen={openDetail}
          />
          <TileColumn
            title="Blocked"
            tiles={groups.blocked}
            byId={byId}
            empty="Nothing blocked."
            onOpen={openDetail}
          />
          <TileColumn
            title="Unlocked"
            tiles={groups.unlocked}
            byId={byId}
            empty="Nothing unlocked."
            onOpen={openDetail}
          />
        </Columns>
      )}

      {overlay?.mode === 'completed' ? (
        <CompletedWindow
          byId={byId}
          completed={groups.completed}
          onClose={closeOverlay}
          onOpen={openDetail}
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
        />
      ) : null}
    </div>
  )
}
