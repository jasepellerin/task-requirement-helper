import { describe, expect, it } from 'vitest'
import { osrsTileId } from './osrsCatalog.ts'
import {
  progressFromStore,
  setStoredStatus,
  storedTilesFromStatuses,
} from './tileProgress.ts'
import { buildStore } from '../storage/localStore.ts'

describe('progressFromStore', () => {
  it('round-trips catalog statuses, stars, stamps, and priority skills', () => {
    const locked = osrsTileId('agility', '21-30')
    const unseen = osrsTileId('woodcutting', '1-10')
    const store = buildStore(
      [
        {
          id: locked,
          status: 'unlocked',
          revealedAt: 5,
          unlockedAt: 10,
        },
        { id: unseen, status: 'unseen', starred: true, unlockedAt: 30 },
        { id: 'forest', status: 'unlocked', unlockedAt: 40 },
      ],
      new Set(['farming', 'not-a-skill']),
    )
    const progress = progressFromStore(store)
    expect(progress.statuses.get(locked)).toBe('unlocked')
    expect(progress.statuses.has(unseen)).toBe(false)
    expect(progress.starred.has(unseen)).toBe(true)
    expect(progress.stamps.get(locked)).toEqual({
      revealedAt: 5,
      unlockedAt: 10,
    })
    expect(progress.prioritySkills).toEqual(new Set(['farming']))

    const rebuilt = buildStore(
      storedTilesFromStatuses(
        progress.statuses,
        progress.starred,
        progress.stamps,
      ),
      progress.prioritySkills,
    )
    expect(rebuilt).toEqual({
      version: 1,
      tiles: [
        {
          id: locked,
          status: 'unlocked',
          revealedAt: 5,
          unlockedAt: 10,
        },
        { id: unseen, status: 'unseen', starred: true, unlockedAt: 30 },
      ],
      prioritySkills: ['farming'],
    })
  })

  it('rebuilds after a status mutation', () => {
    const id = osrsTileId('agility', '1-10')
    const progress = progressFromStore(
      buildStore([{ id, status: 'locked' }], new Set()),
    )
    const statuses = setStoredStatus(progress.statuses, id, 'completed')
    expect(statuses).not.toBeNull()
    if (!statuses) return
    expect(
      storedTilesFromStatuses(statuses, progress.starred, progress.stamps),
    ).toEqual([{ id, status: 'completed' }])
  })
})
