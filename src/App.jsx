import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Auth from './Auth'
import { supabase } from './supabase'

const cities = [
  {
    id: 'tokyo',
    emoji: '🗼',
    name: 'Tokio',
    days: 'Días 1–4',
    description: 'Barrios, templos, miradores y gastronomía.',
    hotel: 'Hotel pendiente de confirmar',
  },
  {
    id: 'kyoto',
    emoji: '⛩️',
    name: 'Kioto',
    days: 'Días 5–8',
    description: 'Santuarios, jardines y calles tradicionales.',
    hotel: 'Hotel pendiente de confirmar',
  },
  {
    id: 'osaka',
    emoji: '🏯',
    name: 'Osaka',
    days: 'Días 9–11',
    description: 'Castillo, comida callejera y vida nocturna.',
    hotel: 'Hotel pendiente de confirmar',
  },
]

const sections = {
  plan: {
    label: 'Planes',
    singular: 'plan',
    icon: '✨',
    emptyTitle: 'Aún no hay planes añadidos',
    emptyText: 'Añade experiencias, excursiones y actividades.',
  },
  place: {
    label: 'Lugares',
    singular: 'lugar',
    icon: '⛩️',
    emptyTitle: 'Aún no hay lugares añadidos',
    emptyText: 'Añade templos, barrios, museos y miradores.',
  },
  food: {
    label: 'Comer',
    singular: 'restaurante',
    icon: '🍜',
    emptyTitle: 'Aún no hay restaurantes añadidos',
    emptyText: 'Añade restaurantes, mercados y platos que quieras probar.',
  },
}

const priorityOptions = [
  {
    value: 'essential',
    label: 'Imprescindible',
    icon: '🔴',
  },
  {
    value: 'high',
    label: 'Alta',
    icon: '🟠',
  },
  {
    value: 'medium',
    label: 'Media',
    icon: '🟡',
  },
  {
    value: 'low',
    label: 'Baja',
    icon: '⚪',
  },
]

const categoryOptions = [
  'Templo o santuario',
  'Museo',
  'Parque',
  'Mirador',
  'Mercado',
  'Barrio',
  'Paseo',
  'Compras',
  'Cultura',
  'Gastronomía',
  'Experiencia urbana',
  'Excursión',
]

const tokyoNeighborhoods = [
  'Shinjuku',
  'Shibuya',
  'Harajuku',
  'Asakusa',
  'Ueno',
  'Akihabara',
  'Ginza',
  'Roppongi',
  'Odaiba',
  'Ikebukuro',
  'Otros',
]

const priorityOrder = {
  essential: 1,
  high: 2,
  medium: 3,
  low: 4,
}

