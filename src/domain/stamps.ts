import type { TileStamps, TileStatus } from './types.ts'

export function pickTileStamps(value: TileStamps | undefined): TileStamps {
  const stamps: TileStamps = {}
  if (value?.revealedAt !== undefined) stamps.revealedAt = value.revealedAt
  if (value?.unlockedAt !== undefined) stamps.unlockedAt = value.unlockedAt
  if (value?.completedAt !== undefined) stamps.completedAt = value.completedAt
  return stamps
}

export function hasTileStamps(value: TileStamps | undefined): boolean {
  return (
    value?.revealedAt !== undefined ||
    value?.unlockedAt !== undefined ||
    value?.completedAt !== undefined
  )
}

export function applyStatusStamp(
  stamps: ReadonlyMap<string, TileStamps>,
  id: string,
  previous: TileStatus,
  next: TileStatus,
  now: number,
): Map<string, TileStamps> {
  if (next === previous) {
    return stamps instanceof Map ? stamps : new Map(stamps)
  }
  const updated = pickTileStamps(stamps.get(id))
  let changed = false
  if (previous === 'unseen' && next !== 'unseen') {
    updated.revealedAt = now
    changed = true
  }
  if (next === 'unlocked') {
    updated.unlockedAt = now
    changed = true
  }
  if (next === 'completed') {
    updated.completedAt = now
    changed = true
  }
  if (!changed) {
    return stamps instanceof Map ? stamps : new Map(stamps)
  }
  const result = new Map(stamps)
  result.set(id, updated)
  return result
}

export function formatTileStamp(
  ms: number,
  locales?: Intl.LocalesArgument,
  now = Date.now(),
): string {
  const date = new Date(ms)
  const current = new Date(now)
  return date.toLocaleDateString(locales, {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === current.getFullYear()
      ? {}
      : { year: '2-digit' }),
  })
}

export function formatTileStampFull(
  ms: number,
  locales?: Intl.LocalesArgument,
): string {
  return new Date(ms).toLocaleString(locales, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
