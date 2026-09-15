import { assetUrl } from '../assetUrl.ts'
import type { WikiUnlock } from '../data/osrsCatalog.ts'
import { WikiUnlockListMark } from './WikiUnlockListMark.tsx'

type TeleportMarkProps = {
  spells: readonly WikiUnlock[]
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

export function TeleportMark({ spells, linked }: TeleportMarkProps) {
  return (
    <WikiUnlockListMark
      items={spells}
      icon={<TeleportIcon />}
      linked={linked}
    />
  )
}
