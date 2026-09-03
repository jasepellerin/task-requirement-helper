import type { Tile, TileStatus } from '../domain/types.ts'
import bracketsData from './skill-brackets.json'
import skillsData from './osrs-skills.json'

export type OsrsSkill = {
  id: string
  name: string
}

export type SkillBracket = {
  id: string
  min: number
  max: number
  cape?: boolean
}

export const OSRS_SKILLS = skillsData as OsrsSkill[]
export const SKILL_BRACKETS = bracketsData as SkillBracket[]

export function osrsTileId(skillId: string, bracketId: string): string {
  return `osrs:${skillId}:${bracketId}`
}

export function osrsTileName(skillName: string, bracket: SkillBracket): string {
  if (bracket.cape) return `Get the ${skillName} skill cape`
  return `${skillName} ${bracket.min}–${bracket.max}`
}

export function isOsrsCatalogId(id: string): boolean {
  return id.startsWith('osrs:')
}

export function buildOsrsSkillTiles(status: TileStatus = 'unseen'): Tile[] {
  return OSRS_SKILLS.flatMap((skill) => {
    const ids = SKILL_BRACKETS.map((bracket) =>
      osrsTileId(skill.id, bracket.id),
    )
    return SKILL_BRACKETS.map((bracket, index) => ({
      id: ids[index] ?? osrsTileId(skill.id, bracket.id),
      name: osrsTileName(skill.name, bracket),
      status,
      parentIds: ids.slice(0, index),
    }))
  })
}

export function mergeOsrsSkillTiles(tiles: Tile[]): Tile[] {
  const existingIds = new Set(tiles.map((tile) => tile.id))
  const missing = buildOsrsSkillTiles().filter(
    (tile) => !existingIds.has(tile.id),
  )
  if (missing.length === 0) return tiles
  return [...tiles, ...missing]
}

export function resetLockedOsrsTilesToUnseen(tiles: Tile[]): Tile[] {
  return tiles.map((tile) =>
    isOsrsCatalogId(tile.id) && tile.status === 'locked'
      ? { ...tile, status: 'unseen' }
      : tile,
  )
}
