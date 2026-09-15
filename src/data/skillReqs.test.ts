import { describe, expect, it } from 'vitest'
import { skillReqKey } from './skillReqs.ts'

describe('skillReqKey', () => {
  it('distinguishes ironman from main', () => {
    expect(skillReqKey({ skill: 'farming', level: 45 })).toBe('farming:45:')
    expect(skillReqKey({ skill: 'farming', level: 45, ironman: true })).toBe(
      'farming:45:im',
    )
  })
})
