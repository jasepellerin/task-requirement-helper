import type { Tile } from '../domain/types.ts'
import { coveringBracketId, diarySkillReqsFor } from './diarySkillReqs.ts'
import type { SkillLevelReq } from './skillReqs.ts'
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
import transportData from './osrs-quest-transport.json'
import teleportsData from './osrs-quest-teleports.json'
import teleportItemsData from './osrs-quest-teleport-items.json'
import spellbooksData from './osrs-quest-spellbooks.json'
import minigamesData from './osrs-quest-minigames.json'

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
  { type: 'tile'; id: string } | ({ type: 'skill' } & SkillLevelReq)

export type WikiUnlock = {
  name: string
  wikiTitle: string
}

export type TeleportItemUnlock = WikiUnlock & { icon: string }

export type SpellbookUnlock = WikiUnlock & { icon: string }

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
  slayerMaster?: WikiUnlock
  slayerMonsters?: WikiUnlock[]
  transport?: WikiUnlock[]
  teleports?: WikiUnlock[]
  teleportItems?: TeleportItemUnlock[]
  spellbooks?: SpellbookUnlock[]
  minigames?: WikiUnlock[]
  reqs: CatalogReq[]
}

export const OSRS_SKILLS = skillsData as OsrsSkill[]
export const SKILL_BRACKETS = bracketsData as SkillBracket[]
export const OSRS_DIARIES = diariesData as OsrsDiary[]
export const DIARY_TIERS = diaryTiersData as DiaryTier[]
const QUEST_SLAYER_MASTERS = slayerMastersData as Record<string, WikiUnlock>
const QUEST_SLAYER_MONSTERS = slayerMonstersData as Record<string, WikiUnlock[]>
const QUEST_TRANSPORT = transportData as Record<string, WikiUnlock[]>
const QUEST_TELEPORTS = teleportsData as Record<string, WikiUnlock[]>
const QUEST_TELEPORT_ITEMS = teleportItemsData as Record<
  string,
  TeleportItemUnlock[]
>
const QUEST_SPELLBOOKS = spellbooksData as Record<string, SpellbookUnlock[]>
const QUEST_MINIGAMES = minigamesData as Record<string, WikiUnlock[]>
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

function skillReqs(reqs: readonly SkillLevelReq[]): CatalogReq[] {
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
    const transport = QUEST_TRANSPORT[quest.id]
    const teleports = QUEST_TELEPORTS[quest.id]
    const teleportItems = QUEST_TELEPORT_ITEMS[quest.id]
    const spellbooks = QUEST_SPELLBOOKS[quest.id]
    const minigames = QUEST_MINIGAMES[quest.id]
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
      ...(transport && transport.length > 0 ? { transport } : {}),
      ...(teleports && teleports.length > 0 ? { teleports } : {}),
      ...(teleportItems && teleportItems.length > 0 ? { teleportItems } : {}),
      ...(spellbooks && spellbooks.length > 0 ? { spellbooks } : {}),
      ...(minigames && minigames.length > 0 ? { minigames } : {}),
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

export function tileSlayerMaster(tileId: string): WikiUnlock | undefined {
  return CATALOG_BY_ID.get(tileId)?.slayerMaster
}

export function tileSlayerMonsters(tileId: string): WikiUnlock[] {
  return CATALOG_BY_ID.get(tileId)?.slayerMonsters ?? []
}

export function tileTransport(tileId: string): WikiUnlock[] {
  return CATALOG_BY_ID.get(tileId)?.transport ?? []
}

export function tileTeleports(tileId: string): WikiUnlock[] {
  return CATALOG_BY_ID.get(tileId)?.teleports ?? []
}

export function tileTeleportItems(tileId: string): TeleportItemUnlock[] {
  return CATALOG_BY_ID.get(tileId)?.teleportItems ?? []
}

export function tileSpellbooks(tileId: string): SpellbookUnlock[] {
  return CATALOG_BY_ID.get(tileId)?.spellbooks ?? []
}

export function tileMinigames(tileId: string): WikiUnlock[] {
  return CATALOG_BY_ID.get(tileId)?.minigames ?? []
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
