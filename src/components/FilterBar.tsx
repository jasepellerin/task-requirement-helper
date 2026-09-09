import { type KindFilter } from '../data/osrsCatalog.ts'
import { KindFilters } from './KindFilters.tsx'
import { SearchBar } from './SearchBar.tsx'

type FilterBarProps = {
  query: string
  onQueryChange: (query: string) => void
  kinds: KindFilter
  onKindsChange: (kinds: KindFilter) => void
  kindsLabel?: string
  searchPlaceholder?: string
  searchAutoFocus?: boolean
}

export function FilterBar({
  query,
  onQueryChange,
  kinds,
  onKindsChange,
  kindsLabel,
  searchPlaceholder,
  searchAutoFocus,
}: FilterBarProps) {
  return (
    <div className="filter-pack">
      <SearchBar
        value={query}
        onChange={onQueryChange}
        placeholder={searchPlaceholder}
        autoFocus={searchAutoFocus}
      />
      <KindFilters kinds={kinds} onChange={onKindsChange} label={kindsLabel} />
    </div>
  )
}
