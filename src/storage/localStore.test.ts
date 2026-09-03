import { describe, expect, it } from 'vitest'
import { parseStore, parseStoreJson, storeToJson } from './localStore.ts'

const legacy = {
  version: 1 as const,
  tiles: [
    { id: 'a', name: 'A', status: 'locked' as const, parentIds: ['b', 'b'] },
    { id: 'b', name: 'B', status: 'completed' as const, parentIds: [] },
  ],
}

const slim = {
  version: 1 as const,
  tiles: [
    { id: 'a', status: 'locked' as const },
    { id: 'b', status: 'completed' as const },
  ],
}

const starred = {
  version: 1 as const,
  tiles: [
    { id: 'a', status: 'locked' as const, starred: true },
    { id: 'b', status: 'completed' as const },
  ],
}

describe('parseStore', () => {
  it('accepts slim v1 tiles and ignores leftover name or parentIds', () => {
    expect(parseStore(legacy)).toEqual(slim)
    expect(parseStore(slim)).toEqual(slim)
  })

  it('keeps starred flags and drops starred: false', () => {
    expect(parseStore(starred)).toEqual(starred)
    expect(
      parseStore({
        version: 1,
        tiles: [
          { id: 'a', status: 'locked', starred: false },
          { id: 'b', status: 'completed' },
        ],
      }),
    ).toEqual(slim)
  })

  it('rejects bad version, tiles, or fields', () => {
    expect(parseStore(null)).toBeNull()
    expect(parseStore({ version: 2, tiles: [] })).toBeNull()
    expect(parseStore({ version: 1, tiles: 'nope' })).toBeNull()
    expect(
      parseStore({
        version: 1,
        tiles: [{ id: 'a', status: 'maybe' }],
      }),
    ).toBeNull()
    expect(
      parseStore({
        version: 1,
        tiles: [{ id: '', status: 'locked' }],
      }),
    ).toBeNull()
  })
})

describe('parseStoreJson / storeToJson', () => {
  it('round-trips a slim store', () => {
    const parsed = parseStore(slim)
    expect(parsed).not.toBeNull()
    if (!parsed) return
    expect(parseStoreJson(storeToJson(parsed))).toEqual(parsed)
  })

  it('returns null for invalid JSON', () => {
    expect(parseStoreJson('{')).toBeNull()
  })
})
