import { assetUrl } from '../assetUrl.ts'
import type { TeleportItemUnlock } from '../data/osrsCatalog.ts'
import { WikiUnlockListMark } from './WikiUnlockListMark.tsx'

type TeleportItemMarkProps = {
  items: readonly TeleportItemUnlock[]
  linked?: boolean
}

function TeleportItemIcons({
  items,
}: {
  items: readonly TeleportItemUnlock[]
}) {
  return items.map((item) => (
    <img
      key={item.icon}
      className="unlock-icon"
      src={assetUrl(`/icons/items/${item.icon}`)}
      alt=""
      width={20}
      height={20}
    />
  ))
}

export function TeleportItemMark({ items, linked }: TeleportItemMarkProps) {
  return (
    <WikiUnlockListMark
      items={items}
      icon={<TeleportItemIcons items={items} />}
      linked={linked}
    />
  )
}
