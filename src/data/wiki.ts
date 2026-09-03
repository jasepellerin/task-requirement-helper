import { CATALOG_BY_ID } from './osrsCatalog.ts'

const WIKI_ORIGIN = 'https://oldschool.runescape.wiki/w/'

export function wikiPageUrl(wikiTitle: string): string {
  const path = wikiTitle
    .split('/')
    .map((segment) => encodeURIComponent(segment.replaceAll(' ', '_')))
    .join('/')
  return `${WIKI_ORIGIN}${path}`
}

export function tileWikiTitle(tileId: string): string | undefined {
  return CATALOG_BY_ID.get(tileId)?.wikiTitle
}

export function tileWikiUrl(tileId: string): string | undefined {
  const title = tileWikiTitle(tileId)
  return title ? wikiPageUrl(title) : undefined
}
