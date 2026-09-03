import { describe, expect, it } from 'vitest'
import { osrsDiaryTileId, osrsQuestTileId, osrsTileId } from './osrsCatalog.ts'
import { tileWikiTitle, tileWikiUrl, wikiFileUrl, wikiPageUrl } from './wiki.ts'

describe('wiki links', () => {
  it('builds wiki file urls from infobox filenames', () => {
    expect(wikiFileUrl("Cook's Assistant.png")).toBe(
      "https://oldschool.runescape.wiki/w/Special:FilePath/Cook's_Assistant.png",
    )
    expect(wikiFileUrl('A Kingdom Divided.png')).toBe(
      'https://oldschool.runescape.wiki/w/Special:FilePath/A_Kingdom_Divided.png',
    )
  })

  it('builds wiki page urls, including subpages', () => {
    expect(wikiPageUrl('Dragon Slayer I')).toBe(
      'https://oldschool.runescape.wiki/w/Dragon_Slayer_I',
    )
    expect(wikiPageUrl("Recipe for Disaster/Another Cook's Quest")).toBe(
      "https://oldschool.runescape.wiki/w/Recipe_for_Disaster/Another_Cook's_Quest",
    )
  })

  it('resolves quest, diary, and skill catalog titles', () => {
    expect(tileWikiTitle(osrsQuestTileId('dragon-slayer-i'))).toBe(
      'Dragon Slayer I',
    )
    expect(tileWikiTitle(osrsDiaryTileId('kandarin', 'easy'))).toBe(
      'Kandarin Diary',
    )
    expect(tileWikiTitle(osrsTileId('agility', '21-30'))).toBe('Agility')
    expect(tileWikiTitle('not-a-tile')).toBeUndefined()
  })

  it('returns a wiki url for catalog tiles only', () => {
    expect(tileWikiUrl(osrsQuestTileId('dragon-slayer-i'))).toBe(
      'https://oldschool.runescape.wiki/w/Dragon_Slayer_I',
    )
    expect(tileWikiUrl('not-a-tile')).toBeUndefined()
  })
})
