import reqsData from './osrs-diary-skill-reqs.json'
import bracketsData from './skill-brackets.json'
import type {
  DiarySkillReqsFile,
  DiarySkillTier,
} from './parseDiaryWikitext.ts'

export type {
  DiarySkillReq,
  DiarySkillReqsFile,
  DiarySkillTier,
} from './parseDiaryWikitext.ts'
export { parseDiarySkillStats } from './parseDiaryWikitext.ts'

type SkillBracket = {
  id: string
  min: number
  max: number
  cape?: boolean
}

const DIARY_SKILL_REQS = reqsData as DiarySkillReqsFile
const BRACKETS = bracketsData as SkillBracket[]

export function coveringBracketId(level: number): string {
  const bracket =
    BRACKETS.find((entry) => entry.max >= level) ?? BRACKETS.at(-1)
  return bracket?.id ?? '91-99'
}

export function skillParentsFor(diaryId: string, tierId: string): string[] {
  const reqs = DIARY_SKILL_REQS[diaryId]?.[tierId as DiarySkillTier] ?? []
  const ids = reqs.map(
    (req) => `osrs:${req.skill}:${coveringBracketId(req.level)}`,
  )
  return [...new Set(ids)]
}
