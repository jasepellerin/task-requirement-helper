import { type KindFilter, type TileKind } from '../data/osrsCatalog.ts'

const KIND_FILTERS: { id: TileKind; label: string }[] = [
  { id: 'skill', label: 'Skills' },
  { id: 'diary', label: 'Diaries' },
  { id: 'quest', label: 'Quests' },
]

type KindFiltersProps = {
  kinds: KindFilter
  onChange: (kinds: KindFilter) => void
  label?: string
}

export function KindFilters({
  kinds,
  onChange,
  label = 'Catalog',
}: KindFiltersProps) {
  return (
    <div className="kind-filters" role="group" aria-label={label}>
      {KIND_FILTERS.map(({ id, label: name }) => (
        <button
          key={id}
          type="button"
          className="btn"
          aria-pressed={kinds[id]}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onChange({ ...kinds, [id]: !kinds[id] })}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
