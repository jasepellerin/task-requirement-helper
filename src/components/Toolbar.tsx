import { useRef } from 'react'

type ToolbarProps = {
  onNew: () => void
  onExport: () => void
  onImport: (text: string) => { ok: true } | { ok: false; error: string }
}

export function Toolbar({ onNew, onExport, onImport }: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <header className="toolbar">
      <div className="toolbar-title">
        <h1>Tiles</h1>
        <p>What you have, what you can unlock, what you still need to find.</p>
      </div>
      <div className="toolbar-actions">
        <button type="button" className="btn primary" onClick={onNew}>
          New tile
        </button>
        <button type="button" className="btn" onClick={onExport}>
          Export
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => fileRef.current?.click()}
        >
          Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            if (!window.confirm('Replace all tiles with this file?')) return
            void file.text().then((text) => {
              const result = onImport(text)
              if (!result.ok) window.alert(result.error)
            })
          }}
        />
      </div>
    </header>
  )
}
