import { isTileStatus, type StoreV1, type StoredTile } from '../domain/types.ts'

export const STORAGE_KEY = 'tiles:v1'

const emptyStore = (): StoreV1 => ({ version: 1, tiles: [] })

function isStoredTile(value: unknown): value is StoredTile {
  if (typeof value !== 'object' || value === null) return false
  const tile = value as Record<string, unknown>
  return (
    typeof tile.id === 'string' &&
    tile.id.length > 0 &&
    typeof tile.status === 'string' &&
    isTileStatus(tile.status)
  )
}

export function parseStore(value: unknown): StoreV1 | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  if (record.version !== 1 || !Array.isArray(record.tiles)) return null
  if (!record.tiles.every(isStoredTile)) return null
  return {
    version: 1,
    tiles: record.tiles.map((tile) => ({
      id: tile.id,
      status: tile.status,
    })),
  }
}

export function parseStoreJson(text: string): StoreV1 | null {
  try {
    return parseStore(JSON.parse(text) as unknown)
  } catch {
    return null
  }
}

export function storeToJson(store: StoreV1): string {
  return `${JSON.stringify(store, null, 2)}\n`
}

export function loadStore(): StoreV1 {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return emptyStore()
  return parseStoreJson(raw) ?? emptyStore()
}

export function saveStore(store: StoreV1): void {
  localStorage.setItem(STORAGE_KEY, storeToJson(store))
}

export function downloadStore(store: StoreV1, filename = 'tiles.json'): void {
  const blob = new Blob([storeToJson(store)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
