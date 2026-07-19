import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import DayItems from './DayItems'

const itineraryCities = [
  {
    value: 'tokyo',
    label: 'Tokio',
    emoji: '🗼',
  },
  {
    value: 'kyoto',
    label: 'Kioto',
    emoji: '⛩️',
  },
  {
    value: 'osaka',
    label: 'Osaka',
    emoji: '🏯',
  },
  {
    value: 'kobe',
    label: 'Kobe',
    emoji: '🥩',
  },
  {
    value: 'hiroshima',
    label: 'Hiroshima',
    emoji: '🕊️',
  },
  {
    value: 'miyajima',
    label: 'Miyajima',
    emoji: '⛩️',
  },
  {
    value: 'nara',
    label: 'Nara',
    emoji: '🦌',
  },
  {
    value: 'hakone',
    label: 'Hakone',
    emoji: '🗻',
  },
  {
    value: 'other',
    label: 'Otra',
    emoji: '📍',
  },
]

function getCityInformation(cityId) {
  const selectedCity = itineraryCities.find(
    (city) => city.value === cityId
  )

  if (selectedCity) {
    return selectedCity
  }

  return {
    value: cityId || '',
    label: cityId || 'Sin ciudad',
    emoji: '📍',
  }
}

function formatTravelDate(dateValue) {
  if (!dateValue) {
    return 'Fecha pendiente'
  }

  const travelDate = new Date(
    dateValue + 'T12:00:00'
  )

  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(travelDate)
}

