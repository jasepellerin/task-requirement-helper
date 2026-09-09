export type OverlayOrigin = 'find' | 'completed'

export type Overlay =
  | { mode: 'find' }
  | { mode: 'detail'; id: string; from?: OverlayOrigin }
  | { mode: 'stats' }
  | { mode: 'completed' }

export function overlayOrigin(
  overlay: Overlay | null,
): OverlayOrigin | undefined {
  if (overlay?.mode === 'find') return 'find'
  if (overlay?.mode === 'completed') return 'completed'
  if (overlay?.mode === 'detail') return overlay.from
  return undefined
}

export function openDetailOverlay(prev: Overlay | null, id: string): Overlay {
  const from = overlayOrigin(prev)
  return from ? { mode: 'detail', id, from } : { mode: 'detail', id }
}

export function closeOverlayState(prev: Overlay | null): Overlay | null {
  if (prev?.mode !== 'detail' || !prev.from) return null
  return { mode: prev.from }
}
