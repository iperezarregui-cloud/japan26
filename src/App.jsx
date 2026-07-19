import './App.css'

function App() {
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
        <button className="tab active">Itinerario</button>
        <button className="tab">Ciudades</button>
      </section>

      <section className="content">
        <p className="date">DÍA 1 · TOKIO</p>
        <h2>Llegada a Japón</h2>
        <p>Aeropuerto, traslado al hotel y primer paseo por Tokio.</p>

        <article className="card">
          <span className="time">10:30</span>

          <div>
            <h3>Llegada al aeropuerto</h3>
            <p>Recoger el equipaje y desplazarse hasta el hotel.</p>
          </div>
        </article>

        <article className="card">
          <span className="time">15:00</span>

          <div>
            <h3>Check-in en el hotel</h3>
            <p>Guardar la dirección y los datos de la reserva.</p>
          </div>
        </article>
      </section>
    </main>
  )
}

export default App