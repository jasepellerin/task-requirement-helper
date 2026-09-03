import { describe, expect, it } from 'vitest'
import {
  buildOsrsSkillTiles,
  mergeOsrsSkillTiles,
  OSRS_SKILLS,
  osrsTileId,
  osrsTileName,
  resetLockedOsrsTilesToUnseen,
  SKILL_BRACKETS,
} from './osrsCatalog.ts'

describe('OSRS skill catalog', () => {
  it('covers all 24 skills and 10 brackets', () => {
    expect(OSRS_SKILLS).toHaveLength(24)
    expect(SKILL_BRACKETS).toHaveLength(10)
    const catalog = buildOsrsSkillTiles()
    expect(catalog).toHaveLength(240)
    expect(catalog.every((tile) => tile.status === 'unseen')).toBe(true)
    expect(OSRS_SKILLS.map((skill) => skill.id)).toContain('sailing')
    expect(OSRS_SKILLS.map((skill) => skill.name)).toContain('Woodcutting')
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
    expect(merged).toHaveLength(240)
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
