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
  partitionByKind,
  SKILL_BRACKETS,
  tileKind,
  userPersistedTiles,
} from './osrsCatalog.ts'

function catalogSize(): number {
  return (
    OSRS_SKILLS.length * SKILL_BRACKETS.length +
    OSRS_DIARIES.length * DIARY_TIERS.length +
    OSRS_QUESTS.length
  )
}

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

  it('keeps catalog status and name, and syncs parentIds on merge', () => {
    const skillId = osrsTileId('woodcutting', '1-10')
    const diaryId = osrsDiaryTileId('kandarin', 'easy')
    const existing = [
      {
        id: skillId,
        name: 'Chop trees',
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
    expect(skill?.name).toBe('Woodcutting 1–10')
    expect(skill?.status).toBe('completed')
    expect(skill?.parentIds).toEqual([])
    expect(diary?.status).toBe('locked')
    expect(diary?.parentIds).toEqual([
      osrsTileId('agility', '11-20'),
      osrsTileId('fishing', '11-20'),
      osrsTileId('crafting', '41-50'),
      osrsTileId('farming', '11-20'),
    ])
    expect(merged).toHaveLength(catalogSize())
  })

  it('ignores unknown ids on merge', () => {
    const skillId = osrsTileId('woodcutting', '1-10')
    const merged = mergeOsrsSkillTiles([
      {
        id: skillId,
        name: 'Woodcutting 1–10',
        status: 'completed',
        parentIds: ['forest'],
      },
      {
        id: 'forest',
        name: 'Forest',
        status: 'completed',
        parentIds: [],
      },
      {
        id: osrsTileId('attack', '1-10'),
        name: 'Attack 1–10',
        status: 'completed',
        parentIds: [],
      },
    ])
    expect(merged).toHaveLength(catalogSize())
    expect(merged.find((tile) => tile.id === 'forest')).toBeUndefined()
    expect(
      merged.find((tile) => tile.id === osrsTileId('attack', '1-10')),
    ).toBeUndefined()
    expect(merged.find((tile) => tile.id === skillId)?.parentIds).toEqual([])
  })

  it('persists catalog status changes only', () => {
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
    ]
    expect(userPersistedTiles(tiles).map((tile) => tile.id)).toEqual([locked])
  })

  it('classifies catalog ids by kind', () => {
    expect(tileKind(osrsTileId('agility', '21-30'))).toBe('skill')
    expect(tileKind(osrsDiaryTileId('kandarin', 'easy'))).toBe('diary')
    expect(tileKind(osrsQuestTileId('dragon-slayer-i'))).toBe('quest')
    expect(tileKind('forest')).toBeNull()
    const grouped = partitionByKind([
      {
        id: osrsTileId('agility', '1-10'),
        name: 'Agility 1–10',
        status: 'completed',
        parentIds: [],
      },
      {
        id: osrsDiaryTileId('kandarin', 'easy'),
        name: 'Kandarin Easy',
        status: 'completed',
        parentIds: [],
      },
      {
        id: osrsQuestTileId('dragon-slayer-i'),
        name: 'Dragon Slayer I',
        status: 'completed',
        parentIds: [],
      },
      {
        id: 'forest',
        name: 'Forest',
        status: 'completed',
        parentIds: [],
      },
    ])
    expect(grouped.skill).toHaveLength(1)
    expect(grouped.diary).toHaveLength(1)
    expect(grouped.quest).toHaveLength(1)
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
    expect(buildOsrsCatalogTiles()).toHaveLength(catalogSize())
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
    expect(OSRS_QUESTS.map((quest) => quest.id)).toEqual(
      expect.arrayContaining([
        'current-affairs',
        'the-ides-of-milk',
        'pandemonium',
        'animal-magnetism',
      ]),
    )
    const tiles = buildOsrsQuestTiles()
    expect(tiles).toHaveLength(OSRS_QUESTS.length)
    expect(OSRS_QUESTS.some((quest) => quest.id === 'enter-the-abyss')).toBe(
      false,
    )
    expect(
      OSRS_QUESTS.some((quest) => quest.id === 'alfred-grimhands-barcrawl'),
    ).toBe(false)
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

    const current = tiles.find(
      (tile) => tile.id === osrsQuestTileId('current-affairs'),
    )
    expect(current?.parentIds).toEqual([
      osrsQuestTileId('pandemonium'),
      osrsTileId('sailing', '21-30'),
      osrsTileId('fishing', '1-10'),
    ])
    expect(
      tiles.find((tile) => tile.id === osrsQuestTileId('the-ides-of-milk'))
        ?.parentIds,
    ).toEqual([])
  })
})
