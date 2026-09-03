import { describe, expect, it } from 'vitest'
import {
  coveringSkillTile,
  requirementViews,
  skillReqTitle,
} from './requirementViews.ts'
import { osrsDiaryTileId, osrsQuestTileId, osrsTileId } from './osrsCatalog.ts'
import type { Tile } from '../domain/types.ts'

function tile(id: string): Tile {
  return { id, name: id, status: 'locked', parentIds: [], starred: false }
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
  it('shows exact quest skill levels pointing at covering tiles', () => {
    const views = requirementViews(tile(osrsQuestTileId('animal-magnetism')))

    expect(views.map((row) => row.title)).toEqual([
      'Ernest the Chicken',
      'Priest in Peril',
      'The Restless Ghost',
      '19 Crafting',
      '35 Woodcutting',
    ])
    expect(views.at(-2)?.parentId).toBe(osrsTileId('crafting', '11-20'))
    expect(views.at(-1)?.parentId).toBe(osrsTileId('woodcutting', '31-40'))
  })

  it('tags ironman skill reqs and still points at the covering tile', () => {
    const views = requirementViews(tile(osrsDiaryTileId('ardougne', 'medium')))
    expect(views).toContainEqual(
      expect.objectContaining({
        title: '49 Crafting (Ironman)',
        parentId: osrsTileId('crafting', '41-50'),
      }),
    )
  })

  it('lists previous diary tiers then exact skill levels', () => {
    const views = requirementViews(tile(osrsDiaryTileId('kandarin', 'medium')))
    expect(views[0]).toMatchObject({
      parentId: osrsDiaryTileId('kandarin', 'easy'),
      title: 'Kandarin Easy',
    })
    expect(views.some((row) => row.title === '26 Farming')).toBe(true)
    expect(views.find((row) => row.title === '26 Farming')?.parentId).toBe(
      osrsTileId('farming', '21-30'),
    )
  })

  it('lists earlier skill brackets as requirements', () => {
    expect(
      requirementViews(tile(osrsTileId('farming', '41-50'))).map(
        (row) => row.title,
      ),
    ).toEqual([
      'Farming 1–10',
      'Farming 11–20',
      'Farming 21–30',
      'Farming 31–40',
    ])
  })

  it('lists first-bracket skill quest unlocks by quest name', () => {
    expect(
      requirementViews(tile(osrsTileId('herblore', '1-10'))).map(
        (row) => row.title,
      ),
    ).toEqual(['Druidic Ritual'])
    expect(
      requirementViews(tile(osrsTileId('sailing', '1-10'))).map(
        (row) => row.title,
      ),
    ).toEqual(['Pandemonium'])
  })
})
