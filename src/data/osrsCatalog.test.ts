import { describe, expect, it } from 'vitest'
import { formatGp } from './questReqs.ts'
import {
  CATALOG,
  CATALOG_BY_ID,
  DIARY_TIERS,
  OSRS_DIARIES,
  OSRS_QUESTS,
  OSRS_SKILLS,
  osrsDiaryTileId,
  osrsDiaryTileName,
  osrsQuestTileId,
  osrsTileId,
  osrsTileName,
  parentIdsFor,
  filterTilesByKind,
  partitionByKind,
  setStoredStarred,
  setStoredStatus,
  SKILL_BRACKETS,
  starredFromStored,
  statusesFromStored,
  storedTilesFromStatuses,
  tileDifficulty,
  tileGp,
  tileItems,
  tileKind,
  tileLength,
  tileRewards,
  tileSlayerMaster,
  tilesFromStatuses,
} from './osrsCatalog.ts'

function catalogSize(): number {
  return (
    OSRS_SKILLS.length * SKILL_BRACKETS.length +
    OSRS_DIARIES.length * DIARY_TIERS.length +
    OSRS_QUESTS.length
  )
}

function unseenTiles() {
  return tilesFromStatuses(new Map())
}

describe('OSRS skill catalog', () => {
  it('covers non-combat skills and 10 brackets', () => {
    expect(OSRS_SKILLS).toHaveLength(16)
    expect(SKILL_BRACKETS).toHaveLength(10)
    const skills = CATALOG.filter((def) => def.kind === 'skill')
    expect(skills).toHaveLength(160)
    expect(unseenTiles().every((tile) => tile.status === 'unseen')).toBe(true)
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
    const first = CATALOG_BY_ID.get(osrsTileId('woodcutting', '1-10'))
    expect(first && parentIdsFor(first)).toEqual([])

    const mid = CATALOG_BY_ID.get(osrsTileId('woodcutting', '21-30'))
    expect(mid && parentIdsFor(mid)).toEqual([
      osrsTileId('woodcutting', '1-10'),
      osrsTileId('woodcutting', '11-20'),
    ])

    const cape = CATALOG_BY_ID.get(osrsTileId('woodcutting', '91-99'))
    expect(cape && parentIdsFor(cape)).toHaveLength(9)
    expect(cape && parentIdsFor(cape).at(-1)).toBe(
      osrsTileId('woodcutting', '81-90'),
    )
  })

  it('parents first-bracket quest unlocks from the skill quest catalog', () => {
    const herblore = CATALOG_BY_ID.get(osrsTileId('herblore', '1-10'))
    expect(herblore && parentIdsFor(herblore)).toEqual([
      osrsQuestTileId('druidic-ritual'),
    ])

    const sailing = CATALOG_BY_ID.get(osrsTileId('sailing', '1-10'))
    expect(sailing && parentIdsFor(sailing)).toEqual([
      osrsQuestTileId('pandemonium'),
    ])

    const later = CATALOG_BY_ID.get(osrsTileId('herblore', '11-20'))
    expect(later && parentIdsFor(later)).toEqual([
      osrsTileId('herblore', '1-10'),
    ])
  })

  it('overlays stored status and keeps catalog names and parents', () => {
    const skillId = osrsTileId('woodcutting', '1-10')
    const diaryId = osrsDiaryTileId('kandarin', 'easy')
    const tiles = tilesFromStatuses(
      statusesFromStored([
        { id: skillId, status: 'completed' },
        { id: diaryId, status: 'locked' },
      ]),
    )
    const skill = tiles.find((tile) => tile.id === skillId)
    const diary = tiles.find((tile) => tile.id === diaryId)
    expect(skill?.name).toBe('Woodcutting 1–10')
    expect(skill?.status).toBe('completed')
    expect(skill?.parentIds).toEqual([])
    expect(skill?.starred).toBe(false)
    expect(diary?.status).toBe('locked')
    expect(diary?.parentIds).toEqual([
      osrsTileId('agility', '11-20'),
      osrsTileId('fishing', '11-20'),
      osrsTileId('crafting', '41-50'),
      osrsTileId('farming', '11-20'),
    ])
    expect(tiles).toHaveLength(catalogSize())
  })

  it('ignores unknown ids when overlaying statuses', () => {
    const skillId = osrsTileId('woodcutting', '1-10')
    const tiles = tilesFromStatuses(
      statusesFromStored([
        { id: skillId, status: 'completed' },
        { id: 'forest', status: 'completed' },
        { id: osrsTileId('attack', '1-10'), status: 'completed' },
      ]),
    )
    expect(tiles).toHaveLength(catalogSize())
    expect(tiles.find((tile) => tile.id === 'forest')).toBeUndefined()
    expect(
      tiles.find((tile) => tile.id === osrsTileId('attack', '1-10')),
    ).toBeUndefined()
    expect(tiles.find((tile) => tile.id === skillId)?.status).toBe('completed')
    expect(tiles.find((tile) => tile.id === skillId)?.parentIds).toEqual([])
  })

  it('persists catalog status changes only', () => {
    const unseen = osrsTileId('woodcutting', '1-10')
    const locked = osrsTileId('agility', '21-30')
    const statuses = statusesFromStored([
      { id: unseen, status: 'unseen' },
      { id: locked, status: 'locked' },
    ])
    expect(storedTilesFromStatuses(statuses).map((tile) => tile.id)).toEqual([
      locked,
    ])
  })

  it('overlays and persists starred flags on stored tiles', () => {
    const locked = osrsTileId('agility', '21-30')
    const stored = statusesFromStored([{ id: locked, status: 'locked' }])
    const starred = starredFromStored([
      { id: locked, status: 'locked', starred: true },
      {
        id: osrsTileId('woodcutting', '1-10'),
        status: 'unseen',
        starred: true,
      },
      { id: 'forest', status: 'locked', starred: true },
    ])
    expect([...starred]).toEqual([locked])
    expect(
      tilesFromStatuses(stored, starred).find((tile) => tile.id === locked)
        ?.starred,
    ).toBe(true)
    expect(storedTilesFromStatuses(stored, starred)).toEqual([
      { id: locked, status: 'locked', starred: true },
    ])
    expect(setStoredStarred(starred, 'forest', true)).toBeNull()
    expect(setStoredStarred(starred, locked, false)?.has(locked)).toBe(false)
  })

  it('rejects unknown ids when setting status', () => {
    const id = osrsTileId('woodcutting', '1-10')
    const statuses = new Map([[id, 'locked' as const]])
    expect(setStoredStatus(statuses, 'forest', 'completed')).toBeNull()
    const unseen = setStoredStatus(statuses, id, 'unseen')
    expect(unseen?.has(id)).toBe(false)
    const completed = setStoredStatus(statuses, id, 'completed')
    expect(completed?.get(id)).toBe('completed')
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
        starred: false,
      },
      {
        id: osrsDiaryTileId('kandarin', 'easy'),
        name: 'Kandarin Easy',
        status: 'completed',
        parentIds: [],
        starred: false,
      },
      {
        id: osrsQuestTileId('dragon-slayer-i'),
        name: 'Dragon Slayer I',
        status: 'completed',
        parentIds: [],
        starred: false,
      },
      {
        id: 'forest',
        name: 'Forest',
        status: 'completed',
        parentIds: [],
        starred: false,
      },
    ])
    expect(grouped.skill).toHaveLength(1)
    expect(grouped.diary).toHaveLength(1)
    expect(grouped.quest).toHaveLength(1)
    expect(
      filterTilesByKind(
        [
          grouped.skill[0]!,
          grouped.diary[0]!,
          grouped.quest[0]!,
          {
            id: 'forest',
            name: 'Forest',
            status: 'locked',
            parentIds: [],
            starred: false,
          },
        ],
        { skill: false, diary: true, quest: true },
      ).map((tile) => tile.id),
    ).toEqual([
      osrsDiaryTileId('kandarin', 'easy'),
      osrsQuestTileId('dragon-slayer-i'),
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
    const diaries = CATALOG.filter((def) => def.kind === 'diary')
    expect(diaries).toHaveLength(48)
    expect(OSRS_DIARIES.map((diary) => diary.name)).toContain('Karamja')
    expect(OSRS_DIARIES.every((diary) => diary.wikiTitle.length > 0)).toBe(true)
    expect(CATALOG).toHaveLength(catalogSize())
  })

  it('names tiers and chains harder tiers before skill parents', () => {
    expect(osrsDiaryTileName('Karamja', { id: 'easy', name: 'Easy' })).toBe(
      'Karamja Easy',
    )
    const isSkillParent = (id: string) =>
      id.startsWith('osrs:') && !id.startsWith('osrs:diary:')

    const easy = CATALOG_BY_ID.get(osrsDiaryTileId('karamja', 'easy'))
    const easyParents = easy ? parentIdsFor(easy) : []
    expect(easyParents.every(isSkillParent)).toBe(true)
    expect(easyParents.length).toBeGreaterThan(0)

    const medium = CATALOG_BY_ID.get(osrsDiaryTileId('karamja', 'medium'))
    const mediumParents = medium ? parentIdsFor(medium) : []
    expect(mediumParents[0]).toBe(osrsDiaryTileId('karamja', 'easy'))
    expect(mediumParents.slice(1).every(isSkillParent)).toBe(true)

    const elite = CATALOG_BY_ID.get(osrsDiaryTileId('karamja', 'elite'))
    const eliteParents = elite ? parentIdsFor(elite) : []
    expect(eliteParents.slice(0, 3)).toEqual([
      osrsDiaryTileId('karamja', 'easy'),
      osrsDiaryTileId('karamja', 'medium'),
      osrsDiaryTileId('karamja', 'hard'),
    ])
    expect(eliteParents.slice(3).every(isSkillParent)).toBe(true)
    expect(tileRewards(osrsDiaryTileId('karamja', 'easy'))[0]).toBe(
      'Karamja gloves 1',
    )
    expect(tileRewards(osrsTileId('agility', '1-10'))).toEqual([])
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
    const quests = CATALOG.filter((def) => def.kind === 'quest')
    expect(quests).toHaveLength(OSRS_QUESTS.length)
    expect(OSRS_QUESTS.some((quest) => quest.id === 'enter-the-abyss')).toBe(
      false,
    )
    expect(
      OSRS_QUESTS.some((quest) => quest.id === 'alfred-grimhands-barcrawl'),
    ).toBe(false)

    const animal = CATALOG_BY_ID.get(osrsQuestTileId('animal-magnetism'))
    expect(animal && parentIdsFor(animal)).toEqual([
      osrsQuestTileId('ernest-the-chicken'),
      osrsQuestTileId('priest-in-peril'),
      osrsQuestTileId('the-restless-ghost'),
      osrsTileId('crafting', '11-20'),
      osrsTileId('woodcutting', '31-40'),
    ])
    expect(tileGp(osrsQuestTileId('dragon-slayer-i'))).toBe(10000)
    expect(formatGp(10000)).toBe('10,000 gp')
    expect(tileGp(osrsQuestTileId('cooks-assistant'))).toBeUndefined()
    expect(tileRewards(osrsQuestTileId('cooks-assistant'))).toEqual([
      '1 Quest point',
      '300 Cooking experience',
      'Permission to use the Cook-o-matic 100, which reduces the chance of burning some foods',
    ])
    expect(tileRewards(osrsQuestTileId('dragon-slayer-i'))[0]).toBe(
      '2 Quest points',
    )
    expect(tileDifficulty(osrsQuestTileId('cooks-assistant'))).toBe('Novice')
    expect(tileLength(osrsQuestTileId('cooks-assistant'))).toBe('Very Short')
    expect(tileItems(osrsQuestTileId('cooks-assistant'))[0]).toMatch(/Egg/i)
    expect(tileDifficulty(osrsTileId('agility', '1-10'))).toBeUndefined()
    expect(tileItems(osrsDiaryTileId('kandarin', 'easy'))).toEqual([])

    const current = CATALOG_BY_ID.get(osrsQuestTileId('current-affairs'))
    expect(current && parentIdsFor(current)).toEqual([
      osrsQuestTileId('pandemonium'),
      osrsTileId('sailing', '21-30'),
      osrsTileId('fishing', '1-10'),
    ])
    const milk = CATALOG_BY_ID.get(osrsQuestTileId('the-ides-of-milk'))
    expect(milk && parentIdsFor(milk)).toEqual([])
  })

  it('marks quests that unlock slayer masters', () => {
    expect(tileSlayerMaster(osrsQuestTileId('a-porcine-of-interest'))).toEqual({
      name: 'Spria',
      wikiTitle: 'Spria',
    })
    expect(tileSlayerMaster(osrsQuestTileId('priest-in-peril'))).toEqual({
      name: 'Mazchna',
      wikiTitle: 'Mazchna',
    })
    expect(tileSlayerMaster(osrsQuestTileId('lost-city'))).toEqual({
      name: 'Chaeldar',
      wikiTitle: 'Chaeldar',
    })
    expect(tileSlayerMaster(osrsQuestTileId('shilo-village'))).toEqual({
      name: 'Duradel',
      wikiTitle: 'Duradel',
    })
    expect(tileSlayerMaster(osrsQuestTileId('fallen-from-grace'))).toEqual({
      name: 'Mortimer',
      wikiTitle: 'Mortimer',
    })
    expect(tileSlayerMaster(osrsQuestTileId('cooks-assistant'))).toBeUndefined()
    expect(tileSlayerMaster(osrsTileId('agility', '1-10'))).toBeUndefined()
  })
})
