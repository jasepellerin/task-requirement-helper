import type { CatalogSkill, DiarySkillReq } from './parseDiaryWikitext.ts'

export type ParsedQuestSkills = DiarySkillReq

export type ParsedQuestEntry = {
  name: string
  quests: string[]
  skills: ParsedQuestSkills[]
}

const SKIP_NAMES = new Set(['tutorial island', 'name_of_quest'])

export function questSlug(name: string): string {
  return normalizeQuestRef(name)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeQuestRef(raw: string): string {
  return raw
    .replace(/^Started:\s*/i, '')
    .replace(/^Partial completion of\s*/i, '')
    .trim()
}

export function isQuestCatalogName(name: string): boolean {
  const trimmed = name.trim()
  if (SKIP_NAMES.has(trimmed.toLowerCase())) return false
  return !/ diary$/i.test(trimmed)
}

export function isWikiQuestPage(wikitext: string): boolean {
  const trimmed = wikitext.trim()
  if (/^#REDIRECT/i.test(trimmed)) return false
  if (/\{\{\s*Infobox Miniquest\b/i.test(wikitext)) return false
  return /\{\{\s*Infobox Quest\b/i.test(wikitext)
}

export const QUEST_LIST_CATEGORIES = [
  'Category:Free-to-play quests',
  "Category:Members' quests",
] as const

export function isQuestIndexTitle(title: string): boolean {
  return title.startsWith('Quests/')
}

function unescapeLuaString(value: string): string {
  return value.replace(/\\'/g, "'").replace(/\\"/g, '"')
}

function readLuaString(
  source: string,
  start: number,
): { value: string; next: number } | null {
  const quote = source[start]
  if (quote !== "'" && quote !== '"') return null
  let i = start + 1
  let value = ''
  while (i < source.length) {
    const char = source[i]
    if (char === '\\' && source[i + 1]) {
      value += source[i + 1]
      i += 2
      continue
    }
    if (char === quote) {
      return { value: unescapeLuaString(value), next: i + 1 }
    }
    value += char
    i += 1
  }
  return null
}

function matchingBrace(source: string, open: number): number {
  let depth = 0
  for (let i = open; i < source.length; i += 1) {
    const char = source[i]
    if (char === "'" || char === '"') {
      const str = readLuaString(source, i)
      if (!str) break
      i = str.next - 1
      continue
    }
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return i
    }
  }
  return -1
}

function extractNamedTable(block: string, key: string): string | null {
  const match = new RegExp(`\\['${key}'\\]\\s*=\\s*\\{`).exec(block)
  if (!match || match.index === undefined) return null
  const open = block.indexOf('{', match.index + match[0].length - 1)
  const close = matchingBrace(block, open)
  if (close < 0) return null
  return block.slice(open + 1, close)
}

function parseQuestNames(body: string): string[] {
  const names: string[] = []
  for (let i = 0; i < body.length; i += 1) {
    if (body[i] !== "'" && body[i] !== '"') continue
    const str = readLuaString(body, i)
    if (!str) continue
    const name = normalizeQuestRef(str.value)
    if (name) names.push(name)
    i = str.next - 1
  }
  return names
}

function parseSkillRows(
  body: string,
  catalogSkills: readonly CatalogSkill[],
): ParsedQuestSkills[] {
  const byName = new Map(
    catalogSkills.map((skill) => [skill.name.toLowerCase(), skill]),
  )
  const reqs: ParsedQuestSkills[] = []
  const row = /\{\s*'((?:\\'|[^'])*)'\s*,\s*(\d+)([^}]*)\}/g
  for (const match of body.matchAll(row)) {
    const rawName = unescapeLuaString(match[1] ?? '')
    const level = Number(match[2])
    const flags = match[3] ?? ''
    const skill = byName.get(rawName.toLowerCase())
    if (!skill || !Number.isInteger(level) || level <= 1) continue
    const req: ParsedQuestSkills = { skill: skill.id, level }
    if (/\bironman\b/i.test(flags)) req.ironman = true
    reqs.push(req)
  }
  return reqs
}

export function parseQuestreqLua(
  lua: string,
  catalogSkills: readonly CatalogSkill[],
): ParsedQuestEntry[] {
  const tableStart = lua.indexOf('local questReqs = {')
  if (tableStart < 0) return []
  const open = lua.indexOf('{', tableStart)
  const close = matchingBrace(lua, open)
  if (close < 0) return []
  const table = lua.slice(open + 1, close)
  const entries: ParsedQuestEntry[] = []

  for (let i = 0; i < table.length; i += 1) {
    if (table.slice(i, i + 2) !== "['") continue
    const nameStr = readLuaString(table, i + 1)
    if (!nameStr) continue
    const afterName = table.slice(nameStr.next).match(/^\s*\]\s*=\s*\{/)
    if (!afterName) continue
    const blockOpen = table.indexOf('{', nameStr.next)
    const blockClose = matchingBrace(table, blockOpen)
    if (blockClose < 0) break
    const name = nameStr.value
    if (isQuestCatalogName(name)) {
      const block = table.slice(blockOpen, blockClose + 1)
      const questsBody = extractNamedTable(block, 'quests') ?? ''
      const skillsBody = extractNamedTable(block, 'skills') ?? ''
      entries.push({
        name,
        quests: parseQuestNames(questsBody),
        skills: parseSkillRows(skillsBody, catalogSkills),
      })
    }
    i = blockClose
  }

  return entries
}

export function parseWikiTemplateFields(
  template: string,
): Record<string, string> {
  const firstNl = template.indexOf('\n')
  const body =
    firstNl < 0
      ? template.replace(/^\{\{[^|]*\|?/, '').replace(/\}\}$/, '')
      : template.slice(firstNl + 1).replace(/\}\}$/, '')
  const fields: Record<string, string> = {}
  let currentKey: string | undefined
  const currentVal: string[] = []

  function flush(): void {
    if (!currentKey) return
    fields[currentKey] = currentVal.join('\n').trim()
  }

  for (const line of body.split('\n')) {
    const match = /^\|([^=]+)=(.*)$/.exec(line)
    if (match?.[1]) {
      flush()
      currentKey = match[1].trim()
      currentVal.length = 0
      currentVal.push(match[2] ?? '')
      continue
    }
    if (currentKey) currentVal.push(line)
  }
  flush()
  return fields
}

export function extractTemplate(source: string, name: string): string | null {
  const start = source.indexOf(`{{${name}`)
  if (start < 0) return null
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
      if (depth === 0) return source.slice(start, i + 1)
    }
  }
  return null
}

export function parseCoinAmounts(text: string): number[] {
  const amounts: number[] = []
  const patterns = [
    /(\d{1,3}(?:,\d{3})+|\d+)\s*\[\[coins?(?:\|[^\]]*)?\]\]/gi,
    /(\d{1,3}(?:,\d{3})+|\d+)\s+coins\b/gi,
    /\{\{[Cc]oins\|(\d+)\}\}/g,
  ]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const raw = match[1]?.replaceAll(',', '')
      const amount = Number(raw)
      if (Number.isInteger(amount) && amount > 0) amounts.push(amount)
    }
  }
  return amounts
}

