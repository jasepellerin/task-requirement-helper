import reqsData from './osrs-diary-skill-reqs.json'
import bracketsData from './skill-brackets.json'

export const DIARY_SKILL_TIERS = ['easy', 'medium', 'hard', 'elite'] as const

export type DiarySkillTier = (typeof DIARY_SKILL_TIERS)[number]

export type DiarySkillReq = {
  skill: string
  level: number
  ironman?: boolean
}

export type DiaryTierSkillReqs = Record<DiarySkillTier, DiarySkillReq[]>

export type DiarySkillReqsFile = Record<string, DiaryTierSkillReqs>

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

export function diarySkillReqsFor(
  diaryId: string,
  tierId: string,
): DiarySkillReq[] {
  return DIARY_SKILL_REQS[diaryId]?.[tierId as DiarySkillTier] ?? []
}
