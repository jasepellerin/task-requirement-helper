import { extractTemplate, parseWikiTemplateFields } from './parseQuestreq.ts'

const DIARY_TIERS = ['easy', 'medium', 'hard', 'elite'] as const

type DiarySkillTier = (typeof DIARY_TIERS)[number]

export type DiaryRewards = Record<DiarySkillTier, string[]>

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function extractHeadingSection(
  source: string,
  title: string,
  level: number,
): string | null {
  const equals = '='.repeat(level)
  const heading = new RegExp(
    `^${equals}\\s*${escapeRegExp(title)}\\s*${equals}\\s*$`,
    'im',
  )
  const match = heading.exec(source)
  if (!match) return null
  const rest = source.slice(match.index + match[0].length)
  const next = new RegExp(`^={1,${level}}[^=].*[^=]={1,${level}}\\s*$`, 'im')
  const nextMatch = next.exec(rest)
  return nextMatch ? rest.slice(0, nextMatch.index) : rest
}

function stripRefsAndComments(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref\b[^>]*\/>/gi, '')
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, '')
}

function replaceInnermostTemplates(text: string): string {
  return text.replace(/\{\{([^{}]*)\}\}/g, (_, body: string) => {
    const scp = /^\s*SCP\|([^}|]+)(?:\|([^}|]+))?/i.exec(body)
    if (scp?.[1]) {
      const skill = scp[1].trim()
      const level = scp[2]?.trim()
      if (level && /^\d/.test(level)) return `${level} ${skill}`
      if (/^quest$/i.test(skill)) return ''
      return skill
    }
    const coins = /^\s*[Cc]oins\|([^}|]+)/.exec(body)
    if (coins?.[1]) return `${coins[1].trim()} coins`
    const itemReq = /^\s*Questitemreq\|([^}|]+)(?:\|([^}|]+))?/i.exec(body)
    if (itemReq?.[1]) {
      const name = itemReq[1].trim()
      const qty = itemReq[2]?.trim()
      if (qty && qty !== '1' && !qty.includes('=')) return `${qty} ${name}`
      return name
    }
    return ''
  })
}

function stripTemplates(text: string): string {
  let current = text
  for (let i = 0; i < 8; i += 1) {
    const next = replaceInnermostTemplates(current)
    if (next === current) break
    current = next
  }
  return current
}

export function plainWiki(text: string): string {
  let value = stripTemplates(stripRefsAndComments(text))
  value = value.replace(/\[\[File:[^\]]*\]\]/gi, '')
  value = value.replace(
    /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g,
    (_, page: string, label?: string) => (label ?? page).trim(),
  )
  value = value.replace(/'{2,}/g, '')
  value = value.replace(/<[^>]+>/g, '')
  value = value.replace(/&nbsp;/gi, ' ')
  value = value.replace(/(\d[\d,.]*) (\w+) \2\b/gi, '$1 $2')
  value = value.replace(/\s+/g, ' ').trim()
  return value.replace(/[:;.,]+$/, '').trim()
}

function isNone(value: string): boolean {
  return /^none$/i.test(value)
}

function keepItemSuffix(inner: string): boolean {
  return /^[A-Za-z0-9]{1,4}$/.test(inner.trim())
}

function itemLineBody(line: string): string {
  return line
    .replace(/^(– )+/, '')
    .replace(/^[–—\s-]+$/, '')
    .trim()
}

export function isItemAcquisitionNote(line: string): boolean {
  const body = itemLineBody(line)
  if (!body) return true
  if (/^If you are a\b/i.test(body)) return false
  return (
    /^(Free-to-play|Members?|F2P|P2P)\b/i.test(body) ||
    /^(Note:?|Notes?:|Note that)\b/i.test(body) ||
    /^(Recommended:?|Highly recommended)\b/i.test(body) ||
    /^(You may|There is|There are|The player)\b/i.test(body) ||
    /^(If you)\b/i.test(body) ||
    /^(Bring(?:ing)?|Offer|Use a |Using |Can be )\b/i.test(body) ||
    /^(All items obtainable)\b/i.test(body) ||
    /^(Alternatively,\s+get)\b/i.test(body) ||
    /\bare recommended\b/i.test(body) ||
    /\b(buy from|bought from|purchased from|spawn locations?)\b/i.test(body) ||
    /\bare found in\b/i.test(body) ||
    /\bspawns?\b/i.test(body) ||
    /\balso works\b/i.test(body)
  )
}

export function stripItemNotes(text: string): string {
  let current = text
  for (let i = 0; i < 8; i += 1) {
    const next = current.replace(
      /(\s*)\(([^()]*)\)/g,
      (_match, space: string, inner: string) =>
        keepItemSuffix(inner) ? `${space}(${inner.trim()})` : '',
    )
    if (next === current) break
    current = next
  }
  current = current
    .replace(/\s*[.—–-]\s*Note\b.*$/i, '')
    .replace(/\s+Note:.*$/i, '')
    .replace(/\.\s+If you\b.*$/i, '')
    .replace(
      /\.\s+[^.]*\b(?:can be )?(?:purchased|bought|obtained|sold)\b.*$/i,
      '',
    )
    .replace(/\s+[–—]\s+(?:bring|buy|if planning)\b.*$/i, '')
    .replace(/,?\s+obtainable as\b.*$/i, '')
  return current
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim()
}

