import { Fragment } from 'react'
import { assetUrl } from '../assetUrl.ts'
import type { TransportUnlock } from '../data/osrsCatalog.ts'
import { wikiPageUrl } from '../data/wiki.ts'

type TransportMarkProps = {
  methods: readonly TransportUnlock[]
  linked?: boolean
}

function TransportIcon() {
  return (
    <img
      className="unlock-icon"
      src={assetUrl('/icons/transport.png')}
      alt=""
      width={20}
      height={20}
    />
  )
}

function transportLabel(methods: readonly TransportUnlock[]): string {
  return `Unlocks ${methods.map((method) => method.name).join(', ')}`
}

export function TransportMark({ methods, linked }: TransportMarkProps) {
  if (methods.length === 0) return null
  const label = transportLabel(methods)
  if (linked) {
    return (
      <span className="unlock-mark">
        <TransportIcon />
        <span>
          Unlocks{' '}
          {methods.map((method, index) => (
            <Fragment key={`${method.wikiTitle}:${method.name}`}>
              {index > 0 ? ', ' : null}
              <a
                href={wikiPageUrl(method.wikiTitle)}
                target="_blank"
                rel="noreferrer"
              >
                {method.name}
              </a>
            </Fragment>
          ))}
        </span>
      </span>
    )
  }
  return (
    <span className="unlock-mark" title={label} aria-label={label}>
      <TransportIcon />
    </span>
  )
}
