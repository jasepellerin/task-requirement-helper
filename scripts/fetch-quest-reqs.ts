import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CatalogSkill } from '../src/data/parseDiaryWikitext.ts'
import {
  extractRequiredGp,
  parseQuestreqLua,
  questSlug,
} from '../src/data/parseQuestreq.ts'
import type { OsrsQuest, QuestReqs } from '../src/data/questReqs.ts'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const USER_AGENT =
  'TilesLocalTracker/1.0 (local OSRS quest req ingest; +https://oldschool.runescape.wiki/)'

async function readJson<T>(relative: string): Promise<T> {
  const text = await readFile(path.join(ROOT, relative), 'utf8')
  return JSON.parse(text) as T
}

function wikiRawUrl(wikiTitle: string): string {
  const slug = wikiTitle.replaceAll(' ', '_')
  return `https://oldschool.runescape.wiki/w/${encodeURIComponent(slug)}?action=raw`
}

async function fetchWikitext(wikiTitle: string): Promise<string | null> {
  const response = await fetch(wikiRawUrl(wikiTitle), {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/plain',
    },
  })
  if (!response.ok) {
    console.warn(`${wikiTitle}: ${response.status} ${response.statusText}`)
    return null
  }
  return response.text()
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function main(): Promise<void> {
  const skills = await readJson<CatalogSkill[]>('src/data/osrs-skills.json')
  const lua = await fetchWikitext('Module:Questreq/data')
  if (!lua) throw new Error('Could not fetch Module:Questreq/data')

  const parsed = parseQuestreqLua(lua, skills)
  const known = new Set(parsed.map((entry) => questSlug(entry.name)))
  const quests: OsrsQuest[] = []
  const reqs: Record<string, QuestReqs> = {}

  for (const [index, entry] of parsed.entries()) {
    const id = questSlug(entry.name)
    const page = await fetchWikitext(entry.name)
    const gp = page ? extractRequiredGp(page) : 0
    const quest: OsrsQuest = {
      id,
      name: entry.name,
      wikiTitle: entry.name,
    }
    if (gp > 0) quest.gp = gp
    quests.push(quest)
    reqs[id] = {
      quests: entry.quests
        .map((name) => questSlug(name))
        .filter((parentId) => known.has(parentId) && parentId !== id),
      skills: entry.skills,
    }
    console.log(
      `${id} quests:${reqs[id].quests.length} skills:${reqs[id].skills.length} gp:${gp || 0}`,
    )
    if (index < parsed.length - 1) await sleep(150)
  }

  await writeFile(
    path.join(ROOT, 'src/data/osrs-quests.json'),
    `${JSON.stringify(quests, null, 2)}\n`,
    'utf8',
  )
  await writeFile(
    path.join(ROOT, 'src/data/osrs-quest-reqs.json'),
    `${JSON.stringify(reqs, null, 2)}\n`,
    'utf8',
  )
  console.log(`wrote ${quests.length} quests`)
}

await main()
