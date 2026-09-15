import { hasTileStamps, pickTileStamps } from '../domain/stamps.ts'
import type {
  StoreV1,
  StoredTile,
  Tile,
  TileStamps,
  TileStatus,
} from '../domain/types.ts'
import { CATALOG, CATALOG_BY_ID, parentIdsFor } from './osrsCatalog.ts'
import { prioritySkillsFromStored } from './prioritySkills.ts'

export type TileProgress = {
  statuses: Map<string, TileStatus>
  starred: Set<string>
  stamps: Map<string, TileStamps>
  prioritySkills: Set<string>
}

export function progressFromStore(store: StoreV1): TileProgress {
  return {
    statuses: statusesFromStored(store.tiles),
    starred: starredFromStored(store.tiles),
    stamps: stampsFromStored(store.tiles),
    prioritySkills: prioritySkillsFromStored(store.prioritySkills),
  }
}

export function tilesFromStatuses(
  statuses: Map<string, TileStatus>,
  starred: ReadonlySet<string> = new Set(),
  stamps: ReadonlyMap<string, TileStamps> = new Map(),
): Tile[] {
  return CATALOG.map((def) => {
    return {
      id: def.id,
      name: def.name,
      status: statuses.get(def.id) ?? 'unseen',
      parentIds: parentIdsFor(def),
      starred: starred.has(def.id),
      ...pickTileStamps(stamps.get(def.id)),
    }
  })
}

export function statusesFromStored(
  tiles: readonly StoredTile[],
): Map<string, TileStatus> {
  const statuses = new Map<string, TileStatus>()
  for (const tile of tiles) {
    if (!CATALOG_BY_ID.has(tile.id) || tile.status === 'unseen') continue
    statuses.set(tile.id, tile.status)
  }
  return statuses
}

export function starredFromStored(tiles: readonly StoredTile[]): Set<string> {
  const starred = new Set<string>()
  for (const tile of tiles) {
    if (!tile.starred || !CATALOG_BY_ID.has(tile.id)) continue
    starred.add(tile.id)
  }
  return starred
}

export function stampsFromStored(
  tiles: readonly StoredTile[],
): Map<string, TileStamps> {
  const stamps = new Map<string, TileStamps>()
  for (const tile of tiles) {
    if (!CATALOG_BY_ID.has(tile.id) || !hasTileStamps(tile)) continue
    stamps.set(tile.id, pickTileStamps(tile))
  }
  return stamps
}

export function storedTilesFromStatuses(
  statuses: Map<string, TileStatus>,
  starred: ReadonlySet<string> = new Set(),
  stamps: ReadonlyMap<string, TileStamps> = new Map(),
): StoredTile[] {
  const tiles: StoredTile[] = []
  for (const def of CATALOG) {
    const status = statuses.get(def.id)
    const isStarred = starred.has(def.id)
    if (!status && !isStarred) continue
    const stored: StoredTile = { id: def.id, status: status ?? 'unseen' }
    if (isStarred) stored.starred = true
    Object.assign(stored, pickTileStamps(stamps.get(def.id)))
    tiles.push(stored)
  }
  return tiles
}

export function setStoredStatus(
  statuses: Map<string, TileStatus>,
  id: string,
  status: TileStatus,
): Map<string, TileStatus> | null {
  if (!CATALOG_BY_ID.has(id)) return null
  const next = new Map(statuses)
  if (status === 'unseen') next.delete(id)
  else next.set(id, status)
  return next
}

export function setStoredStarred(
  starred: Set<string>,
  id: string,
  value: boolean,
): Set<string> | null {
  if (!CATALOG_BY_ID.has(id)) return null
  const next = new Set(starred)
  if (value) next.add(id)
  else next.delete(id)
  return next
}
