import { describe, expect, it } from 'vitest'
import { formatGp, tileGp } from './questReqs.ts'
import {
  buildOsrsCatalogTiles,
  buildOsrsDiaryTiles,
  buildOsrsQuestTiles,
  buildOsrsSkillTiles,
  DIARY_TIERS,
  mergeOsrsSkillTiles,
  OSRS_DIARIES,
  OSRS_QUESTS,
  OSRS_SKILLS,
  osrsDiaryTileId,
  osrsDiaryTileName,
  osrsQuestTileId,
  osrsTileId,
  osrsTileName,
  pruneRemovedOsrsTiles,
  resetLockedOsrsTilesToUnseen,
  SKILL_BRACKETS,
  userPersistedTiles,
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

  it('keeps catalog status and syncs parentIds on merge', () => {
    const skillId = osrsTileId('woodcutting', '1-10')
    const diaryId = osrsDiaryTileId('kandarin', 'easy')
    const existing = [
      {
        id: skillId,
        name: 'custom',
        status: 'completed' as const,
        parentIds: ['stale'],
      },
      {
        id: diaryId,
        name: 'Kandarin Easy',
        status: 'locked' as const,
        parentIds: [],
      },
    ]
    const merged = mergeOsrsSkillTiles(existing)
    const skill = merged.find((tile) => tile.id === skillId)
    const diary = merged.find((tile) => tile.id === diaryId)
    expect(skill?.status).toBe('completed')
    expect(skill?.parentIds).toEqual([])
    expect(diary?.status).toBe('locked')
    expect(diary?.parentIds).toEqual([
      osrsTileId('agility', '11-20'),
      osrsTileId('fishing', '11-20'),
      osrsTileId('crafting', '41-50'),
      osrsTileId('farming', '11-20'),
    ])
    expect(merged).toHaveLength(412)
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

  it('persists custom tiles and catalog status changes only', () => {
    const unseen = osrsTileId('woodcutting', '1-10')
    const locked = osrsTileId('agility', '21-30')
    const tiles = [
      {
        id: unseen,
        name: 'Woodcutting 1–10',
        status: 'unseen' as const,
        parentIds: [],
      },
      {
        id: locked,
        name: 'Agility 21–30',
        status: 'locked' as const,
        parentIds: [],
      },
      {
        id: 'custom',
        name: 'Water',
        status: 'unseen' as const,
        parentIds: [],
      },
    ]
    expect(userPersistedTiles(tiles).map((tile) => tile.id)).toEqual([
      locked,
      'custom',
    ])
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
    expect(OSRS_DIARIES.every((diary) => diary.wikiTitle.length > 0)).toBe(true)
    expect(buildOsrsCatalogTiles()).toHaveLength(412)
  })

  it('names tiers and chains harder tiers before skill parents', () => {
    expect(osrsDiaryTileName('Karamja', { id: 'easy', name: 'Easy' })).toBe(
      'Karamja Easy',
    )
    const tiles = buildOsrsDiaryTiles()
    const byId = new Map(tiles.map((tile) => [tile.id, tile]))
    const isSkillParent = (id: string) =>
      id.startsWith('osrs:') && !id.startsWith('osrs:diary:')

    const easy = byId.get(osrsDiaryTileId('karamja', 'easy'))
    expect(easy?.parentIds.every(isSkillParent)).toBe(true)
    expect(easy?.parentIds.length).toBeGreaterThan(0)

    const medium = byId.get(osrsDiaryTileId('karamja', 'medium'))
    expect(medium?.parentIds[0]).toBe(osrsDiaryTileId('karamja', 'easy'))
    expect(medium?.parentIds.slice(1).every(isSkillParent)).toBe(true)

    const elite = byId.get(osrsDiaryTileId('karamja', 'elite'))
    expect(elite?.parentIds.slice(0, 3)).toEqual([
      osrsDiaryTileId('karamja', 'easy'),
      osrsDiaryTileId('karamja', 'medium'),
      osrsDiaryTileId('karamja', 'hard'),
    ])
    expect(elite?.parentIds.slice(3).every(isSkillParent)).toBe(true)
  })
})

describe('OSRS quests', () => {
  it('seeds quest tiles as unseen with quest and skill parents', () => {
    expect(OSRS_QUESTS.length).toBe(204)
    const tiles = buildOsrsQuestTiles()
    expect(tiles).toHaveLength(204)
    expect(tiles.every((tile) => tile.status === 'unseen')).toBe(true)

    const animal = tiles.find(
      (tile) => tile.id === osrsQuestTileId('animal-magnetism'),
    )
    expect(animal?.parentIds).toEqual([
      osrsQuestTileId('ernest-the-chicken'),
      osrsQuestTileId('priest-in-peril'),
      osrsQuestTileId('the-restless-ghost'),
      osrsTileId('crafting', '11-20'),
      osrsTileId('woodcutting', '31-40'),
    ])
    expect(tileGp(osrsQuestTileId('dragon-slayer-i'))).toBe(10000)
    expect(formatGp(10000)).toBe('10,000 gp')
    expect(tileGp(osrsQuestTileId('cooks-assistant'))).toBeUndefined()
  })
})
