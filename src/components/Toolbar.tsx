import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

type ToolbarProps = {
  onNew: () => void
  onStats: () => void
  onCompleted: () => void
  onExport: () => void
  onImport: (text: string) => { ok: true } | { ok: false; error: string }
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function Toolbar({
  onNew,
  onStats,
  onCompleted,
  onExport,
  onImport,
}: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    function onPointer(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  function pickImport() {
    setMenuOpen(false)
    fileRef.current?.click()
  }

  function exportTiles() {
    setMenuOpen(false)
    onExport()
  }

  return (
    <header className="toolbar">
      <div className="toolbar-start">
        <h1>SlayerScape Requirements Helper</h1>
        <nav className="toolbar-nav" aria-label="Views">
          <button type="button" className="btn toolbar-link" onClick={onStats}>
            <Icon>
              <path d="M4 19V10" />
              <path d="M10 19V5" />
              <path d="M16 19V13" />
              <path d="M22 19H2" />
            </Icon>
            Stats
          </button>
          <button
            type="button"
            className="btn toolbar-link"
            onClick={onCompleted}
          >
            <Icon>
              <circle cx="12" cy="12" r="8" />
              <path d="m8.5 12 2.5 2.5 4.5-5" />
            </Icon>
            Completed
          </button>
        </nav>
      </div>

      <div className="toolbar-end">
        <div className="toolbar-menu" ref={menuRef}>
          <button
            type="button"
            className="btn icon-only"
            aria-label="Import and export"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon>
              <circle
                cx="12"
                cy="6"
                r="1.35"
                fill="currentColor"
                stroke="none"
              />
              <circle
                cx="12"
                cy="12"
                r="1.35"
                fill="currentColor"
                stroke="none"
              />
              <circle
                cx="12"
                cy="18"
                r="1.35"
                fill="currentColor"
                stroke="none"
              />
            </Icon>
          </button>
          {menuOpen ? (
            <div className="toolbar-menu-list" id={menuId} role="menu">
              <button
                type="button"
                className="toolbar-menu-item"
                role="menuitem"
                onClick={exportTiles}
              >
                Export
              </button>
              <button
                type="button"
                className="toolbar-menu-item"
                role="menuitem"
                onClick={pickImport}
              >
                Import
              </button>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="btn primary icon-only"
          aria-label="New tile"
          onClick={onNew}
        >
          <Icon>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </Icon>
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
