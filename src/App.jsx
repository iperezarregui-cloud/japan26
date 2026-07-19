import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Auth from './Auth'
import Itinerary from './Itinerary'
import Hotels from './Hotels'
import ActivityFilters from './ActivityFilters'
import Reservations from './Reservations'
import { supabase } from './supabase'

const cities = [
  {
    id: 'tokyo',
    emoji: '🗼',
    name: 'Tokio',
    description:
      'Barrios, templos, miradores y gastronomía.',
  },
  {
    id: 'hakone',
    emoji: '🗻',
    name: 'Hakone',
    description:
      'Monte Fuji, naturaleza, lago y aguas termales.',
  },
  {
    id: 'kyoto',
    emoji: '⛩️',
    name: 'Kioto',
    description:
      'Santuarios, jardines y calles tradicionales.',
  },
  {
    id: 'nara',
    emoji: '🦌',
    name: 'Nara',
    description:
      'Templos históricos, parques y ciervos.',
  },
  {
    id: 'osaka',
    emoji: '🏯',
    name: 'Osaka',
    description:
      'Castillo, comida callejera y vida nocturna.',
  },
  {
    id: 'kobe',
    emoji: '🥩',
    name: 'Kobe',
    description:
      'Puerto, gastronomía, barrios históricos y montaña.',
  },
  {
    id: 'hiroshima',
    emoji: '🕊️',
    name: 'Hiroshima',
    description:
      'Historia, cultura, jardines y gastronomía.',
  },
  {
    id: 'miyajima',
    emoji: '⛩️',
    name: 'Miyajima',
    description:
      'Santuario de Itsukushima, naturaleza y senderos.',
  },
]

