import type { SlayerMasterUnlock } from '../data/osrsCatalog.ts'
import { wikiPageUrl } from '../data/wiki.ts'

type SlayerMasterMarkProps = {
  master: SlayerMasterUnlock
  linked?: boolean
}

function SlayerMasterIcon() {
  return (
    <img
      className="slayer-master-icon"
      src="/icons/slayer-master.png"
      alt=""
      width={20}
      height={20}
    />
  )
}

export function SlayerMasterMark({ master, linked }: SlayerMasterMarkProps) {
  const label = `Unlocks ${master.name}`
  if (linked) {
    return (
      <a
        className="slayer-master-mark"
        href={wikiPageUrl(master.wikiTitle)}
        target="_blank"
        rel="noreferrer"
        title={label}
      >
        <SlayerMasterIcon />
        <span>{label}</span>
      </a>
    )
  }
  return (
    <span className="slayer-master-mark" title={label} aria-label={label}>
      <SlayerMasterIcon />
    </span>
  )
}
