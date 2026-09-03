import { Fragment } from 'react'
import type { MinigameUnlock } from '../data/osrsCatalog.ts'
import { wikiPageUrl } from '../data/wiki.ts'

type MinigameMarkProps = {
  minigames: readonly MinigameUnlock[]
  linked?: boolean
}

function MinigameIcon() {
  return (
    <img
      className="unlock-icon"
      src="/icons/minigame.png"
      alt=""
      width={20}
      height={20}
    />
  )
}

function minigameLabel(minigames: readonly MinigameUnlock[]): string {
  return `Unlocks ${minigames.map((minigame) => minigame.name).join(', ')}`
}

export function MinigameMark({ minigames, linked }: MinigameMarkProps) {
  if (minigames.length === 0) return null
  const label = minigameLabel(minigames)
  if (linked) {
    return (
      <span className="unlock-mark">
        <MinigameIcon />
        <span>
          Unlocks{' '}
          {minigames.map((minigame, index) => (
            <Fragment key={`${minigame.wikiTitle}:${minigame.name}`}>
              {index > 0 ? ', ' : null}
              <a
                href={wikiPageUrl(minigame.wikiTitle)}
                target="_blank"
                rel="noreferrer"
              >
                {minigame.name}
              </a>
            </Fragment>
          ))}
        </span>
      </span>
    )
  }
  return (
    <span className="unlock-mark" title={label} aria-label={label}>
      <MinigameIcon />
    </span>
  )
}
