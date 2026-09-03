import { describe, expect, it } from 'vitest'
import {
  blockingParentCounts,
  groupTilesByReadiness,
  tileReadiness,
  tilesById,
} from './readiness.ts'
import type { Tile } from './types.ts'

function tile(
  id: string,
  status: Tile['status'],
  parentIds: string[] = [],
  name = id,
  starred = false,
): Tile {
  return { id, name, status, parentIds, starred }
}

describe('tileReadiness', () => {
  it('returns completed when status is completed', () => {
    const parent = tile('p', 'locked')
    const child = tile('c', 'completed', ['p'])
    expect(tileReadiness(child, tilesById([parent, child]))).toBe('completed')
  })

  it('returns unlocked when status is unlocked', () => {
    const lockedParent = tile('p', 'locked')
    const child = tile('c', 'unlocked', ['p'])
    expect(tileReadiness(child, tilesById([lockedParent, child]))).toBe(
      'unlocked',
    )
  })

  it('returns unseen even if all parents are unlocked', () => {
    const parent = tile('p', 'unlocked')
    const child = tile('c', 'unseen', ['p'])
    expect(tileReadiness(child, tilesById([parent, child]))).toBe('unseen')
  })

  it('is ready when locked with no parents', () => {
    const lone = tile('a', 'locked')
    expect(tileReadiness(lone, tilesById([lone]))).toBe('ready')
  })

  it('is ready when locked and every parent is unlocked', () => {
    const a = tile('a', 'unlocked')
    const b = tile('b', 'unlocked')
    const c = tile('c', 'locked', ['a', 'b'])
    expect(tileReadiness(c, tilesById([a, b, c]))).toBe('ready')
  })

  it('is ready when parents are a mix of unlocked and completed', () => {
    const a = tile('a', 'unlocked')
    const b = tile('b', 'completed')
    const c = tile('c', 'locked', ['a', 'b'])
    expect(tileReadiness(c, tilesById([a, b, c]))).toBe('ready')
  })

  it('is possible when a parent is locked', () => {
    const a = tile('a', 'unlocked')
    const b = tile('b', 'locked')
    const c = tile('c', 'locked', ['a', 'b'])
    expect(tileReadiness(c, tilesById([a, b, c]))).toBe('possible')
  })

  it('is possible when every parent is locked', () => {
    const a = tile('a', 'locked')
    const b = tile('b', 'locked')
    const c = tile('c', 'locked', ['a', 'b'])
    expect(tileReadiness(c, tilesById([a, b, c]))).toBe('possible')
  })

  it('is possible when parents mix locked and completed', () => {
    const a = tile('a', 'completed')
    const b = tile('b', 'locked')
    const c = tile('c', 'locked', ['a', 'b'])
    expect(tileReadiness(c, tilesById([a, b, c]))).toBe('possible')
  })

  it('is blocked when a parent is unseen', () => {
    const a = tile('a', 'unseen')
    const b = tile('b', 'locked', ['a'])
    expect(tileReadiness(b, tilesById([a, b]))).toBe('blocked')
  })

  it('is blocked when any parent is unseen even if others are on the board', () => {
    const a = tile('a', 'locked')
    const b = tile('b', 'unseen')
    const c = tile('c', 'locked', ['a', 'b'])
    expect(tileReadiness(c, tilesById([a, b, c]))).toBe('blocked')
  })

  it('is blocked when a parent id is missing', () => {
    const child = tile('c', 'locked', ['missing'])
    expect(tileReadiness(child, tilesById([child]))).toBe('blocked')
  })
})

describe('blockingParentCounts', () => {
  it('splits unmet parents into locked vs unseen, including missing', () => {
    const a = tile('a', 'unlocked')
    const b = tile('b', 'locked')
    const c = tile('c', 'completed')
    const d = tile('d', 'unseen')
    const child = tile('e', 'locked', ['a', 'b', 'c', 'd', 'missing'])
    expect(blockingParentCounts(child, tilesById([a, b, c, d, child]))).toEqual(
      {
        locked: 1,
        unseen: 2,
      },
    )
  })

  it('counts only locked when every unmet parent is on the board', () => {
    const a = tile('a', 'unlocked')
    const b = tile('b', 'locked')
    const c = tile('c', 'locked')
    const child = tile('d', 'locked', ['a', 'b', 'c'])
    expect(blockingParentCounts(child, tilesById([a, b, c, child]))).toEqual({
      locked: 2,
      unseen: 0,
    })
  })

  it('counts only unseen when no unmet parent is locked', () => {
    const a = tile('a', 'unseen')
    const child = tile('b', 'locked', ['a', 'missing'])
    expect(blockingParentCounts(child, tilesById([a, child]))).toEqual({
      locked: 0,
      unseen: 2,
    })
  })

  it('is zero when every parent is unlocked or completed', () => {
    const a = tile('a', 'unlocked')
    const b = tile('b', 'completed')
    const child = tile('c', 'locked', ['a', 'b'])
    expect(blockingParentCounts(child, tilesById([a, b, child]))).toEqual({
      locked: 0,
      unseen: 0,
    })
  })
})

describe('groupTilesByReadiness', () => {
  it('sorts each group by name', () => {
    const tiles = [
      tile('2', 'locked', [], 'Beta'),
      tile('1', 'locked', [], 'Alpha'),
      tile('3', 'unlocked', [], 'Zed'),
      tile('4', 'unseen', [], 'Ghost'),
      tile('5', 'locked', ['missing'], 'Wait'),
      tile('7', 'locked', ['2'], 'Soon'),
      tile('6', 'completed', [], 'Done'),
    ]
    const groups = groupTilesByReadiness(tiles)
    expect(groups.ready.map((t) => t.name)).toEqual(['Alpha', 'Beta'])
    expect(groups.possible.map((t) => t.name)).toEqual(['Soon'])
    expect(groups.blocked.map((t) => t.name)).toEqual(['Wait'])
    expect(groups.unseen.map((t) => t.name)).toEqual(['Ghost'])
    expect(groups.unlocked.map((t) => t.name)).toEqual(['Zed'])
    expect(groups.completed.map((t) => t.name)).toEqual(['Done'])
  })

  it('sorts starred tiles first, then by name', () => {
    const tiles = [
      tile('2', 'locked', [], 'Beta'),
      tile('1', 'locked', [], 'Alpha'),
      tile('3', 'locked', [], 'Zed', true),
      tile('4', 'locked', [], 'Mid', true),
    ]
    expect(groupTilesByReadiness(tiles).ready.map((t) => t.name)).toEqual([
      'Mid',
      'Zed',
      'Alpha',
      'Beta',
    ])
  })
})