const sections = {
  place: {
    label: 'Ver y hacer',
    singular: 'lugar o plan',
    icon: '⛩️',
    emptyTitle: 'Aún no hay lugares o planes añadidos',
    emptyText:
      'Añade lugares, actividades, excursiones y experiencias.',
  },
  food: {
    label: 'Comer y beber',
    singular: 'restaurante',
    icon: '🍜',
    emptyTitle: 'Aún no hay restaurantes añadidos',
    emptyText:
      'Añade restaurantes, mercados y platos que quieras probar.',
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

const placeCategoryOptions = [
  'Barrio',
  'Compras',
  'Cultura',
  'Excursión',
  'Experiencia urbana',
  'Gastronomía',
  'Mercado',
  'Mirador',
  'Museo',
  'Parque',
  'Paseo',
  'Templo o santuario',
]

const foodCategoryOptions = [
  'Ambiente',
  'Café',
  'Carne',
  'Cócteles',
  'Especialidad',
  'Pescado',
  'Ramen',
  'Sushi',
  'Tomar algo',
]

const categoryIcons = {
  'Templo o santuario': '⛩️',
  Museo: '🏛️',
  Parque: '🌳',
  Mirador: '🌇',
  Mercado: '🏮',
  Barrio: '🏙️',
  Paseo: '🚶',
  Compras: '🛍️',
  Cultura: '🎭',
  Gastronomía: '🍜',
  'Experiencia urbana': '🌃',
  Excursión: '🚆',
  Ambiente: '🎶',
  Café: '☕',
  Carne: '🥩',
  Cócteles: '🍸',
  Especialidad: '⭐',
  Pescado: '🐟',
  Ramen: '🍜',
  Sushi: '🍣',
  'Tomar algo': '🍻',
}

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

function getCategoryIcon(category, itemType) {
  if (category && categoryIcons[category]) {
    return categoryIcons[category]
  }

  if (itemType === 'food') {
    return '🍽️'
  }

  if (itemType === 'place') {
    return '📍'
  }

  return '✨'
}

function joinDayParts(parts) {
  if (parts.length === 0) {
    return ''
  }

  if (parts.length === 1) {
    return parts[0]
  }

  if (parts.length === 2) {
    return parts[0] + ' y ' + parts[1]
  }

  return (
    parts.slice(0, -1).join(', ') +
    ' y ' +
    parts[parts.length - 1]
  )
}

function formatCityDays(cityId, itineraryDays) {
  const dayNumbers = itineraryDays
    .filter((day) => day.city === cityId)
    .map((day) => Number(day.day_number))
    .filter((dayNumber) =>
      Number.isFinite(dayNumber)
    )
    .sort((first, second) => first - second)

  const uniqueDayNumbers = [
    ...new Set(dayNumbers),
  ]

  if (uniqueDayNumbers.length === 0) {
    return 'Sin días asignados'
  }

  if (uniqueDayNumbers.length === 1) {
    return 'Día ' + uniqueDayNumbers[0]
  }

  const ranges = []
  let rangeStart = uniqueDayNumbers[0]
  let rangeEnd = uniqueDayNumbers[0]

  for (
    let index = 1;
    index < uniqueDayNumbers.length;
    index += 1
  ) {
    const currentDay = uniqueDayNumbers[index]

    if (currentDay === rangeEnd + 1) {
      rangeEnd = currentDay
    } else {
      ranges.push({
        start: rangeStart,
        end: rangeEnd,
      })

      rangeStart = currentDay
      rangeEnd = currentDay
    }
  }

  ranges.push({
    start: rangeStart,
    end: rangeEnd,
  })

  const formattedRanges = ranges.map((range) => {
    if (range.start === range.end) {
      return String(range.start)
    }

    return range.start + '–' + range.end
  })

  return 'Días ' + joinDayParts(formattedRanges)
}

function App() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] =
    useState(true)

    
const [
  passwordRecovery,
  setPasswordRecovery,
] = useState(false)


  const [activeTab, setActiveTab] =
    useState('itinerary')

  const [
    requestedItineraryDayId,
    setRequestedItineraryDayId,
  ] = useState(null)

  const [selectedCityId, setSelectedCityId] =
    useState(null)

  const [citySection, setCitySection] =
    useState('hotel')

  const [activities, setActivities] =
    useState([])

  const [itineraryDays, setItineraryDays] =
    useState([])

  const [loadingActivities, setLoadingActivities] =
    useState(false)

  const [activitiesError, setActivitiesError] =
    useState('')

  const [showActivityForm, setShowActivityForm] =
    useState(false)

  const [savingActivity, setSavingActivity] =
    useState(false)

  const [editingActivity, setEditingActivity] =
    useState(null)

  const [activityFilter, setActivityFilter] =
    useState('all')

  const [
    selectedNeighborhood,
    setSelectedNeighborhood,
  ] = useState('all')

  const [
    neighborhoodOptions,
    setNeighborhoodOptions,
  ] = useState([])

  const [
    activitySearchText,
    setActivitySearchText,
  ] = useState('')

  const selectedCity = cities.find(
    (city) => city.id === selectedCityId
  )

  const currentItemType =
    citySection === 'places'
      ? 'place'
      : citySection === 'food'
        ? 'food'
        : null

  const currentSection = currentItemType
    ? sections[currentItemType]
    : null

  const currentCategoryOptions =
    currentItemType === 'food'
      ? foodCategoryOptions
      : placeCategoryOptions

  const citySectionActivities = useMemo(() => {
    if (!selectedCityId || !currentItemType) {
      return []
    }

    return activities.filter(
      (activity) =>
        activity.city === selectedCityId &&
        activity.item_type === currentItemType
    )
  }, [
    activities,
    selectedCityId,
    currentItemType,
  ])

  const visibleActivities = useMemo(() => {
    const normalizedSearch =
      activitySearchText.trim().toLowerCase()

    return citySectionActivities
      .filter((activity) => {
        if (activityFilter === 'pending') {
          return !activity.done
        }

        if (activityFilter === 'done') {
          return activity.done
        }

        return true
      })
      .filter((activity) => {
        if (
          selectedCityId !== 'tokyo' ||
          selectedNeighborhood === 'all'
        ) {
          return true
        }

        if (selectedNeighborhood === 'none') {
          return !activity.neighborhood
        }

        return (
          activity.neighborhood ===
          selectedNeighborhood
        )
      })
      .filter((activity) => {
        if (!normalizedSearch) {
          return true
        }

        const searchableText = [
          activity.name,
          activity.description,
          activity.category,
          activity.neighborhood,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(
          normalizedSearch
        )
      })
      .sort((first, second) => {
        if (first.done !== second.done) {
          return first.done ? 1 : -1
        }

        if (!first.done && !second.done) {
          const firstPriority =
            priorityOrder[first.priority] || 3

          const secondPriority =
            priorityOrder[second.priority] || 3

          if (firstPriority !== secondPriority) {
            return firstPriority - secondPriority
          }
        }

        if (
          first.completed_at &&
          second.completed_at
        ) {
          return (
            new Date(second.completed_at) -
            new Date(first.completed_at)
          )
        }

        return first.name.localeCompare(
          second.name
        )
      })
  }, [
    citySectionActivities,
    activityFilter,
    selectedCityId,
    selectedNeighborhood,
    activitySearchText,
  ])

  const pendingCount =
    citySectionActivities.filter(
      (activity) => !activity.done
    ).length

  const doneCount =
    citySectionActivities.filter(
      (activity) => activity.done
    ).length

    useEffect(() => {
      let mounted = true
    
      async function loadSession() {
        const currentUrl = new URL(
          window.location.href
        )
    
        const hashParameters =
          new URLSearchParams(
            currentUrl.hash.replace('#', '')
          )
    
        const recoveryType =
          currentUrl.searchParams.get('type') ||
          hashParameters.get('type')
    
        if (
          mounted &&
          recoveryType === 'recovery'
        ) {
          setPasswordRecovery(true)
        }
    
        const result =
          await supabase.auth.getSession()
    
        if (!mounted) {
          return
        }
    
        setSession(result.data.session)
        setCheckingSession(false)
      }
    
      loadSession()
    
      const authListener =
        supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            if (!mounted) {
              return
            }
    
            if (event === 'PASSWORD_RECOVERY') {
              setPasswordRecovery(true)
            }
    
            if (event === 'SIGNED_OUT') {
              setPasswordRecovery(false)
            }
    
            setSession(currentSession)
            setCheckingSession(false)
          }
        )
    
      return () => {
        mounted = false
        authListener.data.subscription.unsubscribe()
      }
    }, [])

  useEffect(() => {
    if (session) {
      loadApplicationData()
    } else {
      setActivities([])
      setItineraryDays([])
    }
  }, [session])

  async function loadApplicationData() {
    setLoadingActivities(true)
    setActivitiesError('')

    const [activitiesResult, daysResult] =
      await Promise.all([
        supabase
          .from('activities')
          .select('*')
          .order('created_at', {
            ascending: true,
          }),

        supabase
          .from('itinerary_days')
          .select(
            'id, day_number, city, travel_date'
          )
          .order('day_number', {
            ascending: true,
          }),
      ])

    if (activitiesResult.error) {
      console.error(
        'Error al cargar actividades:',
        activitiesResult.error
      )

      setActivitiesError(
        'No se pudo cargar la información.'
      )
    } else {
      setActivities(
        activitiesResult.data || []
      )
    }

    if (daysResult.error) {
      console.error(
        'Error al cargar días:',
        daysResult.error
      )

      setActivitiesError(
        'No se pudieron calcular los días de las ciudades.'
      )
    } else {
      setItineraryDays(
        daysResult.data || []
      )
    }

    setLoadingActivities(false)
  }
  function finishPasswordRecovery() {
    setPasswordRecovery(false)
  
    window.history.replaceState(
      {},
      document.title,
      window.location.origin
    )
  }
  async function handleLogout() {
    const shouldLogout = window.confirm(
      '¿Quieres cerrar la sesión?'
    )

    if (shouldLogout) {
      await supabase.auth.signOut()
    }
  }

  function resetCityView() {
    setCitySection('hotel')
    setShowActivityForm(false)
    setEditingActivity(null)
    setActivityFilter('all')
    setSelectedNeighborhood('all')
    setActivitySearchText('')
    setActivitiesError('')
  }

  function changeTab(tab) {
    setActiveTab(tab)
    setSelectedCityId(null)
    setRequestedItineraryDayId(null)
    resetCityView()

    if (tab === 'cities' && session) {
      loadApplicationData()
    }
  }

  function openCity(cityId) {
    setActiveTab('cities')
    setSelectedCityId(cityId)
    setRequestedItineraryDayId(null)

    setCitySection('hotel')
    setShowActivityForm(false)
    setEditingActivity(null)
    setActivityFilter('all')
    setSelectedNeighborhood('all')
    setActivitySearchText('')
    setActivitiesError('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function openItineraryDay(dayId) {
    setActiveTab('itinerary')
    setSelectedCityId(null)
    setRequestedItineraryDayId(dayId)
    resetCityView()
  }

  function goBackToCities() {
    setSelectedCityId(null)
    resetCityView()

    if (session) {
      loadApplicationData()
    }
  }

  function changeCitySection(section) {
    setCitySection(section)
    setShowActivityForm(false)
    setEditingActivity(null)
    setActivityFilter('all')
    setSelectedNeighborhood('all')
    setActivitySearchText('')
    setActivitiesError('')
  }

  function handleNeighborhoodsChange(
    nextNeighborhoods
  ) {
    setNeighborhoodOptions(nextNeighborhoods)

    if (
      selectedNeighborhood !== 'all' &&
      selectedNeighborhood !== 'none' &&
      !nextNeighborhoods.includes(
        selectedNeighborhood
      )
    ) {
      setSelectedNeighborhood('all')
    }
  }

  function openNewActivityForm() {
    setEditingActivity(null)
    setShowActivityForm(true)
    setActivitiesError('')
  }

  function openEditActivityForm(activity) {
    setEditingActivity(activity)
    setShowActivityForm(true)
    setActivitiesError('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function closeActivityForm() {
    setEditingActivity(null)
    setShowActivityForm(false)
    setActivitiesError('')
  }

  async function saveActivity(event) {
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
      setActivitiesError(
        'El nombre es obligatorio.'
      )
      return
    }

    const durationValue = String(
      formData.get('estimated_duration') || ''
    ).trim()

    const activityInformation = {
      city: selectedCityId,
      item_type: currentItemType,
      name,
      description: String(
        formData.get('description') || ''
      ).trim(),
      link: String(
        formData.get('link') || ''
      ).trim(),
      tiktok_link: String(
        formData.get('tiktok_link') || ''
      ).trim(),
      category:
        String(
          formData.get('category') || ''
        ).trim() || null,
      priority: String(
        formData.get('priority') || 'medium'
      ),
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

    let result

    if (editingActivity) {
      result = await supabase
        .from('activities')
        .update(activityInformation)
        .eq('id', editingActivity.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('activities')
        .insert(activityInformation)
        .select()
        .single()
    }

    if (result.error) {
      console.error(
        'Error al guardar la actividad:',
        result.error
      )

      setActivitiesError(
        'No se pudo guardar el elemento: ' +
          result.error.message
      )
    } else {
      if (editingActivity) {
        setActivities((currentActivities) =>
          currentActivities.map(
            (currentActivity) => {
              if (
                currentActivity.id ===
                editingActivity.id
              ) {
                return result.data
              }

              return currentActivity
            }
          )
        )
      } else {
        setActivities((currentActivities) => [
          ...currentActivities,
          result.data,
        ])
      }

      form.reset()
      closeActivityForm()
    }

    setSavingActivity(false)
  }

  async function toggleActivityDone(activity) {
    const nextDone = !activity.done

    const completedAt = nextDone
      ? new Date().toISOString()
      : null

    setActivitiesError('')

    const result = await supabase
      .from('activities')
      .update({
        done: nextDone,
        completed_at: completedAt,
      })
      .eq('id', activity.id)
      .select()
      .single()

    if (result.error) {
      console.error(
        'Error al actualizar actividad:',
        result.error
      )

      setActivitiesError(
        'No se pudo actualizar el estado.'
      )

      return
    }

    setActivities((currentActivities) =>
      currentActivities.map(
        (currentActivity) => {
          if (
            currentActivity.id === activity.id
          ) {
            return result.data
          }

          return currentActivity
        }
      )
    )
  }

  async function deleteActivity(activity) {
    const shouldDelete = window.confirm(
      '¿Quieres eliminar “' +
        activity.name +
        '”?'
    )

    if (!shouldDelete) {
      return
    }

    setActivitiesError('')

    const result = await supabase
      .from('activities')
      .delete()
      .eq('id', activity.id)

    if (result.error) {
      console.error(
        'Error al eliminar actividad:',
        result.error
      )

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

    if (
      editingActivity &&
      editingActivity.id === activity.id
    ) {
      closeActivityForm()
    }
  }

  if (checkingSession) {
    return (
      <main className="loading-page">
        <span>🇯🇵</span>
        <p>Cargando Japan26...</p>
      </main>
    )
  }
  
  if (passwordRecovery) {
    return (
      <Auth
        initialMode="update-password"
        onPasswordUpdated={
          finishPasswordRecovery
        }
      />
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
          <p className="eyebrow">
            MI VIAJE
          </p>

          <h1>Japón 2026</h1>

          <p>Itinerario de 14 días</p>
        </div>

        <button
          className="logout-button"
          type="button"
          onClick={handleLogout}
        >
          Salir
        </button>
      </header>

      <section className="tabs">
        <button
          className={
            activeTab === 'itinerary'
              ? 'tab active'
              : 'tab'
          }
          type="button"
          onClick={() =>
            changeTab('itinerary')
          }
        >
          Itinerario
        </button>

        <button
          className={
            activeTab === 'cities'
              ? 'tab active'
              : 'tab'
          }
          type="button"
          onClick={() =>
            changeTab('cities')
          }
        >
          Ciudades
        </button>

        <button
          className={
            activeTab === 'reservations'
              ? 'tab active'
              : 'tab'
          }
          type="button"
          onClick={() =>
            changeTab('reservations')
          }
        >
          Reservas
        </button>
      </section>

      {activeTab === 'itinerary' && (
        <Itinerary
          requestedDayId={
            requestedItineraryDayId
          }
          onRequestedDayOpened={() =>
            setRequestedItineraryDayId(null)
          }
        />
      )}

      {activeTab === 'reservations' && (
        <Reservations
          onOpenCity={openCity}
          onOpenItineraryDay={
            openItineraryDay
          }
        />
      )}

      {activeTab === 'cities' &&
        !selectedCity && (
          <section className="content">
            <p className="date">
              DESTINOS DEL VIAJE
            </p>

            <h2>Ciudades</h2>

            <p>
              Los días se calculan automáticamente
              según el itinerario.
            </p>

            {cities.map((city) => (
              <button
                className="card city-card city-button"
                key={city.id}
                type="button"
                onClick={() =>
                  openCity(city.id)
                }
              >
                <span className="city-emoji">
                  {city.emoji}
                </span>

                <div>
                  <span className="city-days">
                    {formatCityDays(
                      city.id,
                      itineraryDays
                    )}
                  </span>

                  <h3>{city.name}</h3>

                  <p>{city.description}</p>
                </div>

                <span className="arrow">
                  ›
                </span>
              </button>
            ))}
          </section>
        )}

      {activeTab === 'cities' &&
        selectedCity && (
          <section className="content">
            <button
              className="back-button"
              type="button"
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
                  {formatCityDays(
                    selectedCity.id,
                    itineraryDays
                  )}
                </p>

                <h2>{selectedCity.name}</h2>
              </div>
            </div>

            <nav className="city-tabs">
              <button
                className={
                  citySection === 'hotel'
                    ? 'selected'
                    : ''
                }
                type="button"
                onClick={() =>
                  changeCitySection('hotel')
                }
              >
                🛏️
                <span>Hotel</span>
              </button>

              <button
                className={
                  citySection === 'places'
                    ? 'selected'
                    : ''
                }
                type="button"
                onClick={() =>
                  changeCitySection('places')
                }
              >
                ⛩️
                <span>Ver y hacer</span>
              </button>

              <button
                className={
                  citySection === 'food'
                    ? 'selected'
                    : ''
                }
                type="button"
                onClick={() =>
                  changeCitySection('food')
                }
              >
                🍜
                <span>Comer y beber</span>
              </button>
            </nav>

            {citySection === 'hotel' && (
              <Hotels
                cityId={selectedCity.id}
                cityName={selectedCity.name}
              />
            )}

            {currentItemType && (
              <section className="city-section">
                <div className="section-heading">
                  <div>
                    <p className="section-label">
                      {currentSection.label.toUpperCase()}
                    </p>

                    <p className="activity-summary">
                      {pendingCount} pendientes ·{' '}
                      {doneCount} hechos
                    </p>
                  </div>

                  <button
                    className="add-button"
                    type="button"
                    onClick={
                      showActivityForm
                        ? closeActivityForm
                        : openNewActivityForm
                    }
                  >
                    {showActivityForm
                      ? 'Cancelar'
                      : '+ Añadir ' +
                        currentSection.singular}
                  </button>
                </div>

                <ActivityFilters
                  cityId={selectedCityId}
                  activityFilter={activityFilter}
                  onActivityFilterChange={
                    setActivityFilter
                  }
                  selectedNeighborhood={
                    selectedNeighborhood
                  }
                  onNeighborhoodChange={
                    setSelectedNeighborhood
                  }
                  onNeighborhoodsChange={
                    handleNeighborhoodsChange
                  }
                  searchText={activitySearchText}
                  onSearchTextChange={
                    setActivitySearchText
                  }
                />

                {showActivityForm && (
                  <form
                    className="place-form"
                    onSubmit={saveActivity}
                    key={
                      editingActivity
                        ? 'edit-activity-' +
                          editingActivity.id
                        : 'new-activity'
                    }
                  >
                    <div className="activity-form-heading">
                      <div>
                        <p className="section-label">
                          {editingActivity
                            ? 'EDITAR ' +
                              currentSection.singular.toUpperCase()
                            : 'NUEVO ' +
                              currentSection.singular.toUpperCase()}
                        </p>

                        <h3>
                          {editingActivity
                            ? editingActivity.name
                            : 'Añadir ' +
                              currentSection.singular}
                        </h3>
                      </div>

                      <button
                        className="form-close-button"
                        type="button"
                        onClick={closeActivityForm}
                        aria-label="Cerrar formulario"
                      >
                        ×
                      </button>
                    </div>

                    <label>
                      Nombre

                      <input
                        name="name"
                        type="text"
                        defaultValue={
                          editingActivity?.name || ''
                        }
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

                        <select
                          name="neighborhood"
                          defaultValue={
                            editingActivity?.neighborhood ||
                            ''
                          }
                        >
                          <option value="">
                            Sin barrio
                          </option>

                          {neighborhoodOptions.map(
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

                        <select
                          name="category"
                          defaultValue={
                            editingActivity?.category ||
                            ''
                          }
                        >
                          <option value="">
                            Sin categoría
                          </option>

                          {currentCategoryOptions.map(
                            (category) => (
                              <option
                                key={category}
                                value={category}
                              >
                                {categoryIcons[category]}{' '}
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
                          defaultValue={
                            editingActivity?.priority ||
                            'medium'
                          }
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
                        defaultValue={
                          editingActivity
                            ?.estimated_duration ||
                          ''
                        }
                        placeholder="Ej. 90"
                      />
                    </label>

                    <label>
                      Descripción

                      <textarea
                        name="description"
                        rows="3"
                        defaultValue={
                          editingActivity
                            ?.description || ''
                        }
                        placeholder="Qué quieres ver o recordar..."
                      />
                    </label>

                    <label>
                      Enlace de Google Maps

                      <input
                        name="link"
                        type="url"
                        defaultValue={
                          editingActivity?.link || ''
                        }
                        placeholder="https://maps.google.com/..."
                      />
                    </label>
                    <label>
                      Enlace de TikTok

                      <input
                        name="tiktok_link"
                        type="url"
                        defaultValue={
                          editingActivity?.tiktok_link || ''
                        }
                        placeholder="https://www.tiktok.com/..."
                      />
                    </label>

                    <button
                      className="save-button"
                      type="submit"
                      disabled={savingActivity}
                    >
                      {savingActivity
                        ? 'Guardando...'
                        : editingActivity
                          ? 'Guardar cambios'
                          : 'Guardar ' +
                            currentSection.singular}
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

                {loadingActivities && (
                  <article className="empty-card">
                    <span>⏳</span>

                    <h3>
                      Cargando información...
                    </h3>
                  </article>
                )}

                {!loadingActivities &&
                  visibleActivities.length === 0 && (
                    <article className="empty-card">
                      <span>
                        {currentSection.icon}
                      </span>

                      <h3>
                        {activitySearchText ||
                        selectedNeighborhood !== 'all'
                          ? 'No hay resultados'
                          : currentSection.emptyTitle}
                      </h3>

                      <p>
                        {activitySearchText ||
                        selectedNeighborhood !== 'all'
                          ? 'Prueba con otra búsqueda o cambia los filtros.'
                          : currentSection.emptyText}
                      </p>
                    </article>
                  )}

                {!loadingActivities &&
                  visibleActivities.map((activity) => {
                    const priority = getPriority(
                      activity.priority
                    )

                    const categoryIcon =
                      getCategoryIcon(
                        activity.category,
                        activity.item_type
                      )

                    return (
                      <article
                        className={
                          activity.done
                            ? 'activity-card activity-done'
                            : 'activity-card'
                        }
                        key={activity.id}
                      >
                        <div className="activity-leading">
                          <span className="category-icon">
                            {categoryIcon}
                          </span>

                          <button
                            className={
                              activity.done
                                ? 'done-button selected'
                                : 'done-button'
                            }
                            type="button"
                            onClick={() =>
                              toggleActivityDone(
                                activity
                              )
                            }
                            aria-label={
                              activity.done
                                ? 'Marcar como pendiente'
                                : 'Marcar como hecho'
                            }
                          >
                            {activity.done
                              ? '✓'
                              : ''}
                          </button>
                        </div>

                        <div className="activity-information">
                          <div className="activity-title-row">
                            <h3>
                              {activity.name}
                            </h3>

                            <span
                              className={
                                'priority-badge priority-' +
                                activity.priority
                              }
                            >
                              {priority.icon}{' '}
                              {priority.label}
                            </span>
                          </div>

                          <div className="activity-metadata">
                            {activity.neighborhood && (
                              <span>
                                📍{' '}
                                {activity.neighborhood}
                              </span>
                            )}

                            {activity.category && (
                              <span>
                                {categoryIcon}{' '}
                                {activity.category}
                              </span>
                            )}

                            {activity.estimated_duration && (
                              <span>
                                ⏱️{' '}
                                {
                                  activity.estimated_duration
                                }{' '}
                                min
                              </span>
                            )}
                          </div>

                          {activity.description && (
                            <p>
                              {activity.description}
                            </p>
                          )}

                              {activity.link && (
                            <a
                              className="activity-icon-link"
                              href={activity.link}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="Abrir en Google Maps"
                              title="Abrir en Google Maps"
                            >
                              <span aria-hidden="true">🗺️</span>
                            </a>
                          )}

                          {activity.tiktok_link && (
                            <a
                              className="activity-icon-link"
                              href={activity.tiktok_link}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="Ver vídeo en TikTok"
                              title="Ver vídeo en TikTok"
                            >
                              <span aria-hidden="true">🎬</span>
                            </a>
                          )}

                          {activity.done && (
                            <button
                              className="restore-button"
                              type="button"
                              onClick={() =>
                                toggleActivityDone(
                                  activity
                                )
                              }
                            >
                              Marcar como pendiente
                            </button>
                          )}
                        </div>

                        <div className="activity-card-actions">
                          <button
                            className="activity-edit-button"
                            type="button"
                            onClick={() =>
                              openEditActivityForm(
                                activity
                              )
                            }
                            aria-label={
                              'Editar ' +
                              activity.name
                            }
                          >
                            ✎
                          </button>

                          <button
                            className="delete-button"
                            type="button"
                            onClick={() =>
                              deleteActivity(
                                activity
                              )
                            }
                            aria-label={
                              'Eliminar ' +
                              activity.name
                            }
                          >
                            ×
                          </button>
                        </div>
                      </article>
                    )
                  })}
              </section>
            )}
          </section>
        )}
    </main>
  )
}

export default App