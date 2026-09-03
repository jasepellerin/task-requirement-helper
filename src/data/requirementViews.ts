import type { Tile } from '../domain/types.ts'
import {
  coveringBracketId,
  diarySkillReqsFor,
  type DiarySkillReq,
} from './diarySkillReqs.ts'
import {
  DIARY_TIERS,
  OSRS_DIARIES,
  OSRS_SKILLS,
  SKILL_BRACKETS,
  osrsDiaryTileId,
  osrsDiaryTileName,
  osrsQuestTileId,
  osrsTileId,
  osrsTileName,
  tileKind,
} from './osrsCatalog.ts'
import { OSRS_QUESTS, questReqsFor } from './questReqs.ts'

export type RequirementView = {
  key: string
  parentId: string
  title: string
}

function skillName(skillId: string): string {
  return OSRS_SKILLS.find((skill) => skill.id === skillId)?.name ?? skillId
}

export function coveringSkillTile(
  skillId: string,
  level: number,
): { id: string; name: string } {
  const skill = OSRS_SKILLS.find((entry) => entry.id === skillId)
  const bracketId = coveringBracketId(level)
  const bracket = SKILL_BRACKETS.find((entry) => entry.id === bracketId)
  return {
    id: osrsTileId(skillId, bracketId),
    name:
      skill && bracket
        ? osrsTileName(skill.name, bracket)
        : `${skillName(skillId)} ${bracketId}`,
  }
}

export function skillReqTitle(
  skillId: string,
  level: number,
  ironman?: boolean,
): string {
  const title = `${level} ${skillName(skillId)}`
  return ironman ? `${title} (Ironman)` : title
}

function skillRows(reqs: readonly DiarySkillReq[]): RequirementView[] {
  return reqs.map((req) => {
    const cover = coveringSkillTile(req.skill, req.level)
    return {
      key: `skill:${req.skill}:${req.level}:${req.ironman ? 'im' : 'main'}`,
      parentId: cover.id,
      title: skillReqTitle(req.skill, req.level, req.ironman),
    }
  })
}

function parentRow(parentId: string, title: string): RequirementView {
  return {
    key: `parent:${parentId}`,
    parentId,
    title,
  }
}

function questCatalogRows(questId: string): RequirementView[] | null {
  const reqs = questReqsFor(questId)
  if (!reqs) return null
  const quests = reqs.quests.map((id) => {
    const name = OSRS_QUESTS.find((quest) => quest.id === id)?.name ?? id
    return parentRow(osrsQuestTileId(id), name)
  })
  return [...quests, ...skillRows(reqs.skills)]
}

function previousDiaryRows(diaryId: string, tierId: string): RequirementView[] {
  const index = DIARY_TIERS.findIndex((tier) => tier.id === tierId)
  if (index <= 0) return []
  const diary = OSRS_DIARIES.find((entry) => entry.id === diaryId)
  return DIARY_TIERS.slice(0, index).map((tier) =>
    parentRow(
      osrsDiaryTileId(diaryId, tier.id),
      osrsDiaryTileName(diary?.name ?? diaryId, tier),
    ),
  )
}

function diaryCatalogRows(diaryId: string, tierId: string): RequirementView[] {
  return [
    ...previousDiaryRows(diaryId, tierId),
    ...skillRows(diarySkillReqsFor(diaryId, tierId)),
  ]
}

function parseDiaryTileId(
  id: string,
): { diaryId: string; tierId: string } | null {
  if (!id.startsWith('osrs:diary:')) return null
  const rest = id.slice('osrs:diary:'.length)
  const split = rest.lastIndexOf(':')
  if (split <= 0 || split === rest.length - 1) return null
  return { diaryId: rest.slice(0, split), tierId: rest.slice(split + 1) }
}

function catalogRows(tile: Tile): RequirementView[] | null {
  const kind = tileKind(tile.id)
  if (kind === 'quest') {
    return questCatalogRows(tile.id.slice('osrs:quest:'.length))
  }
  if (kind === 'diary') {
    const parsed = parseDiaryTileId(tile.id)
    if (!parsed) return null
    return diaryCatalogRows(parsed.diaryId, parsed.tierId)
  }
  return null
}

function fallbackRows(tile: Tile, tiles: Tile[]): RequirementView[] {
  return tile.parentIds.map((id) =>
    parentRow(
      id,
      tiles.find((candidate) => candidate.id === id)?.name ?? 'Missing',
    ),
  )
}

export function requirementViews(tile: Tile, tiles: Tile[]): RequirementView[] {
  return catalogRows(tile) ?? fallbackRows(tile, tiles)
}
