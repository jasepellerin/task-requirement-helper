import { describe, expect, it } from 'vitest'
import { coveringBracketId } from './diarySkillReqs.ts'
import { parseDiarySkillStats } from './parseDiaryWikitext.ts'
import { OSRS_SKILLS } from './osrsCatalog.ts'

const KANDARIN_FIXTURE = `
==Overview==
<tabber>
|-|
Easy=
{{DiarySkillStats
|margin=no
|Agility = 20
|Fishing = 16
|Crafting = 1
|CraftingNotes = <ref name="IronFish">[[File:Ironman chat badge.png]] [[Ironman Mode|Ironmen]] require either 42 [[Crafting]] or completion of [[Skippy and the Mogres]] with 32 [[Slayer]] for a [[fishbowl]].</ref>
|Slayer = 1
|SlayerNotes = <ref name="IronFish"/>
|Farming = 13
|Total = 78
}}
|-|
Medium=
{{DiarySkillStats
|Mining = 30
|Strength = 22
|Agility = 36
|Smithing = 30
|SmithingNotes = <ref name="IronMith">[[Ironman Mode|Ironmen]] require either access to the [[Ancient Cavern]] or 59 [[Smithing]] and 59 [[Fletching]] for a [[mith grapple]].</ref>
|Fishing = 46
|Ranged = 40
|Fletching = 50
|FletchingNotes = <ref name="IronMith"/>
|Farming = 26
|Total = 577
}}
`

describe('coveringBracketId', () => {
  it('picks the lowest bracket whose max covers the level', () => {
    expect(coveringBracketId(1)).toBe('1-10')
    expect(coveringBracketId(13)).toBe('11-20')
    expect(coveringBracketId(20)).toBe('11-20')
    expect(coveringBracketId(21)).toBe('21-30')
    expect(coveringBracketId(42)).toBe('41-50')
    expect(coveringBracketId(99)).toBe('91-99')
  })
})

describe('parseDiarySkillStats', () => {
  it('maps Kandarin Easy/Medium including ironman bumps', () => {
    const parsed = parseDiarySkillStats(KANDARIN_FIXTURE, OSRS_SKILLS)

    expect(parsed.easy).toEqual([
      { skill: 'agility', level: 20 },
      { skill: 'fishing', level: 16 },
      { skill: 'crafting', level: 42, ironman: true },
      { skill: 'farming', level: 13 },
    ])

    expect(parsed.medium).toEqual([
      { skill: 'mining', level: 30 },
      { skill: 'agility', level: 36 },
      { skill: 'smithing', level: 59, ironman: true },
      { skill: 'fishing', level: 46 },
      { skill: 'fletching', level: 59, ironman: true },
      { skill: 'farming', level: 26 },
    ])
  })

  it('skips combat, slayer, dummy level 1, and totals', () => {
    const parsed = parseDiarySkillStats(KANDARIN_FIXTURE, OSRS_SKILLS)
    const skills = [...parsed.easy, ...parsed.medium].map((req) => req.skill)
    expect(skills).not.toContain('slayer')
    expect(skills).not.toContain('strength')
    expect(skills).not.toContain('ranged')
    expect(skills).not.toContain('total')
  })
})
