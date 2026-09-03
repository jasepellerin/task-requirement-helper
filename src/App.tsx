import { useState } from 'react'
import { CompletedWindow } from './components/CompletedWindow.tsx'
import { Columns, TileColumn } from './components/TileColumn.tsx'
import { StatsWindow } from './components/StatsWindow.tsx'
import { TileFinder } from './components/TileFinder.tsx'
import { TileForm } from './components/TileForm.tsx'
import { Toolbar } from './components/Toolbar.tsx'
import type { Tile } from './domain/types.ts'
import { useTiles } from './hooks/useTiles.ts'

type Editor = { mode: 'find' } | { mode: 'edit'; id: string }

export default function App() {
  const { tiles, groups, setStatus, exportStore, importStore } = useTiles()
  const [editor, setEditor] = useState<Editor | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  const editingTile =
    editor?.mode === 'edit'
      ? tiles.find((tile) => tile.id === editor.id)
      : undefined
  const visibleCount =
    groups.ready.length + groups.blocked.length + groups.unlocked.length

  function openFind() {
    setShowStats(false)
    setShowCompleted(false)
    setEditor({ mode: 'find' })
  }

  function openEdit(id: string) {
    setShowStats(false)
    setShowCompleted(false)
    setEditor({ mode: 'edit', id })
  }

  function closeEditor() {
    setEditor(null)
  }

  function openStats() {
    setEditor(null)
    setShowCompleted(false)
    setShowStats(true)
  }

  function openCompleted() {
    setEditor(null)
    setShowStats(false)
    setShowCompleted(true)
  }

  function selectFound(tile: Tile) {
    if (tile.status === 'unseen') {
      setStatus(tile.id, 'locked')
      closeEditor()
      return
    }
    openEdit(tile.id)
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
            allTiles={tiles}
            empty="Nothing ready."
            onOpen={openEdit}
          />
          <TileColumn
            title="Blocked"
            tiles={groups.blocked}
            allTiles={tiles}
            empty="Nothing blocked."
            onOpen={openEdit}
          />
          <TileColumn
            title="Unlocked"
            tiles={groups.unlocked}
            allTiles={tiles}
            empty="Nothing unlocked."
            onOpen={openEdit}
          />
        </Columns>
      )}

      {showCompleted ? (
        <CompletedWindow
          tiles={tiles}
          completed={groups.completed}
          onClose={() => setShowCompleted(false)}
          onOpen={openEdit}
        />
      ) : null}

      {showStats ? (
        <StatsWindow
          tiles={tiles}
          onClose={() => setShowStats(false)}
          onOpenTile={openEdit}
        />
      ) : null}

      {editor?.mode === 'find' ? (
        <TileFinder
          tiles={tiles}
          onSelect={selectFound}
          onCancel={closeEditor}
        />
      ) : null}

      {editor?.mode === 'edit' && editingTile ? (
        <TileForm
          key={editor.id}
          tiles={tiles}
          tile={editingTile}
          onCancel={closeEditor}
          onOpenTile={openEdit}
          onStatusChange={(status) => setStatus(editor.id, status)}
        />
      ) : null}
    </div>
  )
}
