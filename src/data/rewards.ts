import type { DiarySkillTier } from './diarySkillReqs.ts'
import diaryRewardsData from './osrs-diary-rewards.json'
import questRewardsData from './osrs-quest-rewards.json'

const QUEST_REWARDS = questRewardsData as Record<string, string[]>
const DIARY_REWARDS = diaryRewardsData as Record<
  string,
  Partial<Record<DiarySkillTier, string[]>>
>

export function questRewardsFor(questId: string): string[] {
  return QUEST_REWARDS[questId] ?? []
}

export function diaryRewardsFor(diaryId: string, tierId: string): string[] {
  return DIARY_REWARDS[diaryId]?.[tierId as DiarySkillTier] ?? []
}
