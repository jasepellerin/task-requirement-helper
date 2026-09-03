export const TILE_STATUSES = [
  'unseen',
  'locked',
  'unlocked',
  'completed',
] as const

export type TileStatus = (typeof TILE_STATUSES)[number]

export const STATUS_LABEL: Record<TileStatus, string> = {
  unseen: 'Unseen',
  locked: 'Locked',
  unlocked: 'Unlocked',
  completed: 'Completed',
}

export function isTileStatus(value: string): value is TileStatus {
  return (TILE_STATUSES as readonly string[]).includes(value)
}

export type Tile = {
  id: string
  name: string
  status: TileStatus
  parentIds: string[]
  starred: boolean
}

export type StoredTile = {
  id: string
  status: TileStatus
  starred?: boolean
}

export type StoreV1 = {
  version: 1
  tiles: StoredTile[]
}

export type Readiness =
  'unlocked' | 'completed' | 'unseen' | 'ready' | 'possible' | 'blocked'

export type ReadinessGroups = {
  ready: Tile[]
  possible: Tile[]
  blocked: Tile[]
  unseen: Tile[]
  unlocked: Tile[]
  completed: Tile[]
}
