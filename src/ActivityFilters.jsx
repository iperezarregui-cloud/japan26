import Neighborhoods from './Neighborhoods'

function ActivityFilters({
  cityId,
  activityFilter,
  onActivityFilterChange,
  selectedNeighborhood,
  onNeighborhoodChange,
  onNeighborhoodsChange,
  searchText,
  onSearchTextChange,
}) {
  return (
    <section className="activity-tools">
      <label className="activity-search">
        <span>Buscar</span>

        <div className="activity-search-field">
          <span aria-hidden="true">⌕</span>

          <input
            type="search"
            value={searchText}
            onChange={(event) =>
              onSearchTextChange(event.target.value)
            }
            placeholder="Buscar por nombre o descripción..."
            autoComplete="off"
          />

          {searchText && (
            <button
              type="button"
              onClick={() =>
                onSearchTextChange('')
              }
              aria-label="Borrar búsqueda"
            >
              ×
            </button>
          )}
        </div>
      </label>

      <div className="activity-filters">
        <button
          className={
            activityFilter === 'all'
              ? 'selected'
              : ''
          }
          type="button"
          onClick={() =>
            onActivityFilterChange('all')
          }
        >
          Todos
        </button>

        <button
          className={
            activityFilter === 'pending'
              ? 'selected'
              : ''
          }
          type="button"
          onClick={() =>
            onActivityFilterChange('pending')
          }
        >
          Pendientes
        </button>

        <button
          className={
            activityFilter === 'done'
              ? 'selected'
              : ''
          }
          type="button"
          onClick={() =>
            onActivityFilterChange('done')
          }
        >
          Hechos
        </button>
      </div>

      {cityId === 'tokyo' && (
        <Neighborhoods
          cityId={cityId}
          selectedNeighborhood={
            selectedNeighborhood
          }
          onSelectNeighborhood={
            onNeighborhoodChange
          }
          onNeighborhoodsChange={
            onNeighborhoodsChange
          }
        />
      )}
    </section>
  )
}

export default ActivityFilters