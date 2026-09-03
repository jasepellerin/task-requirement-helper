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
  tileImage,
  tileItems,
  tileKind,
  tileLength,
  tileMinigames,
  tileRewards,
  tileSlayerMaster,
  tileSlayerMonsters,
  tileTeleportItems,
  tileTeleports,
  tileTransport,
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
    expect(tileImage(osrsQuestTileId('cooks-assistant'))).toBe(
      "Cook's Assistant.png",
    )
    expect(
      OSRS_QUESTS.every((quest) => tileImage(osrsQuestTileId(quest.id))),
    ).toBe(true)
    expect(tileImage(osrsTileId('agility', '1-10'))).toBeUndefined()
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

  it('applies quest req overrides after the wiki dump', () => {
    const fremennik = CATALOG_BY_ID.get(osrsQuestTileId('the-fremennik-trials'))
    expect(fremennik && parentIdsFor(fremennik)).toEqual([
      osrsTileId('fletching', '21-30'),
      osrsTileId('woodcutting', '31-40'),
      osrsTileId('crafting', '31-40'),
    ])
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

  it('marks quests that unlock slayer monsters', () => {
    expect(tileSlayerMonsters(osrsQuestTileId('horror-from-the-deep'))).toEqual(
      [{ name: 'Dagannoth', wikiTitle: 'Dagannoth' }],
    )
    expect(
      tileSlayerMonsters(osrsQuestTileId('priest-in-peril')).map(
        (monster) => monster.name,
      ),
    ).toEqual(expect.arrayContaining(['Banshees', 'Bloodveld', 'Gargoyles']))
    expect(
      tileSlayerMonsters(osrsQuestTileId('a-porcine-of-interest')),
    ).toEqual([{ name: 'Sourhogs', wikiTitle: 'Sourhog' }])
    expect(
      tileSlayerMonsters(osrsQuestTileId('dragon-slayer-i')).map(
        (monster) => monster.name,
      ),
    ).toContain('Metal dragons')
    expect(tileSlayerMonsters(osrsQuestTileId('cooks-assistant'))).toEqual([])
    expect(tileSlayerMonsters(osrsTileId('agility', '1-10'))).toEqual([])
    const marked = CATALOG.filter(
      (def) => (def.slayerMonsters?.length ?? 0) > 0,
    )
    expect(marked.length).toBeGreaterThan(20)
    expect(marked.every((def) => def.kind === 'quest')).toBe(true)
  })

  it('marks quests that unlock transportation', () => {
    expect(tileTransport(osrsQuestTileId('fairytale-ii-cure-a-queen'))).toEqual(
      [{ name: 'Fairy rings', wikiTitle: 'Fairy rings' }],
    )
    expect(tileTransport(osrsQuestTileId('tree-gnome-village'))).toEqual([
      { name: 'Spirit trees', wikiTitle: 'Spirit tree' },
    ])
    expect(tileTransport(osrsQuestTileId('enlightened-journey'))).toEqual([
      { name: 'Balloon transport', wikiTitle: 'Balloon transport system' },
    ])
    expect(
      tileTransport(osrsQuestTileId('the-grand-tree')).map(
        (method) => method.name,
      ),
    ).toEqual(['Gnome gliders', 'Spirit trees (Stronghold)'])
    expect(tileTransport(osrsQuestTileId('cooks-assistant'))).toEqual([])
    expect(tileTransport(osrsTileId('agility', '1-10'))).toEqual([])
    const marked = CATALOG.filter((def) => (def.transport?.length ?? 0) > 0)
    expect(marked).toHaveLength(14)
    expect(marked.every((def) => def.kind === 'quest')).toBe(true)
  })

  it('marks quests that unlock teleport spells', () => {
    expect(tileTeleports(osrsQuestTileId('plague-city'))).toEqual([
      { name: 'Ardougne Teleport', wikiTitle: 'Ardougne Teleport' },
    ])
    expect(tileTeleports(osrsQuestTileId('watchtower'))).toEqual([
      { name: 'Watchtower Teleport', wikiTitle: 'Watchtower Teleport' },
    ])
    expect(tileTeleports(osrsQuestTileId('desert-treasure-i'))).toEqual([
      { name: 'Ancient Magicks teleports', wikiTitle: 'Ancient Magicks' },
    ])
    expect(tileTeleports(osrsQuestTileId('lunar-diplomacy'))).toEqual([
      { name: 'Lunar teleports', wikiTitle: 'Lunar spells' },
    ])
    expect(tileTeleports(osrsQuestTileId('cooks-assistant'))).toEqual([])
    expect(tileTeleports(osrsTileId('agility', '1-10'))).toEqual([])
    const marked = CATALOG.filter((def) => (def.teleports?.length ?? 0) > 0)
    expect(marked).toHaveLength(12)
    expect(marked.every((def) => def.kind === 'quest')).toBe(true)
  })

  it('marks quests that reward teleport items', () => {
    expect(tileTeleportItems(osrsQuestTileId('ghosts-ahoy'))).toEqual([
      { name: 'Ectophial', wikiTitle: 'Ectophial', icon: 'ectophial.png' },
    ])
    expect(tileTeleportItems(osrsQuestTileId('monkey-madness-ii'))).toEqual([
      {
        name: 'Royal seed pod',
        wikiTitle: 'Royal seed pod',
        icon: 'royal-seed-pod.png',
      },
    ])
    expect(tileTeleportItems(osrsQuestTileId('mournings-end-part-i'))).toEqual([
      {
        name: 'Teleport crystal',
        wikiTitle: 'Teleport crystal',
        icon: 'teleport-crystal.png',
      },
    ])
    expect(
      tileTeleportItems(osrsQuestTileId('making-friends-with-my-arm')).map(
        (item) => item.name,
      ),
    ).toEqual(['Stony basalt', 'Icy basalt'])
    expect(tileTeleportItems(osrsQuestTileId('the-depths-of-despair'))).toEqual(
      [
        {
          name: 'Lunch by the Lancalliums',
          wikiTitle: 'Lunch by the Lancalliums',
          icon: 'lunch-by-the-lancalliums.png',
        },
      ],
    )
    expect(tileTeleportItems(osrsQuestTileId('the-queen-of-thieves'))).toEqual([
      {
        name: "The Fisher's Flute",
        wikiTitle: "The Fisher's Flute",
        icon: 'the-fishers-flute.png',
      },
    ])
    expect(tileTeleportItems(osrsQuestTileId('tale-of-the-righteous'))).toEqual(
      [
        {
          name: 'History and Hearsay',
          wikiTitle: 'History and Hearsay',
          icon: 'history-and-hearsay.png',
        },
      ],
    )
    expect(tileTeleportItems(osrsQuestTileId('the-forsaken-tower'))).toEqual([
      {
        name: 'Jewellery of Jubilation',
        wikiTitle: 'Jewellery of Jubilation',
        icon: 'jewellery-of-jubilation.png',
      },
    ])
    expect(tileTeleportItems(osrsQuestTileId('the-ascent-of-arceuus'))).toEqual(
      [
        {
          name: 'A Dark Disposition',
          wikiTitle: 'A Dark Disposition',
          icon: 'a-dark-disposition.png',
        },
      ],
    )
    expect(tileTeleportItems(osrsQuestTileId('cooks-assistant'))).toEqual([])
    expect(tileTeleportItems(osrsTileId('agility', '1-10'))).toEqual([])
    const marked = CATALOG.filter((def) => (def.teleportItems?.length ?? 0) > 0)
    expect(marked).toHaveLength(18)
    expect(marked.every((def) => def.kind === 'quest')).toBe(true)
  })

  it('marks quests that unlock minigames', () => {
    expect(tileMinigames(osrsQuestTileId('temple-of-the-eye'))).toEqual([
      { name: 'Guardians of the Rift', wikiTitle: 'Guardians of the Rift' },
    ])
    expect(tileMinigames(osrsQuestTileId('sleeping-giants'))).toEqual([
      { name: "Giants' Foundry", wikiTitle: "Giants' Foundry" },
    ])
    expect(tileMinigames(osrsQuestTileId('tears-of-guthix'))).toEqual([
      { name: 'Tears of Guthix', wikiTitle: 'Tears of Guthix' },
    ])
    expect(tileMinigames(osrsQuestTileId('sins-of-the-father'))).toEqual([
      { name: 'Hallowed Sepulchre', wikiTitle: 'Hallowed Sepulchre' },
    ])
    expect(tileMinigames(osrsQuestTileId('song-of-the-elves'))).toEqual([
      { name: 'The Gauntlet', wikiTitle: 'The Gauntlet' },
    ])
    expect(tileMinigames(osrsQuestTileId('in-aid-of-the-myreque'))).toEqual([
      { name: 'Temple Trekking', wikiTitle: 'Temple Trekking' },
    ])
    expect(tileMinigames(osrsQuestTileId('darkness-of-hallowvale'))).toEqual([
      { name: 'Burgh de Rott Ramble', wikiTitle: 'Temple Trekking' },
    ])
    expect(tileMinigames(osrsQuestTileId('the-giant-dwarf'))).toEqual([
      { name: 'Blast Furnace', wikiTitle: 'Blast Furnace' },
    ])
    expect(tileMinigames(osrsQuestTileId('cooks-assistant'))).toEqual([])
    expect(tileMinigames(osrsTileId('agility', '1-10'))).toEqual([])
    const marked = CATALOG.filter((def) => (def.minigames?.length ?? 0) > 0)
    expect(marked).toHaveLength(16)
    expect(marked.every((def) => def.kind === 'quest')).toBe(true)
  })
})
