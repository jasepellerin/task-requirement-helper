import type { Tile, TileStatus } from '../domain/types.ts'
import { skillParentsFor } from './diarySkillReqs.ts'
import diariesData from './osrs-diaries.json'
import diaryTiersData from './diary-tiers.json'
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

export type OsrsDiary = {
  id: string
  name: string
  wikiTitle: string
}

export type DiaryTier = {
  id: string
  name: string
}

export const OSRS_SKILLS = skillsData as OsrsSkill[]
export const SKILL_BRACKETS = bracketsData as SkillBracket[]
export const OSRS_DIARIES = diariesData as OsrsDiary[]
export const DIARY_TIERS = diaryTiersData as DiaryTier[]

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

export function userPersistedTiles(tiles: Tile[]): Tile[] {
  return tiles.filter(
    (tile) => !isOsrsCatalogId(tile.id) || tile.status !== 'unseen',
  )
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

export function osrsDiaryTileId(diaryId: string, tierId: string): string {
  return `osrs:diary:${diaryId}:${tierId}`
}

export function osrsDiaryTileName(diaryName: string, tier: DiaryTier): string {
  return `${diaryName} ${tier.name}`
}

export function buildOsrsDiaryTiles(status: TileStatus = 'unseen'): Tile[] {
  return OSRS_DIARIES.flatMap((diary) => {
    const ids = DIARY_TIERS.map((tier) => osrsDiaryTileId(diary.id, tier.id))
    return DIARY_TIERS.map((tier, index) => ({
      id: ids[index] ?? osrsDiaryTileId(diary.id, tier.id),
      name: osrsDiaryTileName(diary.name, tier),
      status,
      parentIds: [
        ...ids.slice(0, index),
        ...skillParentsFor(diary.id, tier.id),
      ],
    }))
  })
}

export function buildOsrsCatalogTiles(status: TileStatus = 'unseen'): Tile[] {
  return [...buildOsrsSkillTiles(status), ...buildOsrsDiaryTiles(status)]
}

export function pruneRemovedOsrsTiles(tiles: Tile[]): Tile[] {
  const catalogIds = new Set(buildOsrsCatalogTiles().map((tile) => tile.id))
  const removed = new Set(
    tiles
      .filter((tile) => isOsrsCatalogId(tile.id) && !catalogIds.has(tile.id))
      .map((tile) => tile.id),
  )
  if (removed.size === 0) return tiles
  return tiles
    .filter((tile) => !removed.has(tile.id))
    .map((tile) => ({
      ...tile,
      parentIds: tile.parentIds.filter((id) => !removed.has(id)),
    }))
}

function syncOsrsCatalogParents(tiles: Tile[]): Tile[] {
  const catalog = new Map(
    buildOsrsCatalogTiles().map((tile) => [tile.id, tile]),
  )
  return tiles.map((tile) => {
    const canon = catalog.get(tile.id)
    if (!canon) return tile
    return { ...tile, parentIds: canon.parentIds }
  })
}

export function mergeOsrsSkillTiles(tiles: Tile[]): Tile[] {
  const pruned = pruneRemovedOsrsTiles(tiles)
  const existingIds = new Set(pruned.map((tile) => tile.id))
  const missing = buildOsrsCatalogTiles().filter(
    (tile) => !existingIds.has(tile.id),
  )
  return syncOsrsCatalogParents([...pruned, ...missing])
}

export function resetLockedOsrsTilesToUnseen(tiles: Tile[]): Tile[] {
  return tiles.map((tile) =>
    isOsrsCatalogId(tile.id) && tile.status === 'locked'
      ? { ...tile, status: 'unseen' }
      : tile,
  )
}
