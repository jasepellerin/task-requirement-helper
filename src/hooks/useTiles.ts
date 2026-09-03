import { useCallback, useEffect, useMemo, useState } from 'react'
import { mergeOsrsSkillTiles, userPersistedTiles } from '../data/osrsCatalog.ts'
import { groupTilesByReadiness } from '../domain/readiness.ts'
import { setTileStatus } from '../domain/store.ts'
import type { TileStatus } from '../domain/types.ts'
import {
  downloadStore,
  loadStore,
  parseStoreJson,
  saveStore,
} from '../storage/localStore.ts'

function loadTiles() {
  return mergeOsrsSkillTiles(loadStore().tiles)
}

export function useTiles() {
  const [tiles, setTiles] = useState(loadTiles)

  useEffect(() => {
    saveStore({ version: 1, tiles: userPersistedTiles(tiles) })
  }, [tiles])

  const groups = useMemo(() => groupTilesByReadiness(tiles), [tiles])

  const setStatus = useCallback(
    (id: string, status: TileStatus) => {
      const result = setTileStatus(tiles, id, status)
      if (!result.ok) return result
      setTiles(result.tiles)
      return result
    },
    [tiles],
  )

  const exportStore = useCallback(() => {
    downloadStore({ version: 1, tiles: userPersistedTiles(tiles) })
  }, [tiles])

  const importStore = useCallback((text: string) => {
    const store = parseStoreJson(text)
    if (!store) {
      return { ok: false as const, error: 'Invalid tiles JSON' }
    }
    setTiles(mergeOsrsSkillTiles(store.tiles))
    return { ok: true as const }
  }, [])

  return {
    tiles,
    groups,
    setStatus,
    exportStore,
    importStore,
  }
}
