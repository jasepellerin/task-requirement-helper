import { describe, expect, it } from 'vitest'
import { setTileStatus } from './store.ts'
import type { Tile } from './types.ts'

function tile(id: string, overrides: Partial<Tile> = {}): Tile {
  return {
    id,
    name: id,
    status: 'locked',
    parentIds: [],
    ...overrides,
  }
}

describe('setTileStatus', () => {
  it('rejects a missing tile', () => {
    const result = setTileStatus([], 'a', 'unlocked')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Tile not found')
  })

  it('updates status without touching name or parents', () => {
    const tiles = [
      tile('a', { name: 'A' }),
      tile('b', { name: 'B', parentIds: ['a'] }),
    ]
    const result = setTileStatus(tiles, 'b', 'unseen')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.tiles[1]).toEqual({
      id: 'b',
      name: 'B',
      status: 'unseen',
      parentIds: ['a'],
    })
  })
})
