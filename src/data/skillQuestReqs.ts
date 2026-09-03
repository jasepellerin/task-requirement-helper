import reqsData from './osrs-skill-quest-reqs.json'

const SKILL_QUEST_REQS = reqsData as Record<string, string[]>

export function skillQuestReqsFor(skillId: string): string[] {
  return SKILL_QUEST_REQS[skillId] ?? []
}
