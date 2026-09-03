import { useEffect, useId, useMemo, useState } from 'react'
import { skillStats, type SkillStat } from '../data/skillLevels.ts'
import type { Tile } from '../domain/types.ts'

type StatsWindowProps = {
  tiles: Tile[]
  onClose: () => void
  onOpenTile: (id: string) => void
}

function SkillCell({
  skill,
  onOpenTile,
  onHover,
}: {
  skill: SkillStat
  onOpenTile: (id: string) => void
  onHover: (skill: SkillStat | null) => void
}) {
  const tileId = skill.tileId
  const body = (
    <>
      <img
        className="stats-icon"
        src={`/skill-icons/${skill.id}.png`}
        alt=""
        width={25}
        height={25}
      />
      <span className="stats-levels">
        <span>{skill.level}</span>
        <span>{skill.level}</span>
      </span>
    </>
  )

  if (!tileId) {
    return (
      <div
        className="stats-cell"
        aria-label={`${skill.name} ${skill.level}`}
        onMouseEnter={() => onHover(skill)}
        onMouseLeave={() => onHover(null)}
      >
        {body}
      </div>
    )
  }

  return (
    <button
      type="button"
      className="stats-cell"
      aria-label={`${skill.name} ${skill.level}`}
      onClick={() => onOpenTile(tileId)}
      onMouseEnter={() => onHover(skill)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(skill)}
      onBlur={() => onHover(null)}
    >
      {body}
    </button>
  )
}

export function StatsWindow({ tiles, onClose, onOpenTile }: StatsWindowProps) {
  const titleId = useId()
  const stats = useMemo(() => skillStats(tiles), [tiles])
  const [hovered, setHovered] = useState<SkillStat | null>(null)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const hint = hovered
    ? `${hovered.name} ${hovered.level}/${hovered.level}`
    : 'Maximum level from unlocked and completed skill tiles.'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="stats-frame"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="stats-title-row">
          <h2 id={titleId}>Skills</h2>
          <button type="button" className="stats-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="stats-grid">
          {stats.map((skill) => (
            <SkillCell
              key={skill.id}
              skill={skill}
              onOpenTile={onOpenTile}
              onHover={setHovered}
            />
          ))}
        </div>
        <p className="stats-hint">{hint}</p>
      </div>
    </div>
  )
}
