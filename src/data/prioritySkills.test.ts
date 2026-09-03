import { describe, expect, it } from 'vitest'
import { osrsDiaryTileId, osrsQuestTileId, osrsTileId } from './osrsCatalog.ts'
import {
  isCatalogSkill,
  prioritySkillsFromStored,
  setStoredPrioritySkill,
  skillIdFromSkillTile,
  storedPrioritySkills,
  tileMatchesPrioritySkills,
} from './prioritySkills.ts'

describe('isCatalogSkill / skillIdFromSkillTile', () => {
  it('accepts tracked skills and rejects combat', () => {
    expect(isCatalogSkill('farming')).toBe(true)
    expect(isCatalogSkill('attack')).toBe(false)
    expect(isCatalogSkill('slayer')).toBe(false)
  })

  it('reads the skill from a skill tile id', () => {
    expect(skillIdFromSkillTile(osrsTileId('farming', '41-50'))).toBe('farming')
    expect(skillIdFromSkillTile(osrsTileId('farming', '91-99'))).toBe('farming')
    expect(skillIdFromSkillTile(osrsQuestTileId('ernest-the-chicken'))).toBe(
      null,
    )
    expect(skillIdFromSkillTile(osrsDiaryTileId('ardougne', 'easy'))).toBe(null)
    expect(skillIdFromSkillTile('forest')).toBe(null)
  })
})

describe('tileMatchesPrioritySkills', () => {
  const farming = new Set(['farming'])

  it('matches only skill tiles for that skill', () => {
    expect(
      tileMatchesPrioritySkills(osrsTileId('farming', '21-30'), farming),
    ).toBe(true)
    expect(
      tileMatchesPrioritySkills(
        osrsQuestTileId('enlightened-journey'),
        farming,
      ),
    ).toBe(false)
    expect(
      tileMatchesPrioritySkills(osrsDiaryTileId('kandarin', 'easy'), farming),
    ).toBe(false)
    expect(
      tileMatchesPrioritySkills(osrsTileId('agility', '1-10'), farming),
    ).toBe(false)
  })

  it('is false when nothing is prioritized', () => {
    expect(
      tileMatchesPrioritySkills(osrsTileId('farming', '1-10'), new Set()),
    ).toBe(false)
  })
})

describe('priority skill persistence helpers', () => {
  it('keeps catalog skills, drops combat and junk', () => {
    expect([
      ...prioritySkillsFromStored(['farming', 'attack', 'nope', 'farming']),
    ]).toEqual(['farming'])
    expect(prioritySkillsFromStored(undefined).size).toBe(0)
    expect(storedPrioritySkills(new Set(['farming', 'agility']))).toEqual([
      'agility',
      'farming',
    ])
    expect(storedPrioritySkills(new Set())).toBeUndefined()
  })

  it('toggles catalog skills only', () => {
    const empty = new Set<string>()
    expect(setStoredPrioritySkill(empty, 'attack', true)).toBeNull()
    expect([...setStoredPrioritySkill(empty, 'farming', true)!]).toEqual([
      'farming',
    ])
    expect(
      setStoredPrioritySkill(new Set(['farming']), 'farming', false)?.has(
        'farming',
      ),
    ).toBe(false)
  })
})
