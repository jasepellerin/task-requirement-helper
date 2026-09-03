import { describe, expect, it } from 'vitest'
import type { Tile } from '../domain/types.ts'
import { osrsTileId } from './osrsCatalog.ts'
import {
  BASE_SKILL_LEVEL,
  COMBAT_SKILL_LEVEL,
  maxSkillLevel,
  skillStats,
} from './skillLevels.ts'

function tile(
  skillId: string,
  bracketId: string,
  status: Tile['status'],
): Tile {
  return {
    id: osrsTileId(skillId, bracketId),
    name: `${skillId} ${bracketId}`,
    status,
    parentIds: [],
  }
}

describe('maxSkillLevel', () => {
  it('is 1 when no brackets are unlocked or completed', () => {
    expect(maxSkillLevel('agility', [])).toBe(BASE_SKILL_LEVEL)
    expect(
      maxSkillLevel('agility', [
        tile('agility', '1-10', 'locked'),
        tile('agility', '11-20', 'unseen'),
      ]),
    ).toBe(1)
  })

  it('uses the highest unlocked or completed bracket max', () => {
    const tiles = [
      tile('agility', '1-10', 'completed'),
      tile('agility', '11-20', 'unlocked'),
      tile('agility', '21-30', 'locked'),
      tile('woodcutting', '91-99', 'completed'),
    ]
    expect(maxSkillLevel('agility', tiles)).toBe(20)
    expect(maxSkillLevel('woodcutting', tiles)).toBe(99)
    expect(maxSkillLevel('mining', tiles)).toBe(1)
  })

  it('is always 99 for combat skills', () => {
    expect(maxSkillLevel('attack', [])).toBe(COMBAT_SKILL_LEVEL)
    expect(
      maxSkillLevel('slayer', [tile('agility', '91-99', 'completed')]),
    ).toBe(99)
  })
})

describe('skillStats', () => {
  it('uses the in-game skill order with combat at 99', () => {
    const tiles = [
      tile('crafting', '1-10', 'completed'),
      tile('crafting', '11-20', 'unlocked'),
    ]
    const stats = skillStats(tiles)
    expect(stats).toHaveLength(24)
    expect(stats.map((skill) => skill.id).slice(0, 3)).toEqual([
      'attack',
      'hitpoints',
      'mining',
    ])
    expect(stats.find((skill) => skill.id === 'attack')).toEqual({
      id: 'attack',
      name: 'Attack',
      level: 99,
      tileId: null,
    })
    expect(stats.find((skill) => skill.id === 'crafting')).toEqual({
      id: 'crafting',
      name: 'Crafting',
      level: 20,
      tileId: osrsTileId('crafting', '11-20'),
    })
  })
})
