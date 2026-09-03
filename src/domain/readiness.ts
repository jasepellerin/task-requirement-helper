import type { Readiness, ReadinessGroups, Tile, TileStatus } from './types.ts'

export function tilesById(tiles: Tile[]): Map<string, Tile> {
  return new Map(tiles.map((tile) => [tile.id, tile]))
}

export function parentIsSatisfied(status: TileStatus | undefined): boolean {
  return status === 'unlocked' || status === 'completed'
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

  const allParentsSatisfied = tile.parentIds.every((parentId) => {
    return parentIsSatisfied(byId.get(parentId)?.status)
  })

  return allParentsSatisfied ? 'ready' : 'blocked'
}

function byName(a: Tile, b: Tile): number {
  return a.name.localeCompare(b.name)
}

export function groupTilesByReadiness(tiles: Tile[]): ReadinessGroups {
  const byId = tilesById(tiles)
  const groups: ReadinessGroups = {
    ready: [],
    blocked: [],
    unseen: [],
    unlocked: [],
    completed: [],
  }

  for (const tile of tiles) {
    groups[tileReadiness(tile, byId)].push(tile)
  }

  groups.ready.sort(byName)
  groups.blocked.sort(byName)
  groups.unseen.sort(byName)
  groups.unlocked.sort(byName)
  groups.completed.sort(byName)

  return groups
}
