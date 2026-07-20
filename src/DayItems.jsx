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

const activityCategoryIcons = {
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

function getActivityIcon(activity) {
  if (
    activity?.category &&
    activityCategoryIcons[activity.category]
  ) {
    return activityCategoryIcons[activity.category]
  }

  return getActivityType(activity?.item_type).icon
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
  const [allItineraryItems, setAllItineraryItems] = useState([])
  const [activities, setActivities] = useState([])
  const [hotels, setHotels] = useState([])
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [itineraryDays, setItineraryDays] =
    useState([])

  const [loadingItems, setLoadingItems] =
    useState(true)

  const [savingItem, setSavingItem] =
    useState(false)

  const [updatingItemId, setUpdatingItemId] =
    useState(null)

  const [showNewItemForm, setShowNewItemForm] =
    useState(false)

  const [editingItem, setEditingItem] =
    useState(null)

  const [informationItem, setInformationItem] =
    useState(null)

  const [entryMode, setEntryMode] =
    useState('manual')

  const [
    selectedActivityId,
    setSelectedActivityId,
  ] = useState('')

  const [targetDayId, setTargetDayId] =
    useState('')

  const [errorMessage, setErrorMessage] =
    useState('')

  const [showPromptGenerator, setShowPromptGenerator] =
    useState(false)
  const [promptScope, setPromptScope] =
    useState('day')
  const [promptPreferences, setPromptPreferences] =
    useState([])
  const [promptNotes, setPromptNotes] =
    useState('')
  const [generatedPrompt, setGeneratedPrompt] =
    useState('')
  const [promptCopied, setPromptCopied] =
    useState(false)

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
      allItemsResult,
      activitiesResult,
      hotelsResult,
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
        .from('itinerary_items')
        .select('*'),

      supabase
        .from('activities')
        .select('*')
        .order('name', {
          ascending: true,
        }),

      supabase
        .from('hotels')
        .select('*')
        .order('check_in_date', {
          ascending: true,
          nullsFirst: false,
        }),
      supabase
        .from('itinerary_days')
        .select(
          'id, day_number, city, title, travel_date'
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

    if (allItemsResult.error) {
      console.error(
        'Error al cargar el itinerario completo:',
        allItemsResult.error
      )
      errors.push(
        'No se pudo cargar el contexto completo.'
      )
    } else {
      setAllItineraryItems(allItemsResult.data || [])
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

    if (hotelsResult.error) {
      console.error(
        'Error al cargar los hoteles:',
        hotelsResult.error
      )
      errors.push(
        'No se pudieron cargar los hoteles.'
      )
    } else {
      setHotels(hotelsResult.data || [])
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
    setShowNewItemForm(true)
    setErrorMessage('')
  }

  function closeNewItemForm() {
    setShowNewItemForm(false)
    setEntryMode('manual')
    setSelectedActivityId('')
    setErrorMessage('')
  }

  function changeEntryMode(mode) {
    setEntryMode(mode)
    setSelectedActivityId('')
    setErrorMessage('')
  }

  function openInformation(item) {
    setInformationItem(item)
    setErrorMessage('')
  }

  function closeInformation() {
    setInformationItem(null)
    setErrorMessage('')
  }

  function openEditor(item) {
    setEditingItem(item)
    setTargetDayId('')
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
  }

  function closeEditor() {
    setEditingItem(null)
    setTargetDayId('')
    setSelectedActivityId('')
    setEntryMode('manual')
    setErrorMessage('')
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

    const updateResults =
      await Promise.all(
        dayItems.map((item, index) =>
          supabase
            .from('itinerary_items')
            .update({
              position: index,
            })
            .eq('id', item.id)
        )
      )

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

  async function saveNewItem(event) {
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
        maps_name: activity.maps_name || '',
        reserved: false,
        paid: false,
        position: items.length,
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
        maps_name: String(
          formData.get('maps_name') || ''
        ).trim(),
        position: items.length,
        reserved: false,
        paid: false,
      }
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
        'No se pudo guardar la línea: ' +
          result.error.message
      )
    } else {
      setItems((currentItems) => [
        ...currentItems,
        result.data,
      ])

      form.reset()
      closeNewItemForm()
    }

    setSavingItem(false)
  }

  async function saveEditedItem(event) {
    event.preventDefault()

    if (
      !editingItem ||
      savingItem
    ) {
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
        maps_name: activity.maps_name || '',
        reserved: false,
        paid: false,
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
        maps_name: String(
          formData.get('maps_name') || ''
        ).trim(),
      }

      if (!selectedType.supportsBooking) {
        itemInformation.reserved = false
        itemInformation.paid = false
      }
    }

    setSavingItem(true)
    setErrorMessage('')

    const result = await supabase
      .from('itinerary_items')
      .update(itemInformation)
      .eq('id', editingItem.id)
      .select()
      .single()

    if (result.error) {
      console.error(
        'Error al editar la línea:',
        result.error
      )

      setErrorMessage(
        'No se pudieron guardar los cambios: ' +
          result.error.message
      )
    } else {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === editingItem.id
            ? result.data
            : item
        )
      )

      closeEditor()
    }

    setSavingItem(false)
  }

  async function toggleBookingStatus(
    item,
    field
  ) {
    if (
      updatingItemId !== null ||
      (field !== 'reserved' &&
        field !== 'paid')
    ) {
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

      setInformationItem(result.data)
    }

    setUpdatingItemId(null)
  }

  async function moveEditedItem() {
    if (
      !editingItem ||
      !targetDayId ||
      updatingItemId !== null
    ) {
      return
    }

    const numericTargetDayId =
      Number(targetDayId)

    const targetDay = targetDays.find(
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

    setUpdatingItemId(editingItem.id)
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
      .eq('id', editingItem.id)
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
          item.id !== editingItem.id
      )
    )

    await normalizePositions(
      day.id,
      editingItem.id
    )

    setUpdatingItemId(null)
    closeEditor()
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

    setEditingItem(currentResult.data)
    setUpdatingItemId(null)
  }

  async function deleteEditedItem() {
    if (
      !editingItem ||
      updatingItemId !== null
    ) {
      return
    }

    const linkedActivity =
      getLinkedActivity(
        editingItem.activity_id
      )

    const title =
      linkedActivity?.name ||
      editingItem.title ||
      'esta línea'

    const shouldDelete = window.confirm(
      '¿Quieres eliminar “' +
        title +
        '” del itinerario?'
    )

    if (!shouldDelete) {
      return
    }

    setUpdatingItemId(editingItem.id)
    setErrorMessage('')

    const result = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', editingItem.id)

    if (result.error) {
      console.error(
        'Error al eliminar la línea:',
        result.error
      )

      setErrorMessage(
        'No se pudo eliminar la línea.'
      )

      setUpdatingItemId(null)
      return
    }

    setItems((currentItems) =>
      currentItems.filter(
        (currentItem) =>
          currentItem.id !== editingItem.id
      )
    )

    await normalizePositions(
      day.id,
      editingItem.id
    )

    setUpdatingItemId(null)
    closeEditor()
  }

  const informationActivity =
    informationItem
      ? getLinkedActivity(
          informationItem.activity_id
        )
      : null

  const informationIsActivity =
    Boolean(informationActivity)

  const informationManualType =
    informationItem
      ? getManualType(
          informationItem.item_type
        )
      : null

  const informationActivityType =
    informationIsActivity
      ? getActivityType(
          informationActivity.item_type
        )
      : null

  const informationTitle =
    informationIsActivity
      ? informationActivity.name
      : informationItem?.title

  const informationIcon =
    informationIsActivity
      ? informationActivityType.icon
      : informationManualType?.icon

  const informationSupportsBooking =
    Boolean(
      informationItem &&
        !informationIsActivity &&
        informationManualType
          ?.supportsBooking
    )

  const informationLink =
    informationIsActivity
      ? informationActivity.link
      : informationItem?.link

  const editingUntimedIndex =
    editingItem && !editingItem.start_time
      ? itemsWithoutTime.findIndex(
          (item) =>
            item.id === editingItem.id
        )
      : -1

  const canMoveEditingUp =
    editingUntimedIndex > 0

  const canMoveEditingDown =
    editingUntimedIndex >= 0 &&
    editingUntimedIndex <
      itemsWithoutTime.length - 1

  function getHotelForNight(dateValue) {
    if (!dateValue) {
      return null
    }

    return (
      hotels.find(
        (hotel) =>
          hotel.check_in_date &&
          hotel.check_out_date &&
          hotel.check_in_date <= dateValue &&
          hotel.check_out_date > dateValue
      ) || null
    )
  }

  function getPreviousDate(dateValue) {
    if (!dateValue) {
      return null
    }

    const date = new Date(dateValue + 'T12:00:00')
    date.setDate(date.getDate() - 1)
    return date.toISOString().slice(0, 10)
  }

  const nightHotel = getHotelForNight(
    day.travel_date
  )

  const previousNightHotel = getHotelForNight(
    getPreviousDate(day.travel_date)
  )

  function openDayRoute() {
    const routePoints = []

    if (previousNightHotel?.maps_name) {
      routePoints.push(previousNightHotel.maps_name)
    }

    sortedItems.forEach((item) => {
      const linkedActivity = getLinkedActivity(
        item.activity_id
      )

      const mapsName = linkedActivity
        ? linkedActivity.maps_name
        : item.maps_name

      if (mapsName) {
        routePoints.push(mapsName)
      }
    })

    if (nightHotel?.maps_name) {
      routePoints.push(nightHotel.maps_name)
    }

    const cleanPoints = routePoints
      .map((point) => String(point).trim())
      .filter(Boolean)

    if (cleanPoints.length === 0) {
      setErrorMessage(
        'No hay puntos con nombre de Google Maps para crear la ruta.'
      )
      return
    }

    if (cleanPoints.length === 1) {
      const searchUrl =
        'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent(cleanPoints[0])

      openExternalLink(searchUrl)
      return
    }

    const origin = cleanPoints[0]
    const destination =
      cleanPoints[cleanPoints.length - 1]
    const waypoints = cleanPoints.slice(1, -1)

    let routeUrl =
      'https://www.google.com/maps/dir/?api=1' +
      '&origin=' + encodeURIComponent(origin) +
      '&destination=' +
      encodeURIComponent(destination) +
      '&travelmode=walking'

    if (waypoints.length > 0) {
      routeUrl +=
        '&waypoints=' +
        waypoints
          .map((point) => encodeURIComponent(point))
          .join('%7C')
    }

    openExternalLink(routeUrl)
  }

  const promptPreferenceOptions = [
    'Empezar temprano',
    'Ritmo tranquilo',
    'Aprovechar al máximo',
    'Priorizar recorridos a pie',
    'Aceptar más desplazamientos',
    'Incluir comida y cena',
    'Priorizar el atardecer',
    'Terminar con vida nocturna',
    'Solo prioridades altas',
    'Tener en cuenta reservas',
  ]

  function togglePromptPreference(preference) {
    setPromptPreferences((current) =>
      current.includes(preference)
        ? current.filter((item) => item !== preference)
        : [...current, preference]
    )
  }

  function openPromptGenerator() {
    setPromptScope('day')
    setPromptPreferences([])
    setPromptNotes('')
    setGeneratedPrompt('')
    setPromptCopied(false)
    setShowPromptGenerator(true)
  }

  function closePromptGenerator() {
    setShowPromptGenerator(false)
    setGeneratedPrompt('')
    setPromptCopied(false)
  }

  function formatPromptActivity(activity) {
    const priority = getPriority(activity.priority).label
    const type = getActivityType(activity.item_type).label
    const details = [
      activity.neighborhood
        ? 'Barrio: ' + activity.neighborhood
        : null,
      'Tipo: ' + type,
      activity.category
        ? 'Categoría: ' + activity.category
        : null,
      'Prioridad: ' + priority,
      activity.estimated_duration
        ? 'Duración: ' + activity.estimated_duration + ' min'
        : 'Duración: no indicada',
      activity.maps_name
        ? 'Google Maps: ' + activity.maps_name
        : null,
      activity.description
        ? 'Notas: ' + activity.description
        : null,
    ].filter(Boolean)

    return '- ' + activity.name + '\n  ' + details.join('\n  ')
  }

  function generatePlanningPrompt() {
    const orderedDays = [...itineraryDays].sort(
      (first, second) =>
        Number(first.day_number) - Number(second.day_number)
    )
    const currentIndex = orderedDays.findIndex(
      (itineraryDay) => itineraryDay.id === day.id
    )
    const sameCityFromCurrent = orderedDays.filter(
      (itineraryDay, index) =>
        index >= currentIndex && itineraryDay.city === day.city
    )

    let selectedDays
    if (promptScope === 'day') {
      selectedDays = [day]
    } else if (promptScope === 'next') {
      selectedDays = sameCityFromCurrent.slice(0, 2)
    } else {
      selectedDays = sameCityFromCurrent
    }

    const selectedDayIds = new Set(
      selectedDays.map((selectedDay) => selectedDay.id)
    )
    const assignedActivityIds = new Set(
      allItineraryItems
        .filter((item) => item.activity_id)
        .map((item) => Number(item.activity_id))
    )
    const selectedAssignments = allItineraryItems.filter(
      (item) => selectedDayIds.has(item.day_id)
    )
    const cityActivities = activities.filter(
      (activity) => activity.city === day.city
    )
    const completed = cityActivities.filter(
      (activity) => activity.done
    )
    const pending = cityActivities.filter(
      (activity) => !activity.done
    )
    const assignedElsewhere = pending.filter(
      (activity) =>
        assignedActivityIds.has(Number(activity.id)) &&
        !selectedAssignments.some(
          (item) => Number(item.activity_id) === Number(activity.id)
        )
    )
    const available = pending.filter(
      (activity) => !assignedElsewhere.includes(activity)
    )
    const city = getCity(day.city)
    const nights = selectedDays
      .map((selectedDay) => {
        const hotel = getHotelForNight(selectedDay.travel_date)
        return (
          'Día ' + selectedDay.day_number + ': ' +
          (hotel ? hotel.name : 'hotel no identificado')
        )
      })
      .join('\n')
    const scopeLabel = selectedDays
      .map((selectedDay) => 'Día ' + selectedDay.day_number)
      .join(', ')

    const sections = [
      'Actúa como planificador experto de viajes en Japón.',
      '',
      'OBJETIVO',
      'Organiza ' + scopeLabel + ' en ' + city.label +
        ' usando principalmente las opciones que ya he guardado. ' +
        'Decide qué barrios conviene combinar, minimiza desplazamientos ' +
        'y crea un orden geográfico y temporal realista.',
      '',
      'CONTEXTO',
      '- Ciudad: ' + city.label,
      '- Día desde el que planifico: ' + day.day_number,
      '- Días restantes en esta ciudad contando el actual: ' +
        sameCityFromCurrent.length,
      '- Días que debes organizar: ' + scopeLabel,
      '- Hoteles por noche:\n' + nights,
      '',
      'PREFERENCIAS',
      promptPreferences.length
        ? promptPreferences.map((item) => '- ' + item).join('\n')
        : '- Sin preferencias adicionales',
      promptNotes.trim()
        ? '- Indicaciones adicionales: ' + promptNotes.trim()
        : '',
      '',
      'ACTIVIDADES YA COMPLETADAS',
      completed.length
        ? completed.map(formatPromptActivity).join('\n')
        : '- Ninguna registrada',
      '',
      'ACTIVIDADES PENDIENTES DISPONIBLES',
      available.length
        ? available.map(formatPromptActivity).join('\n')
        : '- Ninguna disponible',
      '',
      'ACTIVIDADES PENDIENTES YA ASIGNADAS A OTROS DÍAS',
      assignedElsewhere.length
        ? assignedElsewhere.map(formatPromptActivity).join('\n')
        : '- Ninguna',
      '',
      'NUESTRO RITMO DE VIAJE',
      '- No nos importa madrugar y nos gusta caminar bastante durante la mañana.',
      '- Lo primero al salir del hotel debe ser tomar un café. Prioriza un café guardado cerca del hotel o de la primera visita; si no existe, recomienda uno cercano y márcalo como recomendación externa.',
      '- A media mañana queremos normalmente un segundo café, integrado en la ruta y sin crear un desvío importante.',
      '- Entre las 12:00 y las 13:00 queremos una primera cerveza o una parada agradable en un sitio curioso, cómodo o con ambiente. Esta parada no es la comida.',
      '- Después de esa primera cerveza podemos pasear, visitar algo cercano o desplazarnos ligeramente hasta la comida.',
      '- Comemos con horario español, normalmente entre las 14:00 y las 15:00. Prioriza uno de los sitios guardados de Comer y beber que encaje con la zona y el recorrido.',
      '- Después de comer queremos café, paseo y más visitas, preferiblemente de intensidad moderada al principio de la tarde.',
      '- Si existe margen real y el hotel queda razonablemente conectado, valora volver al hotel para descansar, ducharnos y cambiarnos antes de salir de noche. No fuerces esta vuelta si rompe la ruta.',
      '- Casi todas las noches queremos una zona animada o agradable, tomar algo antes de cenar, una cena interesante o especial con horario español y después otra copa o un paseo nocturno.',
      '- Cenamos normalmente entre las 21:00 y las 22:30. Solo adelanta la cena por reservas u horarios de cierre y explica el motivo.',
      '- Para cafés, cerveza, comida, cena y copas, utiliza primero los sitios guardados que encajen geográficamente. Si no existe una opción adecuada, puedes proponer una recomendación externa claramente identificada.',
      '',
      'CRITERIO Y REDUNDANCIAS',
      '- No intentes incluir todas las actividades pendientes ni maximizar el número de paradas.',
      '- Tu objetivo es diseñar días agradables, variados y coherentes, no completar una checklist.',
      '- Evalúa si algunas actividades son redundantes, demasiado parecidas o producen saturación temática, como dos mercados de pescado, varios miradores, demasiados templos seguidos o varias zonas comerciales similares.',
      '- Si dos experiencias se solapan, elige la que mejor encaje según nuestra prioridad, singularidad, proximidad, horario, variedad y coste de oportunidad.',
      '- Tienes permiso explícito para dejar actividades fuera, moverlas a otro día o señalar que probablemente no merezca la pena hacer ambas.',
      '- No combines dos experiencias similares el mismo día salvo que aporten diferencias claras y expliques por qué la combinación merece la pena.',
      '',
      'INSTRUCCIONES',
      '1. Usa solo las actividades disponibles como base del plan.',
      '2. No repitas actividades completadas ni asignadas a otros días.',
      '3. Prioriza una zona principal por día.',
      '4. Combina como máximo dos o tres barrios, y solo cuando sean contiguos o formen un recorrido natural.',
      '5. Evita mezclar zonas alejadas solo para rellenar horas.',
      '6. En Tokio, evita combinar la zona este, como Asakusa, Ueno o Akihabara, con la zona oeste, como Shibuya, Harajuku o Shinjuku, salvo que exista un motivo excepcional y lo expliques.',
      '7. Es preferible proponer un día corto de 4 o 5 horas que una jornada geográficamente dispersa.',
      '8. Ten en cuenta cuántos días quedan en la ciudad. Si aún hay días suficientes, deja las actividades de otras zonas para esos días en lugar de incluirlas ahora.',
      '9. Distribuye la carga entre los días seleccionados y evita agotar en un solo día actividades que encajan mejor en jornadas posteriores.',
      '10. Antes de cerrar el plan, revisa expresamente si estás metiendo actividades redundantes o zonas que sería mejor reservar para días posteriores.',
      '11. Prioriza Imprescindible y Alta, pero no uses la prioridad como excusa para romper la coherencia geográfica.',
      '12. Integra cafés, cerveza, comida, cena y copas según nuestro ritmo y cerca del recorrido.',
      '13. Ordena las paradas de forma práctica y caminable cuando sea posible.',
      '14. Si alguna opción encaja mejor en otro día restante, déjala fuera del plan principal e indica en qué día o zona la colocarías.',
      '15. Si faltan actividades para completar la jornada, conserva tiempo libre. No cruces la ciudad para rellenar horas.',
      '16. No inventes lugares salvo en una sección opcional separada, y no los añadas al itinerario principal.',
      '17. Señala horarios, reservas o cierres que deban comprobarse.',
      '',
      'FORMATO DE RESPUESTA',
      '- Resumen de barrios y lógica de agrupación.',
      '- Plan por día con horas aproximadas, orden y duración.',
      '- Cafés, primera cerveza, comida, cena y copas integrados en la ruta.',
      '- Qué dejar para otro día y por qué, teniendo en cuenta los días restantes en la ciudad.',
      '- Solapamientos y descartes: actividades redundantes o de poco valor adicional que no incluirías.',
      '- Recomendaciones externas claramente marcadas como no guardadas en Japan26.',
      '- Advertencias y comprobaciones necesarias.',
    ].filter((line) => line !== '')

    setGeneratedPrompt(sections.join('\n'))
    setPromptCopied(false)
  }

  async function copyGeneratedPrompt() {
    if (!generatedPrompt) {
      return
    }

    try {
      await navigator.clipboard.writeText(generatedPrompt)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = generatedPrompt
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    setPromptCopied(true)
    window.setTimeout(() => setPromptCopied(false), 2200)
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
    <div className="manual-day-items compact-day-items">
      {errorMessage && (
        <div className="auth-message error manual-items-error">
          <strong>
            Ha ocurrido un problema
          </strong>

          <p>{errorMessage}</p>
        </div>
      )}

      {sortedItems.length === 0 &&
        !showNewItemForm && (
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
        <div className="compact-timeline">
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
              ? getActivityIcon(linkedActivity)
              : manualType.icon

            const itemTypeLabel =
              isActivity
                ? activityType.label
                : manualType.label

            return (
              <article
                className="compact-timeline-row"
                key={item.id}
              >
                <div className="compact-timeline-time">
                  <strong>
                    {formatTime(
                      item.start_time
                    )}
                  </strong>

                  {item.end_time && (
                    <small>
                      {formatTime(
                        item.end_time
                      )}
                    </small>
                  )}
                </div>

                <span className="compact-timeline-icon">
                  {icon}
                </span>

                <div className="compact-timeline-main">
                  <span>
                    {itemTypeLabel}
                  </span>

                  <strong>{title}</strong>
                </div>

                <div className="compact-timeline-actions">
                  <button
                    className="compact-info-button"
                    type="button"
                    onClick={() =>
                      openInformation(item)
                    }
                    aria-label={
                      'Ver información de ' +
                      title
                    }
                  >
                    i
                  </button>

                  <button
                    className="compact-edit-button"
                    type="button"
                    onClick={() =>
                      openEditor(item)
                    }
                    aria-label={
                      'Editar ' + title
                    }
                  >
                    ✎
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {showNewItemForm && (
        <form
          className="manual-item-form"
          onSubmit={saveNewItem}
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
              onClick={closeNewItemForm}
              aria-label="Cerrar formulario"
            >
              ×
            </button>
          </div>

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
                      const city =
                        getCity(activity.city)

                      return (
                        <option
                          key={activity.id}
                          value={activity.id}
                        >
                          {
                            getPriority(
                              activity.priority
                            ).icon
                          }{' '}
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
                  defaultValue="transport"
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
                  placeholder="Ej. Shinkansen Tokio → Kioto"
                  required
                />
              </label>

              <label>
                Detalles

                <textarea
                  name="description"
                  rows="3"
                  placeholder="Número de tren, asiento, notas..."
                />
              </label>

              <label>
                Nombre exacto en Google Maps

                <input
                  name="maps_name"
                  type="text"
                  placeholder="Ej. Haneda Airport Terminal 3"
                />
              </label>

              <label>
                Enlace opcional

                <input
                  name="link"
                  type="url"
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

      <div className="day-route-section">
        {nightHotel && (
          <button
            className="night-hotel-card"
            type="button"
            onClick={() => setSelectedHotel(nightHotel)}
          >
            <span aria-hidden="true">🏨</span>
            <span>
              <small>NOCHE EN</small>
              <strong>{nightHotel.name}</strong>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        )}

        <button
          className="day-route-button"
          type="button"
          onClick={openDayRoute}
        >
          🗺️ Ruta del día
        </button>

        <button
          className="day-prompt-button"
          type="button"
          onClick={openPromptGenerator}
        >
          ✨ Generar prompt
        </button>
      </div>

      {!showNewItemForm && (
        <button
          className="secondary-action-button active"
          type="button"
          onClick={openNewItemForm}
        >
          + Añadir al día
        </button>
      )}

      {showPromptGenerator && (
        <div
          className="compact-panel-backdrop"
          role="presentation"
          onClick={closePromptGenerator}
        >
          <article
            className="compact-panel prompt-generator-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-generator-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="compact-panel-close"
              type="button"
              onClick={closePromptGenerator}
              aria-label="Cerrar generador"
            >
              ×
            </button>

            <span className="compact-panel-icon">✨</span>
            <p className="section-label">GENERADOR DE PROMPT</p>
            <h2 id="prompt-generator-title">
              Organizar Día {day.day_number}
            </h2>

            {!generatedPrompt ? (
              <div className="prompt-generator-form">
                <label>
                  1. Alcance
                  <select
                    value={promptScope}
                    onChange={(event) =>
                      setPromptScope(event.target.value)
                    }
                  >
                    <option value="day">Solo este día</option>
                    <option value="next">
                      Este día y el siguiente en la ciudad
                    </option>
                    <option value="remaining">
                      Todos los días restantes en la ciudad
                    </option>
                  </select>
                </label>

                <div className="prompt-preferences">
                  <strong>2. Preferencias</strong>
                  <div>
                    {promptPreferenceOptions.map((preference) => (
                      <button
                        className={
                          promptPreferences.includes(preference)
                            ? 'selected'
                            : ''
                        }
                        key={preference}
                        type="button"
                        onClick={() =>
                          togglePromptPreference(preference)
                        }
                      >
                        {preference}
                      </button>
                    ))}
                  </div>
                </div>

                <label>
                  Indicaciones adicionales
                  <textarea
                    rows="3"
                    value={promptNotes}
                    onChange={(event) =>
                      setPromptNotes(event.target.value)
                    }
                    placeholder="Ej. Terminar en Shibuya Sky al atardecer..."
                  />
                </label>

                <button
                  className="save-button"
                  type="button"
                  onClick={generatePlanningPrompt}
                >
                  ✨ Generar prompt
                </button>
              </div>
            ) : (
              <div className="generated-prompt-section">
                <textarea
                  readOnly
                  value={generatedPrompt}
                  aria-label="Prompt generado"
                />

                <button
                  className="copy-prompt-button"
                  type="button"
                  onClick={copyGeneratedPrompt}
                >
                  {promptCopied
                    ? '✓ Prompt copiado'
                    : '📋 Copiar prompt'}
                </button>

                <button
                  className="regenerate-prompt-button"
                  type="button"
                  onClick={() => {
                    setGeneratedPrompt('')
                    setPromptCopied(false)
                  }}
                >
                  Cambiar alcance o preferencias
                </button>
              </div>
            )}
          </article>
        </div>
      )}

      {selectedHotel && (
        <div
          className="compact-panel-backdrop"
          role="presentation"
          onClick={() => setSelectedHotel(null)}
        >
          <article
            className="compact-panel hotel-itinerary-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hotel-itinerary-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="compact-panel-close"
              type="button"
              onClick={() => setSelectedHotel(null)}
              aria-label="Cerrar hotel"
            >
              ×
            </button>

            <span className="compact-panel-icon">🏨</span>
            <p className="section-label">NOCHE EN</p>
            <h2 id="hotel-itinerary-title">
              {selectedHotel.name}
            </h2>

            {selectedHotel.address && (
              <div className="compact-panel-section">
                <span>DIRECCIÓN</span>
                <p>{selectedHotel.address}</p>
              </div>
            )}

            {selectedHotel.confirmation_number && (
              <div className="compact-panel-section">
                <span>CONFIRMACIÓN</span>
                <p>{selectedHotel.confirmation_number}</p>
              </div>
            )}

            {selectedHotel.notes && (
              <div className="compact-panel-section">
                <span>NOTAS</span>
                <p>{selectedHotel.notes}</p>
              </div>
            )}

            <div className="hotel-itinerary-links">
              {selectedHotel.maps_link && (
                <button
                  type="button"
                  onClick={() =>
                    openExternalLink(selectedHotel.maps_link)
                  }
                >
                  🗺️ Google Maps
                </button>
              )}

              {selectedHotel.booking_link && (
                <button
                  type="button"
                  onClick={() =>
                    openExternalLink(
                      selectedHotel.booking_link
                    )
                  }
                >
                  Abrir reserva
                </button>
              )}
            </div>
          </article>
        </div>
      )}

      {informationItem && (
        <div
          className="compact-panel-backdrop"
          role="presentation"
          onClick={closeInformation}
        >
          <article
            className="compact-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="information-panel-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="compact-panel-close"
              type="button"
              onClick={closeInformation}
              aria-label="Cerrar información"
            >
              ×
            </button>

            <span className="compact-panel-icon">
              {informationIcon}
            </span>

            <p className="section-label">
              {informationIsActivity
                ? informationActivityType.label
                : informationManualType.label}
            </p>

            <h2 id="information-panel-title">
              {informationTitle}
            </h2>

            {(informationItem.start_time ||
              informationItem.end_time) && (
              <p className="compact-panel-time">
                🕒{' '}
                {formatTime(
                  informationItem.start_time
                )}

                {informationItem.end_time
                  ? ' → ' +
                    formatTime(
                      informationItem.end_time
                    )
                  : ''}
              </p>
            )}

            {informationIsActivity && (
              <div className="activity-modal-meta">
                <span>
                  {
                    getPriority(
                      informationActivity.priority
                    ).icon
                  }{' '}
                  {
                    getPriority(
                      informationActivity.priority
                    ).label
                  }
                </span>

                {informationActivity.category && (
                  <span>
                    {
                      informationActivity.category
                    }
                  </span>
                )}

                {informationActivity.neighborhood && (
                  <span>
                    📍{' '}
                    {
                      informationActivity.neighborhood
                    }
                  </span>
                )}

                {informationActivity.estimated_duration && (
                  <span>
                    ⏱️{' '}
                    {
                      informationActivity.estimated_duration
                    }{' '}
                    min
                  </span>
                )}
              </div>
            )}

            {informationItem.description && (
              <div className="compact-panel-section">
                <span>NOTA DEL DÍA</span>

                <p>
                  {informationItem.description}
                </p>
              </div>
            )}

            {informationIsActivity &&
              informationActivity.description && (
                <div className="compact-panel-section">
                  <span>DESCRIPCIÓN</span>

                  <p>
                    {
                      informationActivity.description
                    }
                  </p>
                </div>
              )}

            {informationSupportsBooking && (
              <div className="compact-info-statuses">
                <button
                  className={
                    informationItem.reserved
                      ? 'booking-status selected'
                      : 'booking-status'
                  }
                  type="button"
                  disabled={
                    updatingItemId ===
                    informationItem.id
                  }
                  onClick={() =>
                    toggleBookingStatus(
                      informationItem,
                      'reserved'
                    )
                  }
                >
                  {informationItem.reserved
                    ? '✓ Reservado'
                    : '○ Pendiente de reservar'}
                </button>

                <button
                  className={
                    informationItem.paid
                      ? 'booking-status paid selected'
                      : 'booking-status paid'
                  }
                  type="button"
                  disabled={
                    updatingItemId ===
                    informationItem.id
                  }
                  onClick={() =>
                    toggleBookingStatus(
                      informationItem,
                      'paid'
                    )
                  }
                >
                  {informationItem.paid
                    ? '✓ Pagado'
                    : '○ Pendiente de pago'}
                </button>
              </div>
            )}

            {informationLink && (
              <button
                className="compact-panel-link"
                type="button"
                onClick={() =>
                  openExternalLink(
                    informationLink
                  )
                }
              >
                {informationIsActivity
                  ? 'Google Maps'
                  : 'Abrir enlace'}
              </button>
            )}
          </article>
        </div>
      )}

      {editingItem && (
        <div
          className="compact-panel-backdrop"
          role="presentation"
          onClick={closeEditor}
        >
          <article
            className="compact-panel compact-edit-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-panel-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="compact-panel-close"
              type="button"
              onClick={closeEditor}
              aria-label="Cerrar edición"
            >
              ×
            </button>

            <p className="section-label">
              EDITAR LÍNEA
            </p>

            <h2 id="edit-panel-title">
              {getLinkedActivity(
                editingItem.activity_id
              )?.name || editingItem.title}
            </h2>

            <form
              className="compact-edit-form"
              onSubmit={saveEditedItem}
              key={'edit-' + editingItem.id}
            >
              {entryMode === 'activity' ? (
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
                          const city =
                            getCity(
                              activity.city
                            )

                          return (
                            <option
                              key={activity.id}
                              value={activity.id}
                            >
                              {
                                getPriority(
                                  activity.priority
                                ).icon
                              }{' '}
                              {activity.name}
                              {' · '}
                              {city.label}
                            </option>
                          )
                        }
                      )}
                    </select>
                  </label>

                  <label>
                    Nota específica para este día

                    <textarea
                      name="activity_note"
                      rows="3"
                      defaultValue={
                        editingItem.description ||
                        ''
                      }
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Tipo de línea

                    <select
                      name="item_type"
                      defaultValue={
                        editingItem.item_type ||
                        'manual'
                      }
                    >
                      {manualTypes.map(
                        (type) => (
                          <option
                            key={type.value}
                            value={type.value}
                          >
                            {type.icon}{' '}
                            {type.label}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    Título

                    <input
                      name="title"
                      type="text"
                      defaultValue={
                        editingItem.title || ''
                      }
                      required
                    />
                  </label>

                  <label>
                    Detalles

                    <textarea
                      name="description"
                      rows="3"
                      defaultValue={
                        editingItem.description ||
                        ''
                      }
                    />
                  </label>

                  <label>
                    Nombre exacto en Google Maps

                    <input
                      name="maps_name"
                      type="text"
                      defaultValue={
                        editingItem.maps_name || ''
                      }
                    />
                  </label>

                  <label>
                    Enlace opcional

                    <input
                      name="link"
                      type="url"
                      defaultValue={
                        editingItem.link || ''
                      }
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

              <button
                className="save-button"
                type="submit"
                disabled={savingItem}
              >
                {savingItem
                  ? 'Guardando...'
                  : 'Guardar cambios'}
              </button>
            </form>

            {!editingItem.start_time && (
              <div className="compact-edit-section">
                <span>
                  ORDEN DE ELEMENTOS SIN HORA
                </span>

                <div className="compact-order-buttons">
                  <button
                    type="button"
                    disabled={
                      !canMoveEditingUp ||
                      updatingItemId !== null
                    }
                    onClick={() =>
                      moveUntimedItem(
                        editingItem,
                        'up'
                      )
                    }
                  >
                    ↑ Subir
                  </button>

                  <button
                    type="button"
                    disabled={
                      !canMoveEditingDown ||
                      updatingItemId !== null
                    }
                    onClick={() =>
                      moveUntimedItem(
                        editingItem,
                        'down'
                      )
                    }
                  >
                    ↓ Bajar
                  </button>
                </div>
              </div>
            )}

            {targetDays.length > 0 && (
              <div className="compact-edit-section">
                <span>
                  MOVER A OTRO DÍA
                </span>

                <select
                  value={targetDayId}
                  onChange={(event) =>
                    setTargetDayId(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Seleccionar día
                  </option>

                  {targetDays.map(
                    (targetDay) => {
                      const city =
                        getCity(targetDay.city)

                      return (
                        <option
                          key={targetDay.id}
                          value={targetDay.id}
                        >
                          Día{' '}
                          {
                            targetDay.day_number
                          }
                          {' · '}
                          {city.emoji}{' '}
                          {city.label}
                          {' · '}
                          {targetDay.title}
                        </option>
                      )
                    }
                  )}
                </select>

                <button
                  className="compact-move-button"
                  type="button"
                  disabled={
                    !targetDayId ||
                    updatingItemId !== null
                  }
                  onClick={moveEditedItem}
                >
                  {updatingItemId ===
                  editingItem.id
                    ? 'Moviendo...'
                    : 'Mover a este día'}
                </button>
              </div>
            )}

            <button
              className="compact-delete-button"
              type="button"
              disabled={
                updatingItemId !== null
              }
              onClick={deleteEditedItem}
            >
              Eliminar del día
            </button>
          </article>
        </div>
      )}
    </div>
  )
}

export default DayItems