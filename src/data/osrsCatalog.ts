import type { Tile, TileStatus } from '../domain/types.ts'
import { skillParentsFor } from './diarySkillReqs.ts'
import {
  OSRS_QUESTS,
  osrsQuestTileId,
  questParentsFor,
  type OsrsQuest,
} from './questReqs.ts'
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
export { OSRS_QUESTS, osrsQuestTileId } from './questReqs.ts'
export type { OsrsQuest } from './questReqs.ts'

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

export type TileKind = 'skill' | 'diary' | 'quest'

export function tileKind(id: string): TileKind | null {
  if (id.startsWith('osrs:quest:')) return 'quest'
  if (id.startsWith('osrs:diary:')) return 'diary'
  if (id.startsWith('osrs:')) return 'skill'
  return null
}

export function partitionByKind(tiles: Tile[]): Record<TileKind, Tile[]> {
  const groups: Record<TileKind, Tile[]> = {
    skill: [],
    diary: [],
    quest: [],
  }
  for (const tile of tiles) {
    const kind = tileKind(tile.id)
    if (!kind) continue
    groups[kind].push(tile)
  }
  return groups
}

export function userPersistedTiles(tiles: Tile[]): Tile[] {
  return tiles.filter(
    (tile) => isOsrsCatalogId(tile.id) && tile.status !== 'unseen',
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

export function osrsQuestTileName(quest: OsrsQuest): string {
  return quest.name
}

export function buildOsrsQuestTiles(status: TileStatus = 'unseen'): Tile[] {
  return OSRS_QUESTS.map((quest) => ({
    id: osrsQuestTileId(quest.id),
    name: osrsQuestTileName(quest),
    status,
    parentIds: questParentsFor(quest.id),
  }))
}

export function buildOsrsCatalogTiles(status: TileStatus = 'unseen'): Tile[] {
  return [
    ...buildOsrsSkillTiles(status),
    ...buildOsrsDiaryTiles(status),
    ...buildOsrsQuestTiles(status),
  ]
}

export function mergeOsrsSkillTiles(tiles: Tile[]): Tile[] {
  const catalog = buildOsrsCatalogTiles()
  const catalogIds = new Set(catalog.map((tile) => tile.id))
  const overlay = new Map<string, Tile>()
  for (const tile of tiles) {
    if (!catalogIds.has(tile.id)) continue
    overlay.set(tile.id, tile)
  }
  return catalog.map((canon) => {
    const existing = overlay.get(canon.id)
    if (!existing) return canon
    return {
      ...canon,
      status: existing.status,
    }
  })
}
