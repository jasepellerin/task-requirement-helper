import { OSRS_SKILLS, tileKind } from './osrsCatalog.ts'

const CATALOG_SKILL_IDS = new Set(OSRS_SKILLS.map((skill) => skill.id))

export function isCatalogSkill(skillId: string): boolean {
  return CATALOG_SKILL_IDS.has(skillId)
}

export function skillIdFromSkillTile(tileId: string): string | null {
  if (tileKind(tileId) !== 'skill') return null
  const skillId = tileId.split(':')[1]
  return skillId && isCatalogSkill(skillId) ? skillId : null
}

export function tileMatchesPrioritySkills(
  tileId: string,
  prioritySkills: ReadonlySet<string>,
): boolean {
  if (prioritySkills.size === 0) return false
  const skillId = skillIdFromSkillTile(tileId)
  return skillId !== null && prioritySkills.has(skillId)
}

export function prioritySkillsFromStored(
  ids: readonly string[] | undefined,
): Set<string> {
  const next = new Set<string>()
  if (!ids) return next
  for (const id of ids) {
    if (isCatalogSkill(id)) next.add(id)
  }
  return next
}

export function storedPrioritySkills(
  prioritySkills: ReadonlySet<string>,
): string[] | undefined {
  const skills = [...prioritySkills].filter(isCatalogSkill).sort()
  return skills.length > 0 ? skills : undefined
}

export function setStoredPrioritySkill(
  prioritySkills: Set<string>,
  skillId: string,
  value: boolean,
): Set<string> | null {
  if (!isCatalogSkill(skillId)) return null
  const next = new Set(prioritySkills)
  if (value) next.add(skillId)
  else next.delete(skillId)
  return next
}
