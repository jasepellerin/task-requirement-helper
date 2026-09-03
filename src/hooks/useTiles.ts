import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  setStoredStarred,
  setStoredStatus,
  starredFromStored,
  statusesFromStored,
  storedTilesFromStatuses,
  tilesFromStatuses,
} from '../data/osrsCatalog.ts'
import {
  prioritySkillsFromStored,
  setStoredPrioritySkill,
} from '../data/prioritySkills.ts'
import { groupTilesByReadiness, tilesById } from '../domain/readiness.ts'
import type { TileStatus } from '../domain/types.ts'
import {
  buildStore,
  downloadStore,
  loadStore,
  parseStoreJson,
  saveStore,
} from '../storage/localStore.ts'

function loadProgress() {
  const store = loadStore()
  return {
    statuses: statusesFromStored(store.tiles),
    starred: starredFromStored(store.tiles),
    prioritySkills: prioritySkillsFromStored(store.prioritySkills),
  }
}

export function useTiles() {
  const [{ statuses, starred, prioritySkills }, setProgress] =
    useState(loadProgress)
  const tiles = useMemo(
    () => tilesFromStatuses(statuses, starred),
    [starred, statuses],
  )
  const byId = useMemo(() => tilesById(tiles), [tiles])
  const groups = useMemo(
    () => groupTilesByReadiness(tiles, prioritySkills),
    [prioritySkills, tiles],
  )
  const store = useMemo(
    () =>
      buildStore(storedTilesFromStatuses(statuses, starred), prioritySkills),
    [prioritySkills, starred, statuses],
  )

  useEffect(() => {
    saveStore(store)
  }, [store])

  const setStatus = useCallback((id: string, status: TileStatus) => {
    setProgress((current) => {
      const nextStatuses = setStoredStatus(current.statuses, id, status)
      if (!nextStatuses) return current
      if (status !== 'unseen' || !current.starred.has(id)) {
        return { ...current, statuses: nextStatuses }
      }
      const nextStarred = new Set(current.starred)
      nextStarred.delete(id)
      return { ...current, statuses: nextStatuses, starred: nextStarred }
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
    setProgress({
      statuses: statusesFromStored(parsed.tiles),
      starred: starredFromStored(parsed.tiles),
      prioritySkills: prioritySkillsFromStored(parsed.prioritySkills),
    })
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
