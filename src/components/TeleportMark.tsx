import { Fragment } from 'react'
import { assetUrl } from '../assetUrl.ts'
import type { TeleportUnlock } from '../data/osrsCatalog.ts'
import { wikiPageUrl } from '../data/wiki.ts'

type TeleportMarkProps = {
  spells: readonly TeleportUnlock[]
  linked?: boolean
}

function TeleportIcon() {
  return (
    <img
      className="unlock-icon"
      src={assetUrl('/icons/teleport.png')}
      alt=""
      width={20}
      height={20}
    />
  )
}

function teleportLabel(spells: readonly TeleportUnlock[]): string {
  return `Unlocks ${spells.map((spell) => spell.name).join(', ')}`
}

export function TeleportMark({ spells, linked }: TeleportMarkProps) {
  if (spells.length === 0) return null
  const label = teleportLabel(spells)
  if (linked) {
    return (
      <span className="unlock-mark">
        <TeleportIcon />
        <span>
          Unlocks{' '}
          {spells.map((spell, index) => (
            <Fragment key={`${spell.wikiTitle}:${spell.name}`}>
              {index > 0 ? ', ' : null}
              <a
                href={wikiPageUrl(spell.wikiTitle)}
                target="_blank"
                rel="noreferrer"
              >
                {spell.name}
              </a>
            </Fragment>
          ))}
        </span>
      </span>
    )
  }
  return (
    <span className="unlock-mark" title={label} aria-label={label}>
      <TeleportIcon />
    </span>
  )
}
