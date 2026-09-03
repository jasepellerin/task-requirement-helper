import { describe, expect, it } from 'vitest'
import { foldSearch, searchTiles } from './search.ts'
import type { Tile } from './types.ts'

function tile(
  id: string,
  name: string,
  status: Tile['status'] = 'unseen',
): Tile {
  return { id, name, status, parentIds: [] }
}

describe('foldSearch', () => {
  it('treats en-dashes and "to" like hyphens', () => {
    expect(foldSearch('Agility 21–30')).toBe('agility 21-30')
    expect(foldSearch('Agility 21 to 30')).toBe('agility 21-30')
  })
})

describe('searchTiles', () => {
  const tiles = [
    tile('a', 'Agility 1–10', 'locked'),
    tile('b', 'Agility 21–30'),
    tile('c', 'Attack 21–30'),
    tile('d', 'Karamja Easy'),
  ]

  it('returns nothing for a blank query', () => {
    expect(searchTiles(tiles, '   ')).toEqual([])
  })

  it('matches hyphenated queries to en-dash names and prefers unseen', () => {
    const results = searchTiles(tiles, 'agility 21-30')
    expect(results.map((item) => item.id)).toEqual(['b'])
  })

  it('ranks prefix matches first', () => {
    const results = searchTiles(tiles, '21-30')
    expect(results.map((item) => item.name)).toEqual([
      'Agility 21–30',
      'Attack 21–30',
    ])
  })
})
