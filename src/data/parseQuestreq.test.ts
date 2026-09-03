import { describe, expect, it } from 'vitest'
import { OSRS_SKILLS } from './osrsCatalog.ts'
import {
  extractRequiredGp,
  isQuestCatalogName,
  parseQuestreqLua,
  questSlug,
} from './parseQuestreq.ts'

const QUESTREQ_FIXTURE = `
local questReqs = {
    ['Animal Magnetism'] = {
        ['quests'] = {
            'Ernest the Chicken',
            'Priest in Peril',
            'The Restless Ghost'
        },
        ['skills'] = {
            {'Crafting', 19},
            {'Prayer', 31, 'ironman'},
            {'Ranged', 30},
            {'Slayer', 18},
            {'Woodcutting', 35}
        }
    },
    ['Cook\\'s Assistant'] = {
        ['quests'] = {},
        ['skills'] = {}
    },
    ['Tutorial Island'] = {
        ['quests'] = {},
        ['skills'] = {}
    },
    ['Easy Kandarin Diary'] = {
        ['quests'] = {
            'Started:Elemental Workshop I'
        },
        ['skills'] = {
            {'Agility', 20, 'boostable'},
            {'Crafting', 42, 'ironman', 'boostable'}
        }
    },
}
`

const DRAGON_SLAYER_ITEMS = `
{{Quest details
|items = * [[Silk]] for 30 coins
* '''or''' 10,000 coins
* 2,000 [[coins]]
|recommended = * otherwise you will have to pay 10,000 [[coins]].
|ironman = * {{SCP|Crafting|8}}
}}
`

const PIRATE_ITEMS = `
{{Quest details
|items = *[[Karamjan rum]] (obtainable during the quest for 30 coins)
*60 [[coins]] (only 30 are needed if using the [[Ring of Charos(a)]])
|recommended = *Fast travel
}}
`

describe('questSlug / catalog names', () => {
  it('slugs names and strips Started:', () => {
    expect(questSlug('Animal Magnetism')).toBe('animal-magnetism')
    expect(questSlug("Cook's Assistant")).toBe('cooks-assistant')
    expect(questSlug('Started:Elemental Workshop I')).toBe(
      'elemental-workshop-i',
    )
    expect(questSlug("Recipe for Disaster/Another Cook's Quest")).toBe(
      'recipe-for-disaster-another-cooks-quest',
    )
  })

  it('skips diaries and tutorial island', () => {
    expect(isQuestCatalogName('Easy Kandarin Diary')).toBe(false)
    expect(isQuestCatalogName('Tutorial Island')).toBe(false)
    expect(isQuestCatalogName('Animal Magnetism')).toBe(true)
  })
})

describe('parseQuestreqLua', () => {
  it('keeps catalog skills and quest parents, drops combat and diaries', () => {
    const parsed = parseQuestreqLua(QUESTREQ_FIXTURE, OSRS_SKILLS)
    expect(parsed.map((entry) => entry.name)).toEqual([
      'Animal Magnetism',
      "Cook's Assistant",
    ])
    expect(parsed[0]?.quests).toEqual([
      'Ernest the Chicken',
      'Priest in Peril',
      'The Restless Ghost',
    ])
    expect(parsed[0]?.skills).toEqual([
      { skill: 'crafting', level: 19 },
      { skill: 'woodcutting', level: 35 },
    ])
  })
})

describe('extractRequiredGp', () => {
  it('takes the largest required coin amount and ignores recommended', () => {
    expect(extractRequiredGp(DRAGON_SLAYER_ITEMS)).toBe(10000)
    expect(extractRequiredGp(PIRATE_ITEMS)).toBe(60)
  })
})
