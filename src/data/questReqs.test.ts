import { describe, expect, it } from 'vitest'
import { mergeQuestReqs, questReqsFor, type QuestReqs } from './questReqs.ts'

const wiki: QuestReqs = {
  quests: ['priest-in-peril'],
  skills: [{ skill: 'crafting', level: 19 }],
}

describe('mergeQuestReqs', () => {
  it('unions extra quests and skills onto wiki reqs without duplicates', () => {
    expect(
      mergeQuestReqs(wiki, {
        quests: ['priest-in-peril', 'lost-city'],
        skills: [
          { skill: 'crafting', level: 19 },
          { skill: 'woodcutting', level: 40 },
        ],
      }),
    ).toEqual({
      quests: ['priest-in-peril', 'lost-city'],
      skills: [
        { skill: 'crafting', level: 19 },
        { skill: 'woodcutting', level: 40 },
      ],
    })
  })

  it('keeps wiki reqs when the override is empty', () => {
    expect(mergeQuestReqs(wiki, { quests: [], skills: [] })).toEqual(wiki)
    expect(mergeQuestReqs(wiki, undefined)).toEqual(wiki)
  })

  it('applies an override when wiki has nothing', () => {
    expect(
      mergeQuestReqs(
        { quests: [], skills: [] },
        { skills: [{ skill: 'fletching', level: 25 }] },
      ),
    ).toEqual({
      quests: [],
      skills: [{ skill: 'fletching', level: 25 }],
    })
  })
})

describe('questReqsFor', () => {
  it('adds Fremennik Trials lyre-craft skills on top of the wiki dump', () => {
    expect(questReqsFor('the-fremennik-trials')).toEqual({
      quests: [],
      skills: [
        { skill: 'fletching', level: 25 },
        { skill: 'woodcutting', level: 40 },
        { skill: 'crafting', level: 40 },
      ],
    })
  })
})
