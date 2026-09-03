import { describe, expect, it } from 'vitest'
import { parseStore, parseStoreJson, storeToJson } from './localStore.ts'

const valid = {
  version: 1 as const,
  tiles: [
    { id: 'a', name: 'A', status: 'locked' as const, parentIds: ['b', 'b'] },
    { id: 'b', name: 'B', status: 'completed' as const, parentIds: [] },
  ],
}

describe('parseStore', () => {
  it('accepts v1 and dedupes parent ids', () => {
    const store = parseStore(valid)
    expect(store).toEqual({
      version: 1,
      tiles: [
        { id: 'a', name: 'A', status: 'locked', parentIds: ['b'] },
        { id: 'b', name: 'B', status: 'completed', parentIds: [] },
      ],
    })
  })

  it('rejects bad version, tiles, or fields', () => {
    expect(parseStore(null)).toBeNull()
    expect(parseStore({ version: 2, tiles: [] })).toBeNull()
    expect(parseStore({ version: 1, tiles: 'nope' })).toBeNull()
    expect(
      parseStore({
        version: 1,
        tiles: [{ id: 'a', name: 'A', status: 'maybe', parentIds: [] }],
      }),
    ).toBeNull()
    expect(
      parseStore({
        version: 1,
        tiles: [{ id: '', name: 'A', status: 'locked', parentIds: [] }],
      }),
    ).toBeNull()
  })
})

describe('parseStoreJson / storeToJson', () => {
  it('round-trips a valid store', () => {
    const parsed = parseStore(valid)
    expect(parsed).not.toBeNull()
    if (!parsed) return
    expect(parseStoreJson(storeToJson(parsed))).toEqual(parsed)
  })

  it('returns null for invalid JSON', () => {
    expect(parseStoreJson('{')).toBeNull()
  })
})