export function wikiListLines(text: string): string[] {
  const lines: string[] = []
  for (const raw of text.split('\n')) {
    const trimmed = raw.trim()
    if (!trimmed || /^<\/?poem>$/i.test(trimmed)) continue
    const match = /^(\*+)\s*(.*)$/.exec(trimmed)
    if (match?.[1]) {
      const cleaned = plainWiki(match[2] ?? '')
      if (!cleaned || isNone(cleaned)) continue
      const depth = match[1].length - 1
      lines.push(depth > 0 ? `${'– '.repeat(depth)}${cleaned}` : cleaned)
      continue
    }
    const cleaned = plainWiki(trimmed)
    if (cleaned && !isNone(cleaned)) lines.push(cleaned)
  }
  return lines
}

function bulletLines(text: string): string[] {
  const lines: string[] = []
  for (const raw of text.split('\n')) {
    const match = /^(\*+)\s*(.*)$/.exec(raw.trim())
    if (!match?.[1]) continue
    const cleaned = plainWiki(match[2] ?? '')
    if (!cleaned) continue
    const depth = match[1].length - 1
    lines.push(depth > 0 ? `${'– '.repeat(depth)}${cleaned}` : cleaned)
  }
  return lines
}

function pillLabel(value: string | undefined): string | undefined {
  if (!value) return undefined
  const first = value
    .replace(/<\/?poem>/gi, '\n')
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0)
  const cleaned = plainWiki(first ?? '')
  if (!cleaned || isNone(cleaned)) return undefined
  return cleaned
}

export type QuestCardDetails = {
  difficulty?: string
  length?: string
  items: string[]
}

export function parseInfoboxQuestImage(wikitext: string): string | undefined {
  const template = extractTemplate(wikitext, 'Infobox Quest')
  if (!template) return undefined
  const image = parseWikiTemplateFields(template).image
  if (!image) return undefined
  const match = /\[\[\s*(?:File|Image|Media)\s*:\s*([^\]|]+)/i.exec(image)
  const name = match?.[1]?.trim()
  return name || undefined
}

export function parseQuestCardDetails(wikitext: string): QuestCardDetails {
  const template = extractTemplate(wikitext, 'Quest details')
  if (!template) return { items: [] }
  const fields = parseWikiTemplateFields(template)
  const details: QuestCardDetails = {
    items: wikiListLines(fields.items ?? '')
      .map(stripItemNotes)
      .filter((line) => itemLineBody(line).length > 0)
      .filter((line) => !isItemAcquisitionNote(line)),
  }
  const difficulty = pillLabel(fields.difficulty)
  const length = pillLabel(fields.length)
  if (difficulty) details.difficulty = difficulty
  if (length) details.length = length
  return details
}

function questPointLine(qp: number): string {
  return qp === 1 ? '1 Quest point' : `${qp} Quest points`
}

function extractQuestPointCount(template: string): number {
  const match = /\|qp\s*=\s*(\d+)/i.exec(template)
  if (!match?.[1]) return 0
  return Number(match[1])
}

function extractRewardsField(template: string): string {
  const stripped = template.replace(/\}\}$/, '')
  const match = /\|rewards\s*=/i.exec(stripped)
  if (!match || match.index === undefined) return ''
  return stripped.slice(match.index + match[0].length)
}

export function parseQuestRewards(wikitext: string): string[] {
  const section =
    extractHeadingSection(wikitext, 'Rewards', 2) ??
    extractHeadingSection(wikitext, 'Reward', 2) ??
    extractHeadingSection(wikitext, 'Rewards', 3) ??
    extractHeadingSection(wikitext, 'Reward', 3)
  if (!section) return []

  const template = extractTemplate(section, 'Quest rewards')
  const lines: string[] = []

  if (template) {
    const qp = extractQuestPointCount(template)
    if (qp > 0) lines.push(questPointLine(qp))
    lines.push(...bulletLines(extractRewardsField(template)))
    lines.push(...bulletLines(section.replace(template, '\n')))
    return lines
  }

  return bulletLines(section)
}

export function parseDiaryRewards(wikitext: string): DiaryRewards {
  const rewards: DiaryRewards = {
    easy: [],
    medium: [],
    hard: [],
    elite: [],
  }

  for (const tier of DIARY_TIERS) {
    const heading = `${tier[0]?.toUpperCase() ?? ''}${tier.slice(1)}`
    const tierSection = extractHeadingSection(wikitext, heading, 2)
    if (!tierSection) continue
    const rewardSection = extractHeadingSection(tierSection, 'Rewards', 3)
    rewards[tier] = bulletLines(rewardSection ?? '')
  }

  return rewards
}
