import type { StoredTile, Tile, TileStatus } from '../domain/types.ts'
import {
  coveringBracketId,
  diarySkillReqsFor,
  type DiarySkillReq,
} from './diarySkillReqs.ts'
import { OSRS_QUESTS, osrsQuestTileId, questReqsFor } from './questReqs.ts'
import { skillQuestReqsFor } from './skillQuestReqs.ts'
import { diaryRewardsFor, questRewardsFor } from './rewards.ts'
import { questDetailsFor } from './questDetails.ts'
import diariesData from './osrs-diaries.json'
import diaryTiersData from './diary-tiers.json'
import bracketsData from './skill-brackets.json'
import skillsData from './osrs-skills.json'
import slayerMastersData from './osrs-quest-slayer-masters.json'
import slayerMonstersData from './osrs-quest-slayer-monsters.json'

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

export type CatalogReq =
  | { type: 'tile'; id: string }
  | { type: 'skill'; skill: string; level: number; ironman?: boolean }

export type SlayerMasterUnlock = {
  name: string
  wikiTitle: string
}

export type SlayerMonsterUnlock = {
  name: string
  wikiTitle: string
}

export type CatalogDef = {
  id: string
  name: string
  kind: TileKind
  wikiTitle: string
  gp?: number
  rewards?: string[]
  difficulty?: string
  length?: string
  items?: string[]
  image?: string
  slayerMaster?: SlayerMasterUnlock
  slayerMonsters?: SlayerMonsterUnlock[]
  reqs: CatalogReq[]
}

export const OSRS_SKILLS = skillsData as OsrsSkill[]
export const SKILL_BRACKETS = bracketsData as SkillBracket[]
export const OSRS_DIARIES = diariesData as OsrsDiary[]
export const DIARY_TIERS = diaryTiersData as DiaryTier[]
const QUEST_SLAYER_MASTERS = slayerMastersData as Record<
  string,
  SlayerMasterUnlock
>
const QUEST_SLAYER_MONSTERS = slayerMonstersData as Record<
  string,
  SlayerMonsterUnlock[]
>
export { OSRS_QUESTS, osrsQuestTileId } from './questReqs.ts'
export type { OsrsQuest } from './questReqs.ts'

export function osrsTileId(skillId: string, bracketId: string): string {
  return `osrs:${skillId}:${bracketId}`
}

export function osrsTileName(skillName: string, bracket: SkillBracket): string {
  if (bracket.cape) return `Get the ${skillName} skill cape`
  return `${skillName} ${bracket.min}–${bracket.max}`
}

export type TileKind = 'skill' | 'diary' | 'quest'

export function osrsDiaryTileId(diaryId: string, tierId: string): string {
  return `osrs:diary:${diaryId}:${tierId}`
}

export function osrsDiaryTileName(diaryName: string, tier: DiaryTier): string {
  return `${diaryName} ${tier.name}`
}

function skillReqs(reqs: readonly DiarySkillReq[]): CatalogReq[] {
  return reqs.map((req) => ({
    type: 'skill',
    skill: req.skill,
    level: req.level,
    ...(req.ironman ? { ironman: true } : {}),
  }))
}

function parentIdFor(req: CatalogReq): string {
  if (req.type === 'tile') return req.id
  return osrsTileId(req.skill, coveringBracketId(req.level))
}

export function parentIdsFor(def: CatalogDef): string[] {
  return [...new Set(def.reqs.map(parentIdFor))]
}

function buildSkillDefs(): CatalogDef[] {
  return OSRS_SKILLS.flatMap((skill) => {
    const ids = SKILL_BRACKETS.map((bracket) =>
      osrsTileId(skill.id, bracket.id),
    )
    return SKILL_BRACKETS.map((bracket, index) => ({
      id: ids[index] ?? osrsTileId(skill.id, bracket.id),
      name: osrsTileName(skill.name, bracket),
      kind: 'skill' as const,
      wikiTitle: skill.name,
      reqs: [
        ...ids.slice(0, index).map((id) => ({ type: 'tile' as const, id })),
        ...(bracket.id === '1-10'
          ? skillQuestReqsFor(skill.id).map((questId) => ({
              type: 'tile' as const,
              id: osrsQuestTileId(questId),
            }))
          : []),
      ],
    }))
  })
}

function buildDiaryDefs(): CatalogDef[] {
  return OSRS_DIARIES.flatMap((diary) => {
    const ids = DIARY_TIERS.map((tier) => osrsDiaryTileId(diary.id, tier.id))
    return DIARY_TIERS.map((tier, index) => {
      const rewards = diaryRewardsFor(diary.id, tier.id)
      return {
        id: ids[index] ?? osrsDiaryTileId(diary.id, tier.id),
        name: osrsDiaryTileName(diary.name, tier),
        kind: 'diary' as const,
        wikiTitle: diary.wikiTitle,
        ...(rewards.length > 0 ? { rewards } : {}),
        reqs: [
          ...ids.slice(0, index).map((id) => ({ type: 'tile' as const, id })),
          ...skillReqs(diarySkillReqsFor(diary.id, tier.id)),
        ],
      }
    })
  })
}