function Itinerary() {
  const [days, setDays] = useState([])
  const [expandedDays, setExpandedDays] =
    useState([])

  const [loadingDays, setLoadingDays] =
    useState(true)

  const [savingDay, setSavingDay] =
    useState(false)

  const [showDayForm, setShowDayForm] =
    useState(false)

  const [editingDay, setEditingDay] =
    useState(null)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    loadDays()
  }, [])

  async function loadDays() {
    setLoadingDays(true)
    setErrorMessage('')

    const result = await supabase
      .from('itinerary_days')
      .select('*')
      .order('day_number', {
        ascending: true,
      })

    if (result.error) {
      console.error(
        'Error al cargar el itinerario:',
        result.error
      )

      setErrorMessage(
        'No se pudo cargar el itinerario.'
      )
    } else {
      const loadedDays = result.data || []

      setDays(loadedDays)

      if (loadedDays.length > 0) {
        setExpandedDays([
          loadedDays[0].id,
        ])
      }
    }

    setLoadingDays(false)
  }

  function toggleDay(dayId) {
    setExpandedDays((currentDays) => {
      const isExpanded =
        currentDays.includes(dayId)

      if (isExpanded) {
        return currentDays.filter(
          (currentDayId) =>
            currentDayId !== dayId
        )
      }

      return [
        ...currentDays,
        dayId,
      ]
    })
  }

  function getNextDayNumber() {
    if (days.length === 0) {
      return 1
    }

    const dayNumbers = days.map(
      (day) => day.day_number
    )

    return Math.max(...dayNumbers) + 1
  }

  function openNewDayForm() {
    setEditingDay(null)
    setShowDayForm(true)
    setErrorMessage('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function openEditDayForm(day) {
    setEditingDay(day)
    setShowDayForm(true)
    setErrorMessage('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function closeDayForm() {
    setEditingDay(null)
    setShowDayForm(false)
    setErrorMessage('')
  }

  async function saveDay(event) {
    event.preventDefault()

    if (savingDay) {
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)

    const dayNumber = Number(
      formData.get('day_number')
    )

    const travelDate = String(
      formData.get('travel_date') || ''
    )

    const city = String(
      formData.get('city') || ''
    ).trim()

    const title = String(
      formData.get('title') || ''
    ).trim()

    const summary = String(
      formData.get('summary') || ''
    ).trim()

    if (!dayNumber || !title) {
      setErrorMessage(
        'El número de día y el título son obligatorios.'
      )

      return
    }

    const dayInformation = {
      day_number: dayNumber,
      travel_date: travelDate || null,
      city: city || null,
      title,
      summary,
    }

    setSavingDay(true)
    setErrorMessage('')

    let result

    if (editingDay) {
      result = await supabase
        .from('itinerary_days')
        .update(dayInformation)
        .eq('id', editingDay.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('itinerary_days')
        .insert(dayInformation)
        .select()
        .single()
    }

    if (result.error) {
      console.error(
        'Error al guardar el día:',
        result.error
      )

      if (result.error.code === '23505') {
        setErrorMessage(
          'Ya existe un día con ese número.'
        )
      } else {
        setErrorMessage(
          'No se pudo guardar el día.'
        )
      }

      setSavingDay(false)
      return
    }

    const savedDay = result.data

    setDays((currentDays) => {
      let updatedDays

      if (editingDay) {
        updatedDays = currentDays.map(
          (day) => {
            if (day.id === savedDay.id) {
              return savedDay
            }

            return day
          }
        )
      } else {
        updatedDays = [
          ...currentDays,
          savedDay,
        ]
      }

      return updatedDays.sort(
        (firstDay, secondDay) =>
          firstDay.day_number -
          secondDay.day_number
      )
    })

    setExpandedDays((currentDays) => {
      if (
        currentDays.includes(savedDay.id)
      ) {
        return currentDays
      }

      return [
        ...currentDays,
        savedDay.id,
      ]
    })

    form.reset()
    setSavingDay(false)
    closeDayForm()
  }

  async function deleteDay(day) {
    const shouldDelete = window.confirm(
      '¿Quieres eliminar el Día ' +
        day.day_number +
        ': “' +
        day.title +
        '”? Todas sus líneas también se eliminarán.'
    )

    if (!shouldDelete) {
      return
    }

    setErrorMessage('')

    const result = await supabase
      .from('itinerary_days')
      .delete()
      .eq('id', day.id)

    if (result.error) {
      console.error(
        'Error al eliminar el día:',
        result.error
      )

      setErrorMessage(
        'No se pudo eliminar el día.'
      )

      return
    }

    setDays((currentDays) =>
      currentDays.filter(
        (currentDay) =>
          currentDay.id !== day.id
      )
    )

    setExpandedDays((currentDays) =>
      currentDays.filter(
        (currentDayId) =>
          currentDayId !== day.id
      )
    )
  }

  if (loadingDays) {
    return (
      <section className="content">
        <article className="itinerary-empty">
          <span>⏳</span>

          <h2>Cargando itinerario...</h2>

          <p>
            Recuperando los días guardados en
            Supabase.
          </p>
        </article>
      </section>
    )
  }

  return (
    <section className="itinerary-page">
      <div className="itinerary-heading">
        <div>
          <p className="date">
            VIAJE A JAPÓN
          </p>

          <h2>Itinerario</h2>

          <p>
            Organiza el viaje por días y despliega
            cada jornada para consultar el detalle
            horario.
          </p>
        </div>

        <button
          className="add-button itinerary-add-day"
          type="button"
          onClick={
            showDayForm
              ? closeDayForm
              : openNewDayForm
          }
        >
          {showDayForm
            ? 'Cancelar'
            : '+ Añadir día'}
        </button>
      </div>

      {showDayForm && (
        <form
          className="day-form"
          onSubmit={saveDay}
        >
          <div className="day-form-heading">
            <div>
              <p className="section-label">
                {editingDay
                  ? 'EDITAR DÍA'
                  : 'NUEVO DÍA'}
              </p>

              <h3>
                {editingDay
                  ? 'Día ' +
                    editingDay.day_number
                  : 'Añadir al itinerario'}
              </h3>
            </div>

            <button
              className="form-close-button"
              type="button"
              onClick={closeDayForm}
              aria-label="Cerrar formulario"
            >
              ×
            </button>
          </div>

          <div className="day-form-grid">
            <label>
              Número de día

              <input
                name="day_number"
                type="number"
                min="1"
                max="99"
                defaultValue={
                  editingDay
                    ? editingDay.day_number
                    : getNextDayNumber()
                }
                required
              />
            </label>

            <label>
              Fecha

              <input
                name="travel_date"
                type="date"
                defaultValue={
                  editingDay &&
                  editingDay.travel_date
                    ? editingDay.travel_date
                    : ''
                }
              />
            </label>
          </div>

          <label>
            Ciudad

            <select
              name="city"
              defaultValue={
                editingDay &&
                editingDay.city
                  ? editingDay.city
                  : ''
              }
            >
              <option value="">
                Seleccionar ciudad
              </option>

              {itineraryCities.map(
                (cityOption) => (
                  <option
                    key={cityOption.value}
                    value={cityOption.value}
                  >
                    {cityOption.emoji}{' '}
                    {cityOption.label}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Título del día

            <input
              name="title"
              type="text"
              defaultValue={
                editingDay
                  ? editingDay.title
                  : ''
              }
              placeholder="Ej. Kobe y traslado a Hiroshima"
              required
            />
          </label>

          <label>
            Resumen

            <textarea
              name="summary"
              rows="3"
              defaultValue={
                editingDay
                  ? editingDay.summary || ''
                  : ''
              }
              placeholder="Resumen de la jornada..."
            />
          </label>

          <button
            className="save-button"
            type="submit"
            disabled={savingDay}
          >
            {savingDay
              ? 'Guardando...'
              : editingDay
                ? 'Guardar cambios'
                : 'Crear día'}
          </button>
        </form>
      )}

      {errorMessage && (
        <div className="auth-message error itinerary-error">
          <strong>
            Ha ocurrido un problema
          </strong>

          <p>{errorMessage}</p>
        </div>
      )}

      {days.length === 0 && (
        <article className="itinerary-empty">
          <span>🗓️</span>

          <h2>
            El itinerario está vacío
          </h2>

          <p>
            Crea el primer día para empezar a
            organizar el viaje.
          </p>

          <button
            className="add-button"
            type="button"
            onClick={openNewDayForm}
          >
            + Crear el Día 1
          </button>
        </article>
      )}

      {days.length > 0 && (
        <div className="itinerary-days">
          {days.map((day) => {
            const isExpanded =
              expandedDays.includes(day.id)

            const cityInformation =
              getCityInformation(day.city)

            return (
              <article
                className={
                  isExpanded
                    ? 'itinerary-day expanded'
                    : 'itinerary-day'
                }
                key={day.id}
              >
                <button
                  className="itinerary-day-header"
                  type="button"
                  onClick={() =>
                    toggleDay(day.id)
                  }
                  aria-expanded={
                    isExpanded
                  }
                >
                  <span className="itinerary-day-number">
                    <small>DÍA</small>

                    <strong>
                      {day.day_number}
                    </strong>
                  </span>

                  <span className="itinerary-day-main">
                    <span className="itinerary-day-meta">
                      <span>
                        {formatTravelDate(
                          day.travel_date
                        )}
                      </span>

                      <span>•</span>

                      <span>
                        {cityInformation.emoji}{' '}
                        {cityInformation.label}
                      </span>
                    </span>

                    <strong className="itinerary-day-title">
                      {day.title}
                    </strong>

                    {!isExpanded &&
                      day.summary && (
                        <span className="itinerary-day-preview">
                          {day.summary}
                        </span>
                      )}
                  </span>

                  <span className="itinerary-chevron">
                    {isExpanded
                      ? '▲'
                      : '▼'}
                  </span>
                </button>

                {isExpanded && (
                  <div className="itinerary-day-content">
                    {day.summary && (
                      <p className="itinerary-day-summary">
                        {day.summary}
                      </p>
                    )}

                    <DayItems day={day} />

                    <div className="itinerary-day-actions">
                      <button
                        className="edit-day-button"
                        type="button"
                        onClick={() =>
                          openEditDayForm(day)
                        }
                      >
                        Editar día
                      </button>

                      <button
                        className="delete-day-button"
                        type="button"
                        onClick={() =>
                          deleteDay(day)
                        }
                      >
                        Eliminar día
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default Itinerary