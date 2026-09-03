import { useEffect, useId, useMemo, useState } from 'react'
import {
  tileDifficulty,
  tileGp,
  tileImage,
  tileItems,
  tileLength,
  tileRewards,
} from '../data/osrsCatalog.ts'
import { formatGp } from '../data/questReqs.ts'
import { requirementViews } from '../data/requirementViews.ts'
import { tileWikiUrl, wikiFileUrl } from '../data/wiki.ts'
import { STATUS_LABEL, type Tile, type TileStatus } from '../domain/types.ts'
import { TileUnlockMarks } from './TileUnlockMarks.tsx'
import {
  CloseIcon,
  ExternalLinkIcon,
  StarButton,
  StatusPicker,
} from './StatusPicker.tsx'

type TileDetailProps = {
  byId: Map<string, Tile>
  tile: Tile
  onCancel: () => void
  onOpenTile?: (id: string) => void
  onStatusChange?: (status: TileStatus) => void
  onStarChange?: (starred: boolean) => void
}

function difficultyPillClass(difficulty: string): string {
  const key = difficulty.toLowerCase()
  if (key.includes('grandmaster')) return 'grandmaster'
  if (key.includes('novice')) return 'novice'
  if (key.includes('intermediate')) return 'intermediate'
  if (key.includes('experienced')) return 'experienced'
  if (key.includes('master')) return 'master'
  if (key.includes('special')) return 'special'
  return 'plain'
}

export function TileDetail({
  byId,
  tile,
  onCancel,
  onOpenTile,
  onStatusChange,
  onStarChange,
}: TileDetailProps) {
  const titleId = useId()
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [failedImageTileId, setFailedImageTileId] = useState<string | null>(
    null,
  )
  const wikiUrl = tileWikiUrl(tile.id)
  const gp = tileGp(tile.id)
  const difficulty = tileDifficulty(tile.id)
  const length = tileLength(tile.id)
  const items = tileItems(tile.id)
  const rewards = tileRewards(tile.id)
  const image = tileImage(tile.id)
  const showImage = Boolean(image) && failedImageTileId !== tile.id
  const reqViews = useMemo(() => requirementViews(tile), [tile])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (statusMenuOpen) {
        setStatusMenuOpen(false)
        return
      }
      onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, statusMenuOpen])

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal tile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-title-row">
          {showImage && image ? (
            <img
              className="tile-thumb"
              src={wikiFileUrl(image)}
              alt=""
              onError={() => setFailedImageTileId(tile.id)}
            />
          ) : null}
          <h2 id={titleId}>{tile.name}</h2>
          <div className="modal-title-actions">
            {tile.status !== 'unseen' ? (
              <StarButton
                starred={tile.starred}
                onChange={(starred) => onStarChange?.(starred)}
              />
            ) : null}
            <StatusPicker
              value={tile.status}
              open={statusMenuOpen}
              onOpenChange={setStatusMenuOpen}
              onChange={(status) => onStatusChange?.(status)}
            />
            {wikiUrl ? (
              <a
                className="btn icon-ghost"
                href={wikiUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Open wiki"
                title="Wiki"
              >
                <ExternalLinkIcon />
              </a>
            ) : null}
            <button
              type="button"
              className="btn icon-ghost"
              aria-label="Close"
              title="Close"
              onClick={onCancel}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {difficulty || length ? (
          <div className="tile-pills">
            {difficulty ? (
              <span className={`pill pill-${difficultyPillClass(difficulty)}`}>
                {difficulty}
              </span>
            ) : null}
            {length ? <span className="pill pill-length">{length}</span> : null}
          </div>
        ) : null}

        <TileUnlockMarks tileId={tile.id} linked />

        {gp !== undefined ? (
          <p className="tile-gold">Gold {formatGp(gp)}</p>
        ) : null}

        <fieldset className="rel-fieldset">
          <legend>Requirements</legend>
          {reqViews.length === 0 ? (
            <p className="empty">No requirements.</p>
          ) : (
            <ul className="parent-list">
              {reqViews.map((row) => {
                const parent = byId.get(row.parentId)
                const parentStatus = parent?.status ?? 'unseen'
                const open = Boolean(parent && onOpenTile)
                const className = `req-name req-${parentStatus}`
                const label = `${row.title}, ${STATUS_LABEL[parentStatus]}`
                return (
                  <li key={row.key} className="parent-row">
                    {open ? (
                      <button
                        type="button"
                        className={className}
                        title={label}
                        onClick={() => onOpenTile?.(row.parentId)}
                      >
                        {row.title}
                      </button>
                    ) : (
                      <span className={className} title={label}>
                        {row.title}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </fieldset>

        {items.length > 0 ? (
          <fieldset className="rel-fieldset">
            <legend>Items</legend>
            <ul className="parent-list">
              {items.map((item, index) => (
                <li key={`${index}:${item}`} className="parent-row">
                  {item}
                </li>
              ))}
            </ul>
          </fieldset>
        ) : null}

        {rewards.length > 0 ? (
          <fieldset className="rel-fieldset">
            <legend>Rewards</legend>
            <ul className="parent-list">
              {rewards.map((reward, index) => (
                <li key={`${index}:${reward}`} className="parent-row">
                  {reward}
                </li>
              ))}
            </ul>
          </fieldset>
        ) : null}
      </div>
    </div>
  )
}