function buildQuestDefs(): CatalogDef[] {
  return OSRS_QUESTS.map((quest) => {
    const reqs = questReqsFor(quest.id)
    const gp = quest.gp && quest.gp > 0 ? quest.gp : undefined
    const rewards = questRewardsFor(quest.id)
    const details = questDetailsFor(quest.id)
    const slayerMaster = QUEST_SLAYER_MASTERS[quest.id]
    const slayerMonsters = QUEST_SLAYER_MONSTERS[quest.id]
    return {
      id: osrsQuestTileId(quest.id),
      name: quest.name,
      kind: 'quest' as const,
      wikiTitle: quest.wikiTitle,
      ...(gp !== undefined ? { gp } : {}),
      ...(rewards.length > 0 ? { rewards } : {}),
      ...(details.difficulty ? { difficulty: details.difficulty } : {}),
      ...(details.length ? { length: details.length } : {}),
      ...(details.items.length > 0 ? { items: details.items } : {}),
      ...(details.image ? { image: details.image } : {}),
      ...(slayerMaster ? { slayerMaster } : {}),
      ...(slayerMonsters && slayerMonsters.length > 0
        ? { slayerMonsters }
        : {}),
      reqs: [
        ...(reqs?.quests ?? []).map((id) => ({
          type: 'tile' as const,
          id: osrsQuestTileId(id),
        })),
        ...skillReqs(reqs?.skills ?? []),
      ],
    }
  })
}

export const CATALOG: CatalogDef[] = [
  ...buildSkillDefs(),
  ...buildDiaryDefs(),
  ...buildQuestDefs(),
]

export const CATALOG_BY_ID = new Map(
  CATALOG.map((def) => [def.id, def] as const),
)

export function tileKind(id: string): TileKind | null {
  return CATALOG_BY_ID.get(id)?.kind ?? null
}

export function tileGp(tileId: string): number | undefined {
  const gp = CATALOG_BY_ID.get(tileId)?.gp
  return gp && gp > 0 ? gp : undefined
}

export function tileRewards(tileId: string): string[] {
  return CATALOG_BY_ID.get(tileId)?.rewards ?? []
}

export function tileDifficulty(tileId: string): string | undefined {
  return CATALOG_BY_ID.get(tileId)?.difficulty
}

export function tileLength(tileId: string): string | undefined {
  return CATALOG_BY_ID.get(tileId)?.length
}

export function tileItems(tileId: string): string[] {
  return CATALOG_BY_ID.get(tileId)?.items ?? []
}

export function tileImage(tileId: string): string | undefined {
  return CATALOG_BY_ID.get(tileId)?.image
}

export function tileSlayerMaster(
  tileId: string,
): SlayerMasterUnlock | undefined {
  return CATALOG_BY_ID.get(tileId)?.slayerMaster
}

export function tileSlayerMonsters(tileId: string): SlayerMonsterUnlock[] {
  return CATALOG_BY_ID.get(tileId)?.slayerMonsters ?? []
}

export type KindFilter = Record<TileKind, boolean>

export const ALL_KINDS: KindFilter = {
  skill: true,
  diary: true,
  quest: true,
}

export function filterTilesByKind(
  tiles: readonly Tile[],
  kinds: KindFilter,
): Tile[] {
  return tiles.filter((tile) => {
    const kind = tileKind(tile.id)
    return kind !== null && kinds[kind]
  })
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

export function tilesFromStatuses(
  statuses: Map<string, TileStatus>,
  starred: ReadonlySet<string> = new Set(),
): Tile[] {
  return CATALOG.map((def) => ({
    id: def.id,
    name: def.name,
    status: statuses.get(def.id) ?? 'unseen',
    parentIds: parentIdsFor(def),
    starred: starred.has(def.id),
  }))
}

export function statusesFromStored(
  tiles: readonly StoredTile[],
): Map<string, TileStatus> {
  const statuses = new Map<string, TileStatus>()
  for (const tile of tiles) {
    if (!CATALOG_BY_ID.has(tile.id) || tile.status === 'unseen') continue
    statuses.set(tile.id, tile.status)
  }
  return statuses
}

export function starredFromStored(tiles: readonly StoredTile[]): Set<string> {
  const starred = new Set<string>()
  for (const tile of tiles) {
    if (!tile.starred || !CATALOG_BY_ID.has(tile.id)) continue
    if (tile.status === 'unseen') continue
    starred.add(tile.id)
  }
  return starred
}

export function storedTilesFromStatuses(
  statuses: Map<string, TileStatus>,
  starred: ReadonlySet<string> = new Set(),
): StoredTile[] {
  const tiles: StoredTile[] = []
  for (const def of CATALOG) {
    const status = statuses.get(def.id)
    if (!status || status === 'unseen') continue
    const stored: StoredTile = { id: def.id, status }
    if (starred.has(def.id)) stored.starred = true
    tiles.push(stored)
  }
  return tiles
}

export function setStoredStatus(
  statuses: Map<string, TileStatus>,
  id: string,
  status: TileStatus,
): Map<string, TileStatus> | null {
  if (!CATALOG_BY_ID.has(id)) return null
  const next = new Map(statuses)
  if (status === 'unseen') next.delete(id)
  else next.set(id, status)
  return next
}

export function setStoredStarred(
  starred: Set<string>,
  id: string,
  value: boolean,
): Set<string> | null {
  if (!CATALOG_BY_ID.has(id)) return null
  const next = new Set(starred)
  if (value) next.add(id)
  else next.delete(id)
  return next
}
