import type { Tile } from './types.ts'

export function foldSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[–—−]/g, '-')
    .replace(/\s+to\s+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

export function searchSortKey(value: string): string {
  return foldSearch(value).replace(/^(the|an|a)\s+/, '')
}

function isPrefixMatch(name: string, query: string): boolean {
  return (
    foldSearch(name).startsWith(query) || searchSortKey(name).startsWith(query)
  )
}

export function searchTiles(tiles: Tile[], query: string): Tile[] {
  const folded = foldSearch(query)

  return tiles
    .filter((tile) => !folded || foldSearch(tile.name).includes(folded))
    .sort((a, b) => {
      const aPrefix = isPrefixMatch(a.name, folded)
      const bPrefix = isPrefixMatch(b.name, folded)
      if (aPrefix !== bPrefix) return aPrefix ? -1 : 1
      const byKey = searchSortKey(a.name).localeCompare(searchSortKey(b.name))
      if (byKey !== 0) return byKey
      return a.name.localeCompare(b.name)
    })
}
