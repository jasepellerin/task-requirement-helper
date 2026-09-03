import type { Tile } from '../domain/types.ts'
import { coveringBracketId } from './diarySkillReqs.ts'
import {
  CATALOG_BY_ID,
  OSRS_SKILLS,
  osrsTileId,
  type CatalogReq,
} from './osrsCatalog.ts'

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
  const bracketId = coveringBracketId(level)
  const id = osrsTileId(skillId, bracketId)
  return {
    id,
    name: CATALOG_BY_ID.get(id)?.name ?? `${skillName(skillId)} ${bracketId}`,
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

function viewForReq(req: CatalogReq): RequirementView {
  if (req.type === 'tile') {
    return {
      key: `parent:${req.id}`,
      parentId: req.id,
      title: CATALOG_BY_ID.get(req.id)?.name ?? req.id,
    }
  }
  return {
    key: `skill:${req.skill}:${req.level}:${req.ironman ? 'im' : 'main'}`,
    parentId: coveringSkillTile(req.skill, req.level).id,
    title: skillReqTitle(req.skill, req.level, req.ironman),
  }
}

export function requirementViews(tile: Tile): RequirementView[] {
  const def = CATALOG_BY_ID.get(tile.id)
  if (!def) return []
  return def.reqs.map(viewForReq)
}
