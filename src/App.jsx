import { useEffect, useState } from 'react'
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
    plans: [
      'Pasear por Shibuya',
      'Visitar Meiji Jingu',
      'Explorar Asakusa',
    ],
  },
  {
    id: 'kyoto',
    emoji: '⛩️',
    name: 'Kioto',
    days: 'Días 5–8',
    description: 'Santuarios, jardines y calles tradicionales.',
    hotel: 'Hotel pendiente de confirmar',
    plans: [
      'Visitar Fushimi Inari',
      'Pasear por Gion',
      'Visitar Kiyomizu-dera',
    ],
  },
  {
    id: 'osaka',
    emoji: '🏯',
    name: 'Osaka',
    days: 'Días 9–11',
    description: 'Castillo, comida callejera y vida nocturna.',
    hotel: 'Hotel pendiente de confirmar',
    plans: [
      'Visitar el castillo de Osaka',
      'Cenar en Dotonbori',
      'Explorar Shinsekai',
    ],
  },
]

function App() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  const [activeTab, setActiveTab] = useState('itinerary')
  const [selectedCityId, setSelectedCityId] = useState(null)
  const [citySection, setCitySection] = useState('hotel')

  const [places, setPlaces] = useState([])
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const [placesError, setPlacesError] = useState('')
  const [showPlaceForm, setShowPlaceForm] = useState(false)
  const [savingPlace, setSavingPlace] = useState(false)

  const selectedCity = cities.find(
    (city) => city.id === selectedCityId
  )

  const selectedCityPlaces = places.filter(
    (place) => place.city === selectedCityId
  )

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
      loadPlaces()
    } else {
      setPlaces([])
    }
  }, [session])

  async function loadPlaces() {
    setLoadingPlaces(true)
    setPlacesError('')

    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error al cargar lugares:', error)

      setPlacesError(
        'No se pudieron cargar los lugares. Comprueba la conexión e inténtalo de nuevo.'
      )
    } else {
      setPlaces(data ?? [])
    }

    setLoadingPlaces(false)
  }

  async function handleLogout() {
    const shouldLogout = window.confirm(
      '¿Quieres cerrar la sesión?'
    )

    if (!shouldLogout) {
      return
    }

    await supabase.auth.signOut()
  }

  function changeTab(tab) {
    setActiveTab(tab)
    setSelectedCityId(null)
    setCitySection('hotel')
    setShowPlaceForm(false)
    setPlacesError('')
  }

  function openCity(cityId) {
    setSelectedCityId(cityId)
    setCitySection('hotel')
    setShowPlaceForm(false)
    setPlacesError('')
  }

  function goBackToCities() {
    setSelectedCityId(null)
    setCitySection('hotel')
    setShowPlaceForm(false)
    setPlacesError('')
  }

  function changeCitySection(section) {
    setCitySection(section)
    setShowPlaceForm(false)
    setPlacesError('')
  }

  async function addPlace(event) {
    event.preventDefault()

    if (!selectedCityId || savingPlace) {
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)

    const name = String(formData.get('name') || '').trim()
    const description = String(
      formData.get('description') || ''
    ).trim()
    const link = String(formData.get('link') || '').trim()

    if (!name) {
      return
    }

    setSavingPlace(true)
    setPlacesError('')

    const { data, error } = await supabase
      .from('places')
      .insert({
        city: selectedCityId,
        name,
        description,
        link,
      })
      .select()
      .single()

    if (error) {
      console.error('Error al guardar el lugar:', error)

      setPlacesError(
        'No se pudo guardar el lugar. Inténtalo de nuevo.'
      )
    } else {
      setPlaces((currentPlaces) => [
        ...currentPlaces,
        data,
      ])

      form.reset()
      setShowPlaceForm(false)
    }

    setSavingPlace(false)
  }

  async function deletePlace(placeId) {
    const shouldDelete = window.confirm(
      '¿Quieres eliminar este lugar?'
    )

    if (!shouldDelete) {
      return
    }

    setPlacesError('')

    const { error } = await supabase
      .from('places')
      .delete()
      .eq('id', placeId)

    if (error) {
      console.error('Error al eliminar el lugar:', error)

      setPlacesError(
        'No se pudo eliminar el lugar. Inténtalo de nuevo.'
      )

      return
    }

    setPlaces((currentPlaces) =>
      currentPlaces.filter(
        (place) => place.id !== placeId
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
          <p className="date">DÍA 1 · TOKIO</p>
          <h2>Llegada a Japón</h2>

          <p>
            Aeropuerto, traslado al hotel y primer paseo por Tokio.
          </p>

          <article className="card">
            <span className="time">10:30</span>

            <div>
              <h3>Llegada al aeropuerto</h3>
              <p>
                Recoger el equipaje y desplazarse hasta el hotel.
              </p>
            </div>
          </article>

          <article className="card">
            <span className="time">15:00</span>

            <div>
              <h3>Check-in en el hotel</h3>
              <p>
                Guardar la dirección y los datos de la reserva.
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
            Pulsa una ciudad para consultar el hotel, los planes,
            los lugares de interés y los restaurantes.
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

          {citySection === 'plans' && (
            <section className="city-section">
              <p className="section-label">
                PLANES
              </p>

              {selectedCity.plans.map((plan, index) => (
                <article
                  className="detail-card"
                  key={plan}
                >
                  <span className="plan-number">
                    {index + 1}
                  </span>

                  <div>
                    <h3>{plan}</h3>
                    <p>
                      Información pendiente de completar.
                    </p>
                  </div>
                </article>
              ))}
            </section>
          )}

          {citySection === 'places' && (
            <section className="city-section">
              <div className="section-heading">
                <p className="section-label">
                  LUGARES DE INTERÉS
                </p>

                <button
                  className="add-button"
                  onClick={() =>
                    setShowPlaceForm((current) => !current)
                  }
                >
                  {showPlaceForm
                    ? 'Cancelar'
                    : '+ Añadir lugar'}
                </button>
              </div>

              {showPlaceForm && (
                <form
                  className="place-form"
                  onSubmit={addPlace}
                >
                  <label>
                    Nombre del lugar

                    <input
                      name="name"
                      type="text"
                      placeholder="Ej. Senso-ji"
                      required
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
                    disabled={savingPlace}
                  >
                    {savingPlace
                      ? 'Guardando...'
                      : 'Guardar lugar'}
                  </button>
                </form>
              )}

              {placesError && (
                <div className="auth-message error">
                  <strong>Ha ocurrido un problema</strong>
                  <p>{placesError}</p>
                </div>
              )}

              {loadingPlaces ? (
                <article className="empty-card">
                  <span>⏳</span>
                  <h3>Cargando lugares...</h3>
                  <p>
                    Estamos consultando la información del viaje.
                  </p>
                </article>
              ) : selectedCityPlaces.length === 0 ? (
                <article className="empty-card">
                  <span>📍</span>

                  <h3>
                    Aún no hay lugares añadidos
                  </h3>

                  <p>
                    Añade templos, barrios, museos y miradores.
                  </p>
                </article>
              ) : (
                selectedCityPlaces.map((place) => (
                  <article
                    className="place-card"
                    key={place.id}
                  >
                    <span className="detail-icon">📍</span>

                    <div className="place-information">
                      <h3>{place.name}</h3>

                      {place.description && (
                        <p>{place.description}</p>
                      )}

                      {place.link && (
                        <a
                          href={place.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir en Google Maps ↗
                        </a>
                      )}
                    </div>

                    <button
                      className="delete-button"
                      onClick={() =>
                        deletePlace(place.id)
                      }
                      aria-label={`Eliminar ${place.name}`}
                    >
                      ×
                    </button>
                  </article>
                ))
              )}
            </section>
          )}

          {citySection === 'food' && (
            <section className="city-section">
              <p className="section-label">
                RESTAURANTES Y COMIDA
              </p>

              <article className="empty-card">
                <span>🍜</span>

                <h3>
                  Aún no hay restaurantes añadidos
                </h3>

                <p>
                  Aquí guardaremos restaurantes y platos
                  que quieras probar.
                </p>
              </article>
            </section>
          )}
        </section>
      )}
    </main>
  )
}

export default App