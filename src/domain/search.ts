import type { Tile } from './types.ts'

export function foldSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[–—−]/g, '-')
    .replace(/\s+to\s+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

export function searchTiles(tiles: Tile[], query: string, limit = 20): Tile[] {
  const folded = foldSearch(query)
  if (!folded) return []

  return tiles
    .filter((tile) => foldSearch(tile.name).includes(folded))
    .sort((a, b) => {
      const aFolded = foldSearch(a.name)
      const bFolded = foldSearch(b.name)
      const aStarts = aFolded.startsWith(folded)
      const bStarts = bFolded.startsWith(folded)
      if (aStarts !== bStarts) return aStarts ? -1 : 1
      if (a.status === 'unseen' && b.status !== 'unseen') return -1
      if (b.status === 'unseen' && a.status !== 'unseen') return 1
      return a.name.localeCompare(b.name)
    })
    .slice(0, limit)
}
