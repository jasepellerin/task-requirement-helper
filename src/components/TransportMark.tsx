import { assetUrl } from '../assetUrl.ts'
import type { WikiUnlock } from '../data/osrsCatalog.ts'
import { WikiUnlockListMark } from './WikiUnlockListMark.tsx'

type TransportMarkProps = {
  methods: readonly WikiUnlock[]
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

export function TransportMark({ methods, linked }: TransportMarkProps) {
  return (
    <WikiUnlockListMark
      items={methods}
      icon={<TransportIcon />}
      linked={linked}
    />
  )
}