function getPriority(priority) {
  return (
    priorityOptions.find(
      (option) => option.value === priority
    ) || priorityOptions[2]
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  const [activeTab, setActiveTab] = useState('itinerary')
  const [selectedCityId, setSelectedCityId] = useState(null)
  const [citySection, setCitySection] = useState('hotel')

  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] =
    useState(false)
  const [activitiesError, setActivitiesError] = useState('')

  const [showActivityForm, setShowActivityForm] =
    useState(false)
  const [savingActivity, setSavingActivity] =
    useState(false)
  const [activityFilter, setActivityFilter] =
    useState('all')

  const selectedCity = cities.find(
    (city) => city.id === selectedCityId
  )

  const currentItemType =
    citySection === 'plans'
      ? 'plan'
      : citySection === 'places'
        ? 'place'
        : citySection === 'food'
          ? 'food'
          : null

  const currentSection = currentItemType
    ? sections[currentItemType]
    : null

  const visibleActivities = useMemo(() => {
    if (!currentItemType || !selectedCityId) {
      return []
    }

    return activities
      .filter(
        (activity) =>
          activity.city === selectedCityId &&
          activity.item_type === currentItemType
      )
      .filter((activity) => {
        if (activityFilter === 'pending') {
          return !activity.done
        }

        if (activityFilter === 'done') {
          return activity.done
        }

        return true
      })
      .sort((first, second) => {
        if (first.done !== second.done) {
          return first.done ? 1 : -1
        }

        if (!first.done && !second.done) {
          return (
            priorityOrder[first.priority] -
            priorityOrder[second.priority]
          )
        }

        if (first.completed_at && second.completed_at) {
          return (
            new Date(second.completed_at) -
            new Date(first.completed_at)
          )
        }

        return first.name.localeCompare(second.name)
      })
  }, [
    activities,
    selectedCityId,
    currentItemType,
    activityFilter,
  ])

  const pendingCount = visibleActivities.filter(
    (activity) => !activity.done
  ).length

  const doneCount = visibleActivities.filter(
    (activity) => activity.done
  ).length

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      setSession(currentSession)
      setCheckingSession(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession)
        setCheckingSession(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session) {
      loadActivities()
    } else {
      setActivities([])
    }
  }, [session])

  async function loadActivities() {
    setLoadingActivities(true)
    setActivitiesError('')

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)

      setActivitiesError(
        'No se pudo cargar la información. Comprueba la conexión.'
      )
    } else {
      setActivities(data ?? [])
    }

    setLoadingActivities(false)
  }

  async function handleLogout() {
    const shouldLogout = window.confirm(
      '¿Quieres cerrar la sesión?'
    )

    if (shouldLogout) {
      await supabase.auth.signOut()
    }
  }

  function changeTab(tab) {
    setActiveTab(tab)
    setSelectedCityId(null)
    resetCityView()
  }

  function openCity(cityId) {
    setSelectedCityId(cityId)
    resetCityView()
  }

  function goBackToCities() {
    setSelectedCityId(null)
    resetCityView()
  }

  function resetCityView() {
    setCitySection('hotel')
    setShowActivityForm(false)
    setActivityFilter('all')
    setActivitiesError('')
  }

  function changeCitySection(section) {
    setCitySection(section)
    setShowActivityForm(false)
    setActivityFilter('all')
    setActivitiesError('')
  }

  async function addActivity(event) {
    event.preventDefault()

    if (
      !selectedCityId ||
      !currentItemType ||
      savingActivity
    ) {
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)

    const name = String(
      formData.get('name') || ''
    ).trim()

    if (!name) {
      return
    }

    const durationValue = String(
      formData.get('estimated_duration') || ''
    ).trim()

    const newActivity = {
      city: selectedCityId,
      item_type: currentItemType,
      name,
      description: String(
        formData.get('description') || ''
      ).trim(),
      link: String(
        formData.get('link') || ''
      ).trim(),
      category:
        String(formData.get('category') || '').trim() ||
        null,
      priority:
        String(formData.get('priority') || 'medium'),
      neighborhood:
        selectedCityId === 'tokyo'
          ? String(
              formData.get('neighborhood') || ''
            ).trim() || null
          : null,
      estimated_duration: durationValue
        ? Number(durationValue)
        : null,
    }

    setSavingActivity(true)
    setActivitiesError('')

    const { data, error } = await supabase
      .from('activities')
      .insert(newActivity)
      .select()
      .single()

    if (error) {
      console.error(error)

      setActivitiesError(
        `No se pudo guardar el ${currentSection.singular}.`
      )
    } else {
      setActivities((currentActivities) => [
        ...currentActivities,
        data,
      ])

      form.reset()
      setShowActivityForm(false)
    }

    setSavingActivity(false)
  }

  async function toggleActivityDone(activity) {
    const nextDone = !activity.done
    const completedAt = nextDone
      ? new Date().toISOString()
      : null

    setActivitiesError('')

    const { data, error } = await supabase
      .from('activities')
      .update({
        done: nextDone,
        completed_at: completedAt,
      })
      .eq('id', activity.id)
      .select()
      .single()

    if (error) {
      console.error(error)

      setActivitiesError(
        'No se pudo actualizar el estado.'
      )

      return
    }

    setActivities((currentActivities) =>
      currentActivities.map((currentActivity) =>
        currentActivity.id === activity.id
          ? data
          : currentActivity
      )
    )
  }

  async function deleteActivity(activity) {
    const shouldDelete = window.confirm(
      `¿Quieres eliminar “${activity.name}”?`
    )

    if (!shouldDelete) {
      return
    }

    setActivitiesError('')

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activity.id)

    if (error) {
      console.error(error)

      setActivitiesError(
        'No se pudo eliminar el elemento.'
      )

      return
    }

    setActivities((currentActivities) =>
      currentActivities.filter(
        (currentActivity) =>
          currentActivity.id !== activity.id
      )
    )
  }

  if (checkingSession) {
    return (
      <main className="loading-page">
        <span>🇯🇵</span>
        <p>Cargando Japan26...</p>
      </main>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <main className="app">
      <header className="header app-header">
        <span className="flag">🇯🇵</span>

        <div className="header-information">
          <p className="eyebrow">MI VIAJE</p>
          <h1>Japón 2026</h1>
          <p>Itinerario de 14 días</p>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Salir
        </button>
      </header>

      <section className="tabs">
        <button
          className={`tab ${
            activeTab === 'itinerary' ? 'active' : ''
          }`}
          onClick={() => changeTab('itinerary')}
        >
          Itinerario
        </button>

        <button
          className={`tab ${
            activeTab === 'cities' ? 'active' : ''
          }`}
          onClick={() => changeTab('cities')}
        >
          Ciudades
        </button>
      </section>

      {activeTab === 'itinerary' && (
        <section className="content">
          <p className="date">PRÓXIMAMENTE</p>
          <h2>Itinerario por días</h2>

          <p>
            Aquí añadiremos los días plegables, las actividades
            vinculadas, los transportes y las líneas manuales.
          </p>

          <article className="card">
            <span className="time">Día 1</span>

            <div>
              <h3>Llegada a Japón</h3>
              <p>
                Este apartado será editable y tendrá detalle
                horario al desplegar cada día.
              </p>
            </div>
          </article>
        </section>
      )}

      {activeTab === 'cities' && !selectedCity && (
        <section className="content">
          <p className="date">DESTINOS DEL VIAJE</p>
          <h2>Ciudades</h2>

          <p>
            Consulta hoteles, planes, lugares de interés y
            restaurantes.
          </p>

          {cities.map((city) => (
            <button
              className="card city-card city-button"
              key={city.id}
              onClick={() => openCity(city.id)}
            >
              <span className="city-emoji">
                {city.emoji}
              </span>

              <div>
                <span className="city-days">
                  {city.days}
                </span>

                <h3>{city.name}</h3>
                <p>{city.description}</p>
              </div>

              <span className="arrow">›</span>
            </button>
          ))}
        </section>
      )}

      {activeTab === 'cities' && selectedCity && (
        <section className="content">
          <button
            className="back-button"
            onClick={goBackToCities}
          >
            ← Volver a ciudades
          </button>

          <div className="city-title">
            <span className="city-emoji large">
              {selectedCity.emoji}
            </span>

            <div>
              <p className="date">
                {selectedCity.days}
              </p>

              <h2>{selectedCity.name}</h2>
            </div>
          </div>

          <nav className="city-tabs">
            <button
              className={
                citySection === 'hotel' ? 'selected' : ''
              }
              onClick={() => changeCitySection('hotel')}
            >
              🛏️
              <span>Hotel</span>
            </button>

            <button
              className={
                citySection === 'plans' ? 'selected' : ''
              }
              onClick={() => changeCitySection('plans')}
            >
              ✨
              <span>Planes</span>
            </button>

            <button
              className={
                citySection === 'places' ? 'selected' : ''
              }
              onClick={() => changeCitySection('places')}
            >
              ⛩️
              <span>Lugares</span>
            </button>

            <button
              className={
                citySection === 'food' ? 'selected' : ''
              }
              onClick={() => changeCitySection('food')}
            >
              🍜
              <span>Comer</span>
            </button>
          </nav>

          {citySection === 'hotel' && (
            <section className="city-section">
              <p className="section-label">
                ALOJAMIENTO
              </p>

              <article className="detail-card">
                <span className="detail-icon">🛏️</span>

                <div>
                  <h3>
                    Hotel en {selectedCity.name}
                  </h3>

                  <p>{selectedCity.hotel}</p>
                </div>
              </article>
            </section>
          )}

          {currentItemType && (
            <section className="city-section">
              <div className="section-heading">
                <div>
                  <p className="section-label">
                    {currentSection.label.toUpperCase()}
                  </p>

                  <p className="activity-summary">
                    {pendingCount} pendientes · {doneCount} hechos
                  </p>
                </div>

                <button
                  className="add-button"
                  onClick={() =>
                    setShowActivityForm(
                      (current) => !current
                    )
                  }
                >
                  {showActivityForm
                    ? 'Cancelar'
                    : `+ Añadir ${currentSection.singular}`}
                </button>
              </div>

              <div className="activity-filters">
                <button
                  className={
                    activityFilter === 'all'
                      ? 'selected'
                      : ''
                  }
                  onClick={() =>
                    setActivityFilter('all')
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
                  onClick={() =>
                    setActivityFilter('pending')
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
                  onClick={() =>
                    setActivityFilter('done')
                  }
                >
                  Hechos
                </button>
              </div>

              {showActivityForm && (
                <form
                  className="place-form"
                  onSubmit={addActivity}
                >
                  <label>
                    Nombre

                    <input
                      name="name"
                      type="text"
                      placeholder={
                        currentItemType === 'food'
                          ? 'Ej. Ichiran Ramen'
                          : 'Ej. Senso-ji'
                      }
                      required
                    />
                  </label>

                  {selectedCityId === 'tokyo' && (
                    <label>
                      Barrio de Tokio

                      <select name="neighborhood">
                        <option value="">
                          Seleccionar barrio
                        </option>

                        {tokyoNeighborhoods.map(
                          (neighborhood) => (
                            <option
                              key={neighborhood}
                              value={neighborhood}
                            >
                              {neighborhood}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  )}

                  <div className="form-grid">
                    <label>
                      Categoría

                      <select name="category">
                        <option value="">
                          Sin categoría
                        </option>

                        {categoryOptions.map(
                          (category) => (
                            <option
                              key={category}
                              value={category}
                            >
                              {category}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      Prioridad

                      <select
                        name="priority"
                        defaultValue="medium"
                      >
                        {priorityOptions.map(
                          (priority) => (
                            <option
                              key={priority.value}
                              value={priority.value}
                            >
                              {priority.icon}{' '}
                              {priority.label}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>

                  <label>
                    Duración estimada en minutos

                    <input
                      name="estimated_duration"
                      type="number"
                      min="1"
                      placeholder="Ej. 90"
                    />
                  </label>

                  <label>
                    Descripción

                    <textarea
                      name="description"
                      placeholder="Qué quieres ver o recordar..."
                      rows="3"
                    />
                  </label>

                  <label>
                    Enlace de Google Maps

                    <input
                      name="link"
                      type="url"
                      placeholder="https://maps.google.com/..."
                    />
                  </label>

                  <button
                    className="save-button"
                    type="submit"
                    disabled={savingActivity}
                  >
                    {savingActivity
                      ? 'Guardando...'
                      : `Guardar ${currentSection.singular}`}
                  </button>
                </form>
              )}

              {activitiesError && (
                <div className="auth-message error">
                  <strong>
                    Ha ocurrido un problema
                  </strong>
                  <p>{activitiesError}</p>
                </div>
              )}

              {loadingActivities ? (
                <article className="empty-card">
                  <span>⏳</span>
                  <h3>Cargando información...</h3>
                </article>
              ) : visibleActivities.length === 0 ? (
                <article className="empty-card">
                  <span>{currentSection.icon}</span>
                  <h3>{currentSection.emptyTitle}</h3>
                  <p>{currentSection.emptyText}</p>
                </article>
              ) : (
                visibleActivities.map((activity) => {
                  const priority = getPriority(
                    activity.priority
                  )

                  return (
                    <article
                      className={`activity-card ${
                        activity.done
                          ? 'activity-done'
                          : ''
                      }`}
                      key={activity.id}
                    >
                      <button
                        className={`done-button ${
                          activity.done
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          toggleActivityDone(activity)
                        }
                        aria-label={
                          activity.done
                            ? `Marcar ${activity.name} como pendiente`
                            : `Marcar ${activity.name} como hecho`
                        }
                      >
                        {activity.done ? '✓' : ''}
                      </button>

                      <div className="activity-information">
                        <div className="activity-title-row">
                          <h3>{activity.name}</h3>

                          <span
                            className={`priority-badge priority-${activity.priority}`}
                          >
                            {priority.icon}{' '}
                            {priority.label}
                          </span>
                        </div>

                        <div className="activity-metadata">
                          {activity.neighborhood && (
                            <span>
                              📍 {activity.neighborhood}
                            </span>
                          )}

                          {activity.category && (
                            <span>
                              {activity.category}
                            </span>
                          )}

                          {activity.estimated_duration && (
                            <span>
                              ⏱️{' '}
                              {activity.estimated_duration}{' '}
                              min
                            </span>
                          )}
                        </div>

                        {activity.description && (
                          <p>{activity.description}</p>
                        )}

                        {activity.link && (
                          <a
                            href={activity.link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir en Google Maps ↗
                          </a>
                        )}

                        {activity.done && (
                          <button
                            className="restore-button"
                            onClick={() =>
                              toggleActivityDone(activity)
                            }
                          >
                            Marcar como pendiente
                          </button>
                        )}
                      </div>

                      <button
                        className="delete-button"
                        onClick={() =>
                          deleteActivity(activity)
                        }
                        aria-label={`Eliminar ${activity.name}`}
                      >
                        ×
                      </button>
                    </article>
                  )
                })
              )}
            </section>
          )}
        </section>
      )}
    </main>
  )
}

export default App