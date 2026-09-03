import type { MutationResult, Tile, TileStatus } from './types.ts'

export function setTileStatus(
  tiles: Tile[],
  id: string,
  status: TileStatus,
): MutationResult {
  const current = tiles.find((tile) => tile.id === id)
  if (!current) return { ok: false, error: 'Tile not found' }
  return {
    ok: true,
    tiles: tiles.map((tile) => (tile.id === id ? { ...tile, status } : tile)),
  }
}
