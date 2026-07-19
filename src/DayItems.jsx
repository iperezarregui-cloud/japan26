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

const cityInformation = {
  tokyo: {
    label: 'Tokio',
    emoji: '🗼',
  },
  hakone: {
    label: 'Hakone',
    emoji: '🗻',
  },
  kyoto: {
    label: 'Kioto',
    emoji: '⛩️',
  },
  nara: {
    label: 'Nara',
    emoji: '🦌',
  },
  osaka: {
    label: 'Osaka',
    emoji: '🏯',
  },
  kobe: {
    label: 'Kobe',
    emoji: '🥩',
  },
  hiroshima: {
    label: 'Hiroshima',
    emoji: '🕊️',
  },
  miyajima: {
    label: 'Miyajima',
    emoji: '⛩️',
  },
  other: {
    label: 'Otra',
    emoji: '📍',
  },
}

function getManualType(type) {
  return (
    manualTypes.find(
      (manualType) =>
        manualType.value === type
    ) || {
      value: type,
      label: 'Otra línea',
      icon: '📌',
      supportsBooking: false,
    }
  )
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

function getCity(cityId) {
  return (
    cityInformation[cityId] || {
      label: cityId || 'Sin ciudad',
      emoji: '📍',
    }
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
  const [itineraryDays, setItineraryDays] =
    useState([])

  const [loadingItems, setLoadingItems] =
    useState(true)

  const [savingItem, setSavingItem] =
    useState(false)

  const [updatingItemId, setUpdatingItemId] =
    useState(null)

  const [showItemForm, setShowItemForm] =
    useState(false)

  const [editingItem, setEditingItem] =
    useState(null)

  const [entryMode, setEntryMode] =
    useState('manual')

  const [
    selectedActivityId,
    setSelectedActivityId,
  ] = useState('')

  const [activityDetails, setActivityDetails] =
    useState(null)

  const [movingItem, setMovingItem] =
    useState(null)

  const [targetDayId, setTargetDayId] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  const sortedItems = useMemo(() => {
    return [...items].sort((first, second) => {
      const firstHasTime =
        Boolean(first.start_time)

      const secondHasTime =
        Boolean(second.start_time)

      if (
        firstHasTime &&
        !secondHasTime
      ) {
        return -1
      }

      if (
        !firstHasTime &&
        secondHasTime
      ) {
        return 1
      }

      if (
        firstHasTime &&
        secondHasTime
      ) {
        const timeComparison =
          first.start_time.localeCompare(
            second.start_time
          )

        if (timeComparison !== 0) {
          return timeComparison
        }
      }

      return (
        Number(first.position || 0) -
        Number(second.position || 0)
      )
    })
  }, [items])

  const itemsWithoutTime = useMemo(() => {
    return sortedItems.filter(
      (item) => !item.start_time
    )
  }, [sortedItems])

  const availableActivities = useMemo(() => {
    return [...activities].sort(
      (first, second) => {
        const firstSameCity =
          first.city === day.city ? 0 : 1

        const secondSameCity =
          second.city === day.city ? 0 : 1

        if (
          firstSameCity !== secondSameCity
        ) {
          return (
            firstSameCity -
            secondSameCity
          )
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

        if (
          firstPriority !== secondPriority
        ) {
          return (
            firstPriority -
            secondPriority
          )
        }

        return first.name.localeCompare(
          second.name
        )
      }
    )
  }, [activities, day.city])

  const selectedActivity = useMemo(() => {
    if (!selectedActivityId) {
      return null
    }

    return (
      activities.find(
        (activity) =>
          activity.id ===
          Number(selectedActivityId)
      ) || null
    )
  }, [activities, selectedActivityId])

  const targetDays = useMemo(() => {
    return itineraryDays.filter(
      (itineraryDay) =>
        itineraryDay.id !== day.id
    )
  }, [itineraryDays, day.id])

  useEffect(() => {
    loadInformation()
  }, [day.id])

  async function loadInformation() {
    setLoadingItems(true)
    setErrorMessage('')

    const [
      itemsResult,
      activitiesResult,
      daysResult,
    ] = await Promise.all([
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

      supabase
        .from('itinerary_days')
        .select(
          'id, day_number, city, title'
        )
        .order('day_number', {
          ascending: true,
        }),
    ])

    const errors = []

    if (itemsResult.error) {
      console.error(
        'Error al cargar las líneas:',
        itemsResult.error
      )

      errors.push(
        'No se pudieron cargar las líneas.'
      )
    } else {
      setItems(itemsResult.data || [])
    }

    if (activitiesResult.error) {
      console.error(
        'Error al cargar las actividades:',
        activitiesResult.error
      )

      errors.push(
        'No se pudieron cargar las actividades.'
      )
    } else {
      setActivities(
        activitiesResult.data || []
      )
    }

    if (daysResult.error) {
      console.error(
        'Error al cargar los días:',
        daysResult.error
      )

      errors.push(
        'No se pudieron cargar los días.'
      )
    } else {
      setItineraryDays(
        daysResult.data || []
      )
    }

    if (errors.length > 0) {
      setErrorMessage(errors.join(' '))
    }

    setLoadingItems(false)
  }

  function getLinkedActivity(activityId) {
    if (!activityId) {
      return null
    }

    return (
      activities.find(
        (activity) =>
          activity.id ===
          Number(activityId)
      ) || null
    )
  }

  function openNewItemForm() {
    setEditingItem(null)
    setEntryMode('manual')
    setSelectedActivityId('')
    setShowItemForm(true)
    setErrorMessage('')
  }

  function openEditItemForm(item) {
    setEditingItem(item)
    setErrorMessage('')

    if (item.activity_id) {
      setEntryMode('activity')
      setSelectedActivityId(
        String(item.activity_id)
      )
    } else {
      setEntryMode('manual')
      setSelectedActivityId('')
    }

    setShowItemForm(true)
  }

  function closeItemForm() {
    setEditingItem(null)
    setEntryMode('manual')
    setSelectedActivityId('')
    setShowItemForm(false)
    setErrorMessage('')
  }

  function changeEntryMode(mode) {
    setEntryMode(mode)
    setEditingItem(null)
    setSelectedActivityId('')
    setErrorMessage('')
  }

  function openActivityDetails(activity) {
    if (activity) {
      setActivityDetails(activity)
    }
  }

  function closeActivityDetails() {
    setActivityDetails(null)
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

  function openMoveForm(item) {
    setMovingItem(item)
    setTargetDayId('')
    setErrorMessage('')
  }

  function closeMoveForm() {
    setMovingItem(null)
    setTargetDayId('')
    setErrorMessage('')
  }

  async function normalizePositions(
    dayId,
    excludedItemId = null
  ) {
    const result = await supabase
      .from('itinerary_items')
      .select('id, start_time, position')
      .eq('day_id', dayId)

    if (result.error) {
      console.error(
        'Error al normalizar posiciones:',
        result.error
      )

      return false
    }

    const dayItems = (result.data || [])
      .filter(
        (item) =>
          item.id !== excludedItemId
      )
      .sort((first, second) => {
        const firstHasTime =
          Boolean(first.start_time)

        const secondHasTime =
          Boolean(second.start_time)

        if (
          firstHasTime &&
          !secondHasTime
        ) {
          return -1
        }

        if (
          !firstHasTime &&
          secondHasTime
        ) {
          return 1
        }

        if (
          firstHasTime &&
          secondHasTime
        ) {
          const comparison =
            first.start_time.localeCompare(
              second.start_time
            )

          if (comparison !== 0) {
            return comparison
          }
        }

        return (
          Number(first.position || 0) -
          Number(second.position || 0)
        )
      })

    const updates = dayItems.map(
      (item, index) =>
        supabase
          .from('itinerary_items')
          .update({
            position: index,
          })
          .eq('id', item.id)
    )

    const updateResults =
      await Promise.all(updates)

    const failedUpdate =
      updateResults.find(
        (updateResult) =>
          updateResult.error
      )

    if (failedUpdate) {
      console.error(
        'Error al guardar posiciones:',
        failedUpdate.error
      )

      return false
    }

    return true
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

    const startTime =
      startTimeValue || null

    const endTime =
      endTimeValue || null

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

      if (!activity) {
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
          formData.get('activity_note') ||
            ''
        ).trim(),
        link: activity.link || '',
        reserved: false,
        paid: false,
        position: editingItem
          ? Number(
              editingItem.position || 0
            )
          : items.length,
      }
    } else {
      const itemType = String(
        formData.get('item_type') ||
          'manual'
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
          formData.get('description') ||
            ''
        ).trim(),
        link: String(
          formData.get('link') || ''
        ).trim(),
        position: editingItem
          ? Number(
              editingItem.position || 0
            )
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
      console.error(
        'Error al guardar la línea:',
        result.error
      )

      setErrorMessage(
        'No se pudo guardar la línea: ' +
          result.error.message
      )
    } else {
      if (editingItem) {
        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === editingItem.id
              ? result.data
              : item
          )
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

  async function toggleBookingStatus(
    item,
    field
  ) {
    if (updatingItemId !== null) {
      return
    }

    if (
      field !== 'reserved' &&
      field !== 'paid'
    ) {
      return
    }

    const manualType =
      getManualType(item.item_type)

    if (!manualType.supportsBooking) {
      return
    }

    const nextValue =
      !Boolean(item[field])

    const changes =
      field === 'reserved'
        ? {
            reserved: nextValue,
          }
        : {
            paid: nextValue,
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
      console.error(
        'Error al actualizar el estado:',
        result.error
      )

      setErrorMessage(
        'No se pudo actualizar el estado: ' +
          result.error.message
      )
    } else {
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? result.data
            : currentItem
        )
      )
    }

    setUpdatingItemId(null)
  }

  async function moveItem(event) {
    event.preventDefault()

    if (
      !movingItem ||
      !targetDayId ||
      updatingItemId !== null
    ) {
      return
    }

    const numericTargetDayId =
      Number(targetDayId)

    const targetDay = itineraryDays.find(
      (itineraryDay) =>
        itineraryDay.id ===
        numericTargetDayId
    )

    if (!targetDay) {
      setErrorMessage(
        'Selecciona un día de destino.'
      )

      return
    }

    setUpdatingItemId(movingItem.id)
    setErrorMessage('')

    const targetItemsResult =
      await supabase
        .from('itinerary_items')
        .select('id')
        .eq(
          'day_id',
          numericTargetDayId
        )

    if (targetItemsResult.error) {
      console.error(
        'Error al preparar el movimiento:',
        targetItemsResult.error
      )

      setErrorMessage(
        'No se pudo preparar el día de destino.'
      )

      setUpdatingItemId(null)
      return
    }

    const newPosition =
      (targetItemsResult.data || []).length

    const result = await supabase
      .from('itinerary_items')
      .update({
        day_id: numericTargetDayId,
        position: newPosition,
      })
      .eq('id', movingItem.id)
      .select()
      .single()

    if (result.error) {
      console.error(
        'Error al mover la línea:',
        result.error
      )

      setErrorMessage(
        'No se pudo mover la línea: ' +
          result.error.message
      )

      setUpdatingItemId(null)
      return
    }

    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          item.id !== movingItem.id
      )
    )

    await normalizePositions(
      day.id,
      movingItem.id
    )

    closeMoveForm()
    setUpdatingItemId(null)
  }

  async function moveUntimedItem(
    item,
    direction
  ) {
    if (
      item.start_time ||
      updatingItemId !== null
    ) {
      return
    }

    const currentIndex =
      itemsWithoutTime.findIndex(
        (currentItem) =>
          currentItem.id === item.id
      )

    const targetIndex =
      direction === 'up'
        ? currentIndex - 1
        : currentIndex + 1

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >=
        itemsWithoutTime.length
    ) {
      return
    }

    const targetItem =
      itemsWithoutTime[targetIndex]

    const currentPosition =
      Number(item.position || 0)

    const targetPosition =
      Number(targetItem.position || 0)

    setUpdatingItemId(item.id)
    setErrorMessage('')

    const [
      currentResult,
      targetResult,
    ] = await Promise.all([
      supabase
        .from('itinerary_items')
        .update({
          position: targetPosition,
        })
        .eq('id', item.id)
        .select()
        .single(),

      supabase
        .from('itinerary_items')
        .update({
          position: currentPosition,
        })
        .eq('id', targetItem.id)
        .select()
        .single(),
    ])

    if (
      currentResult.error ||
      targetResult.error
    ) {
      console.error(
        'Error al reordenar:',
        currentResult.error ||
          targetResult.error
      )

      setErrorMessage(
        'No se pudo guardar el nuevo orden.'
      )

      await loadInformation()
      setUpdatingItemId(null)
      return
    }

    setItems((currentItems) =>
      currentItems.map((currentItem) => {
        if (
          currentItem.id === item.id
        ) {
          return currentResult.data
        }

        if (
          currentItem.id === targetItem.id
        ) {
          return targetResult.data
        }

        return currentItem
      })
    )

    setUpdatingItemId(null)
  }

  async function deleteItem(item) {
    const linkedActivity =
      getLinkedActivity(item.activity_id)

    const title =
      linkedActivity?.name ||
      item.title ||
      'esta línea'

    const shouldDelete = window.confirm(
      '¿Quieres eliminar “' +
        title +
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

    await normalizePositions(
      day.id,
      item.id
    )

    if (editingItem?.id === item.id) {
      closeItemForm()
    }

    if (movingItem?.id === item.id) {
      closeMoveForm()
    }
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
                Todavía no hay líneas
              </h4>

              <p>
                Añade una actividad existente
                o una línea manual.
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
              Boolean(linkedActivity)

            const manualType =
              getManualType(item.item_type)

            const activityType =
              isActivity
                ? getActivityType(
                    linkedActivity.item_type
                  )
                : null

            const title = isActivity
              ? linkedActivity.name
              : item.title

            const icon = isActivity
              ? activityType.icon
              : manualType.icon

            const mapsLink = isActivity
              ? linkedActivity.link
              : item.link

            const supportsBooking =
              !isActivity &&
              manualType.supportsBooking

            const isUpdating =
              updatingItemId === item.id

            const untimedIndex =
              itemsWithoutTime.findIndex(
                (untimedItem) =>
                  untimedItem.id === item.id
              )

            const canMoveUp =
              !item.start_time &&
              untimedIndex > 0

            const canMoveDown =
              !item.start_time &&
              untimedIndex >= 0 &&
              untimedIndex <
                itemsWithoutTime.length - 1

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
                    <div
                      className={
                        isActivity
                          ? 'itinerary-activity-heading'
                          : ''
                      }
                    >
                      <span className="manual-item-type">
                        {isActivity
                          ? activityType.label
                          : manualType.label}
                      </span>

                      <h4>{title}</h4>
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

                  {isActivity && (
                    <div className="itinerary-activity-actions">
                      <button
                        className="activity-details-button"
                        type="button"
                        onClick={() =>
                          openActivityDetails(
                            linkedActivity
                          )
                        }
                      >
                        Ver ficha
                      </button>

                      {mapsLink && (
                        <button
                          className="activity-maps-button"
                          type="button"
                          onClick={() =>
                            openExternalLink(
                              mapsLink
                            )
                          }
                        >
                          Google Maps
                        </button>
                      )}
                    </div>
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

                  {!isActivity && item.link && (
                    <button
                      className="manual-link-button"
                      type="button"
                      onClick={() =>
                        openExternalLink(
                          item.link
                        )
                      }
                    >
                      Abrir enlace
                    </button>
                  )}

                  {!item.start_time && (
                    <div className="untimed-order-actions">
                      <span>
                        Orden sin hora
                      </span>

                      <button
                        type="button"
                        disabled={
                          !canMoveUp ||
                          isUpdating
                        }
                        onClick={() =>
                          moveUntimedItem(
                            item,
                            'up'
                          )
                        }
                      >
                        ↑ Subir
                      </button>

                      <button
                        type="button"
                        disabled={
                          !canMoveDown ||
                          isUpdating
                        }
                        onClick={() =>
                          moveUntimedItem(
                            item,
                            'down'
                          )
                        }
                      >
                        ↓ Bajar
                      </button>
                    </div>
                  )}

                  {movingItem?.id ===
                  item.id ? (
                    <form
                      className="move-item-form"
                      onSubmit={moveItem}
                    >
                      <label>
                        Mover a otro día

                        <select
                          value={targetDayId}
                          onChange={(event) =>
                            setTargetDayId(
                              event.target.value
                            )
                          }
                          required
                        >
                          <option value="">
                            Seleccionar día
                          </option>

                          {targetDays.map(
                            (targetDay) => {
                              const city =
                                getCity(
                                  targetDay.city
                                )

                              return (
                                <option
                                  key={
                                    targetDay.id
                                  }
                                  value={
                                    targetDay.id
                                  }
                                >
                                  Día{' '}
                                  {
                                    targetDay.day_number
                                  }
                                  {' · '}
                                  {city.emoji}{' '}
                                  {city.label}
                                  {' · '}
                                  {
                                    targetDay.title
                                  }
                                </option>
                              )
                            }
                          )}
                        </select>
                      </label>

                      <div className="move-item-form-actions">
                        <button
                          className="move-item-save-button"
                          type="submit"
                          disabled={
                            !targetDayId ||
                            isUpdating
                          }
                        >
                          {isUpdating
                            ? 'Moviendo...'
                            : 'Mover'}
                        </button>

                        <button
                          type="button"
                          onClick={closeMoveForm}
                          disabled={isUpdating}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="manual-secondary-actions">
                      <button
                        className="move-item-button"
                        type="button"
                        onClick={() =>
                          openMoveForm(item)
                        }
                        disabled={
                          targetDays.length === 0
                        }
                      >
                        Mover a otro día
                      </button>

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
                  )}
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
                  value={selectedActivityId}
                  onChange={(event) =>
                    setSelectedActivityId(
                      event.target.value
                    )
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

                      const city =
                        getCity(activity.city)

                      return (
                        <option
                          key={activity.id}
                          value={activity.id}
                        >
                          {priority.icon}{' '}
                          {activity.name}
                          {' · '}
                          {city.label}
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
                      getActivityType(
                        selectedActivity.item_type
                      ).label
                    }
                  </span>

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
                </div>
              )}

              <label>
                Nota específica para este día

                <textarea
                  name="activity_note"
                  rows="3"
                  defaultValue={
                    editingItem?.description ||
                    ''
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
                      {type.icon}{' '}
                      {type.label}
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
                    editingItem?.description ||
                    ''
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
          role="presentation"
          onClick={closeActivityDetails}
        >
          <article
            className="activity-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-modal-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="activity-modal-close"
              type="button"
              onClick={closeActivityDetails}
              aria-label="Cerrar ficha"
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

            <h2 id="activity-modal-title">
              {activityDetails.name}
            </h2>

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
                  {
                    activityDetails.neighborhood
                  }
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
                Google Maps
              </button>
            )}
          </article>
        </div>
      )}
    </div>
  )
}

export default DayItems