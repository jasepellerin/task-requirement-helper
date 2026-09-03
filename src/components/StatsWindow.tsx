import { useEffect, useId, useMemo } from 'react'
import {
  isCombatSkill,
  skillStats,
  type SkillStat,
} from '../data/skillLevels.ts'
import { wikiPageUrl } from '../data/wiki.ts'
import type { Tile } from '../domain/types.ts'
import { PriorityIcon } from './StatusPicker.tsx'

type StatsWindowProps = {
  tiles: Tile[]
  prioritySkills: ReadonlySet<string>
  onPriorityChange: (skillId: string, value: boolean) => void
  onClose: () => void
}

function SkillCell({
  skill,
  priority,
  onPriorityChange,
}: {
  skill: SkillStat
  priority: boolean
  onPriorityChange?: (value: boolean) => void
}) {
  const label = `${skill.name} ${skill.level}`
  const contents = (
    <>
      <img
        className="stats-icon"
        src={`/skill-icons/${skill.id}.png`}
        alt=""
        width={25}
        height={25}
      />
      <span className="stats-level">{skill.level}</span>
      {priority ? (
        <span className="stats-priority-mark" aria-hidden="true">
          <PriorityIcon filled />
        </span>
      ) : null}
    </>
  )

  if (onPriorityChange) {
    return (
      <button
        type="button"
        className={priority ? 'stats-cell stats-cell-priority' : 'stats-cell'}
        aria-label={priority ? `Unpin ${skill.name}` : `Priority ${skill.name}`}
        aria-pressed={priority}
        title={skill.name}
        onClick={() => onPriorityChange(!priority)}
      >
        {contents}
      </button>
    )
  }

  return (
    <a
      className="stats-cell"
      href={wikiPageUrl(skill.name)}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={skill.name}
    >
      {contents}
    </a>
  )
}

export function StatsWindow({
  tiles,
  prioritySkills,
  onPriorityChange,
  onClose,
}: StatsWindowProps) {
  const titleId = useId()
  const stats = useMemo(() => skillStats(tiles), [tiles])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
              priority={prioritySkills.has(skill.id)}
              onPriorityChange={
                isCombatSkill(skill.id)
                  ? undefined
                  : (value) => onPriorityChange(skill.id, value)
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}