export function extractRequiredGp(wikitext: string): number {
  const template = extractTemplate(wikitext, 'Quest details')
  if (!template) return 0
  const fields = parseWikiTemplateFields(template)
  const required = [fields.items, fields.ironman]
    .filter((value): value is string => Boolean(value))
    .join('\n')
  const amounts = parseCoinAmounts(required)
  return amounts.length === 0 ? 0 : Math.max(...amounts)
}

function leadingStars(line: string): number {
  const match = /^(\*+)/.exec(line.trim())
  return match?.[1]?.length ?? 0
}

function parseSkillReqsFromLine(
  line: string,
  catalogSkills: readonly CatalogSkill[],
): ParsedQuestSkills[] {
  const byName = new Map(
    catalogSkills.map((skill) => [skill.name.toLowerCase(), skill]),
  )
  const ironman = /\bironman\b/i.test(line)
  const reqs: ParsedQuestSkills[] = []
  const scp = /\{\{\s*SCP\|([^|]+)\|(\d+)/gi
  for (const match of line.matchAll(scp)) {
    const skill = byName.get((match[1] ?? '').trim().toLowerCase())
    const level = Number(match[2])
    if (!skill || !Number.isInteger(level) || level <= 1) continue
    const req: ParsedQuestSkills = { skill: skill.id, level }
    if (ironman) req.ironman = true
    reqs.push(req)
  }
  return reqs
}

function parseQuestNamesFromLine(line: string): string[] {
  const names: string[] = []
  const links = /\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g
  for (const match of line.matchAll(links)) {
    const raw = match[1]?.trim() ?? ''
    if (!raw || raw.includes(':')) continue
    const name = normalizeQuestRef(raw)
    if (name) names.push(name)
  }
  return names
}

export function parseQuestDetailsReqs(
  wikitext: string,
  catalogSkills: readonly CatalogSkill[],
): Pick<ParsedQuestEntry, 'quests' | 'skills'> {
  const template = extractTemplate(wikitext, 'Quest details')
  if (!template) return { quests: [], skills: [] }
  const requirements = parseWikiTemplateFields(template).requirements?.trim()
  if (!requirements || /^none$/i.test(requirements)) {
    return { quests: [], skills: [] }
  }

  const quests: string[] = []
  const skills: ParsedQuestSkills[] = []
  const seenQuests = new Set<string>()
  const seenSkills = new Set<string>()

  for (const line of requirements.split('\n')) {
    const stars = leadingStars(line)
    if (stars <= 1) {
      for (const req of parseSkillReqsFromLine(line, catalogSkills)) {
        const key = `${req.skill}:${req.level}:${req.ironman ? 'im' : ''}`
        if (seenSkills.has(key)) continue
        seenSkills.add(key)
        skills.push(req)
      }
    }
    if (stars > 2) continue
    for (const name of parseQuestNamesFromLine(line)) {
      if (seenQuests.has(name)) continue
      seenQuests.add(name)
      quests.push(name)
    }
  }

  return { quests, skills }
}
