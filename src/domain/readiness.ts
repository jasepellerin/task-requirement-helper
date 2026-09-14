import { tileMatchesPrioritySkills } from '../data/prioritySkills.ts'
import { compareTilesByStarThenName } from './search.ts'
import type { Readiness, ReadinessGroups, Tile, TileStatus } from './types.ts'

export function tilesById(tiles: Tile[]): Map<string, Tile> {
  return new Map(tiles.map((tile) => [tile.id, tile]))
}

export function parentIsSatisfied(status: TileStatus | undefined): boolean {
  return status === 'unlocked' || status === 'completed'
}

function parentSupportsPossible(
  parentId: string,
  byId: Map<string, Tile>,
  memo: Map<string, Readiness>,
  visiting: Set<string>,
): boolean {
  const parent = byId.get(parentId)
  if (!parent) return false
  if (parentIsSatisfied(parent.status)) return true
  if (parent.status !== 'locked') return false
  const readiness = tileReadiness(parent, byId, memo, visiting)
  return readiness === 'ready' || readiness === 'possible'
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

export function tileReadiness(
  tile: Tile,
  byId: Map<string, Tile>,
  memo: Map<string, Readiness> = new Map(),
  visiting: Set<string> = new Set(),
): Readiness {
  const cached = memo.get(tile.id)
  if (cached) return cached
  if (visiting.has(tile.id)) return 'blocked'

  if (tile.status === 'completed') {
    memo.set(tile.id, 'completed')
    return 'completed'
  }
  if (tile.status === 'unlocked') {
    memo.set(tile.id, 'unlocked')
    return 'unlocked'
  }
  if (tile.status === 'unseen') {
    memo.set(tile.id, 'unseen')
    return 'unseen'
  }

  visiting.add(tile.id)
  const ready = tile.parentIds.every((parentId) =>
    parentIsSatisfied(byId.get(parentId)?.status),
  )
  const result: Readiness = ready
    ? 'ready'
    : tile.parentIds.every((parentId) =>
          parentSupportsPossible(parentId, byId, memo, visiting),
        )
      ? 'possible'
      : 'blocked'
  visiting.delete(tile.id)
  memo.set(tile.id, result)
  return result
}

export function groupTilesByReadiness(
  tiles: Tile[],
  prioritySkills: ReadonlySet<string> = new Set(),
): ReadinessGroups {
  const byId = tilesById(tiles)
  const memo = new Map<string, Readiness>()
  const groups: ReadinessGroups = {
    ready: [],
    possible: [],
    blocked: [],
    unseen: [],
    unlocked: [],
    completed: [],
  }

  for (const tile of tiles) {
    groups[tileReadiness(tile, byId, memo)].push(tile)
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
