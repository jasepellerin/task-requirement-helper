import { Fragment, type ReactNode } from 'react'
import type { WikiUnlock } from '../data/osrsCatalog.ts'
import { wikiPageUrl } from '../data/wiki.ts'

type WikiUnlockListMarkProps = {
  items: readonly WikiUnlock[]
  icon: ReactNode
  linked?: boolean
  className?: string
}

function unlocksLabel(items: readonly WikiUnlock[]): string {
  return `Unlocks ${items.map((item) => item.name).join(', ')}`
}

export function WikiUnlockListMark({
  items,
  icon,
  linked,
  className = 'unlock-mark',
}: WikiUnlockListMarkProps) {
  if (items.length === 0) return null
  const label = unlocksLabel(items)
  if (linked) {
    return (
      <span className={className}>
        {icon}
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
    <span className={className} title={label} aria-label={label}>
      {icon}
    </span>
  )
}
