import { useState } from 'react'
import { Columns, TileColumn } from './components/TileColumn.tsx'
import { TileFinder } from './components/TileFinder.tsx'
import { TileForm } from './components/TileForm.tsx'
import { Toolbar } from './components/Toolbar.tsx'
import { isOsrsCatalogId } from './data/osrsCatalog.ts'
import type { Tile, TileInput } from './domain/types.ts'
import { useTiles } from './hooks/useTiles.ts'

type Editor =
  { mode: 'find' } | { mode: 'create' } | { mode: 'edit'; id: string }

export default function App() {
  const {
    tiles,
    groups,
    create,
    update,
    setStatus,
    remove,
    exportStore,
    importStore,
  } = useTiles()
  const [editor, setEditor] = useState<Editor | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const editingTile =
    editor?.mode === 'edit'
      ? tiles.find((tile) => tile.id === editor.id)
      : undefined
  const visibleCount =
    groups.ready.length +
    groups.blocked.length +
    groups.unlocked.length +
    groups.completed.length

  function openFind() {
    setFormError(null)
    setEditor({ mode: 'find' })
  }

  function openEdit(id: string) {
    setFormError(null)
    setEditor({ mode: 'edit', id })
  }

  function closeEditor() {
    setEditor(null)
    setFormError(null)
  }

  function submit(input: TileInput) {
    const result =
      editor?.mode === 'edit' ? update(editor.id, input) : create(input)
    if (!result.ok) {
      setFormError(result.error)
      return
    }
    closeEditor()
  }

  function selectFound(tile: Tile) {
    if (tile.status === 'unseen') {
      setStatus(tile.id, 'locked')
      closeEditor()
      return
    }
    openEdit(tile.id)
  }

  const editingCatalog =
    editingTile !== undefined && isOsrsCatalogId(editingTile.id)

  function confirmRemove() {
    if (!editingTile) return
    if (!editingCatalog && !window.confirm(`Delete “${editingTile.name}”?`)) {
      return
    }
    remove(editingTile.id)
    closeEditor()
  }

  return (
    <div className="app">
      <Toolbar onNew={openFind} onExport={exportStore} onImport={importStore} />

      {visibleCount === 0 ? (
        <p className="hero-empty">
          Find a tile you’ve just seen, or create a custom one.
        </p>
      ) : (
        <Columns>
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
          <TileColumn
            title="Completed"
            tiles={groups.completed}
            allTiles={tiles}
            empty="Nothing completed."
            onOpen={openEdit}
          />
        </Columns>
      )}

      {editor?.mode === 'find' ? (
        <TileFinder
          tiles={tiles}
          onSelect={selectFound}
          onCreateCustom={() => {
            setFormError(null)
            setEditor({ mode: 'create' })
          }}
          onCancel={closeEditor}
        />
      ) : null}

      {(editor?.mode === 'create' ||
        (editor?.mode === 'edit' && editingTile)) &&
      editor ? (
        <TileForm
          key={editor.mode === 'edit' ? editor.id : 'create'}
          tiles={tiles}
          tile={editingTile}
          error={formError}
          onSubmit={submit}
          onCancel={closeEditor}
          onDelete={editor.mode === 'edit' ? confirmRemove : undefined}
          deleteLabel={editingCatalog ? 'Remove from board' : 'Delete'}
          deleteDanger={!editingCatalog}
          onOpenTile={editor.mode === 'edit' ? openEdit : undefined}
        />
      ) : null}
    </div>
  )
}
