import {
  tileMinigames,
  tileSlayerMaster,
  tileSlayerMonsters,
  tileSpellbooks,
  tileTeleportItems,
  tileTeleports,
  tileTransport,
} from '../data/osrsCatalog.ts'
import { MinigameMark } from './MinigameMark.tsx'
import { SlayerMasterMark } from './SlayerMasterMark.tsx'
import { SlayerMonsterMark } from './SlayerMonsterMark.tsx'
import { SpellbookMark } from './SpellbookMark.tsx'
import { TeleportItemMark } from './TeleportItemMark.tsx'
import { TeleportMark } from './TeleportMark.tsx'
import { TransportMark } from './TransportMark.tsx'

type TileUnlockMarksProps = {
  tileId: string
  linked?: boolean
}

export function TileUnlockMarks({ tileId, linked }: TileUnlockMarksProps) {
  const slayerMaster = tileSlayerMaster(tileId)
  const slayerMonsters = tileSlayerMonsters(tileId)
  const transport = tileTransport(tileId)
  const teleports = tileTeleports(tileId)
  const teleportItems = tileTeleportItems(tileId)
  const spellbooks = tileSpellbooks(tileId)
  const minigames = tileMinigames(tileId)

  return (
    <>
      {slayerMaster ? (
        <SlayerMasterMark master={slayerMaster} linked={linked} />
      ) : null}
      {slayerMonsters.length > 0 ? (
        <SlayerMonsterMark monsters={slayerMonsters} linked={linked} />
      ) : null}
      {transport.length > 0 ? (
        <TransportMark methods={transport} linked={linked} />
      ) : null}
      {spellbooks.length > 0 ? (
        <SpellbookMark spellbooks={spellbooks} linked={linked} />
      ) : null}
      {teleports.length > 0 ? (
        <TeleportMark spells={teleports} linked={linked} />
      ) : null}
      {teleportItems.length > 0 ? (
        <TeleportItemMark items={teleportItems} linked={linked} />
      ) : null}
      {minigames.length > 0 ? (
        <MinigameMark minigames={minigames} linked={linked} />
      ) : null}
    </>
  )
}
