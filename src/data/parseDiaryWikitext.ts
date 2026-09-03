import type {
  DiarySkillReq,
  DiarySkillTier,
  DiaryTierSkillReqs,
} from './diarySkillReqs.ts'

export type CatalogSkill = {
  id: string
  name: string
}

const IGNORED_STAT_KEYS = new Set(['total', 'quest', 'combat'])

const TIER_HEADING = /^(easy|medium|hard|elite)\s*=\s*$/i

type CatalogSkillIndex = {
  byId: Map<string, CatalogSkill>
  byName: Map<string, CatalogSkill>
}

function indexCatalog(skills: readonly CatalogSkill[]): CatalogSkillIndex {
  const byId = new Map<string, CatalogSkill>()
  const byName = new Map<string, CatalogSkill>()
  for (const skill of skills) {
    byId.set(skill.id, skill)
    byName.set(skill.name.toLowerCase(), skill)
  }
  return { byId, byName }
}

function findCatalogSkill(
  index: CatalogSkillIndex,
  raw: string,
): CatalogSkill | undefined {
  const name = raw.trim().toLowerCase()
  return index.byName.get(name) ?? index.byId.get(name)
}

function extractTemplateArgs(source: string, start: number): string | null {
  if (!source.startsWith('{{DiarySkillStats', start)) return null
  let depth = 0
  for (let i = start; i < source.length - 1; i += 1) {
    if (source[i] === '{' && source[i + 1] === '{') {
      depth += 1
      i += 1
      continue
    }
    if (source[i] === '}' && source[i + 1] === '}') {
      depth -= 1
      i += 1
      if (depth === 0) {
        return source.slice(start, i + 1)
      }
    }
  }
  return null
}

function parseTemplateFields(template: string): Record<string, string> {
  const fields: Record<string, string> = {}
  const body = template.replace(/^\{\{DiarySkillStats/, '').replace(/\}\}$/, '')
  for (const line of body.split('\n')) {
    const match = /^\|(\w+)\s*=\s*(.*)$/.exec(line.trimEnd())
    if (!match) continue
    const key = match[1]
    const value = match[2]
    if (!key || value === undefined) continue
    fields[key] = value.trim()
  }
  return fields
}

function extractIronmanLevels(
  notes: string[],
  index: CatalogSkillIndex,
): Map<string, number> {
  const levels = new Map<string, number>()
  const ironmanNotes = notes.filter((note) => /ironman/i.test(note))
  const patterns = [
    /(\d+)\s+\[\[([^|\]]+)(?:\|[^\]]*)?\]\]/g,
    /(\d+)\s+([A-Za-z][A-Za-z]+)/g,
  ]

  for (const note of ironmanNotes) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0
      for (const match of note.matchAll(pattern)) {
        const level = Number(match[1])
        const rawName = match[2]
        if (!Number.isInteger(level) || !rawName) continue
        const skill = findCatalogSkill(index, rawName)
        if (!skill) continue
        const previous = levels.get(skill.id) ?? 0
        if (level > previous) levels.set(skill.id, level)
      }
    }
  }
  return levels
}

function reqsFromFields(
  fields: Record<string, string>,
  index: CatalogSkillIndex,
): DiarySkillReq[] {
  const baseLevels = new Map<string, number>()
  const notes: string[] = []

  for (const [rawKey, value] of Object.entries(fields)) {
    if (rawKey.endsWith('Notes')) {
      notes.push(value)
      continue
    }
    const key = rawKey.toLowerCase()
    if (IGNORED_STAT_KEYS.has(key)) continue
    const skill = findCatalogSkill(index, rawKey)
    if (!skill) continue
    const level = Number(value)
    if (!Number.isInteger(level)) continue
    baseLevels.set(skill.id, level)
  }

  const ironmanLevels = extractIronmanLevels(notes, index)
  const skillIds = new Set([...baseLevels.keys(), ...ironmanLevels.keys()])
  const reqs: DiarySkillReq[] = []

  for (const skillId of skillIds) {
    const base = baseLevels.get(skillId) ?? 0
    const ironman = ironmanLevels.get(skillId) ?? 0
    const countedBase = base > 1 ? base : 0
    const level = Math.max(countedBase, ironman)
    if (level <= 0) continue
    const req: DiarySkillReq = { skill: skillId, level }
    if (ironman > 0) req.ironman = true
    reqs.push(req)
  }

  return reqs
}

function isDiarySkillTier(value: string): value is DiarySkillTier {
  return (
    value === 'easy' ||
    value === 'medium' ||
    value === 'hard' ||
    value === 'elite'
  )
}

export function parseDiarySkillStats(
  wikitext: string,
  catalogSkills: readonly CatalogSkill[],
): DiaryTierSkillReqs {
  const index = indexCatalog(catalogSkills)
  const result: DiaryTierSkillReqs = {
    easy: [],
    medium: [],
    hard: [],
    elite: [],
  }

  let currentTier: DiarySkillTier | undefined
  let offset = 0
  for (const line of wikitext.split('\n')) {
    const heading = TIER_HEADING.exec(line.trim())
    const tierName = heading?.[1]?.toLowerCase()
    if (tierName && isDiarySkillTier(tierName)) {
      currentTier = tierName
    }
    const local = line.indexOf('{{DiarySkillStats')
    if (local !== -1 && currentTier) {
      const template = extractTemplateArgs(wikitext, offset + local)
      if (template) {
        result[currentTier] = reqsFromFields(
          parseTemplateFields(template),
          index,
        )
      }
    }
    offset += line.length + 1
  }

  return result
}
