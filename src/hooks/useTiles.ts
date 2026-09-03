import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  setStoredStarred,
  setStoredStatus,
  starredFromStored,
  statusesFromStored,
  storedTilesFromStatuses,
  tilesFromStatuses,
} from '../data/osrsCatalog.ts'
import { groupTilesByReadiness, tilesById } from '../domain/readiness.ts'
import type { TileStatus } from '../domain/types.ts'
import {
  downloadStore,
  loadStore,
  parseStoreJson,
  saveStore,
} from '../storage/localStore.ts'

function loadProgress() {
  const tiles = loadStore().tiles
  return {
    statuses: statusesFromStored(tiles),
    starred: starredFromStored(tiles),
  }
}

export function useTiles() {
  const [{ statuses, starred }, setProgress] = useState(loadProgress)
  const tiles = useMemo(
    () => tilesFromStatuses(statuses, starred),
    [starred, statuses],
  )
  const byId = useMemo(() => tilesById(tiles), [tiles])
  const groups = useMemo(() => groupTilesByReadiness(tiles), [tiles])

  useEffect(() => {
    saveStore({
      version: 1,
      tiles: storedTilesFromStatuses(statuses, starred),
    })
  }, [starred, statuses])

  const setStatus = useCallback((id: string, status: TileStatus) => {
    setProgress((current) => {
      const nextStatuses = setStoredStatus(current.statuses, id, status)
      if (!nextStatuses) return current
      if (status !== 'unseen' || !current.starred.has(id)) {
        return { statuses: nextStatuses, starred: current.starred }
      }
      const nextStarred = new Set(current.starred)
      nextStarred.delete(id)
      return { statuses: nextStatuses, starred: nextStarred }
    })
  }, [])

  const setStarred = useCallback((id: string, value: boolean) => {
    setProgress((current) => {
      const nextStarred = setStoredStarred(current.starred, id, value)
      if (!nextStarred) return current
      return { statuses: current.statuses, starred: nextStarred }
    })
  }, [])

  const exportStore = useCallback(() => {
    downloadStore({
      version: 1,
      tiles: storedTilesFromStatuses(statuses, starred),
    })
  }, [starred, statuses])

  const importStore = useCallback((text: string) => {
    const store = parseStoreJson(text)
    if (!store) {
      return { ok: false as const, error: 'Invalid tiles JSON' }
    }
    setProgress({
      statuses: statusesFromStored(store.tiles),
      starred: starredFromStored(store.tiles),
    })
    return { ok: true as const }
  }, [])

  return {
    tiles,
    byId,
    groups,
    setStatus,
    setStarred,
    exportStore,
    importStore,
  }
}
