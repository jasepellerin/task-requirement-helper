import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CatalogSkill } from '../src/data/parseDiaryWikitext.ts'
import {
  extractRequiredGp,
  isQuestIndexTitle,
  isWikiQuestPage,
  parseQuestDetailsReqs,
  parseQuestreqLua,
  QUEST_LIST_CATEGORIES,
  questSlug,
} from '../src/data/parseQuestreq.ts'
import type { OsrsQuest, QuestReqs } from '../src/data/questReqs.ts'
import {
  parseQuestCardDetails,
  parseQuestRewards,
} from '../src/data/parseRewards.ts'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const WIKI_API = 'https://oldschool.runescape.wiki/api.php'
const USER_AGENT =
  'TilesLocalTracker/1.0 (local OSRS quest req ingest; +https://oldschool.runescape.wiki/)'
const PAGE_BATCH = 20

async function readJson<T>(relative: string): Promise<T> {
  const text = await readFile(path.join(ROOT, relative), 'utf8')
  return JSON.parse(text) as T
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function wikiJson<T>(params: Record<string, string>): Promise<T> {
  const url = `${WIKI_API}?${new URLSearchParams({
    format: 'json',
    formatversion: '2',
    ...params,
  }).toString()}`
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error(`${url}: ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as T
}

async function fetchWikitext(wikiTitle: string): Promise<string | null> {
  const slug = wikiTitle.replaceAll(' ', '_')
  const response = await fetch(
    `https://oldschool.runescape.wiki/w/${encodeURIComponent(slug)}?action=raw`,
    {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/plain',
      },
    },
  )
  if (!response.ok) {
    console.warn(`${wikiTitle}: ${response.status} ${response.statusText}`)
    return null
  }
  return response.text()
}

type CategoryQuery = {
  continue?: { cmcontinue: string }
  query?: { categorymembers?: { title: string }[] }
}

async function fetchCategoryTitles(category: string): Promise<string[]> {
  const titles: string[] = []
  let cmcontinue: string | undefined
  do {
    const params: Record<string, string> = {
      action: 'query',
      list: 'categorymembers',
      cmtitle: category,
      cmlimit: '500',
      cmtype: 'page',
    }
    if (cmcontinue) params.cmcontinue = cmcontinue
    const data = await wikiJson<CategoryQuery>(params)
    for (const member of data.query?.categorymembers ?? []) {
      titles.push(member.title)
    }
    cmcontinue = data.continue?.cmcontinue
  } while (cmcontinue)
  return titles
}

type RevisionsQuery = {
  query?: {
    redirects?: { from: string; to: string }[]
    pages?: {
      title: string
      missing?: boolean
      revisions?: { slots?: { main?: { content?: string } } }[]
    }[]
  }
}

async function fetchPageText(titles: string[]): Promise<Map<string, string>> {
  const pages = new Map<string, string>()
  for (let i = 0; i < titles.length; i += PAGE_BATCH) {
    const batch = titles.slice(i, i + PAGE_BATCH)
    const data = await wikiJson<RevisionsQuery>({
      action: 'query',
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
      redirects: '1',
      titles: batch.join('|'),
    })
    for (const page of data.query?.pages ?? []) {
      const content = page.revisions?.[0]?.slots?.main?.content
      if (page.missing || !content) continue
      pages.set(page.title, content)
    }
    for (const redirect of data.query?.redirects ?? []) {
      const content = pages.get(redirect.to)
      if (content) pages.set(redirect.from, content)
    }
    if (i + PAGE_BATCH < titles.length) await sleep(150)
  }
  return pages
}

async function main(): Promise<void> {
  const skills = await readJson<CatalogSkill[]>('src/data/osrs-skills.json')
  const listTitles = [
    ...new Set(
      (
        await Promise.all(QUEST_LIST_CATEGORIES.map(fetchCategoryTitles))
      ).flat(),
    ),
  ]
    .filter((title) => !isQuestIndexTitle(title))
    .sort((a, b) => a.localeCompare(b))

  const lua = await fetchWikitext('Module:Questreq/data')
  if (!lua) throw new Error('Could not fetch Module:Questreq/data')
  const luaByName = new Map(
    parseQuestreqLua(lua, skills).map((entry) => [entry.name, entry]),
  )

  const pages = await fetchPageText(listTitles)
  const kept: {
    title: string
    gp: number
    quests: string[]
    skills: QuestReqs['skills']
    rewards: string[]
    difficulty?: string
    length?: string
    items: string[]
  }[] = []

  for (const title of listTitles) {
    const page = pages.get(title)
    if (!page) {
      console.log(`skip ${questSlug(title)} (missing page)`)
      continue
    }
    if (!isWikiQuestPage(page)) {
      console.log(`skip ${questSlug(title)} (not a quest)`)
      continue
    }
    const luaEntry = luaByName.get(title)
    const details = parseQuestDetailsReqs(page, skills)
    const card = parseQuestCardDetails(page)
    kept.push({
      title,
      gp: extractRequiredGp(page),
      quests: luaEntry?.quests ?? details.quests,
      skills: luaEntry?.skills ?? details.skills,
      rewards: parseQuestRewards(page),
      difficulty: card.difficulty,
      length: card.length,
      items: card.items,
    })
  }

  const known = new Set(kept.map((entry) => questSlug(entry.title)))
  const quests: OsrsQuest[] = []
  const reqs: Record<string, QuestReqs> = {}
  const rewards: Record<string, string[]> = {}
  const cardDetails: Record<
    string,
    { difficulty?: string; length?: string; items?: string[] }
  > = {}

  for (const entry of kept) {
    const id = questSlug(entry.title)
    const quest: OsrsQuest = {
      id,
      name: entry.title,
      wikiTitle: entry.title,
    }
    if (entry.gp > 0) quest.gp = entry.gp
    quests.push(quest)
    reqs[id] = {
      quests: entry.quests
        .map((name) => questSlug(name))
        .filter((parentId) => known.has(parentId) && parentId !== id),
      skills: entry.skills,
    }
    if (entry.rewards.length > 0) rewards[id] = entry.rewards
    const stored: {
      difficulty?: string
      length?: string
      items?: string[]
    } = {}
    if (entry.difficulty) stored.difficulty = entry.difficulty
    if (entry.length) stored.length = entry.length
    if (entry.items.length > 0) stored.items = entry.items
    if (Object.keys(stored).length > 0) cardDetails[id] = stored
    console.log(
      `${id} quests:${reqs[id].quests.length} skills:${reqs[id].skills.length} gp:${entry.gp || 0} rewards:${entry.rewards.length} items:${entry.items.length}`,
    )
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
  await writeFile(
    path.join(ROOT, 'src/data/osrs-quest-rewards.json'),
    `${JSON.stringify(rewards, null, 2)}\n`,
    'utf8',
  )
  await writeFile(
    path.join(ROOT, 'src/data/osrs-quest-details.json'),
    `${JSON.stringify(cardDetails, null, 2)}\n`,
    'utf8',
  )
  console.log(`wrote ${quests.length} quests`)
}

await main()
