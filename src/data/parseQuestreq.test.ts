import { describe, expect, it } from 'vitest'
import { OSRS_SKILLS } from './osrsCatalog.ts'
import {
  extractRequiredGp,
  isQuestCatalogName,
  isQuestIndexTitle,
  isUnreleasedQuestPage,
  isWikiQuestPage,
  parseQuestDetailsReqs,
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

describe('isWikiQuestPage', () => {
  it('keeps Infobox Quest and drops miniquests and redirects', () => {
    expect(
      isWikiQuestPage("{{Infobox Quest\n|name = Cook's Assistant\n}}"),
    ).toBe(true)
    expect(
      isWikiQuestPage(
        "{{Infobox Miniquest\n|name = Alfred Grimhand's Barcrawl\n}}",
      ),
    ).toBe(false)
    expect(isWikiQuestPage('#REDIRECT [[Barbarian_Training#Farming]]')).toBe(
      false,
    )
  })
})

describe('isUnreleasedQuestPage', () => {
  it('detects Future Content and ignores released quest pages', () => {
    expect(
      isUnreleasedQuestPage(`{{Future Content}}
{{Infobox Quest
|name = Crab Quest
|image =
}}`),
    ).toBe(true)
    expect(
      isUnreleasedQuestPage("{{Infobox Quest\n|name = Cook's Assistant\n}}"),
    ).toBe(false)
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

describe('quest list titles', () => {
  it('skips Quests/ index pages', () => {
    expect(isQuestIndexTitle('Quests/Free-to-play')).toBe(true)
    expect(isQuestIndexTitle('Current Affairs')).toBe(false)
    expect(isQuestIndexTitle('Recipe for Disaster/Full guide')).toBe(false)
  })
})

describe('parseQuestDetailsReqs', () => {
  it('takes direct quests and catalog skills, drops nested and combat', () => {
    const parsed = parseQuestDetailsReqs(
      `{{Quest details
|requirements = * {{SCP|Sailing|22|link=yes}} {{Boostable|no}}
* {{SCP|Fishing|10|link=yes}}
* {{SCP|Magic|75|link=yes}}
*Completion of [[Pandemonium]]
** [[The Heart of Darkness]]
*** [[Twilight's Promise]]
}}`,
      OSRS_SKILLS,
    )
    expect(parsed.quests).toEqual(['Pandemonium', 'The Heart of Darkness'])
    expect(parsed.skills).toEqual([
      { skill: 'sailing', level: 22 },
      { skill: 'fishing', level: 10 },
    ])
  })

  it('treats None and empty requirements as no reqs', () => {
    expect(
      parseQuestDetailsReqs(
        '{{Quest details\n|requirements = None\n}}',
        OSRS_SKILLS,
      ),
    ).toEqual({ quests: [], skills: [] })
    expect(
      parseQuestDetailsReqs(
        '{{Quest details\n|requirements =\n|items =\n}}',
        OSRS_SKILLS,
      ),
    ).toEqual({ quests: [], skills: [] })
  })
})

describe('extractRequiredGp', () => {
  it('takes the largest required coin amount and ignores recommended', () => {
    expect(extractRequiredGp(DRAGON_SLAYER_ITEMS)).toBe(10000)
    expect(extractRequiredGp(PIRATE_ITEMS)).toBe(60)
  })
})
