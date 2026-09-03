import { describe, expect, it } from 'vitest'
import {
  parseDiaryRewards,
  parseQuestCardDetails,
  parseQuestRewards,
  plainWiki,
  stripItemNotes,
} from './parseRewards.ts'

const COOKS_ASSISTANT = `
==Rewards==
{{Quest rewards
|name = Cook's Assistant
|image=[[File:Cook's Assistant reward scroll.png|centre]]
|qp = 1
|rewards = 
* {{SCP|Cooking|300|link=yes}} [[experience]]
* Permission to use the [[Cooking range (Lumbridge Castle)|Cook-o-matic 100]], which reduces the chance of burning some [[food]]s.
}}

==Required for completing==
* [[Recipe for Disaster]]
`

const DRAGON_SLAYER = `
==Rewards==
{{Quest rewards
|image=[[File:Dragon Slayer reward scroll.png|centre]]|name=Dragon Slayer I|qp=2|rewards=*{{SCP|Strength|18,650}} [[Strength]] experience
*{{SCP|Defence|18,650}} [[Defence]] experience
*The ability to equip a [[green d'hide body]], [[rune platebody]], and [[dragon platebody]]
*The ability to hire the ghost of [[Cabin Boy Jenkins]] as a [[crewmate]] with {{SCP|Sailing|60|link=yes}}.
}}

*Access to [[Crandor]]

Unlocks:
* [[Elvarg]] accessible in the [[Nightmare Zone]].

==Required for completing==
* [[Heroes' Quest]]
`

const FREMENNIK = `
==Rewards==
{{Quest rewards
|name=The Fremennik Trials|image=[[File:The Fremennik Trials reward scroll.png|centre]]|qp=3|rewards=*{{SCP|Agility|2,812.4}} [[Agility]] [[experience]]
*A [[herring]]}}
*[[Jarvald]] will charge no fee for travelling to [[Waterbirth Island]]

==Required for completing==
*[[The Fremennik Isles]]
`

const KARAMJA = `
==Easy==
{| class="wikitable"
| 1. Kill a [[jogre]].
|}
===Rewards===
*[[Karamja gloves 1]]:
**While worn, [[Brimhaven]]—[[Ardougne]] boat trips cost 15 [[coins]] instead of 30 [[coins]]
*[[Antique lamp (Karamja Diary)|Antique lamp]] worth 1,000 experience in any skill of any level (instead of the usual [[Antique lamp (easy)|antique lamp]] for this tier)

==Medium==
{| class="wikitable"
| 1. Claim a ticket.
|}
===Rewards===
*[[Karamja gloves 2]]
*[[Antique lamp (Karamja Diary)|Antique lamp]] worth 5,000 experience in any skill of at least level 30
*Access to the underground portion of the [[Shilo Village mine]]

==Hard==
===Rewards===
*[[Karamja gloves 3]]

==Elite==
===Rewards===
*[[Karamja gloves 4]]
`

describe('plainWiki', () => {
  it('turns SCP xp and piped links into readable text', () => {
    expect(plainWiki('{{SCP|Cooking|300|link=yes}} [[experience]]')).toBe(
      '300 Cooking experience',
    )
    expect(
      plainWiki(
        'Permission to use the [[Cooking range (Lumbridge Castle)|Cook-o-matic 100]], which reduces the chance of burning some [[food]]s.',
      ),
    ).toBe(
      'Permission to use the Cook-o-matic 100, which reduces the chance of burning some foods',
    )
  })

  it('drops a duplicated skill name after SCP', () => {
    expect(plainWiki('{{SCP|Strength|18,650}} [[Strength]] experience')).toBe(
      '18,650 Strength experience',
    )
    expect(
      plainWiki('can be made with {{SCP|Crafting|8}} [[Crafting]] on a wheel'),
    ).toBe('can be made with 8 Crafting on a wheel')
  })
})

describe('parseQuestRewards', () => {
  it("adds quest points and cleans Cook's Assistant rewards", () => {
    expect(parseQuestRewards(COOKS_ASSISTANT)).toEqual([
      '1 Quest point',
      '300 Cooking experience',
      'Permission to use the Cook-o-matic 100, which reduces the chance of burning some foods',
    ])
  })

  it('reads inline template fields and leftover reward bullets', () => {
    expect(parseQuestRewards(DRAGON_SLAYER)).toEqual([
      '2 Quest points',
      '18,650 Strength experience',
      '18,650 Defence experience',
      "The ability to equip a green d'hide body, rune platebody, and dragon platebody",
      'The ability to hire the ghost of Cabin Boy Jenkins as a crewmate with 60 Sailing',
      'Access to Crandor',
      'Elvarg accessible in the Nightmare Zone',
    ])
  })

  it('keeps bullets after a same-line template close', () => {
    expect(parseQuestRewards(FREMENNIK)).toEqual([
      '3 Quest points',
      '2,812.4 Agility experience',
      'A herring',
      'Jarvald will charge no fee for travelling to Waterbirth Island',
    ])
  })

  it('is empty when there is no rewards section', () => {
    expect(parseQuestRewards('{{Infobox Quest\n|name = Test\n}}')).toEqual([])
  })

  it('reads a singular Reward heading', () => {
    expect(
      parseQuestRewards(`
==Reward==
{{Quest rewards
|name = Black Knights' Fortress
|qp = 3
|rewards = * 2,500 [[Coins]]
}}
`),
    ).toEqual(['3 Quest points', '2,500 Coins'])
  })

  it('reads a level-3 Rewards heading', () => {
    expect(
      parseQuestRewards(`
===Rewards===
{{Quest rewards
|name = Recipe for Disaster/Freeing Pirate Pete
|qp = 1
|rewards = 
*{{SCP|Cooking|1,000}} [[Cooking]] experience
}}
`),
    ).toEqual(['1 Quest point', '1,000 Cooking experience'])
  })
})

