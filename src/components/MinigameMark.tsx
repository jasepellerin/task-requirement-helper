import { assetUrl } from '../assetUrl.ts'
import type { WikiUnlock } from '../data/osrsCatalog.ts'
import { WikiUnlockListMark } from './WikiUnlockListMark.tsx'

type MinigameMarkProps = {
  minigames: readonly WikiUnlock[]
  linked?: boolean
}

function MinigameIcon() {
  return (
    <img
      className="unlock-icon"
      src={assetUrl('/icons/minigame.png')}
      alt=""
      width={20}
      height={20}
    />
  )
}

export function MinigameMark({ minigames, linked }: MinigameMarkProps) {
  return (
    <WikiUnlockListMark
      items={minigames}
      icon={<MinigameIcon />}
      linked={linked}
    />
  )
}
