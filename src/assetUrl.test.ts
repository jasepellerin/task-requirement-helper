import { describe, expect, it } from 'vitest'
import { assetUrl } from './assetUrl.ts'

describe('assetUrl', () => {
  it('joins a rooted path onto BASE_URL', () => {
    expect(assetUrl('/icons/slayer.png')).toBe('/icons/slayer.png')
  })

  it('joins a relative path onto BASE_URL', () => {
    expect(assetUrl('icons/slayer.png')).toBe('/icons/slayer.png')
  })
})
