import overrideData from './osrs-quest-req-overrides.json'
import reqsData from './osrs-quest-reqs.json'
import questsData from './osrs-quests.json'

export type OsrsQuest = {
  id: string
  name: string
  wikiTitle: string
  gp?: number
}

export type QuestSkillReq = {
  skill: string
  level: number
  ironman?: boolean
}

export type QuestReqs = {
  quests: string[]
  skills: QuestSkillReq[]
}

const QUESTS = questsData as OsrsQuest[]
const QUEST_REQS = reqsData as Record<string, QuestReqs>
const QUEST_REQ_OVERRIDES = overrideData as Record<string, Partial<QuestReqs>>

export const OSRS_QUESTS = QUESTS

export function osrsQuestTileId(questId: string): string {
  return `osrs:quest:${questId}`
}

export function formatGp(gp: number): string {
  return `${gp.toLocaleString('en-US')} gp`
}

function skillKey(req: QuestSkillReq): string {
  return `${req.skill}:${req.level}:${req.ironman ? 'im' : ''}`
}

export function mergeQuestReqs(
  base: QuestReqs | undefined,
  extra: Partial<QuestReqs> | undefined,
): QuestReqs | undefined {
  if (!base && !extra) return undefined

  const quests = [...(base?.quests ?? [])]
  const seenQuests = new Set(quests)
  for (const id of extra?.quests ?? []) {
    if (seenQuests.has(id)) continue
    seenQuests.add(id)
    quests.push(id)
  }

  const skills = [...(base?.skills ?? [])]
  const seenSkills = new Set(skills.map(skillKey))
  for (const req of extra?.skills ?? []) {
    const key = skillKey(req)
    if (seenSkills.has(key)) continue
    seenSkills.add(key)
    skills.push(req)
  }

  return { quests, skills }
}

export function questReqsFor(questId: string): QuestReqs | undefined {
  return mergeQuestReqs(QUEST_REQS[questId], QUEST_REQ_OVERRIDES[questId])
}
