import { useState } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('itinerary')

  const cities = [
    {
      id: 1,
      emoji: '🗼',
      name: 'Tokio',
      days: 'Días 1–4',
      description: 'Barrios, templos, miradores y gastronomía.',
    },
    {
      id: 2,
      emoji: '⛩️',
      name: 'Kioto',
      days: 'Días 5–8',
      description: 'Santuarios, jardines y calles tradicionales.',
    },
    {
      id: 3,
      emoji: '🏯',
      name: 'Osaka',
      days: 'Días 9–11',
      description: 'Castillo, comida callejera y vida nocturna.',
    },
  ]

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
          onClick={() => setActiveTab('itinerary')}
        >
          Itinerario
        </button>

        <button
          className={`tab ${activeTab === 'cities' ? 'active' : ''}`}
          onClick={() => setActiveTab('cities')}
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

      {activeTab === 'cities' && (
        <section className="content">
          <p className="date">DESTINOS DEL VIAJE</p>
          <h2>Ciudades</h2>

          <p>
            Consulta los hoteles, planes y lugares de interés de cada ciudad.
          </p>

          {cities.map((city) => (
            <article className="card city-card" key={city.id}>
              <span className="city-emoji">{city.emoji}</span>

              <div>
                <span className="city-days">{city.days}</span>
                <h3>{city.name}</h3>
                <p>{city.description}</p>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

export default App
