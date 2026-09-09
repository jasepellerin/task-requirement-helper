import { describe, expect, it } from 'vitest'
import { nextTileStatus } from './types.ts'

describe('nextTileStatus', () => {
  it('advances through the catalog flow', () => {
    expect(nextTileStatus('unseen')).toBe('locked')
    expect(nextTileStatus('locked')).toBe('unlocked')
    expect(nextTileStatus('unlocked')).toBe('completed')
  })

  it('stays on completed', () => {
    expect(nextTileStatus('completed')).toBe('completed')
  })
})
