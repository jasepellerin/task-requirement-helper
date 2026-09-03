import detailsData from './osrs-quest-details.json'

export type StoredQuestDetails = {
  difficulty?: string
  length?: string
  items?: string[]
}

export type QuestDetails = {
  difficulty?: string
  length?: string
  items: string[]
}

const QUEST_DETAILS = detailsData as Record<string, StoredQuestDetails>

export function questDetailsFor(questId: string): QuestDetails {
  const details = QUEST_DETAILS[questId]
  return {
    ...(details?.difficulty ? { difficulty: details.difficulty } : {}),
    ...(details?.length ? { length: details.length } : {}),
    items: details?.items ?? [],
  }
}
