import type { Tile } from './types.ts'

export function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)]
}

export function getDependentIds(tiles: Tile[], parentId: string): string[] {
  return tiles
    .filter((tile) => tile.parentIds.includes(parentId))
    .map((tile) => tile.id)
}

export function getDependents(tiles: Tile[], parentId: string): Tile[] {
  return tiles.filter((tile) => tile.parentIds.includes(parentId))
}

export function hasCycle(tiles: Tile[]): boolean {
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const byId = new Map(tiles.map((tile) => [tile.id, tile]))

  function visit(id: string): boolean {
    if (visited.has(id)) return false
    if (visiting.has(id)) return true
    visiting.add(id)
    const tile = byId.get(id)
    if (tile) {
      for (const parentId of tile.parentIds) {
        if (visit(parentId)) return true
      }
    }
    visiting.delete(id)
    visited.add(id)
    return false
  }

  return tiles.some((tile) => visit(tile.id))
}

export function wouldCreateCycle(
  tiles: Tile[],
  childId: string,
  parentId: string,
): boolean {
  if (childId === parentId) return true
  const next = tiles.map((tile) =>
    tile.id === childId && !tile.parentIds.includes(parentId)
      ? { ...tile, parentIds: [...tile.parentIds, parentId] }
      : tile,
  )
  return hasCycle(next)
}

export function applyRelations(
  tiles: Tile[],
  tileId: string,
  parentIds: string[],
  dependentIds: string[],
): Tile[] {
  const uniqueParents = uniqueIds(parentIds)
  const dependentSet = new Set(dependentIds)

  return tiles.map((tile) => {
    if (tile.id === tileId) {
      return { ...tile, parentIds: uniqueParents }
    }

    const hasThis = tile.parentIds.includes(tileId)
    const shouldHave = dependentSet.has(tile.id)
    if (hasThis === shouldHave) return tile
    if (shouldHave) {
      return { ...tile, parentIds: [...tile.parentIds, tileId] }
    }
    return { ...tile, parentIds: tile.parentIds.filter((id) => id !== tileId) }
  })
}
