import { Fragment } from 'react'
import type { TeleportItemUnlock } from '../data/osrsCatalog.ts'
import { wikiPageUrl } from '../data/wiki.ts'

type TeleportItemMarkProps = {
  items: readonly TeleportItemUnlock[]
  linked?: boolean
}

function TeleportItemIcon({ item }: { item: TeleportItemUnlock }) {
  return (
    <img
      className="unlock-icon"
      src={`/icons/items/${item.icon}`}
      alt=""
      width={20}
      height={20}
    />
  )
}

function teleportItemLabel(items: readonly TeleportItemUnlock[]): string {
  return `Unlocks ${items.map((item) => item.name).join(', ')}`
}

export function TeleportItemMark({ items, linked }: TeleportItemMarkProps) {
  if (items.length === 0) return null
  const label = teleportItemLabel(items)
  if (linked) {
    return (
      <span className="unlock-mark">
        {items.map((item) => (
          <TeleportItemIcon key={item.icon} item={item} />
        ))}
        <span>
          Unlocks{' '}
          {items.map((item, index) => (
            <Fragment key={`${item.wikiTitle}:${item.name}`}>
              {index > 0 ? ', ' : null}
              <a
                href={wikiPageUrl(item.wikiTitle)}
                target="_blank"
                rel="noreferrer"
              >
                {item.name}
              </a>
            </Fragment>
          ))}
        </span>
      </span>
    )
  }
  return (
    <span className="unlock-mark" title={label} aria-label={label}>
      {items.map((item) => (
        <TeleportItemIcon key={item.icon} item={item} />
      ))}
    </span>
  )
}
