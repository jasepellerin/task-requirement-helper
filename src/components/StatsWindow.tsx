import { useEffect, useId, useMemo } from 'react'
import { skillStats, type SkillStat } from '../data/skillLevels.ts'
import { wikiPageUrl } from '../data/wiki.ts'
import type { Tile } from '../domain/types.ts'

type StatsWindowProps = {
  tiles: Tile[]
  onClose: () => void
}

function SkillCell({ skill }: { skill: SkillStat }) {
  return (
    <a
      className="stats-cell"
      href={wikiPageUrl(skill.name)}
      target="_blank"
      rel="noreferrer"
      aria-label={`${skill.name} ${skill.level}`}
      title={skill.name}
    >
      <img
        className="stats-icon"
        src={`/skill-icons/${skill.id}.png`}
        alt=""
        width={25}
        height={25}
      />
      <span className="stats-level">{skill.level}</span>
    </a>
  )
}

export function StatsWindow({ tiles, onClose }: StatsWindowProps) {
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
            <SkillCell key={skill.id} skill={skill} />
          ))}
        </div>
      </div>
    </div>
  )
}
