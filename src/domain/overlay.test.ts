import { describe, expect, it } from 'vitest'
import {
  closeOverlayState,
  openDetailOverlay,
  overlayOrigin,
} from './overlay.ts'

describe('overlayOrigin', () => {
  it('keeps find and completed while browsing their details', () => {
    expect(overlayOrigin({ mode: 'find' })).toBe('find')
    expect(overlayOrigin({ mode: 'completed' })).toBe('completed')
    expect(overlayOrigin({ mode: 'detail', id: 'a', from: 'find' })).toBe(
      'find',
    )
    expect(overlayOrigin({ mode: 'detail', id: 'a', from: 'completed' })).toBe(
      'completed',
    )
    expect(overlayOrigin({ mode: 'detail', id: 'a' })).toBeUndefined()
    expect(overlayOrigin({ mode: 'stats' })).toBeUndefined()
  })
})

describe('openDetailOverlay', () => {
  it('opens a bare detail from the board', () => {
    expect(openDetailOverlay(null, 'a')).toEqual({ mode: 'detail', id: 'a' })
    expect(openDetailOverlay({ mode: 'stats' }, 'a')).toEqual({
      mode: 'detail',
      id: 'a',
    })
  })

  it('keeps the finder or completed stack when opening another tile', () => {
    expect(openDetailOverlay({ mode: 'find' }, 'a')).toEqual({
      mode: 'detail',
      id: 'a',
      from: 'find',
    })
    expect(openDetailOverlay({ mode: 'completed' }, 'a')).toEqual({
      mode: 'detail',
      id: 'a',
      from: 'completed',
    })
    expect(
      openDetailOverlay({ mode: 'detail', id: 'a', from: 'completed' }, 'b'),
    ).toEqual({ mode: 'detail', id: 'b', from: 'completed' })
  })
})

describe('closeOverlayState', () => {
  it('returns to the stacked window, otherwise closes', () => {
    expect(
      closeOverlayState({ mode: 'detail', id: 'a', from: 'find' }),
    ).toEqual({ mode: 'find' })
    expect(
      closeOverlayState({ mode: 'detail', id: 'a', from: 'completed' }),
    ).toEqual({ mode: 'completed' })
    expect(closeOverlayState({ mode: 'detail', id: 'a' })).toBeNull()
    expect(closeOverlayState({ mode: 'completed' })).toBeNull()
  })
})
