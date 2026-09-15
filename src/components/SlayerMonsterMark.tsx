import { assetUrl } from '../assetUrl.ts'
import type { WikiUnlock } from '../data/osrsCatalog.ts'
import { WikiUnlockListMark } from './WikiUnlockListMark.tsx'

type SlayerMonsterMarkProps = {
  monsters: readonly WikiUnlock[]
  linked?: boolean
}

function SlayerMonsterIcon() {
  return (
    <img
      className="slayer-icon"
      src={assetUrl('/icons/slayer.png')}
      alt=""
      width={20}
      height={20}
    />
  )
}

export function SlayerMonsterMark({
  monsters,
  linked,
}: SlayerMonsterMarkProps) {
  return (
    <WikiUnlockListMark
      items={monsters}
      icon={<SlayerMonsterIcon />}
      linked={linked}
      className="slayer-mark"
    />
  )
}
