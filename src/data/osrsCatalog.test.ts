import { describe, expect, it } from 'vitest'
import {
  buildOsrsCatalogTiles,
  buildOsrsDiaryTiles,
  buildOsrsSkillTiles,
  DIARY_TIERS,
  mergeOsrsSkillTiles,
  OSRS_DIARIES,
  OSRS_SKILLS,
  osrsDiaryTileId,
  osrsDiaryTileName,
  osrsTileId,
  osrsTileName,
  pruneRemovedOsrsTiles,
  resetLockedOsrsTilesToUnseen,
  SKILL_BRACKETS,
} from './osrsCatalog.ts'

describe('OSRS skill catalog', () => {
  it('covers non-combat skills and 10 brackets', () => {
    expect(OSRS_SKILLS).toHaveLength(16)
    expect(SKILL_BRACKETS).toHaveLength(10)
    const catalog = buildOsrsSkillTiles()
    expect(catalog).toHaveLength(160)
    expect(catalog.every((tile) => tile.status === 'unseen')).toBe(true)
    expect(OSRS_SKILLS.map((skill) => skill.id)).toContain('sailing')
    expect(OSRS_SKILLS.map((skill) => skill.name)).toContain('Woodcutting')
    expect(OSRS_SKILLS.map((skill) => skill.id)).not.toContain('attack')
    expect(OSRS_SKILLS.map((skill) => skill.id)).not.toContain('magic')
    expect(OSRS_SKILLS.map((skill) => skill.id)).not.toContain('slayer')
  })

  it('names ranges and the skill cape', () => {
    const cape = SKILL_BRACKETS.find((bracket) => bracket.cape)
    expect(cape).toBeDefined()
    if (!cape) return
    expect(osrsTileName('Woodcutting', { id: '1-10', min: 1, max: 10 })).toBe(
      'Woodcutting 1–10',
    )
    expect(osrsTileName('Woodcutting', cape)).toBe(
      'Get the Woodcutting skill cape',
    )
  })

  it('chains every earlier bracket as a parent', () => {
    const tiles = buildOsrsSkillTiles()
    const byId = new Map(tiles.map((tile) => [tile.id, tile]))

    const first = byId.get(osrsTileId('woodcutting', '1-10'))
    expect(first?.parentIds).toEqual([])

    const mid = byId.get(osrsTileId('woodcutting', '21-30'))
    expect(mid?.parentIds).toEqual([
      osrsTileId('woodcutting', '1-10'),
      osrsTileId('woodcutting', '11-20'),
    ])

    const cape = byId.get(osrsTileId('woodcutting', '91-99'))
    expect(cape?.parentIds).toHaveLength(9)
    expect(cape?.parentIds.at(-1)).toBe(osrsTileId('woodcutting', '81-90'))
  })

  it('does not overwrite existing catalog tiles on merge', () => {
    const id = osrsTileId('woodcutting', '1-10')
    const existing = [
      {
        id,
        name: 'custom',
        status: 'completed' as const,
        parentIds: [],
      },
    ]
    const merged = mergeOsrsSkillTiles(existing)
    expect(merged.find((tile) => tile.id === id)?.status).toBe('completed')
    expect(merged).toHaveLength(208)
  })

  it('prunes removed combat skill tiles and dangling parents', () => {
    const stale = osrsTileId('attack', '1-10')
    const next = pruneRemovedOsrsTiles([
      {
        id: stale,
        name: 'Attack 1–10',
        status: 'unseen',
        parentIds: [],
      },
      {
        id: 'custom',
        name: 'Forest',
        status: 'locked',
        parentIds: [stale],
      },
    ])
    expect(next.map((tile) => tile.id)).toEqual(['custom'])
    expect(next[0]?.parentIds).toEqual([])
  })

  it('resets only locked catalog tiles to unseen', () => {
    const id = osrsTileId('woodcutting', '1-10')
    const tiles = [
      {
        id,
        name: 'Woodcutting 1–10',
        status: 'locked' as const,
        parentIds: [],
      },
      {
        id: 'custom',
        name: 'Forest',
        status: 'locked' as const,
        parentIds: [],
      },
      {
        id: osrsTileId('attack', '1-10'),
        name: 'Attack 1–10',
        status: 'completed' as const,
        parentIds: [],
      },
    ]
    const next = resetLockedOsrsTilesToUnseen(tiles)
    expect(next.find((tile) => tile.id === id)?.status).toBe('unseen')
    expect(next.find((tile) => tile.id === 'custom')?.status).toBe('locked')
    expect(
      next.find((tile) => tile.id === osrsTileId('attack', '1-10'))?.status,
    ).toBe('completed')
  })
})

describe('OSRS achievement diaries', () => {
  it('covers 12 diaries and 4 tiers as unseen', () => {
    expect(OSRS_DIARIES).toHaveLength(12)
    expect(DIARY_TIERS.map((tier) => tier.id)).toEqual([
      'easy',
      'medium',
      'hard',
      'elite',
    ])
    const tiles = buildOsrsDiaryTiles()
    expect(tiles).toHaveLength(48)
    expect(tiles.every((tile) => tile.status === 'unseen')).toBe(true)
    expect(OSRS_DIARIES.map((diary) => diary.name)).toContain('Karamja')
    expect(buildOsrsCatalogTiles()).toHaveLength(208)
  })

  it('names tiers and chains harder tiers on easier ones', () => {
    expect(osrsDiaryTileName('Karamja', { id: 'easy', name: 'Easy' })).toBe(
      'Karamja Easy',
    )
    const tiles = buildOsrsDiaryTiles()
    const byId = new Map(tiles.map((tile) => [tile.id, tile]))

    expect(byId.get(osrsDiaryTileId('karamja', 'easy'))?.parentIds).toEqual([])
    expect(byId.get(osrsDiaryTileId('karamja', 'medium'))?.parentIds).toEqual([
      osrsDiaryTileId('karamja', 'easy'),
    ])
    expect(byId.get(osrsDiaryTileId('karamja', 'elite'))?.parentIds).toEqual([
      osrsDiaryTileId('karamja', 'easy'),
      osrsDiaryTileId('karamja', 'medium'),
      osrsDiaryTileId('karamja', 'hard'),
    ])
  })
})
