import { useCallback, useEffect, useMemo, useState } from 'react'
import { groupTilesByReadiness } from '../domain/readiness.ts'
import {
  createTile,
  deleteTile,
  setTileStatus,
  updateTile,
} from '../domain/store.ts'
import {
  mergeOsrsSkillTiles,
  resetLockedOsrsTilesToUnseen,
  userPersistedTiles,
} from '../data/osrsCatalog.ts'
import type { TileInput, TileStatus } from '../domain/types.ts'
import {
  downloadStore,
  loadStore,
  parseStoreJson,
  saveStore,
} from '../storage/localStore.ts'

const OSRS_UNSEEN_MIGRATION_KEY = 'tiles:osrs-default-unseen-v1'

function loadTiles() {
  const merged = mergeOsrsSkillTiles(loadStore().tiles)
  if (localStorage.getItem(OSRS_UNSEEN_MIGRATION_KEY) === '1') {
    return merged
  }
  localStorage.setItem(OSRS_UNSEEN_MIGRATION_KEY, '1')
  return resetLockedOsrsTilesToUnseen(merged)
}

export function useTiles() {
  const [tiles, setTiles] = useState(loadTiles)

  useEffect(() => {
    saveStore({ version: 1, tiles: userPersistedTiles(tiles) })
  }, [tiles])

  const groups = useMemo(() => groupTilesByReadiness(tiles), [tiles])

  const create = useCallback(
    (input: TileInput) => {
      const result = createTile(tiles, input)
      if (!result.ok) return result
      setTiles(result.tiles)
      return result
    },
    [tiles],
  )

  const update = useCallback(
    (id: string, input: Partial<TileInput>) => {
      const result = updateTile(tiles, id, input)
      if (!result.ok) return result
      setTiles(result.tiles)
      return result
    },
    [tiles],
  )

  const setStatus = useCallback(
    (id: string, status: TileStatus) => {
      const result = setTileStatus(tiles, id, status)
      if (!result.ok) return result
      setTiles(result.tiles)
      return result
    },
    [tiles],
  )

  const remove = useCallback(
    (id: string) => {
      setTiles(deleteTile(tiles, id))
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
    create,
    update,
    setStatus,
    remove,
    exportStore,
    importStore,
  }
}
