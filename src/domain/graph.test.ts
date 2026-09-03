import { describe, expect, it } from 'vitest'
import {
  applyRelations,
  getDependentIds,
  hasCycle,
  wouldCreateCycle,
} from './graph.ts'
import type { Tile } from './types.ts'

function tile(id: string, parentIds: string[] = []): Tile {
  return { id, name: id, status: 'locked', parentIds }
}

describe('hasCycle', () => {
  it('is false for a DAG', () => {
    const tiles = [tile('a'), tile('b', ['a']), tile('c', ['a', 'b'])]
    expect(hasCycle(tiles)).toBe(false)
  })

  it('detects a self-cycle', () => {
    expect(hasCycle([tile('a', ['a'])])).toBe(true)
  })

  it('detects A <-> B', () => {
    expect(hasCycle([tile('a', ['b']), tile('b', ['a'])])).toBe(true)
  })

  it('detects a longer cycle', () => {
    expect(
      hasCycle([tile('a', ['c']), tile('b', ['a']), tile('c', ['b'])]),
    ).toBe(true)
  })
})

describe('wouldCreateCycle', () => {
  it('rejects a self edge', () => {
    expect(wouldCreateCycle([tile('a')], 'a', 'a')).toBe(true)
  })

  it('rejects closing a cycle', () => {
    const tiles = [tile('a'), tile('b', ['a'])]
    expect(wouldCreateCycle(tiles, 'a', 'b')).toBe(true)
  })

  it('allows a new acyclic parent', () => {
    const tiles = [tile('a'), tile('b'), tile('c', ['a'])]
    expect(wouldCreateCycle(tiles, 'c', 'b')).toBe(false)
  })
})

describe('applyRelations / dependents', () => {
  it('writes parentIds on dependents and clears stale ones', () => {
    const tiles = [tile('root'), tile('child', ['root']), tile('other')]
    const next = applyRelations(tiles, 'root', [], ['other'])
    expect(getDependentIds(next, 'root')).toEqual(['other'])
    expect(next.find((t) => t.id === 'child')?.parentIds).toEqual([])
    expect(next.find((t) => t.id === 'other')?.parentIds).toEqual(['root'])
  })
})
