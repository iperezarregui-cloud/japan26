import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const manualTypes = [
  {
    value: 'transport',
    label: 'Transporte',
    icon: '🚆',
  },
  {
    value: 'accommodation',
    label: 'Alojamiento',
    icon: '🏨',
  },
  {
    value: 'food',
    label: 'Comida',
    icon: '🍜',
  },
  {
    value: 'note',
    label: 'Nota',
    icon: '📝',
  },
  {
    value: 'free_time',
    label: 'Tiempo libre',
    icon: '☕',
  },
  {
    value: 'manual',
    label: 'Otra línea',
    icon: '📌',
  },
]

function getManualType(type) {
  const selectedType = manualTypes.find(
    (manualType) => manualType.value === type
  )

  if (selectedType) {
    return selectedType
  }

  return {
    value: type,
    label: 'Otra línea',
    icon: '📌',
  }
}

function formatTime(time) {
  if (!time) {
    return 'Sin hora'
  }

  return time.slice(0, 5)
}

function DayItems({ day }) {
  const [items, setItems] = useState([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [savingItem, setSavingItem] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const sortedItems = useMemo(() => {
    return [...items].sort((first, second) => {
      const firstTime =
        first.start_time || '99:99:99'

      const secondTime =
        second.start_time || '99:99:99'

      if (firstTime !== secondTime) {
        return firstTime.localeCompare(secondTime)
      }

      return (
        Number(first.position || 0) -
        Number(second.position || 0)
      )
    })
  }, [items])

  useEffect(() => {
    loadItems()
  }, [day.id])

  async function loadItems() {
    setLoadingItems(true)
    setErrorMessage('')

    const result = await supabase
      .from('itinerary_items')
      .select('*')
      .eq('day_id', day.id)
      .order('start_time', {
        ascending: true,
        nullsFirst: false,
      })
      .order('position', {
        ascending: true,
      })

    if (result.error) {
      console.error(
        'Error al cargar las líneas:',
        result.error
      )

      setErrorMessage(
        'No se pudieron cargar las líneas de este día.'
      )
    } else {
      setItems(result.data || [])
    }

    setLoadingItems(false)
  }

  function openItemForm() {
    setShowItemForm(true)
    setErrorMessage('')
  }

  function closeItemForm() {
    setShowItemForm(false)
    setErrorMessage('')
  }

  async function saveItem(event) {
    event.preventDefault()

    if (savingItem) {
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)

    const itemType = String(
      formData.get('item_type') || 'manual'
    )

    const title = String(
      formData.get('title') || ''
    ).trim()

    const description = String(
      formData.get('description') || ''
    ).trim()

    const link = String(
      formData.get('link') || ''
    ).trim()

    const startTimeValue = String(
      formData.get('start_time') || ''
    )

    const endTimeValue = String(
      formData.get('end_time') || ''
    )

    const startTime = startTimeValue || null
    const endTime = endTimeValue || null

    if (!title) {
      setErrorMessage(
        'El título de la línea es obligatorio.'
      )

      return
    }

    if (
      startTime &&
      endTime &&
      endTime < startTime
    ) {
      setErrorMessage(
        'La hora de fin no puede ser anterior a la hora de inicio.'
      )

      return
    }

    const itemInformation = {
      day_id: day.id,
      activity_id: null,
      item_type: itemType,
      start_time: startTime,
      end_time: endTime,
      title,
      description,
      link,
      position: items.length,
    }

    setSavingItem(true)
    setErrorMessage('')

    const result = await supabase
      .from('itinerary_items')
      .insert(itemInformation)
      .select()
      .single()

    if (result.error) {
      console.error(
        'Error al guardar la línea:',
        result.error
      )

      setErrorMessage(
        'No se pudo añadir la línea al itinerario.'
      )
    } else {
      setItems((currentItems) => [
        ...currentItems,
        result.data,
      ])

      form.reset()
      closeItemForm()
    }

    setSavingItem(false)
  }

  async function deleteItem(item) {
    const shouldDelete = window.confirm(
      '¿Quieres eliminar “' +
        item.title +
        '” del itinerario?'
    )

    if (!shouldDelete) {
      return
    }

    setErrorMessage('')

    const result = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', item.id)

    if (result.error) {
      console.error(
        'Error al eliminar la línea:',
        result.error
      )

      setErrorMessage(
        'No se pudo eliminar la línea.'
      )

      return
    }

    setItems((currentItems) =>
      currentItems.filter(
        (currentItem) =>
          currentItem.id !== item.id
      )
    )
  }

  function openItemLink(link) {
    if (!link) {
      return
    }

    window.open(
      link,
      '_blank',
      'noopener,noreferrer'
    )
  }

  if (loadingItems) {
    return (
      <div className="manual-items-loading">
        <span>⏳</span>
        <p>Cargando detalle horario...</p>
      </div>
    )
  }

  return (
    <div className="manual-day-items">
      {errorMessage && (
        <div className="auth-message error manual-items-error">
          <strong>
            Ha ocurrido un problema
          </strong>

          <p>{errorMessage}</p>
        </div>
      )}

      {sortedItems.length === 0 &&
        !showItemForm && (
          <div className="itinerary-no-items">
            <span>🕒</span>

            <div>
              <h4>
                Todavía no hay líneas horarias
              </h4>

              <p>
                Añade transportes, alojamientos,
                comidas, notas o tiempo libre.
              </p>
            </div>
          </div>
        )}

      {sortedItems.length > 0 && (
        <div className="manual-timeline">
          {sortedItems.map((item) => {
            const itemType = getManualType(
              item.item_type
            )

            return (
              <article
                className="manual-timeline-item"
                key={item.id}
              >
                <div className="manual-timeline-time">
                  <strong>
                    {formatTime(
                      item.start_time
                    )}
                  </strong>

                  {item.end_time && (
                    <small>
                      hasta{' '}
                      {formatTime(
                        item.end_time
                      )}
                    </small>
                  )}
                </div>

                <div className="manual-timeline-marker">
                  <span>{itemType.icon}</span>
                </div>

                <div className="manual-timeline-card">
                  <span className="manual-item-type">
                    {itemType.label}
                  </span>

                  <h4>{item.title}</h4>

                  {item.description && (
                    <p>{item.description}</p>
                  )}

                  {item.link && (
                    <button
                      className="manual-link-button"
                      type="button"
                      onClick={() =>
                        openItemLink(item.link)
                      }
                    >
                      Abrir enlace ↗
                    </button>
                  )}

                  <button
                    className="manual-delete-button"
                    type="button"
                    onClick={() =>
                      deleteItem(item)
                    }
                  >
                    Eliminar del día
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {showItemForm && (
        <form
          className="manual-item-form"
          onSubmit={saveItem}
        >
          <div className="manual-item-form-heading">
            <div>
              <p className="section-label">
                AÑADIR AL DÍA{' '}
                {day.day_number}
              </p>

              <h4>Nueva línea</h4>
            </div>

            <button
              className="form-close-button"
              type="button"
              onClick={closeItemForm}
              aria-label="Cerrar formulario"
            >
              ×
            </button>
          </div>

          <label>
            Tipo de línea

            <select
              name="item_type"
              defaultValue="transport"
            >
              {manualTypes.map((type) => (
                <option
                  key={type.value}
                  value={type.value}
                >
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Título

            <input
              name="title"
              type="text"
              placeholder="Ej. Shinkansen Tokio → Kioto"
              required
            />
          </label>

          <div className="manual-time-grid">
            <label>
              Hora de inicio

              <input
                name="start_time"
                type="time"
              />
            </label>

            <label>
              Hora de fin

              <input
                name="end_time"
                type="time"
              />
            </label>
          </div>

          <label>
            Detalles

            <textarea
              name="description"
              rows="3"
              placeholder="Número de tren, asiento, reserva, indicaciones..."
            />
          </label>

          <label>
            Enlace opcional

            <input
              name="link"
              type="url"
              placeholder="Billete, reserva o Google Maps"
            />
          </label>

          <button
            className="save-button"
            type="submit"
            disabled={savingItem}
          >
            {savingItem
              ? 'Guardando...'
              : 'Añadir al itinerario'}
          </button>
        </form>
      )}

      {!showItemForm && (
        <button
          className="secondary-action-button active"
          type="button"
          onClick={openItemForm}
        >
          + Añadir al día
        </button>
      )}
    </div>
  )
}

export default DayItems