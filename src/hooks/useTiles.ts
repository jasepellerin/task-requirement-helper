import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  setStoredStatus,
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

function loadStatuses() {
  return statusesFromStored(loadStore().tiles)
}

export function useTiles() {
  const [statuses, setStatuses] = useState(loadStatuses)
  const tiles = useMemo(() => tilesFromStatuses(statuses), [statuses])
  const byId = useMemo(() => tilesById(tiles), [tiles])
  const groups = useMemo(() => groupTilesByReadiness(tiles), [tiles])

  useEffect(() => {
    saveStore({ version: 1, tiles: storedTilesFromStatuses(statuses) })
  }, [statuses])

  const setStatus = useCallback((id: string, status: TileStatus) => {
    setStatuses((current) => setStoredStatus(current, id, status) ?? current)
  }, [])

  const exportStore = useCallback(() => {
    downloadStore({ version: 1, tiles: storedTilesFromStatuses(statuses) })
  }, [statuses])

  const importStore = useCallback((text: string) => {
    const store = parseStoreJson(text)
    if (!store) {
      return { ok: false as const, error: 'Invalid tiles JSON' }
    }
    setStatuses(statusesFromStored(store.tiles))
    return { ok: true as const }
  }, [])

  return {
    tiles,
    byId,
    groups,
    setStatus,
    exportStore,
    importStore,
  }
}
