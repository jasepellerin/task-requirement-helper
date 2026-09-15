import { assetUrl } from '../assetUrl.ts'
import type { SpellbookUnlock } from '../data/osrsCatalog.ts'
import { WikiUnlockListMark } from './WikiUnlockListMark.tsx'

type SpellbookMarkProps = {
  spellbooks: readonly SpellbookUnlock[]
  linked?: boolean
}

function SpellbookIcons({
  spellbooks,
}: {
  spellbooks: readonly SpellbookUnlock[]
}) {
  return spellbooks.map((spellbook) => (
    <img
      key={spellbook.icon}
      className="unlock-icon"
      src={assetUrl(`/icons/spellbooks/${spellbook.icon}`)}
      alt=""
      width={20}
      height={20}
    />
  ))
}

export function SpellbookMark({ spellbooks, linked }: SpellbookMarkProps) {
  return (
    <WikiUnlockListMark
      items={spellbooks}
      icon={<SpellbookIcons spellbooks={spellbooks} />}
      linked={linked}
    />
  )
}
