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

const priorityInformation = {
  essential: {
    label: 'Imprescindible',
    icon: '🔴',
  },
  high: {
    label: 'Alta',
    icon: '🟠',
  },
  medium: {
    label: 'Media',
    icon: '🟡',
  },
  low: {
    label: 'Baja',
    icon: '⚪',
  },
}

const activityTypeInformation = {
  plan: {
    label: 'Plan',
    icon: '✨',
  },
  place: {
    label: 'Lugar',
    icon: '📍',
  },
  food: {
    label: 'Comer',
    icon: '🍜',
  },
}

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

function getActivityType(type) {
  return (
    activityTypeInformation[type] || {
      label: 'Actividad',
      icon: '✨',
    }
  )
}

function getPriority(priority) {
  return (
    priorityInformation[priority] ||
    priorityInformation.medium
  )
}

function formatTime(time) {
  if (!time) {
    return 'Sin hora'
  }

  return time.slice(0, 5)
}

function DayItems({ day }) {
  const [items, setItems] = useState([])
  const [activities, setActivities] = useState([])

  const [loadingItems, setLoadingItems] = useState(true)
  const [savingItem, setSavingItem] = useState(false)
  const [updatingItemId, setUpdatingItemId] =
    useState(null)

  const [showItemForm, setShowItemForm] =
    useState(false)

  const [editingItem, setEditingItem] =
    useState(null)

  const [entryMode, setEntryMode] =
    useState('manual')

  const [selectedActivity, setSelectedActivity] =
    useState(null)

  const [activityDetails, setActivityDetails] =
    useState(null)

  const [errorMessage, setErrorMessage] =
    useState('')

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

  const availableActivities = useMemo(() => {
    return [...activities].sort((first, second) => {
      const firstSameCity =
        first.city === day.city ? 0 : 1

      const secondSameCity =
        second.city === day.city ? 0 : 1

      if (firstSameCity !== secondSameCity) {
        return firstSameCity - secondSameCity
      }

      const priorityOrder = {
        essential: 1,
        high: 2,
        medium: 3,
        low: 4,
      }

      const firstPriority =
        priorityOrder[first.priority] || 3

      const secondPriority =
        priorityOrder[second.priority] || 3

      if (firstPriority !== secondPriority) {
        return firstPriority - secondPriority
      }

      return first.name.localeCompare(second.name)
    })
  }, [activities, day.city])

  useEffect(() => {
    loadInformation()
  }, [day.id])

  async function loadInformation() {
    setLoadingItems(true)
    setErrorMessage('')

    const [itemsResult, activitiesResult] =
      await Promise.all([
        supabase
          .from('itinerary_items')
          .select('*')
          .eq('day_id', day.id)
          .order('start_time', {
            ascending: true,
            nullsFirst: false,
          })
          .order('position', {
            ascending: true,
          }),

        supabase
          .from('activities')
          .select('*')
          .order('name', {
            ascending: true,
          }),
      ])

    if (itemsResult.error) {
      console.error(itemsResult.error)

      setErrorMessage(
        'No se pudieron cargar las líneas de este día.'
      )
    } else {
      setItems(itemsResult.data || [])
    }

    if (activitiesResult.error) {
      console.error(activitiesResult.error)

      setErrorMessage(
        'No se pudieron cargar las actividades.'
      )
    } else {
      setActivities(activitiesResult.data || [])
    }

    setLoadingItems(false)
  }

  function getLinkedActivity(activityId) {
    if (!activityId) {
      return null
    }

    return (
      activities.find(
        (activity) => activity.id === activityId
      ) || null
    )
  }

  function openNewItemForm() {
    setEditingItem(null)
    setEntryMode('manual')
    setSelectedActivity(null)
    setShowItemForm(true)
    setErrorMessage('')
  }

  function openEditItemForm(item) {
    setEditingItem(item)

    if (
      item.item_type === 'activity' &&
      item.activity_id
    ) {
      setEntryMode('activity')
      setSelectedActivity(
        getLinkedActivity(item.activity_id)
      )
    } else {
      setEntryMode('manual')
      setSelectedActivity(null)
    }

    setShowItemForm(true)
    setErrorMessage('')
  }

  function closeItemForm() {
    setEditingItem(null)
    setSelectedActivity(null)
    setEntryMode('manual')
    setShowItemForm(false)
    setErrorMessage('')
  }

  function changeEntryMode(mode) {
    setEntryMode(mode)
    setEditingItem(null)
    setSelectedActivity(null)
    setErrorMessage('')
  }

  function handleActivitySelection(event) {
    const activityId = Number(event.target.value)

    const activity =
      getLinkedActivity(activityId)

    setSelectedActivity(activity)
  }

  async function saveItem(event) {
    event.preventDefault()

    if (savingItem) {
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)

    const startTimeValue = String(
      formData.get('start_time') || ''
    )

    const endTimeValue = String(
      formData.get('end_time') || ''
    )

    const startTime = startTimeValue || null
    const endTime = endTimeValue || null

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

    let itemInformation

    if (entryMode === 'activity') {
      const activityId = Number(
        formData.get('activity_id')
      )

      const activity =
        getLinkedActivity(activityId)

      if (!activityId || !activity) {
        setErrorMessage(
          'Selecciona una actividad.'
        )
        return
      }

      itemInformation = {
        day_id: day.id,
        activity_id: activity.id,
        item_type: 'activity',
        start_time: startTime,
        end_time: endTime,
        title: activity.name,
        description: String(
          formData.get('activity_note') || ''
        ).trim(),
        link: activity.link || '',
        position: editingItem
          ? Number(editingItem.position || 0)
          : items.length,
        reserved: false,
        paid: false,
      }
    } else {
      const itemType = String(
        formData.get('item_type') || 'manual'
      )

      const title = String(
        formData.get('title') || ''
      ).trim()

      if (!title) {
        setErrorMessage(
          'El título es obligatorio.'
        )
        return
      }

      const selectedType =
        getManualType(itemType)

      itemInformation = {
        day_id: day.id,
        activity_id: null,
        item_type: itemType,
        start_time: startTime,
        end_time: endTime,
        title,
        description: String(
          formData.get('description') || ''
        ).trim(),
        link: String(
          formData.get('link') || ''
        ).trim(),
        position: editingItem
          ? Number(editingItem.position || 0)
          : items.length,
      }

      if (!selectedType.supportsBooking) {
        itemInformation.reserved = false
        itemInformation.paid = false
      }
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
      console.error(result.error)

      setErrorMessage(
        'No se pudo guardar la línea: ' +
          result.error.message
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

    const itemType =
      getManualType(item.item_type)

    if (!itemType.supportsBooking) {
      return
    }

    const nextValue = !Boolean(item[field])

    let changes

    if (field === 'reserved') {
      changes = {
        reserved: nextValue,
      }
    } else {
      changes = {
        paid: nextValue,
      }
    }

    setUpdatingItemId(item.id)
    setErrorMessage('')

    const result = await supabase
      .from('itinerary_items')
      .update(changes)
      .eq('id', item.id)
      .select()
      .single()

    if (result.error) {
      console.error(result.error)

      setErrorMessage(
        'No se pudo actualizar el estado: ' +
          result.error.message
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
    const linkedActivity =
      getLinkedActivity(item.activity_id)

    const itemTitle =
      linkedActivity?.name ||
      item.title ||
      'esta línea'

    const shouldDelete = window.confirm(
      '¿Quieres eliminar “' +
        itemTitle +
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
      console.error(result.error)

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

  function openExternalLink(link) {
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
                Añade una actividad existente o una
                línea manual.
              </p>
            </div>
          </div>
        )}

      {sortedItems.length > 0 && (
        <div className="manual-timeline">
          {sortedItems.map((item) => {
            const linkedActivity =
              getLinkedActivity(
                item.activity_id
              )

            const isActivity =
              item.item_type === 'activity' &&
              linkedActivity

            const manualType =
              getManualType(item.item_type)

            const activityType = isActivity
              ? getActivityType(
                  linkedActivity.item_type
                )
              : null

            const priority = isActivity
              ? getPriority(
                  linkedActivity.priority
                )
              : null

            const title = isActivity
              ? linkedActivity.name
              : item.title

            const icon = isActivity
              ? activityType.icon
              : manualType.icon

            const supportsBooking =
              !isActivity &&
              manualType.supportsBooking

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
                  <span>{icon}</span>
                </div>

                <div className="manual-timeline-card">
                  <div className="manual-card-heading">
                    <button
                      className={
                        isActivity
                          ? 'linked-activity-heading'
                          : 'manual-heading-static'
                      }
                      type="button"
                      onClick={() => {
                        if (isActivity) {
                          setActivityDetails(
                            linkedActivity
                          )
                        }
                      }}
                    >
                      <span className="manual-item-type">
                        {isActivity
                          ? activityType.label
                          : manualType.label}
                      </span>

                      <h4>{title}</h4>

                      {isActivity && (
                        <span className="linked-activity-open">
                          Ver detalles ›
                        </span>
                      )}
                    </button>

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

                  {isActivity && (
                    <div className="linked-activity-meta">
                      <span>
                        {priority.icon}{' '}
                        {priority.label}
                      </span>

                      {linkedActivity.category && (
                        <span>
                          {linkedActivity.category}
                        </span>
                      )}

                      {linkedActivity.estimated_duration && (
                        <span>
                          ⏱️{' '}
                          {
                            linkedActivity.estimated_duration
                          }{' '}
                          min
                        </span>
                      )}
                    </div>
                  )}

                  {item.description && (
                    <p>{item.description}</p>
                  )}

                  {supportsBooking && (
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
                        {item.reserved
                          ? '✓ Reservado'
                          : '○ Pendiente de reservar'}
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
                        {item.paid
                          ? '✓ Pagado'
                          : '○ Pendiente de pago'}
                      </button>
                    </div>
                  )}

                  {(isActivity
                    ? linkedActivity.link
                    : item.link) && (
                    <button
                      className="manual-link-button"
                      type="button"
                      onClick={() =>
                        openExternalLink(
                          isActivity
                            ? linkedActivity.link
                            : item.link
                        )
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
            >
              ×
            </button>
          </div>

          {!editingItem && (
            <div className="entry-mode-selector">
              <button
                className={
                  entryMode === 'manual'
                    ? 'selected'
                    : ''
                }
                type="button"
                onClick={() =>
                  changeEntryMode('manual')
                }
              >
                ✏️ Línea manual
              </button>

              <button
                className={
                  entryMode === 'activity'
                    ? 'selected'
                    : ''
                }
                type="button"
                onClick={() =>
                  changeEntryMode('activity')
                }
              >
                🔗 Actividad existente
              </button>
            </div>
          )}

          {entryMode === 'activity' && (
            <>
              <label>
                Actividad

                <select
                  name="activity_id"
                  defaultValue={
                    editingItem?.activity_id ||
                    ''
                  }
                  onChange={
                    handleActivitySelection
                  }
                  required
                >
                  <option value="">
                    Seleccionar actividad
                  </option>

                  {availableActivities.map(
                    (activity) => {
                      const priority =
                        getPriority(
                          activity.priority
                        )

                      return (
                        <option
                          key={activity.id}
                          value={activity.id}
                        >
                          {priority.icon}{' '}
                          {activity.name}
                          {' · '}
                          {activity.city}
                        </option>
                      )
                    }
                  )}
                </select>
              </label>

              {selectedActivity && (
                <div className="activity-selection-preview">
                  <strong>
                    {selectedActivity.name}
                  </strong>

                  <span>
                    {
                      getPriority(
                        selectedActivity.priority
                      ).icon
                    }{' '}
                    {
                      getPriority(
                        selectedActivity.priority
                      ).label
                    }
                  </span>

                  {selectedActivity.category && (
                    <span>
                      {selectedActivity.category}
                    </span>
                  )}
                </div>
              )}

              <label>
                Nota específica para este día

                <textarea
                  name="activity_note"
                  rows="3"
                  defaultValue={
                    editingItem?.description || ''
                  }
                  placeholder="Ej. Visitar a primera hora..."
                />
              </label>
            </>
          )}

          {entryMode === 'manual' && (
            <>
              <label>
                Tipo de línea

                <select
                  name="item_type"
                  defaultValue={
                    editingItem?.item_type ||
                    'transport'
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
                    editingItem?.title || ''
                  }
                  placeholder="Ej. Shinkansen Tokio → Kioto"
                  required
                />
              </label>

              <label>
                Detalles

                <textarea
                  name="description"
                  rows="3"
                  defaultValue={
                    editingItem?.description || ''
                  }
                  placeholder="Número de tren, asiento, notas..."
                />
              </label>

              <label>
                Enlace opcional

                <input
                  name="link"
                  type="url"
                  defaultValue={
                    editingItem?.link || ''
                  }
                  placeholder="Reserva o Google Maps"
                />
              </label>
            </>
          )}

          <div className="manual-time-grid">
            <label>
              Hora de inicio

              <input
                name="start_time"
                type="time"
                defaultValue={
                  editingItem?.start_time
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
                  editingItem?.end_time
                    ? editingItem.end_time.slice(
                        0,
                        5
                      )
                    : ''
                }
              />
            </label>
          </div>

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

      {activityDetails && (
        <div
          className="activity-modal-backdrop"
          onClick={() =>
            setActivityDetails(null)
          }
        >
          <article
            className="activity-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="activity-modal-close"
              type="button"
              onClick={() =>
                setActivityDetails(null)
              }
            >
              ×
            </button>

            <span className="activity-modal-icon">
              {
                getActivityType(
                  activityDetails.item_type
                ).icon
              }
            </span>

            <p className="section-label">
              {
                getActivityType(
                  activityDetails.item_type
                ).label
              }
            </p>

            <h2>{activityDetails.name}</h2>

            <div className="activity-modal-meta">
              <span>
                {
                  getPriority(
                    activityDetails.priority
                  ).icon
                }{' '}
                {
                  getPriority(
                    activityDetails.priority
                  ).label
                }
              </span>

              {activityDetails.category && (
                <span>
                  {activityDetails.category}
                </span>
              )}

              {activityDetails.neighborhood && (
                <span>
                  📍{' '}
                  {activityDetails.neighborhood}
                </span>
              )}

              {activityDetails.estimated_duration && (
                <span>
                  ⏱️{' '}
                  {
                    activityDetails.estimated_duration
                  }{' '}
                  min
                </span>
              )}
            </div>

            {activityDetails.description && (
              <p className="activity-modal-description">
                {activityDetails.description}
              </p>
            )}

            {activityDetails.link && (
              <button
                className="save-button"
                type="button"
                onClick={() =>
                  openExternalLink(
                    activityDetails.link
                  )
                }
              >
                Abrir en Google Maps ↗
              </button>
            )}
          </article>
        </div>
      )}
    </div>
  )
}

export default DayItems