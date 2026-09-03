import { describe, expect, it } from 'vitest'
import {
  coveringSkillTile,
  requirementSummary,
  requirementViews,
  skillReqTitle,
} from './requirementViews.ts'
import { osrsDiaryTileId, osrsQuestTileId, osrsTileId } from './osrsCatalog.ts'
import type { Tile } from '../domain/types.ts'

function tile(id: string, parentIds: string[] = [], name = id): Tile {
  return { id, name, status: 'locked', parentIds }
}

describe('skillReqTitle', () => {
  it('uses the catalog skill name and ironman tag', () => {
    expect(skillReqTitle('farming', 45)).toBe('45 Farming')
    expect(skillReqTitle('farming', 45, true)).toBe('45 Farming (Ironman)')
  })
})

describe('coveringSkillTile', () => {
  it('maps a wiki level onto the covering bracket tile', () => {
    expect(coveringSkillTile('farming', 45)).toEqual({
      id: osrsTileId('farming', '41-50'),
      name: 'Farming 41–50',
    })
    expect(coveringSkillTile('farming', 99).name).toBe(
      'Get the Farming skill cape',
    )
  })
})

describe('requirementViews', () => {
  it('shows exact quest skill levels with covering tiles underneath', () => {
    const id = osrsQuestTileId('animal-magnetism')
    const views = requirementViews(tile(id, []), [])

    expect(views.map((row) => row.title)).toEqual([
      'Ernest the Chicken',
      'Priest in Peril',
      'The Restless Ghost',
      '19 Crafting',
      '35 Woodcutting',
    ])
    expect(views.at(-2)).toMatchObject({
      parentId: osrsTileId('crafting', '11-20'),
      coverLabel: 'Crafting 11–20',
      catalog: true,
    })
    expect(views.at(-1)).toMatchObject({
      parentId: osrsTileId('woodcutting', '31-40'),
      coverLabel: 'Woodcutting 31–40',
      catalog: true,
    })
  })

  it('tags ironman skill reqs and still points at the covering tile', () => {
    const views = requirementViews(
      tile(osrsDiaryTileId('ardougne', 'medium'), []),
      [],
    )
    expect(views).toContainEqual(
      expect.objectContaining({
        title: '49 Crafting (Ironman)',
        coverLabel: 'Crafting 41–50',
        parentId: osrsTileId('crafting', '41-50'),
        catalog: true,
      }),
    )
  })

  it('lists previous diary tiers then exact skill levels', () => {
    const id = osrsDiaryTileId('kandarin', 'medium')
    const views = requirementViews(tile(id, []), [])
    expect(views[0]).toMatchObject({
      parentId: osrsDiaryTileId('kandarin', 'easy'),
      title: 'Kandarin Easy',
    })
    expect(views[0]?.coverLabel).toBeUndefined()
    expect(views.some((row) => row.title === '26 Farming')).toBe(true)
    expect(views.find((row) => row.title === '26 Farming')?.coverLabel).toBe(
      'Farming 21–30',
    )
  })

  it('falls back to parent tile names for skills and custom tiles', () => {
    const parent = tile(osrsTileId('farming', '31-40'), [], 'Farming 31–40')
    const child = tile(osrsTileId('farming', '41-50'), [parent.id])
    expect(requirementViews(child, [parent, child])).toEqual([
      {
        key: `parent:${parent.id}`,
        parentId: parent.id,
        title: 'Farming 31–40',
        catalog: false,
      },
    ])
  })

  it('appends extra parentIds that are not part of the catalog recipe', () => {
    const extra = tile('custom-a', [], 'Custom A')
    const quest = tile(osrsQuestTileId('garden-of-tranquillity'), [extra.id])
    const views = requirementViews(quest, [extra, quest])
    expect(views.map((row) => row.title)).toEqual([
      'Creature of Fenkenstrain',
      '25 Farming',
      'Custom A',
    ])
    expect(views.at(-1)?.catalog).toBe(false)
  })
})

describe('requirementSummary', () => {
  it('joins exact req titles for finder meta', () => {
    const id = osrsQuestTileId('garden-of-tranquillity')
    expect(requirementSummary(tile(id, []), [])).toBe(
      'Creature of Fenkenstrain, 25 Farming',
    )
  })
})
