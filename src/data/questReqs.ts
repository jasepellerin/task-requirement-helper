import reqsData from './osrs-quest-reqs.json'
import questsData from './osrs-quests.json'

export type OsrsQuest = {
  id: string
  name: string
  wikiTitle: string
  gp?: number
}

export type QuestReqs = {
  quests: string[]
  skills: { skill: string; level: number; ironman?: boolean }[]
}

const QUESTS = questsData as OsrsQuest[]
const QUEST_REQS = reqsData as Record<string, QuestReqs>

export const OSRS_QUESTS = QUESTS

export function osrsQuestTileId(questId: string): string {
  return `osrs:quest:${questId}`
}

export function formatGp(gp: number): string {
  return `${gp.toLocaleString('en-US')} gp`
}

export function questReqsFor(questId: string): QuestReqs | undefined {
  return QUEST_REQS[questId]
}
