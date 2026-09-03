import { parentIsSatisfied, tilesById } from '../domain/readiness.ts'
import type { Tile } from '../domain/types.ts'
import { OSRS_SKILLS, SKILL_BRACKETS, osrsTileId } from './osrsCatalog.ts'

export type SkillStat = {
  id: string
  name: string
  level: number
  tileId: string | null
}

export const BASE_SKILL_LEVEL = 1
export const COMBAT_SKILL_LEVEL = 99

const COMBAT_SKILLS = [
  { id: 'attack', name: 'Attack' },
  { id: 'hitpoints', name: 'Hitpoints' },
  { id: 'strength', name: 'Strength' },
  { id: 'defence', name: 'Defence' },
  { id: 'ranged', name: 'Ranged' },
  { id: 'prayer', name: 'Prayer' },
  { id: 'magic', name: 'Magic' },
  { id: 'slayer', name: 'Slayer' },
] as const

const COMBAT_IDS = new Set<string>(COMBAT_SKILLS.map((skill) => skill.id))

const STATS_SKILL_ORDER = [
  'attack',
  'hitpoints',
  'mining',
  'strength',
  'agility',
  'smithing',
  'defence',
  'herblore',
  'fishing',
  'ranged',
  'thieving',
  'cooking',
  'prayer',
  'crafting',
  'firemaking',
  'magic',
  'fletching',
  'woodcutting',
  'runecraft',
  'slayer',
  'farming',
  'construction',
  'hunter',
  'sailing',
] as const

const SKILL_BY_ID = new Map(
  [...OSRS_SKILLS, ...COMBAT_SKILLS].map((skill) => [skill.id, skill]),
)

export function isCombatSkill(skillId: string): boolean {
  return COMBAT_IDS.has(skillId)
}

export function maxSkillLevel(skillId: string, tiles: Tile[]): number {
  if (isCombatSkill(skillId)) return COMBAT_SKILL_LEVEL
  const byId = tilesById(tiles)
  let level = BASE_SKILL_LEVEL
  for (const bracket of SKILL_BRACKETS) {
    const tile = byId.get(osrsTileId(skillId, bracket.id))
    if (parentIsSatisfied(tile?.status)) {
      level = Math.max(level, bracket.max)
    }
  }
  return level
}

function tileIdForLevel(skillId: string, level: number): string {
  const bracket = [...SKILL_BRACKETS]
    .reverse()
    .find((entry) => entry.max <= level)
  return osrsTileId(skillId, bracket?.id ?? '1-10')
}

export function skillStats(tiles: Tile[]): SkillStat[] {
  return STATS_SKILL_ORDER.map((id) => {
    const skill = SKILL_BY_ID.get(id)
    if (!skill) {
      throw new Error(`Unknown stats skill: ${id}`)
    }
    if (isCombatSkill(id)) {
      return {
        id,
        name: skill.name,
        level: COMBAT_SKILL_LEVEL,
        tileId: null,
      }
    }
    const level = maxSkillLevel(id, tiles)
    return {
      id,
      name: skill.name,
      level,
      tileId: tileIdForLevel(id, level),
    }
  })
}
