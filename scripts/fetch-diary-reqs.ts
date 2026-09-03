import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DIARY_SKILL_TIERS,
  parseDiarySkillStats,
  type CatalogSkill,
  type DiarySkillReqsFile,
} from '../src/data/parseDiaryWikitext.ts'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const USER_AGENT =
  'TilesLocalTracker/1.0 (local OSRS diary skill-req ingest; +https://oldschool.runescape.wiki/)'

type DiaryRow = {
  id: string
  name: string
  wikiTitle: string
}

async function readJson<T>(relative: string): Promise<T> {
  const text = await readFile(path.join(ROOT, relative), 'utf8')
  return JSON.parse(text) as T
}

function wikiRawUrl(wikiTitle: string): string {
  const slug = wikiTitle.replaceAll(' ', '_')
  return `https://oldschool.runescape.wiki/w/${encodeURIComponent(slug)}?action=raw`
}

async function fetchWikitext(wikiTitle: string): Promise<string> {
  const response = await fetch(wikiRawUrl(wikiTitle), {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/plain',
    },
  })
  if (!response.ok) {
    throw new Error(`${wikiTitle}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function main(): Promise<void> {
  const diaries = await readJson<DiaryRow[]>('src/data/osrs-diaries.json')
  const skills = await readJson<CatalogSkill[]>('src/data/osrs-skills.json')
  const out: DiarySkillReqsFile = {}

  for (const [index, diary] of diaries.entries()) {
    const wikitext = await fetchWikitext(diary.wikiTitle)
    out[diary.id] = parseDiarySkillStats(wikitext, skills)
    const counts = DIARY_SKILL_TIERS.map(
      (tier) => `${tier}:${out[diary.id]?.[tier]?.length ?? 0}`,
    ).join(' ')
    console.log(`${diary.id} (${diary.wikiTitle}) ${counts}`)
    if (index < diaries.length - 1) await sleep(250)
  }

  const dest = path.join(ROOT, 'src/data/osrs-diary-skill-reqs.json')
  await writeFile(dest, `${JSON.stringify(out, null, 2)}\n`, 'utf8')
  console.log(`wrote ${path.relative(ROOT, dest)}`)
}

await main()
