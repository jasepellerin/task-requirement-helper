import {
  applyRelations,
  getDependentIds,
  hasCycle,
  uniqueIds,
} from './graph.ts'
import type { MutationResult, Tile, TileInput, TileStatus } from './types.ts'

function tileIds(tiles: Tile[]): Set<string> {
  return new Set(tiles.map((tile) => tile.id))
}

function validateRelations(
  tiles: Tile[],
  tileId: string,
  parentIds: string[],
  dependentIds: string[],
): string | null {
  const ids = tileIds(tiles)
  if (!ids.has(tileId)) return 'Tile not found'

  const uniqueParents = uniqueIds(parentIds)
  const uniqueDependents = uniqueIds(dependentIds)

  if (uniqueParents.includes(tileId) || uniqueDependents.includes(tileId)) {
    return 'A tile cannot depend on itself'
  }

  for (const parentId of uniqueParents) {
    if (!ids.has(parentId)) return 'Unknown parent tile'
  }

  for (const dependentId of uniqueDependents) {
    if (!ids.has(dependentId)) return 'Unknown dependent tile'
  }

  const next = applyRelations(tiles, tileId, uniqueParents, uniqueDependents)
  if (hasCycle(next)) {
    return 'That relationship would create a cycle'
  }

  return null
}

function commitRelations(
  tiles: Tile[],
  tileId: string,
  parentIds: string[],
  dependentIds: string[],
): MutationResult {
  const error = validateRelations(tiles, tileId, parentIds, dependentIds)
  if (error) return { ok: false, error }
  return {
    ok: true,
    tiles: applyRelations(
      tiles,
      tileId,
      uniqueIds(parentIds),
      uniqueIds(dependentIds),
    ),
  }
}

export function createTile(
  tiles: Tile[],
  input: TileInput,
  id: string = crypto.randomUUID(),
): MutationResult {
  const name = input.name.trim()
  if (!name) return { ok: false, error: 'Name is required' }

  const tile: Tile = {
    id,
    name,
    status: input.status,
    parentIds: [],
  }

  return commitRelations(
    [...tiles, tile],
    id,
    input.parentIds,
    input.dependentIds ?? [],
  )
}

export function updateTile(
  tiles: Tile[],
  id: string,
  input: Partial<TileInput>,
): MutationResult {
  const current = tiles.find((tile) => tile.id === id)
  if (!current) return { ok: false, error: 'Tile not found' }

  const name = input.name !== undefined ? input.name.trim() : current.name
  if (!name) return { ok: false, error: 'Name is required' }

  const status = input.status ?? current.status
  const renamed = tiles.map((tile) =>
    tile.id === id ? { ...tile, name, status } : tile,
  )

  if (input.parentIds === undefined && input.dependentIds === undefined) {
    return { ok: true, tiles: renamed }
  }

  return commitRelations(
    renamed,
    id,
    input.parentIds ?? current.parentIds,
    input.dependentIds ?? getDependentIds(tiles, id),
  )
}

export function setTileStatus(
  tiles: Tile[],
  id: string,
  status: TileStatus,
): MutationResult {
  return updateTile(tiles, id, { status })
}

export function deleteTile(tiles: Tile[], id: string): Tile[] {
  return tiles
    .filter((tile) => tile.id !== id)
    .map((tile) => ({
      ...tile,
      parentIds: tile.parentIds.filter((parentId) => parentId !== id),
    }))
}
