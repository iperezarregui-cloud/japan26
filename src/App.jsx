import { useState } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('itinerary')
  const [selectedCity, setSelectedCity] = useState(null)
  const [citySection, setCitySection] = useState('hotel')

  const cities = [
    {
      id: 1,
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
      id: 2,
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
      id: 3,
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

  function changeTab(tab) {
    setActiveTab(tab)
    setSelectedCity(null)
    setCitySection('hotel')
  }

  function openCity(city) {
    setSelectedCity(city)
    setCitySection('hotel')
  }

  function goBackToCities() {
    setSelectedCity(null)
    setCitySection('hotel')
  }

  return (
    <main className="app">
      <header className="header">
        <span className="flag">🇯🇵</span>

        <div>
          <p className="eyebrow">MI VIAJE</p>
          <h1>Japón 2026</h1>
          <p>Itinerario de 14 días</p>
        </div>
      </header>

      <section className="tabs">
        <button
          className={`tab ${activeTab === 'itinerary' ? 'active' : ''}`}
          onClick={() => changeTab('itinerary')}
        >
          Itinerario
        </button>

        <button
          className={`tab ${activeTab === 'cities' ? 'active' : ''}`}
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
              onClick={() => openCity(city)}
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
              onClick={() => setCitySection('hotel')}
            >
              🛏️
              <span>Hotel</span>
            </button>

            <button
              className={
                citySection === 'plans' ? 'selected' : ''
              }
              onClick={() => setCitySection('plans')}
            >
              ✨
              <span>Planes</span>
            </button>

            <button
              className={
                citySection === 'places' ? 'selected' : ''
              }
              onClick={() => setCitySection('places')}
            >
              ⛩️
              <span>Lugares</span>
            </button>

            <button
              className={
                citySection === 'food' ? 'selected' : ''
              }
              onClick={() => setCitySection('food')}
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
              <p className="section-label">
                LUGARES DE INTERÉS
              </p>

              <article className="empty-card">
                <span>📍</span>

                <h3>
                  Aún no hay lugares añadidos
                </h3>

                <p>
                  Aquí guardaremos templos, barrios,
                  museos y miradores.
                </p>
              </article>
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
                  Aquí guardaremos restaurantes y
                  platos que quieras probar.
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