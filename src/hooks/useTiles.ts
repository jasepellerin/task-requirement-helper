import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  progressFromStore,
  setStoredStarred,
  setStoredStatus,
  storedTilesFromStatuses,
  tilesFromStatuses,
} from '../data/tileProgress.ts'
import { setStoredPrioritySkill } from '../data/prioritySkills.ts'
import { applyStatusStamp } from '../domain/stamps.ts'
import { groupTilesByReadiness, tilesById } from '../domain/readiness.ts'
import type { TileStatus } from '../domain/types.ts'
import {
  buildStore,
  downloadStore,
  loadStore,
  parseStoreJson,
  saveStore,
} from '../storage/localStore.ts'

export function useTiles() {
  const [{ statuses, starred, stamps, prioritySkills }, setProgress] = useState(
    () => progressFromStore(loadStore()),
  )
  const tiles = useMemo(
    () => tilesFromStatuses(statuses, starred, stamps),
    [starred, stamps, statuses],
  )
  const byId = useMemo(() => tilesById(tiles), [tiles])
  const groups = useMemo(
    () => groupTilesByReadiness(tiles, prioritySkills),
    [prioritySkills, tiles],
  )
  const store = useMemo(
    () =>
      buildStore(
        storedTilesFromStatuses(statuses, starred, stamps),
        prioritySkills,
      ),
    [prioritySkills, starred, stamps, statuses],
  )

  useEffect(() => {
    saveStore(store)
  }, [store])

  const setStatus = useCallback((id: string, status: TileStatus) => {
    setProgress((current) => {
      const nextStatuses = setStoredStatus(current.statuses, id, status)
      if (!nextStatuses) return current
      const previous = current.statuses.get(id) ?? 'unseen'
      return {
        ...current,
        statuses: nextStatuses,
        stamps: applyStatusStamp(
          current.stamps,
          id,
          previous,
          status,
          Date.now(),
        ),
      }
    })
  }, [])

  const setStarred = useCallback((id: string, value: boolean) => {
    setProgress((current) => {
      const nextStarred = setStoredStarred(current.starred, id, value)
      if (!nextStarred) return current
      return { ...current, starred: nextStarred }
    })
  }, [])

  const setPrioritySkill = useCallback((skillId: string, value: boolean) => {
    setProgress((current) => {
      const next = setStoredPrioritySkill(
        current.prioritySkills,
        skillId,
        value,
      )
      if (!next) return current
      return { ...current, prioritySkills: next }
    })
  }, [])

  const exportStore = useCallback(() => {
    downloadStore(store)
  }, [store])

  const importStore = useCallback((text: string) => {
    const parsed = parseStoreJson(text)
    if (!parsed) {
      return { ok: false as const, error: 'Invalid tiles JSON' }
    }
    setProgress(progressFromStore(parsed))
    return { ok: true as const }
  }, [])

  return {
    tiles,
    byId,
    groups,
    prioritySkills,
    setStatus,
    setStarred,
    setPrioritySkill,
    exportStore,
    importStore,
  }
}
