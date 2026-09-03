import { describe, expect, it } from 'vitest'
import { getDependentIds } from './graph.ts'
import { createTile, deleteTile, setTileStatus, updateTile } from './store.ts'
import type { Tile, TileInput } from './types.ts'

function input(overrides: Partial<TileInput> = {}): TileInput {
  return {
    name: 'Tile',
    status: 'locked',
    parentIds: [],
    dependentIds: [],
    ...overrides,
  }
}

function created(tiles: Tile[], next: TileInput, id?: string): Tile[] {
  const result = createTile(tiles, next, id)
  if (!result.ok) throw new Error(result.error)
  return result.tiles
}

describe('createTile', () => {
  it('rejects a blank name', () => {
    const result = createTile([], input({ name: '   ' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Name is required')
  })

  it('defaults parentIds and wires dependents', () => {
    const parent = created([], input({ name: 'Root' }), 'root')
    const next = created(
      parent,
      input({ name: 'Child', dependentIds: ['root'] }),
      'child',
    )
    expect(next.find((t) => t.id === 'root')?.parentIds).toEqual(['child'])
    expect(getDependentIds(next, 'child')).toEqual(['root'])
  })

  it('rejects a cyclic parent/dependent pair', () => {
    const a = created([], input({ name: 'A' }), 'a')
    const both = created(a, input({ name: 'B' }), 'b')
    const result = updateTile(both, 'b', {
      parentIds: ['a'],
      dependentIds: ['a'],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('That relationship would create a cycle')
    }
  })

  it('rejects unknown parent ids', () => {
    const result = createTile([], input({ parentIds: ['nope'] }), 'a')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Unknown parent tile')
  })
})

describe('updateTile / setTileStatus', () => {
  it('updates name and status without touching edges', () => {
    const tiles = created(
      created([], input({ name: 'A' }), 'a'),
      input({ name: 'B', parentIds: ['a'] }),
      'b',
    )
    const result = updateTile(tiles, 'b', { name: 'Bee', status: 'unlocked' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const bee = result.tiles.find((t) => t.id === 'b')
    expect(bee?.name).toBe('Bee')
    expect(bee?.status).toBe('unlocked')
    expect(bee?.parentIds).toEqual(['a'])
  })

  it('setTileStatus is a status-only update', () => {
    const tiles = created([], input({ name: 'A' }), 'a')
    const result = setTileStatus(tiles, 'a', 'unseen')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.tiles[0]?.status).toBe('unseen')
  })
})

describe('deleteTile', () => {
  it('removes the tile and dangling parent ids', () => {
    const tiles = created(
      created([], input({ name: 'A' }), 'a'),
      input({ name: 'B', parentIds: ['a'] }),
      'b',
    )
    const next = deleteTile(tiles, 'a')
    expect(next.map((t) => t.id)).toEqual(['b'])
    expect(next[0]?.parentIds).toEqual([])
  })
})