describe('parseDiaryRewards', () => {
  it('reads each tier rewards section and keeps nested lines', () => {
    expect(parseDiaryRewards(KARAMJA)).toEqual({
      easy: [
        'Karamja gloves 1',
        '– While worn, Brimhaven—Ardougne boat trips cost 15 coins instead of 30 coins',
        'Antique lamp worth 1,000 experience in any skill of any level (instead of the usual antique lamp for this tier)',
      ],
      medium: [
        'Karamja gloves 2',
        'Antique lamp worth 5,000 experience in any skill of at least level 30',
        'Access to the underground portion of the Shilo Village mine',
      ],
      hard: ['Karamja gloves 3'],
      elite: ['Karamja gloves 4'],
    })
  })
})

describe('parseQuestCardDetails', () => {
  it('reads difficulty, length, and nested item bullets', () => {
    expect(
      parseQuestCardDetails(`
{{Quest details
|difficulty = Novice
|length = Very Short
|items = * [[Egg]] (can be obtained during the quest)
* [[Bucket of milk]]
**A [[bucket]] (if obtaining the milk during the quest)
* [[Pot of flour]]
}}
`),
    ).toEqual({
      difficulty: 'Novice',
      length: 'Very Short',
      items: ['Egg', 'Bucket of milk', '– A bucket', 'Pot of flour'],
    })
  })

  it('skips None items and recommended items', () => {
    expect(
      parseQuestCardDetails(`
{{Quest details
|difficulty = Intermediate
|length = Short
|items = None
|recommended = * [[Food]]
}}
`),
    ).toEqual({
      difficulty: 'Intermediate',
      length: 'Short',
      items: [],
    })
  })

  it('keeps item section headers and Questitemreq rows', () => {
    expect(
      parseQuestCardDetails(`
{{Quest details
|difficulty = Special
|length = Very Long
|items = '''To start:'''
* {{Questitemreq|Eye of newt|1}}
* [[Greenman's ale]]
}}
`),
    ).toEqual({
      difficulty: 'Special',
      length: 'Very Long',
      items: ['To start', 'Eye of newt', "Greenman's ale"],
    })
  })

  it('drops acquisition parentheticals but keeps short item suffixes', () => {
    expect(
      parseQuestCardDetails(`
{{Quest details
|difficulty = Experienced
|length = Medium
|items = * [[Unfired bowl]] (can be made with soft clay)
* [[Marrentill potion (unf)]]
* [[Ring of Charos(a)]]
* [[Knife]] (except whip) (obtainable during the quest)
}}
`),
    ).toEqual({
      difficulty: 'Experienced',
      length: 'Medium',
      items: [
        'Unfired bowl',
        'Marrentill potion (unf)',
        'Ring of Charos(a)',
        'Knife',
      ],
    })
  })

  it('drops nested how-to-get bullets but keeps extra items', () => {
    expect(
      parseQuestCardDetails(`
{{Quest details
|difficulty = Experienced
|length = Medium
|items = * [[3 planks]] (only normal planks work)
**[[Free-to-play]]: Buy from [[Sawmill operator]] at the sawmill
**[[Member]]: Several other spawn locations or buy them at the sawmill
* [[Bucket of milk]]
**A [[bucket]] (if obtaining the milk during the quest)
* [[Willow longbow]]
**Can be purchased from Lowe's Archery Emporium
}}
`),
    ).toEqual({
      difficulty: 'Experienced',
      length: 'Medium',
      items: ['3 planks', 'Bucket of milk', '– A bucket', 'Willow longbow'],
    })
  })

  it('drops leftover empty nested lines after stripping notes', () => {
    expect(
      parseQuestCardDetails(`
{{Quest details
|difficulty = Intermediate
|length = Medium
|items = * 12 unnoted willow branches
**Note: The player receives a willow sapling during the quest
***[[Secateurs]]
}}
`),
    ).toEqual({
      difficulty: 'Intermediate',
      length: 'Medium',
      items: ['12 unnoted willow branches', '– – Secateurs'],
    })
  })
})

describe('stripItemNotes', () => {
  it('removes nested acquisition notes', () => {
    expect(
      stripItemNotes(
        'Silk (can be bought from Thessalia for 30 coins (members cheaper))',
      ),
    ).toBe('Silk')
  })

  it('cuts trailing how-to sentences', () => {
    expect(
      stripItemNotes(
        "A light source. If you don't have one, the guard will sell you a torch",
      ),
    ).toBe('A light source')
    expect(
      stripItemNotes(
        'Either 8 tin ores or 6 mithril ores. Note: The ores can be noted',
      ),
    ).toBe('Either 8 tin ores or 6 mithril ores')
  })
})
