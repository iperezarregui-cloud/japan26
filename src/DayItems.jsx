import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const manualTypes = [
  {
    value: 'transport',
    label: 'Transporte',
    icon: '🚆',
    supportsBooking: true,
  },
  {
    value: 'accommodation',
    label: 'Alojamiento',
    icon: '🏨',
    supportsBooking: true,
  },
  {
    value: 'food',
    label: 'Comida',
    icon: '🍜',
    supportsBooking: false,
  },
  {
    value: 'note',
    label: 'Nota',
    icon: '📝',
    supportsBooking: false,
  },
  {
    value: 'free_time',
    label: 'Tiempo libre',
    icon: '☕',
    supportsBooking: false,
  },
  {
    value: 'manual',
    label: 'Otra línea',
    icon: '📌',
    supportsBooking: false,
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
    supportsBooking: false,
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
  const [updatingItemId, setUpdatingItemId] = useState(null)

  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
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

  function openNewItemForm() {
    setEditingItem(null)
    setShowItemForm(true)
    setErrorMessage('')
  }

  function openEditItemForm(item) {
    setEditingItem(item)
    setShowItemForm(true)
    setErrorMessage('')
  }

  function closeItemForm() {
    setEditingItem(null)
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
        'El título es obligatorio.'
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

    const selectedType = getManualType(itemType)

    const itemInformation = {
      day_id: day.id,
      activity_id: null,
      item_type: itemType,
      start_time: startTime,
      end_time: endTime,
      title,
      description,
      link,
      position: editingItem
        ? Number(editingItem.position || 0)
        : items.length,
    }

    /*
     * Si una línea deja de ser transporte o alojamiento,
     * eliminamos sus estados de reserva y pago.
     */
    if (!selectedType.supportsBooking) {
      itemInformation.reserved = false
      itemInformation.paid = false
    }

    setSavingItem(true)
    setErrorMessage('')

    let result

    if (editingItem) {
      result = await supabase
        .from('itinerary_items')
        .update(itemInformation)
        .eq('id', editingItem.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('itinerary_items')
        .insert(itemInformation)
        .select()
        .single()
    }

    if (result.error) {
      console.error(
        'Error al guardar la línea:',
        result.error
      )

      setErrorMessage(
        'No se pudo guardar la línea del itinerario.'
      )
    } else {
      if (editingItem) {
        setItems((currentItems) =>
          currentItems.map((item) => {
            if (item.id === editingItem.id) {
              return result.data
            }

            return item
          })
        )
      } else {
        setItems((currentItems) => [
          ...currentItems,
          result.data,
        ])
      }

      form.reset()
      closeItemForm()
    }

    setSavingItem(false)
  }

  async function toggleBookingStatus(item, field) {
    if (updatingItemId !== null) {
      return
    }

    if (
      field !== 'reserved' &&
      field !== 'paid'
    ) {
      return
    }

    const itemType = getManualType(
      item.item_type
    )

    if (!itemType.supportsBooking) {
      return
    }

    const nextValue = !Boolean(item[field])

    setUpdatingItemId(item.id)
    setErrorMessage('')

    /*
     * [field] es una propiedad dinámica.
     *
     * Si field es "reserved", envía:
     * { reserved: true }
     *
     * Si field es "paid", envía:
     * { paid: true }
     */
    const changes = {
      nextValue,
    }

    const result = await supabase
      .from('itinerary_items')
      .update(changes)
      .eq('id', item.id)
      .select()
      .single()

    if (result.error) {
      console.error(
        'Error al actualizar el estado:',
        result.error
      )

      setErrorMessage(
        'No se pudo actualizar el estado.'
      )
    } else {
      setItems((currentItems) =>
        currentItems.map((currentItem) => {
          if (currentItem.id === item.id) {
            return result.data
          }

          return currentItem
        })
      )
    }

    setUpdatingItemId(null)
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

    if (
      editingItem &&
      editingItem.id === item.id
    ) {
      closeItemForm()
    }
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

            const isUpdating =
              updatingItemId === item.id

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
                  <div className="manual-card-heading">
                    <div>
                      <span className="manual-item-type">
                        {itemType.label}
                      </span>

                      <h4>{item.title}</h4>
                    </div>

                    <button
                      className="manual-edit-button"
                      type="button"
                      onClick={() =>
                        openEditItemForm(item)
                      }
                    >
                      Editar
                    </button>
                  </div>

                  {item.description && (
                    <p>{item.description}</p>
                  )}

                  {itemType.supportsBooking && (
                    <div className="booking-statuses">
                      <button
                        className={
                          item.reserved
                            ? 'booking-status selected'
                            : 'booking-status'
                        }
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          toggleBookingStatus(
                            item,
                            'reserved'
                          )
                        }
                      >
                        <span>
                          {item.reserved
                            ? '✓'
                            : '○'}
                        </span>

                        {item.reserved
                          ? 'Reservado'
                          : 'Pendiente de reservar'}
                      </button>

                      <button
                        className={
                          item.paid
                            ? 'booking-status paid selected'
                            : 'booking-status paid'
                        }
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          toggleBookingStatus(
                            item,
                            'paid'
                          )
                        }
                      >
                        <span>
                          {item.paid
                            ? '✓'
                            : '○'}
                        </span>

                        {item.paid
                          ? 'Pagado'
                          : 'Pendiente de pago'}
                      </button>
                    </div>
                  )}

                  {isUpdating && (
                    <p className="booking-updating">
                      Guardando estado...
                    </p>
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
          key={
            editingItem
              ? 'edit-' + editingItem.id
              : 'new-item'
          }
        >
          <div className="manual-item-form-heading">
            <div>
              <p className="section-label">
                {editingItem
                  ? 'EDITAR LÍNEA'
                  : 'AÑADIR AL DÍA ' +
                    day.day_number}
              </p>

              <h4>
                {editingItem
                  ? editingItem.title
                  : 'Nueva línea'}
              </h4>
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
              defaultValue={
                editingItem
                  ? editingItem.item_type
                  : 'transport'
              }
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
              defaultValue={
                editingItem
                  ? editingItem.title
                  : ''
              }
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
                defaultValue={
                  editingItem &&
                  editingItem.start_time
                    ? editingItem.start_time.slice(
                        0,
                        5
                      )
                    : ''
                }
              />
            </label>

            <label>
              Hora de fin

              <input
                name="end_time"
                type="time"
                defaultValue={
                  editingItem &&
                  editingItem.end_time
                    ? editingItem.end_time.slice(
                        0,
                        5
                      )
                    : ''
                }
              />
            </label>
          </div>

          <label>
            Detalles

            <textarea
              name="description"
              rows="3"
              defaultValue={
                editingItem
                  ? editingItem.description || ''
                  : ''
              }
              placeholder="Número de tren, asiento, reserva, indicaciones..."
            />
          </label>

          <label>
            Enlace opcional

            <input
              name="link"
              type="url"
              defaultValue={
                editingItem
                  ? editingItem.link || ''
                  : ''
              }
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
              : editingItem
                ? 'Guardar cambios'
                : 'Añadir al itinerario'}
          </button>
        </form>
      )}

      {!showItemForm && (
        <button
          className="secondary-action-button active"
          type="button"
          onClick={openNewItemForm}
        >
          + Añadir al día
        </button>
      )}
    </div>
  )
}

export default DayItems