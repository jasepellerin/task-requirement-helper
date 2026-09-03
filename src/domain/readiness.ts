import { compareTilesByStarThenName } from './search.ts'
import type { Readiness, ReadinessGroups, Tile, TileStatus } from './types.ts'

export function tilesById(tiles: Tile[]): Map<string, Tile> {
  return new Map(tiles.map((tile) => [tile.id, tile]))
}

export function parentIsSatisfied(status: TileStatus | undefined): boolean {
  return status === 'unlocked' || status === 'completed'
}

export function parentIsOnBoard(status: TileStatus | undefined): boolean {
  return status === 'locked' || status === 'unlocked' || status === 'completed'
}

export function blockingParentCount(
  tile: Tile,
  byId: Map<string, Tile>,
): number {
  return tile.parentIds.filter(
    (parentId) => !parentIsSatisfied(byId.get(parentId)?.status),
  ).length
}

export function tileReadiness(tile: Tile, byId: Map<string, Tile>): Readiness {
  if (tile.status === 'completed') return 'completed'
  if (tile.status === 'unlocked') return 'unlocked'
  if (tile.status === 'unseen') return 'unseen'

  const parentStatuses = tile.parentIds.map(
    (parentId) => byId.get(parentId)?.status,
  )
  if (parentStatuses.every(parentIsSatisfied)) return 'ready'
  return parentStatuses.every(parentIsOnBoard) ? 'possible' : 'blocked'
}

export function groupTilesByReadiness(tiles: Tile[]): ReadinessGroups {
  const byId = tilesById(tiles)
  const groups: ReadinessGroups = {
    ready: [],
    possible: [],
    blocked: [],
    unseen: [],
    unlocked: [],
    completed: [],
  }

  for (const tile of tiles) {
    groups[tileReadiness(tile, byId)].push(tile)
  }

  groups.ready.sort(compareTilesByStarThenName)
  groups.possible.sort(compareTilesByStarThenName)
  groups.blocked.sort(compareTilesByStarThenName)
  groups.unseen.sort(compareTilesByStarThenName)
  groups.unlocked.sort(compareTilesByStarThenName)
  groups.completed.sort(compareTilesByStarThenName)

  return groups
}
