import { tileMatchesPrioritySkills } from '../data/prioritySkills.ts'
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

export function blockingParentCounts(
  tile: Tile,
  byId: Map<string, Tile>,
): { locked: number; unseen: number } {
  let locked = 0
  let unseen = 0
  for (const parentId of tile.parentIds) {
    const status = byId.get(parentId)?.status
    if (parentIsSatisfied(status)) continue
    if (status === 'locked') locked += 1
    else unseen += 1
  }
  return { locked, unseen }
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

export function groupTilesByReadiness(
  tiles: Tile[],
  prioritySkills: ReadonlySet<string> = new Set(),
): ReadinessGroups {
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

  const compare = (a: Tile, b: Tile) =>
    compareTilesByStarThenName(a, b, (tile) =>
      tileMatchesPrioritySkills(tile.id, prioritySkills),
    )
  groups.ready.sort(compare)
  groups.possible.sort(compare)
  groups.blocked.sort(compare)
  groups.unseen.sort(compare)
  groups.unlocked.sort(compare)
  groups.completed.sort(compare)

  return groups
}
