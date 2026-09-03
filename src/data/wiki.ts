import { OSRS_DIARIES, OSRS_SKILLS } from './osrsCatalog.ts'
import { OSRS_QUESTS, osrsQuestTileId } from './questReqs.ts'

const WIKI_ORIGIN = 'https://oldschool.runescape.wiki/w/'

export function wikiPageUrl(wikiTitle: string): string {
  const path = wikiTitle
    .split('/')
    .map((segment) => encodeURIComponent(segment.replaceAll(' ', '_')))
    .join('/')
  return `${WIKI_ORIGIN}${path}`
}

export function tileWikiTitle(tileId: string): string | undefined {
  if (tileId.startsWith('osrs:quest:')) {
    return OSRS_QUESTS.find((quest) => osrsQuestTileId(quest.id) === tileId)
      ?.wikiTitle
  }
  if (tileId.startsWith('osrs:diary:')) {
    const diaryId = tileId.slice('osrs:diary:'.length).split(':')[0]
    return OSRS_DIARIES.find((diary) => diary.id === diaryId)?.wikiTitle
  }
  if (tileId.startsWith('osrs:')) {
    const skillId = tileId.slice('osrs:'.length).split(':')[0]
    return OSRS_SKILLS.find((skill) => skill.id === skillId)?.name
  }
  return undefined
}

export function tileWikiUrl(tileId: string): string | undefined {
  const title = tileWikiTitle(tileId)
  return title ? wikiPageUrl(title) : undefined
}
