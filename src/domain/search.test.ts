import { describe, expect, it } from 'vitest'
import { foldSearch, searchSortKey, searchTiles } from './search.ts'
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

describe('searchSortKey', () => {
  it('drops a leading a, an, or the', () => {
    expect(searchSortKey('The Ascent of Arceuus')).toBe('ascent of arceuus')
    expect(searchSortKey('A Porcine of Interest')).toBe('porcine of interest')
    expect(searchSortKey('An Odd One')).toBe('odd one')
    expect(searchSortKey('Agility 1–10')).toBe('agility 1-10')
    expect(searchSortKey('Another Slice of H.A.M.')).toBe(
      'another slice of h.a.m.',
    )
  })
})

describe('searchTiles', () => {
  const tiles = [
    tile('a', 'Agility 1–10', 'locked'),
    tile('b', 'Agility 21–30'),
    tile('c', 'Attack 21–30'),
    tile('d', 'Karamja Easy'),
  ]

  it('lists alphabetized tiles for a blank query', () => {
    expect(
      searchTiles(
        [
          ...tiles,
          tile('t', 'The Ascent of Arceuus'),
          tile('p', 'A Porcine of Interest'),
        ],
        '   ',
      ).map((item) => item.name),
    ).toEqual([
      'Agility 1–10',
      'Agility 21–30',
      'The Ascent of Arceuus',
      'Attack 21–30',
      'Karamja Easy',
      'A Porcine of Interest',
    ])
  })

  it('matches hyphenated queries to en-dash names', () => {
    const results = searchTiles(tiles, 'agility 21-30')
    expect(results.map((item) => item.id)).toEqual(['b'])
  })

  it('keeps name order regardless of status', () => {
    const results = searchTiles(tiles, 'agility')
    expect(results.map((item) => item.name)).toEqual([
      'Agility 1–10',
      'Agility 21–30',
    ])
  })

  it('ranks prefix matches first', () => {
    const results = searchTiles(
      [tile('p', 'Pirate Pete'), tile('a', 'Another Pirate Thing')],
      'pirate',
    )
    expect(results.map((item) => item.name)).toEqual([
      'Pirate Pete',
      'Another Pirate Thing',
    ])
  })

  it('returns every match', () => {
    const many = Array.from({ length: 25 }, (_, i) =>
      tile(`q-${i}`, `Quest ${String(i).padStart(2, '0')}`),
    )
    expect(searchTiles(many, 'quest')).toHaveLength(25)
    expect(searchTiles(many, '')).toHaveLength(25)
  })

  it('treats a leading The as ignorable for prefix and alpha', () => {
    const results = searchTiles(
      [
        tile('z', 'Zebra as a Pet'),
        tile('t', 'The Ascent of Arceuus'),
        tile('b', 'Basin of Something'),
      ],
      'as',
    )
    expect(results.map((item) => item.name)).toEqual([
      'The Ascent of Arceuus',
      'Basin of Something',
      'Zebra as a Pet',
    ])
  })

  it('treats a leading A or An the same way', () => {
    expect(
      searchTiles(
        [
          tile('z', 'Zebra as a Pet'),
          tile('p', 'A Porcine of Interest'),
          tile('pirate', 'Pirate Pete'),
          tile('o', 'An Odd One'),
        ],
        'p',
      ).map((item) => item.name),
    ).toEqual(['Pirate Pete', 'A Porcine of Interest', 'Zebra as a Pet'])

    expect(
      searchTiles(
        [tile('z', 'Zebra as a Pet'), tile('o', 'An Odd One')],
        'odd',
      ).map((item) => item.name),
    ).toEqual(['An Odd One'])
  })
})
