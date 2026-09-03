import { Fragment } from 'react'
import type { SlayerMonsterUnlock } from '../data/osrsCatalog.ts'
import { wikiPageUrl } from '../data/wiki.ts'

type SlayerMonsterMarkProps = {
  monsters: readonly SlayerMonsterUnlock[]
  linked?: boolean
}

function SlayerMonsterIcon() {
  return (
    <img
      className="slayer-icon"
      src="/icons/slayer.png"
      alt=""
      width={20}
      height={20}
    />
  )
}

function slayerMonsterLabel(monsters: readonly SlayerMonsterUnlock[]): string {
  return `Unlocks ${monsters.map((monster) => monster.name).join(', ')}`
}

export function SlayerMonsterMark({
  monsters,
  linked,
}: SlayerMonsterMarkProps) {
  if (monsters.length === 0) return null
  const label = slayerMonsterLabel(monsters)
  if (linked) {
    return (
      <span className="slayer-mark">
        <SlayerMonsterIcon />
        <span>
          Unlocks{' '}
          {monsters.map((monster, index) => (
            <Fragment key={monster.wikiTitle}>
              {index > 0 ? ', ' : null}
              <a
                href={wikiPageUrl(monster.wikiTitle)}
                target="_blank"
                rel="noreferrer"
              >
                {monster.name}
              </a>
            </Fragment>
          ))}
        </span>
      </span>
    )
  }
  return (
    <span className="slayer-mark" title={label} aria-label={label}>
      <SlayerMonsterIcon />
    </span>
  )
}
