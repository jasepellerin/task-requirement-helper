import { describe, expect, it } from 'vitest'
import { applyStatusStamp, formatTileStamp } from './stamps.ts'

const now = 1_700_000_000_000
const later = now + 60_000

describe('applyStatusStamp', () => {
  it('stamps reveal when leaving unseen', () => {
    const revealed = applyStatusStamp(new Map(), 'a', 'unseen', 'locked', now)
    expect(revealed.get('a')).toEqual({ revealedAt: now })
    const stillLocked = applyStatusStamp(
      revealed,
      'a',
      'locked',
      'locked',
      later,
    )
    expect(stillLocked).toBe(revealed)
    const hidden = applyStatusStamp(revealed, 'a', 'locked', 'unseen', later)
    expect(hidden).toBe(revealed)
    const again = applyStatusStamp(revealed, 'a', 'unseen', 'locked', later)
    expect(again.get('a')).toEqual({ revealedAt: later })
  })

  it('stamps unlock and complete only when entering that status', () => {
    const empty = new Map()
    const unlocked = applyStatusStamp(empty, 'a', 'locked', 'unlocked', now)
    expect(unlocked.get('a')).toEqual({ unlockedAt: now })
    const still = applyStatusStamp(unlocked, 'a', 'unlocked', 'unlocked', later)
    expect(still).toBe(unlocked)
    const locked = applyStatusStamp(unlocked, 'a', 'unlocked', 'locked', later)
    expect(locked).toBe(unlocked)
    const again = applyStatusStamp(unlocked, 'a', 'locked', 'unlocked', later)
    expect(again.get('a')).toEqual({ unlockedAt: later })
    const completed = applyStatusStamp(
      again,
      'a',
      'unlocked',
      'completed',
      later,
    )
    expect(completed.get('a')).toEqual({
      unlockedAt: later,
      completedAt: later,
    })
    const uncompleted = applyStatusStamp(
      completed,
      'a',
      'completed',
      'unlocked',
      later + 1,
    )
    expect(uncompleted.get('a')).toEqual({
      unlockedAt: later + 1,
      completedAt: later,
    })
    const recompleted = applyStatusStamp(
      uncompleted,
      'a',
      'unlocked',
      'completed',
      later + 2,
    )
    expect(recompleted.get('a')).toEqual({
      unlockedAt: later + 1,
      completedAt: later + 2,
    })
  })

  it('stamps reveal and unlock together when skipping locked', () => {
    const stamped = applyStatusStamp(new Map(), 'a', 'unseen', 'unlocked', now)
    expect(stamped.get('a')).toEqual({ revealedAt: now, unlockedAt: now })
  })

  it('stamps complete without inventing an unlock time', () => {
    const stamped = applyStatusStamp(new Map(), 'a', 'locked', 'completed', now)
    expect(stamped.get('a')).toEqual({ completedAt: now })
  })
})

describe('formatTileStamp', () => {
  it('drops the year in the current year', () => {
    const ms = new Date(2026, 8, 13).getTime()
    expect(formatTileStamp(ms, 'en-GB', new Date(2026, 0, 1).getTime())).toBe(
      '13 Sept',
    )
    expect(formatTileStamp(ms, 'en-GB', new Date(2025, 0, 1).getTime())).toBe(
      '13 Sept 26',
    )
  })
})
