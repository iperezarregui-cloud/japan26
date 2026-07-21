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
  'Watch hunting': '⌚',
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

  const [showImportProposal, setShowImportProposal] =
    useState(false)
  const [importText, setImportText] = useState('')
  const [importPreview, setImportPreview] =
    useState(null)
  const [importSelectedKeys, setImportSelectedKeys] =
    useState([])
  const [importError, setImportError] = useState('')
  const [importingProposal, setImportingProposal] =
    useState(false)
  const [importSuccess, setImportSuccess] =
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

  const MAX_GOOGLE_MAPS_ROUTE_POINTS = 10

  function getDayRoutePoints() {
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

    return routePoints
      .map((point) => String(point).trim())
      .filter(Boolean)
      .filter(
        (point, index, points) =>
          index === 0 ||
          point.toLowerCase() !==
            points[index - 1].toLowerCase()
      )
  }

  function openRoutePoints(routePoints) {
    if (routePoints.length === 0) {
      setErrorMessage(
        'No hay puntos con nombre de Google Maps para crear la ruta.'
      )
      return
    }

    if (routePoints.length === 1) {
      const searchUrl =
        'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent(routePoints[0])

      openExternalLink(searchUrl)
      return
    }

    const origin = routePoints[0]
    const destination =
      routePoints[routePoints.length - 1]
    const waypoints = routePoints.slice(1, -1)

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

  const dayRoutePoints = getDayRoutePoints()
  const shouldSplitDayRoute =
    dayRoutePoints.length > MAX_GOOGLE_MAPS_ROUTE_POINTS
  const routeSplitIndex = shouldSplitDayRoute
    ? Math.ceil(dayRoutePoints.length / 2) - 1
    : -1
  const morningRoutePoints = shouldSplitDayRoute
    ? dayRoutePoints.slice(0, routeSplitIndex + 1)
    : dayRoutePoints
  const afternoonRoutePoints = shouldSplitDayRoute
    ? dayRoutePoints.slice(routeSplitIndex)
    : []

  function openDayRoute() {
    openRoutePoints(dayRoutePoints)
  }

  function openMorningRoute() {
    openRoutePoints(morningRoutePoints)
  }

  function openAfternoonRoute() {
    openRoutePoints(afternoonRoutePoints)
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

    return (
      '- ' + activity.name +
      '\n  ID de actividad: ' + activity.id +
      '\n  ' + details.join('\n  ')
    )
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
    const previousDays = orderedDays.filter(
      (itineraryDay, index) => index < currentIndex
    )
    const previousDayIds = new Set(
      previousDays.map((previousDay) => previousDay.id)
    )
    const futureDayIds = new Set(
      orderedDays
        .filter((itineraryDay, index) => index > currentIndex)
        .map((futureDay) => futureDay.id)
    )
    const selectedAssignments = allItineraryItems.filter(
      (item) => selectedDayIds.has(item.day_id)
    )
    const previousItineraryItems = allItineraryItems.filter(
      (item) => previousDayIds.has(item.day_id)
    )
    const futureItineraryItems = allItineraryItems.filter(
      (item) => futureDayIds.has(item.day_id)
    )
    const previousActivityIds = new Set(
      previousItineraryItems
        .filter((item) => item.activity_id)
        .map((item) => Number(item.activity_id))
    )
    const futureActivityIds = new Set(
      futureItineraryItems
        .filter((item) => item.activity_id)
        .map((item) => Number(item.activity_id))
    )
    const cityActivities = activities.filter(
      (activity) => activity.city === day.city
    )
    const completed = cityActivities.filter(
      (activity) =>
        activity.done ||
        previousActivityIds.has(Number(activity.id))
    )
    const completedIds = new Set(
      completed.map((activity) => Number(activity.id))
    )
    const pending = cityActivities.filter(
      (activity) => !completedIds.has(Number(activity.id))
    )
    const assignedElsewhere = pending.filter(
      (activity) =>
        futureActivityIds.has(Number(activity.id)) &&
        !selectedAssignments.some(
          (item) => Number(item.activity_id) === Number(activity.id)
        )
    )
    const available = pending.filter(
      (activity) => !assignedElsewhere.includes(activity)
    )
    const previousExternalPlaces = previousItineraryItems
      .filter(
        (item) =>
          !item.activity_id &&
          item.item_type !== 'transport' &&
          item.item_type !== 'note' &&
          item.item_type !== 'free_time' &&
          (item.maps_name || item.title)
      )
      .map((item) => {
        const previousDay = previousDays.find(
          (candidate) => candidate.id === item.day_id
        )
        return {
          title: item.title || item.maps_name,
          mapsName: item.maps_name || '',
          dayNumber: previousDay?.day_number || '?',
        }
      })
      .filter(
        (place, index, places) =>
          places.findIndex(
            (candidate) =>
              String(candidate.mapsName || candidate.title)
                .trim()
                .toLowerCase() ===
              String(place.mapsName || place.title)
                .trim()
                .toLowerCase()
          ) === index
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
      'LUGARES YA VISITADOS SEGÚN EL ITINERARIO ANTERIOR',
      completed.length
        ? completed.map(formatPromptActivity).join('\n')
        : '- Ninguna actividad vinculada registrada',
      previousExternalPlaces.length
        ? previousExternalPlaces
            .map(
              (place) =>
                '- ' + place.title +
                ' (Día ' + place.dayNumber + ')' +
                (place.mapsName
                  ? '\n  Google Maps: ' + place.mapsName
                  : '')
            )
            .join('\n')
        : '- Ningún establecimiento externo registrado en días anteriores',
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
      'REGLAS CRÍTICAS',
      '- No intentes meter todo. El día debe ser orgánico, cómodo, geográficamente coherente y bien aprovechado.',
      '- Incluye normalmente una Parada para tomar algo antes de la Comida. Si no hay un local claro, crea una pausa flexible por la zona.',
      '- lunch debe empezar normalmente entre las 14:00 y las 15:00. Solo puede adelantarse por una reserva, cierre o restricción objetiva, y debes indicarlo antes de cerrar el plan.',
      '- afternoon_coffee va inmediatamente después de lunch, antes de otra visita principal y nunca más tarde de las 16:00.',
      '- afternoon_coffee solo puede ser café o matcha real. Refrescos, cola, cerveza, cócteles, zumos y postres no cumplen ese rol.',
      '- Iyoshi Cola es una bebida especial opcional y nunca puede clasificarse como afternoon_coffee.',
      '- Elige una sola comida y una sola cena principales por día. Las alternativas se explican, pero no entran en el JSON.',
      '- Un restaurante de prioridad alta no tiene que ser una experiencia especial. Elige por adecuación al momento, ruta, horario, variedad y nivel de ocasión.',
      '',
      'NUESTRO RITMO DE VIAJE',
      '- No nos importa madrugar y nos gusta caminar bastante durante la mañana.',
      '- Lo primero al salir del hotel debe ser tomar un café. Prioriza un café guardado cerca del hotel o de la primera visita; si no existe, recomienda uno cercano y márcalo como recomendación externa.',
      '- A media mañana queremos normalmente un segundo café, integrado en la ruta y sin crear un desvío importante. Es opcional si no encaja de forma natural.',
      '- No encadenes pausas como una checklist: entre un café y la primera cerveza debe haber normalmente visitas, paseo y al menos 90 minutos, salvo una razón excepcional.',
      '- Entre las 12:00 y las 13:00 nos suele apetecer una primera cerveza o una parada agradable, pero es una preferencia flexible, no una obligación ni un destino.',
      '- REGLA ESTRICTA: la Parada para tomar algo debe ocurrir antes de la Comida. Nunca la coloques después de comer ni la uses como sobremesa.',
      '- Solo puedes omitir la Parada para tomar algo por una restricción objetiva importante. Debes explicar expresamente el motivo. No la traslades a después de la Comida.',
      '- Nunca alteres la dirección del recorrido, adelantes la visita a un barrio posterior o provoques un retroceso para encontrar una cervecería concreta.',
      '- Si hay un bar, izakaya, terraza o local agradable que encaja naturalmente antes de comer, inclúyelo. Si no, crea una Parada flexible para tomar algo por la zona antes de la Comida, sin local concreto ni desvío.',
      '- Comemos con horario español, normalmente entre las 14:00 y las 15:00. No programes lunch a las 12:00 salvo restricción objetiva importante.',
      '- Para comida y cena selecciona una opción recomendada y, si aporta valor, una alternativa flexible y una alternativa especial.',
      '- Si faltan restaurantes guardados adecuados en la zona, recomienda un sitio externo casual o good_local, o deja una comida flexible. No uses automáticamente el único restaurante especial guardado.',
      '- Explica la elección según ruta, horario, prioridad, variedad, reserva y nivel de ocasión.',
      '- Después de comer queremos siempre el café de sobremesa antes de retomar las visitas principales de la tarde. La secuencia normal es lunch → afternoon_coffee → paseo o visitas de tarde.',
      '- REGLA ESTRICTA: afternoon_coffee debe empezar después de terminar lunch y nunca más tarde de las 16:00.',
      '- No coloques una actividad principal entre lunch y afternoon_coffee. Solo puede haber un desplazamiento corto y directo hasta el café.',
      '- Si la comida termina tarde y no es posible tomar café antes de las 16:00, omite afternoon_coffee. No lo reprogrames a las 17:00, 18:00, 19:00 ni por la noche.',
      '- Si no existe una cafetería concreta que encaje de forma natural justo después de comer, crea una pausa flexible de café por la zona antes de las 16:00 o prescinde de indicar un establecimiento.',
      '- Si existe margen real y el hotel queda razonablemente conectado, valora volver al hotel para descansar, ducharnos y cambiarnos antes de salir de noche. No fuerces esta vuelta si rompe la ruta.',
      '- Casi todas las noches queremos una zona animada o agradable, tomar algo antes de cenar, una cena interesante o especial con horario español y después otra copa o un paseo nocturno.',
      '- Cenamos normalmente entre las 21:00 y las 22:30. Solo adelanta la cena por reservas u horarios de cierre y explica el motivo.',
      '- Para las pausas de café y cerveza, prioriza ante todo establecimientos agradables y situados de forma natural en el recorrido.',
      '- Una cafetería moderna o trendy, de especialidad o con buen matcha es un plus, no un requisito ni un destino obligatorio.',
      '- Si hay varias cafeterías cercanas y equivalentes, usa café de especialidad o buen matcha como criterio de desempate. No organices cada parada de café alrededor de estas preferencias.',
      '- Excepción para Laia: si existe un establecimiento realmente especializado en matcha situado directamente en la ruta o con un desvío de hasta 5 minutos, inclúyelo con prioridad y úsalo en lugar de una de las pausas de café, no como una parada adicional consecutiva.',
      '- Si el especialista en matcha exige 10 minutos o más de desvío, menciónalo como oportunidad para otro momento o día, pero no alteres automáticamente la ruta.',
      '- Para cerveza, cualquier bar, izakaya, terraza o local agradable y bien situado es válido.',
      '- La cerveza artesanal, especialmente IPAs y ales, y los taprooms o brewpubs son un plus si aparecen de forma natural en la ruta, no una obligación diaria.',
      '- Una terraza o espacio exterior suma puntos tanto para café como para cerveza, pero nunca debe justificar por sí solo un desplazamiento.',
      '- Si una cafetería, matcha bar o cervecería está guardada expresamente en Japan26, trátala como una actividad de interés normal y trata de ubicarla en el día geográficamente adecuado según su prioridad.',
      '- Si la parada no está guardada y una opción especial exige desviarse, elige una cafetería normal agradable o un bar cualquiera situado en la ruta.',
      '- En cada recomendación externa indica: nombre exacto, tipo de local, por qué encaja, desvío estimado, si tiene terraza o exterior y qué información debe comprobarse.',
      '- No inventes establecimientos. Si no puedes verificar que siguen abiertos, marca claramente el sitio como por comprobar.',
      '',
      'ORDEN FUNCIONAL DE LAS PAUSAS',
      '- En la respuesta visible usa siempre nombres en castellano: Café al salir, Café de media mañana, Parada para tomar algo, Comida, Café post comida, Copa antes de cenar, Cena y Copa después de cenar.',
      '- No muestres etiquetas técnicas en inglés como beer_stop, lunch o afternoon_coffee fuera del bloque JSON.',
      '- Café al salir debe ser la primera parada tras salir del hotel.',
      '- Café de media mañana es opcional y debe estar separado de la Parada para tomar algo por visitas, paseo y tiempo suficiente.',
      '- Café post comida debe empezar después de terminar la Comida, ser la siguiente pausa real antes de otra visita principal y comenzar como máximo a las 16:00.',
      '- Café post comida solo admite café o matcha real. Iyoshi Cola y cualquier refresco deben quedar como Bebida especial opcional.',
      '- La Parada para tomar algo debe terminar antes de que empiece la Comida. Su ausencia solo es válida si aparece como OMITIDA JUSTIFICADAMENTE con una razón objetiva.',
      '- pre_dinner_drink debe aparecer antes de dinner y after_dinner_drink después de dinner.',
      '- Si el orden geográfico contradice la función horaria de una parada, selecciona otro establecimiento o reconstruye la ruta completa. No mantengas un establecimiento bien elegido en una posición temporal incorrecta.',
      '',
      'AUDITORÍA DE OPORTUNIDADES EN RUTA',
      '- Antes de cerrar el orden, revisa si el recorrido pasa cerca de un establecimiento o actividad que está previsto visitar más tarde.',
      '- Si el lugar está de camino y su función horaria encaja, visítalo en la primera pasada y no continúes para regresar después.',
      '- Si el lugar está de camino pero su función horaria todavía no encaja, no fuerces la parada: elige una alternativa posterior que respete la dirección general o recoloca el resto del día.',
      '- No atravieses la zona de un afternoon_coffee para realizar otra actividad y volver después al mismo café.',
      '- Solo permite una excepción por horario de apertura, reserva o una razón objetiva que debes explicar.',
      '',
      'AUDITORÍA DE OPORTUNIDADES EN RUTA',
      '- Después de definir la ruta principal, revisa si el recorrido pasa prácticamente junto a algún lugar característico, tienda interesante, callejón, yokocho, establecimiento de watch hunting, mercado, gran tienda japonesa o actividad guardada de prioridad media o baja.',
      '- Si el lugar aporta valor y supone un desvío mínimo, menciónalo como OPORTUNIDAD EN RUTA.',
      '- Para cada oportunidad indica el nombre exacto, por qué puede interesarnos, el desvío adicional aproximado, el tiempo sugerido, el tramo del recorrido donde aparece y la condición para entrar.',
      '- No conviertas automáticamente estas oportunidades en paradas fijas y no las incluyas en el JSON salvo que el usuario las apruebe o estén guardadas con prioridad suficiente para incorporarlas.',
      '- Si solo merece la pena asomarse durante el paseo, intégralo en la descripción del desplazamiento sin crear una actividad independiente.',
      '- Una oportunidad en ruta nunca debe comprometer una reserva, una actividad prioritaria, la comida, la cena ni la comodidad general del día.',
      '- Considera desvío mínimo entre 0 y 5 minutos. Entre 5 y 10 minutos solo menciónalo si tiene un interés claro; con más de 10 minutos no lo trates como oportunidad de paso.',
      '- Ejemplos de oportunidad: pasar junto a MEGA Don Quijote en Shibuya, una relojería de segunda mano, una tienda vintage, un yokocho o una calle comercial característica.',
      '',
      'COHERENCIA GEOGRÁFICA Y PRUEBA ANTI-YOYÓ',
      '- Diseña primero una dirección general predominantemente unidireccional y coloca después las pausas y establecimientos.',
      '- Evalúa cada parada usando el trayecto completo parada anterior → parada propuesta → parada siguiente, no solo la distancia desde la parada anterior.',
      '- Compara ese trayecto con ir directamente de la parada anterior a la siguiente y calcula el desvío adicional real.',
      '- No bajes a una zona para después volver a subir, no cruces dos veces el mismo corredor y no visites prematuramente un barrio que ya está previsto para más tarde.',
      '- Si un establecimiento está en una zona que se visitará después, resérvalo para cuando la ruta llegue naturalmente allí o escoge una alternativa cercana en la zona actual.',
      '- Una buena recomendación colocada en un mal momento es una mala recomendación.',
      '- Antes de cerrar el plan realiza una auditoría anti-yoyó y reordena o sustituye cualquier parada que cause retrocesos.',
      '- La auditoría debe comprobar también que ninguna pausa gastronómica queda después de una actividad cuando, por función y recorrido, debería haberse realizado antes.',
      '- Una buena recomendación no está correctamente planificada si se pasa cerca de ella, se continúa hasta otra actividad y luego se regresa.',
      '',
      'CALIDAD DE LOS RECORRIDOS A PIE',
      '- Cuando conecten naturalmente dos paradas, guía el paseo por callejones con ambiente, yokocho, shotengai, calles peatonales, canales, parques, calles comerciales locales o recorridos arquitectónicos interesantes.',
      '- Si el recorrido interesante añade de 0 a 5 minutos, priorízalo; entre 5 y 10 minutos úsalo solo si aporta claramente valor; con más de 10 minutos no lo incluyas automáticamente.',
      '- Integra estos rincones dentro de la línea de desplazamiento y no conviertas cada callejón en una actividad independiente.',
      '- Indica el nombre concreto del callejón o calle, el tiempo total y el desvío adicional. No inventes conexiones ni tiempos.',
      '',
      'COBERTURA Y MUST FALTANTES',
      '- Revisa si falta algún lugar verdaderamente imprescindible o muy representativo de la ciudad, barrio o zona seleccionada.',
      '- No generes una lista turística genérica. Solo señala ausencias con valor claro, buen encaje geográfico, baja redundancia y compatibilidad con los días restantes.',
      '- Clasifica cada sugerencia como MUST faltante, muy recomendable u opcional, y explica dónde encajaría, cuánto tiempo requiere y qué sustituirías si el día ya está lleno.',
      '- No incluyas automáticamente un MUST faltante en el JSON: preséntalo primero para que el usuario decida.',
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
      '2. Considera realizados todos los lugares que aparecen en días anteriores del itinerario y no los vuelvas a proponer. Esto incluye actividades vinculadas y establecimientos externos con nombre o Google Maps.',
      '3. Si una actividad no realizada fue eliminada del itinerario anterior, vuelve a tratarla como pendiente y disponible.',
      '4. Prioriza una zona principal por día.',
      '5. Combina como máximo dos o tres barrios, y solo cuando sean contiguos o formen un recorrido natural.',
      '6. Evita mezclar zonas alejadas solo para rellenar horas.',
      '7. En Tokio, evita combinar la zona este, como Asakusa, Ueno o Akihabara, con la zona oeste, como Shibuya, Harajuku o Shinjuku, salvo que exista un motivo excepcional y lo expliques.',
      '8. Es preferible proponer un día corto de 4 o 5 horas que una jornada geográficamente dispersa.',
      '9. Ten en cuenta cuántos días quedan en la ciudad. Si aún hay días suficientes, deja las actividades de otras zonas para esos días en lugar de incluirlas ahora.',
      '10. Distribuye la carga entre los días seleccionados y evita agotar en un solo día actividades que encajan mejor en jornadas posteriores.',
      '11. Antes de cerrar el plan, revisa expresamente si estás metiendo actividades redundantes o zonas que sería mejor reservar para días posteriores.',
      '12. Prioriza Imprescindible y Alta, pero no uses la prioridad como excusa para romper la coherencia geográfica.',
      '13. Integra cafés, cerveza, comida, cena y copas según nuestro ritmo y cerca del recorrido.',
      '14. Ordena las paradas de forma práctica y caminable cuando sea posible.',
      '15. Incluye siempre cada desplazamiento entre paradas como una línea propia del itinerario, indicando el medio recomendado y un tiempo estimado realista.',
      '16. Para cada trayecto especifica una opción concreta, por ejemplo: 15 min andando, 12 min en metro más 5 min andando, 20 min en tren o 10 min en taxi.',
      '17. Añade margen razonable para entrar y salir de estaciones, esperas, transbordos, orientación y pequeños retrasos. No uses solo el tiempo puro del tren.',
      '18. Prioriza caminar cuando el trayecto sea agradable y razonable; usa metro o tren cuando reduzca claramente el tiempo o el cansancio.',
      '19. Si no puedes verificar una duración exacta, da una estimación prudente y márcala como aproximada.',
      '20. Los tiempos de traslado deben contar dentro de la duración total del día y pueden justificar eliminar o mover actividades.',
      '21. Si alguna opción encaja mejor en otro día restante, déjala fuera del plan principal e indica en qué día o zona la colocarías.',
      '22. Si faltan actividades para completar la jornada, conserva tiempo libre. No cruces la ciudad para rellenar horas.',
      '23. No inventes lugares salvo en una sección opcional separada, y no los añadas al itinerario principal.',
      '24. Señala horarios, reservas o cierres que deban comprobarse.',
      '',
      'FORMATO DE RESPUESTA',
      '- Resumen de barrios y lógica de agrupación.',
      '- Plan por día con horas aproximadas, orden y duración.',
      '- Entre cada dos paradas incluye una línea de traslado con medio y duración, por ejemplo: → 15 min andando o → 20 min en metro, incluido el acceso y la espera.',
      '- Incluye al final el tiempo total aproximado de visitas, pausas y desplazamientos.',
      '- Cafés, primera cerveza, comida, cena y copas integrados en la ruta y etiquetados por su role funcional.',
      '- Confirma expresamente que la Parada para tomar algo aparece antes de la Comida, que el Café post comida aparece después de la Comida, que no hay una visita principal entre ambos y que el Café post comida empieza como máximo a las 16:00.',
      '- Incluye una AUDITORÍA DE SECUENCIA DE PAUSAS en castellano: Parada para tomar algo antes de la Comida; Café post comida después de la Comida; Café post comida no más tarde de las 16:00.',
      '- Qué dejar para otro día y por qué, teniendo en cuenta los días restantes en la ciudad.',
      '- Solapamientos y descartes: actividades redundantes o de poco valor adicional que no incluirías.',
      '- Recomendaciones externas claramente marcadas como no guardadas en Japan26.',
      '- Para cada recomendación externa: nombre exacto, tipo, motivo geográfico y experiencial, desvío estimado, terraza o exterior y datos por comprobar.',
      '- Auditoría anti-yoyó: dirección general, retrocesos detectados y paradas recolocadas.',
      '- Oportunidades en ruta: lugares interesantes de paso, con desvío y tiempo sugerido, claramente separados del itinerario fijo.',
      '- Decisiones gastronómicas: una comida principal y una cena principal, con una alternativa opcional fuera del JSON.',
      '- MUST faltantes para revisar antes del JSON.',
      '- Advertencias y comprobaciones necesarias.',
      '',
      'SELECCIÓN DE COMIDA Y CENA',
      '- Clasifica cada restaurante, aunque sea de forma provisional, como casual, good_local, elevated, special o destination.',
      '- La prioridad indica cuánto nos interesa el lugar; el nivel de ocasión indica qué tipo de comida representa. No confundas ambos conceptos.',
      '- casual y good_local son opciones normales para la mayoría de comidas y cenas.',
      '- elevated puede usarse cuando encaja bien y aporta variedad.',
      '- special o destination deben tratarse como decisiones materiales: no los elijas automáticamente si condicionan el día, requieren reserva o elevan mucho el gasto o la formalidad.',
      '- Evita cenas special o destination en noches consecutivas salvo preferencia expresa.',
      '- Antes de elegir una cena especial, revisa las cenas de días anteriores y las reservas o experiencias especiales de días posteriores.',
      '- Si solo hay una opción guardada y es special o destination, ofrece primero una recomendación externa casual o good_local y presenta la opción especial por separado.',
      '- Para cada comida y cena presenta: RECOMENDADA, ALTERNATIVA FLEXIBLE y ALTERNATIVA ESPECIAL cuando exista. Solo la elección final entra en el JSON.',
      '',
      'FASE DE DECISIÓN ANTES DE CERRAR EL ITINERARIO',
      '- Antes de cerrar el día o generar el JSON, analiza si existen decisiones subjetivas capaces de cambiar materialmente la ruta geográfica, la distribución entre comida y cena, la inclusión de una experiencia prioritaria, el ritmo del día, el regreso al hotel, la variedad gastronómica, la asignación de una visita a este día u otro o los horarios condicionados por reservas.',
      '',
      'TIPOS DE DECISIÓN',
      '- DECISIONES OBJETIVAS: resuélvelas automáticamente con datos, distancias, horarios y preferencias conocidas. Incluyen el orden geográfico, aperturas, última admisión, desplazamientos, cercanía, reservas y viabilidad real.',
      '- DECISIONES DE PREFERENCIA: pregunta solo cuando dos o más alternativas razonables produzcan experiencias claramente diferentes y las preferencias conocidas no permitan elegir con seguridad.',
      '- DECISIONES MIXTAS: presenta el trade-off y pregunta antes de decidir. Distingue entre mejor opción logística, mejor opción según prioridades, mejor opción para el ritmo del día y recomendación final provisional.',
      '',
      'CUÁNDO HACER PREGUNTAS',
      '- No hagas preguntas por rutina.',
      '- Haz 0 preguntas si existe una opción claramente superior y compatible con las preferencias conocidas.',
      '- Haz 1 pregunta si solo existe una decisión relevante.',
      '- Haz 2 o 3 preguntas si varias decisiones pueden cambiar sustancialmente el día.',
      '- Nunca hagas más de 3 preguntas en una misma ronda.',
      '- No preguntes por detalles menores, preferencias ya expresadas o decisiones sin efecto real sobre el itinerario.',
      '- Agrupa todas las preguntas en una sola ronda antes de reconstruir el día.',
      '- Si falta información objetiva, pregunta solo cuando afecte realmente a la viabilidad.',
      '',
      'FORMATO DE LAS PREGUNTAS',
      '- Cada pregunta debe presentar una decisión concreta con opciones A y B, y C solo cuando sea realmente distinta.',
      '- Explica brevemente cómo afecta cada opción a la ruta, al ritmo o a la experiencia.',
      '- Incluye una recomendación provisional razonada.',
      '- Permite responder rápidamente con un formato como 1A, 2B, 3A.',
      '- Evita preguntas vagas como Qué preferís, Os parece bien o Queréis cambiar algo.',
      '',
      'REGLA PARA GENERAR EL JSON',
      '- Si no existen decisiones materiales pendientes, presenta el plan, explica brevemente las decisiones y genera el JSON definitivo.',
      '- Si existen decisiones materiales pendientes, presenta una propuesta provisional, formula un máximo de 3 preguntas y no generes todavía el JSON.',
      '- Espera las respuestas del usuario y solo entonces reconstruye el día completo y genera el JSON definitivo.',
      '- Nunca metas en el JSON alternativas de respaldo, MUST aún no aprobados, oportunidades en ruta no aprobadas ni recomendaciones geográficas no verificadas.',
      '',
      'RECONSTRUCCIÓN DESPUÉS DE LAS RESPUESTAS',
      '- Reconstruye el día completo desde cero, no te limites a sustituir el elemento preguntado.',
      '- Recalcula el orden geográfico, los desplazamientos, aperturas, última admisión y reservas.',
      '- Ejecuta de nuevo la auditoría anti-yoyó.',
      '- Reevalúa el ritmo general, la vuelta al hotel, la variedad gastronómica y la protección de las actividades prioritarias.',
      '- Asegura que el horario de la cena principal no quede comprometido.',
      '- Explica brevemente las consecuencias de las decisiones tomadas.',
      '',
      'REGLA DE CONSISTENCIA',
      '- Cuando cambies una visita, restaurante, barrio o franja horaria, identifica qué elementos quedan afectados, cuáles se mantienen, cuáles cambian de orden y cuáles deben trasladarse.',
      '- Ningún elemento puede desaparecer silenciosamente.',
      '- Clasifica todo elemento eliminado como MOVIDO A OTRO DÍA, OPCIONAL, DESCARTADO o PENDIENTE DE RECOLOCAR, explicando brevemente el motivo o la condición.',
      '',
      'RESPUESTA POR DEFECTO',
      '- Si el usuario no responde o pide que decidas directamente, aplica las preferencias conocidas, prioriza los lugares de prioridad alta, evita zigzags, protege las reservas, conserva variedad y deja margen para cafés, paseos, descanso y cambios de ritmo.',
      '- Explica en 2 o 3 frases por qué has elegido esa opción y marca claramente los elementos movidos, opcionales o pendientes.',
      '',
      'AUDITORÍA DE COBERTURA DE LA ZONA',
      '- La revisión de MUST faltantes es una auditoría, no una invitación a añadir más paradas.',
      '- Concluye obligatoriamente con una sola categoría: ZONA BIEN CUBIERTA, MUST FALTANTE PARA OTRO DÍA o MUST FALTANTE QUE MERECE ENTRAR.',
      '- Si la selección actual representa bien la zona y produce un día orgánico, cómodo, variado y aprovechado, indica expresamente que no añadirías nada más.',
      '- Un día aprovechado no es un día lleno minuto a minuto. Debe tener dirección clara, visitas valiosas, pausas naturales, desplazamientos realistas y margen para disfrutar.',
      '- No metas nada con calzador. La organicidad y comodidad tienen prioridad sobre el número de paradas.',
      '',
      'REGLAS PARA RECOMENDACIONES EXTERNAS',
      '- No incluyas una recomendación externa en el plan principal sin comprobar su encaje entre la parada anterior y la siguiente.',
      '- Calcula el desvío total, no solo la distancia desde la parada anterior.',
      '- Para una recomendación externa de café, cerveza o copa, busca idealmente un desvío de 0 a 5 minutos. Una opción especialmente atractiva puede justificar hasta 10 minutos adicionales. Más de 10 minutos no debe incluirse automáticamente. Para comida puede llegar a 20 minutos si realmente merece la pena.',
      '- Si no puedes verificar la geografía o los tiempos, deja geography_verified en false y explica qué debe comprobarse.',
      '- Una recomendación con geography_verified false puede aparecer como opción, pero no debe presentarse como parada fiable ni usar tiempos exactos inventados.',
      '- No afirmes que un trayecto dura 10 o 15 minutos si no lo has comprobado.',
      '- Si dos paradas consecutivas ocurren en el mismo establecimiento, fusiónalas en una sola parada con un único intervalo horario.',
      '- No generes una recomendación externa únicamente para cumplir el patrón de cerveza antes de comer.',
      '- Si no existe una opción externa fiable, crea una pausa flexible con type flexible_break, sin destino concreto, sin maps_name y sin desplazamiento específico.',
      '- Para una pausa flexible usa internamente role beer_stop, pero en la respuesta visible llámala Parada para tomar algo o Buscar un sitio para tomar algo por la zona.',
      '',
      'BLOQUE IMPORTABLE PARA JAPAN26',
      'Al final de la respuesta incluye un único bloque de código JSON válido y después no escribas nada más.',
      'No incluyas comentarios dentro del JSON. No inventes activity_id: usa únicamente los ID de actividad incluidos arriba.',
      'Usa exactamente esta estructura:',
      '{',
      '  \"japan26_import\": true,',
      '  \"version\": 1,',
      '  \"days\": [',
      '    {',
      '      \"day_number\": ' + day.day_number + ',',
      '      \"title\": \"Título propuesto\",',
      '      \"summary\": \"Resumen breve\",',
      '      \"items\": [',
      '        { \"type\": \"activity\", \"activity_id\": 123, \"start_time\": \"09:00\", \"end_time\": \"10:30\" },',
      '        { \"type\": \"transport\", \"start_time\": \"10:30\", \"end_time\": \"10:50\", \"title\": \"Traslado a la siguiente zona\", \"description\": \"15 min en metro y 5 min andando\" },',
      '        { \"type\": \"flexible_break\", \"role\": \"beer_stop\", \"start_time\": \"12:30\", \"end_time\": \"13:15\", \"title\": \"Buscar un sitio para tomar algo por la zona\", \"description\": \"Elegir sobre la marcha un bar, izakaya o terraza sin desviarse\" },',
      '        { \"type\": \"external\", \"role\": \"lunch\", \"start_time\": \"14:00\", \"end_time\": \"15:15\", \"title\": \"Nombre exacto del local\", \"description\": \"Recomendación externa y motivo\", \"maps_name\": \"Nombre exacto en Google Maps\", \"previous_stop\": \"Parada anterior\", \"next_stop\": \"Parada siguiente\", \"travel_from_previous_minutes\": 10, \"travel_to_next_minutes\": 8, \"detour_minutes\": 5, \"transport_mode\": \"walking\", \"route_direction\": \"Zona A → Zona B\", \"causes_backtracking\": false, \"geography_verified\": true, \"verification_note\": \"Ruta y horario comprobados\" }',
      '      ]',
      '    }',
      '  ]',
      '}',
      'Para actividades existentes usa type activity y activity_id. Para traslados usa type transport. Para pausas sin local concreto usa type flexible_break y role. Para recomendaciones externas usa type external e incluye siempre role, geography_verified, previous_stop, next_stop, detour_minutes, route_direction, causes_backtracking y verification_note.',
      'En el JSON conserva estos códigos técnicos para que Japan26 pueda importarlos: morning_coffee, mid_morning_coffee, beer_stop, lunch, afternoon_coffee, pre_dinner_drink, dinner y after_dinner_drink.',
      'En el texto visible tradúcelos como Café al salir, Café de media mañana, Parada para tomar algo, Comida, Café post comida, Copa antes de cenar, Cena y Copa después de cenar.',
      'Antes de devolver el JSON valida obligatoriamente: 1) la Parada para tomar algo termina antes de la Comida; 2) la Comida empieza normalmente entre 14:00 y 15:00; 3) el Café post comida empieza después de la Comida; 4) no hay una visita principal entre Comida y Café post comida; 5) el Café post comida empieza como máximo a las 16:00; 6) el Café post comida es café o matcha real; 7) solo hay una comida y una cena principales.',
      'Si falla cualquiera de estas comprobaciones, no generes el JSON: corrige y reconstruye primero el día completo.',
      '- La ausencia de Parada para tomar algo no puede marcarse simplemente como correcta. Debe figurar como OMITIDA JUSTIFICADAMENTE con una razón objetiva concreta; en caso contrario, añade una pausa flexible antes de la Comida.',
      'Todas las horas deben usar HH:MM. Para una actividad que termina a medianoche usa 23:59, no 00:00, porque 00:00 se interpreta como anterior a una hora nocturna del mismo día. Incluye en items tanto las visitas como cada traslado, café, cerveza, comida, cena y copa.',
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

  function openImportProposal() {
    setImportText('')
    setImportPreview(null)
    setImportSelectedKeys([])
    setImportError('')
    setImportSuccess('')
    setShowImportProposal(true)
  }

  function closeImportProposal() {
    if (importingProposal) {
      return
    }
    setShowImportProposal(false)
    setImportPreview(null)
    setImportError('')
    setImportSuccess('')
  }

  async function pasteImportText() {
    try {
      const clipboardText = await navigator.clipboard.readText()
      setImportText(clipboardText)
      setImportError('')
    } catch {
      setImportError(
        'El navegador no permite leer el portapapeles. Mantén pulsado en el cuadro y elige Pegar.'
      )
    }
  }

  function extractImportJson(rawText) {
    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()

    try {
      return JSON.parse(cleaned)
    } catch {
      const start = cleaned.indexOf('{')
      const end = cleaned.lastIndexOf('}')
      if (start < 0 || end <= start) {
        throw new Error('No se encontró un bloque JSON.')
      }
      return JSON.parse(cleaned.slice(start, end + 1))
    }
  }

  function isValidTime(value) {
    return (
      value === null ||
      value === undefined ||
      value === '' ||
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
    )
  }

  function analyzeImportProposal() {
    setImportError('')
    setImportSuccess('')

    let parsed
    try {
      parsed = extractImportJson(importText)
    } catch (error) {
      setImportError(
        'No se pudo leer el JSON: ' + error.message
      )
      return
    }

    if (
      parsed.japan26_import !== true ||
      Number(parsed.version) !== 1 ||
      !Array.isArray(parsed.days)
    ) {
      setImportError(
        'El bloque no tiene el formato Japan26 esperado.'
      )
      return
    }

    const errors = []
    const previewDays = []

    parsed.days.forEach((importDay, dayIndex) => {
      const targetDay = itineraryDays.find(
        (candidate) =>
          Number(candidate.day_number) ===
          Number(importDay.day_number)
      )

      if (!targetDay) {
        errors.push(
          'El Día ' + importDay.day_number + ' no existe.'
        )
        return
      }

      if (!Array.isArray(importDay.items)) {
        errors.push(
          'El Día ' + importDay.day_number +
          ' no contiene una lista de elementos.'
        )
        return
      }

      const previewItems = []
      importDay.items.forEach((importItem, itemIndex) => {
        const key = dayIndex + '-' + itemIndex
        const type = String(importItem.type || '')
        if (!['activity', 'transport', 'external', 'flexible_break'].includes(type)) {
          errors.push(
            'Tipo no válido en el Día ' +
            importDay.day_number + ': ' + type
          )
          return
        }

        if (
          !isValidTime(importItem.start_time) ||
          !isValidTime(importItem.end_time)
        ) {
          errors.push(
            'Hora no válida en el Día ' + importDay.day_number + '.'
          )
          return
        }

        let linkedActivity = null
        if (type === 'activity') {
          linkedActivity = activities.find(
            (activity) =>
              Number(activity.id) ===
              Number(importItem.activity_id)
          )
          if (!linkedActivity) {
            errors.push(
              'La actividad ' + importItem.activity_id +
              ' no existe en Japan26.'
            )
            return
          }
        } else if (!String(importItem.title || '').trim()) {
          errors.push(
            'Falta el título en un elemento del Día ' +
            importDay.day_number + '.'
          )
          return
        }

        const geographyVerified =
          type !== 'external' ||
          (importItem.geography_verified === true &&
            importItem.causes_backtracking !== true)

        previewItems.push({
          ...importItem,
          key,
          linkedActivity,
          geographyVerified,
        })
      })

      previewDays.push({
        ...importDay,
        targetDay,
        items: previewItems,
      })
    })

    if (errors.length > 0) {
      setImportError(errors.join(' '))
      return
    }

    const keys = previewDays.flatMap((previewDay) =>
      previewDay.items
        .filter((item) => item.geographyVerified)
        .map((item) => item.key)
    )

    setImportPreview({ days: previewDays })
    setImportSelectedKeys(keys)
  }

  function toggleImportItem(key) {
    setImportSelectedKeys((current) =>
      current.includes(key)
        ? current.filter((itemKey) => itemKey !== key)
        : [...current, key]
    )
  }

  async function importSelectedProposal() {
    if (!importPreview || importingProposal) {
      return
    }

    setImportingProposal(true)
    setImportError('')
    setImportSuccess('')

    let importedCount = 0

    for (const previewDay of importPreview.days) {
      const selectedItems = previewDay.items.filter((item) =>
        importSelectedKeys.includes(item.key)
      )

      if (selectedItems.length === 0) {
        continue
      }

      const existingResult = await supabase
        .from('itinerary_items')
        .select('id')
        .eq('day_id', previewDay.targetDay.id)

      if (existingResult.error) {
        setImportError(
          'No se pudo preparar el Día ' +
          previewDay.targetDay.day_number + '.'
        )
        setImportingProposal(false)
        return
      }

      const basePosition = (existingResult.data || []).length
      const rows = selectedItems.map((item, index) => {
        const isActivity = item.type === 'activity'
        const linkedActivity = item.linkedActivity
        const startTime = item.start_time || null
        let endTime = item.end_time || null

        if (startTime && endTime && endTime <= startTime) {
          endTime = startTime >= '20:00' && endTime === '00:00'
            ? '23:59'
            : null
        }

        return {
          day_id: previewDay.targetDay.id,
          activity_id: isActivity ? linkedActivity.id : null,
          item_type: isActivity
            ? 'activity'
            : item.type === 'transport'
              ? 'transport'
              : item.type === 'flexible_break'
                ? 'break'
                : 'manual',
          start_time: startTime,
          end_time: endTime,
          title: isActivity
            ? linkedActivity.name
            : String(item.title || '').trim(),
          description: String(item.description || '').trim(),
          link: isActivity ? linkedActivity.link || '' : '',
          maps_name: isActivity
            ? linkedActivity.maps_name || ''
            : String(item.maps_name || '').trim(),
          reserved: false,
          paid: false,
          position: basePosition + index,
        }
      })

      const insertResult = await supabase
        .from('itinerary_items')
        .insert(rows)
        .select()

      if (insertResult.error) {
        console.error('Error de importación:', insertResult.error)
        setImportError(
          'No se pudo importar el Día ' +
          previewDay.targetDay.day_number + ': ' +
          insertResult.error.message
        )
        setImportingProposal(false)
        return
      }

      importedCount += (insertResult.data || []).length
    }

    setImportingProposal(false)
    setImportSuccess(
      '✓ ' + importedCount +
      (importedCount === 1
        ? ' elemento añadido.'
        : ' elementos añadidos.')
    )
    await loadInformation()
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

        {!shouldSplitDayRoute ? (
          <button
            className="day-route-button"
            type="button"
            onClick={openDayRoute}
          >
            🗺️ Ruta del día
          </button>
        ) : (
          <div className="split-route-buttons">
            <p>
              Día dividido en dos rutas por el número de paradas.
            </p>

            <button
              className="day-route-button"
              type="button"
              onClick={openMorningRoute}
            >
              ☀️ Ruta de mañana
            </button>

            <button
              className="day-route-button afternoon"
              type="button"
              onClick={openAfternoonRoute}
            >
              🌆 Ruta de tarde
            </button>
          </div>
        )}

        <button
          className="day-prompt-button"
          type="button"
          onClick={openPromptGenerator}
        >
          ✨ Generar prompt
        </button>

        <button
          className="day-import-button"
          type="button"
          onClick={openImportProposal}
        >
          📥 Importar propuesta
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

      {showImportProposal && (
        <div
          className="compact-panel-backdrop"
          role="presentation"
          onClick={closeImportProposal}
        >
          <article
            className="compact-panel import-proposal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-proposal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="compact-panel-close"
              type="button"
              onClick={closeImportProposal}
              aria-label="Cerrar importación"
            >
              ×
            </button>

            <span className="compact-panel-icon">📥</span>
            <p className="section-label">IMPORTAR PROPUESTA</p>
            <h2 id="import-proposal-title">
              Llevar la propuesta al itinerario
            </h2>

            {!importPreview ? (
              <div className="import-proposal-form">
                <p>
                  Copia el bloque JSON generado por la IA y pégalo aquí.
                  También puedes pegar la respuesta completa.
                </p>

                <button
                  className="paste-import-button"
                  type="button"
                  onClick={pasteImportText}
                >
                  📋 Pegar desde el portapapeles
                </button>

                <textarea
                  value={importText}
                  onChange={(event) =>
                    setImportText(event.target.value)
                  }
                  placeholder="Pega aquí el bloque Japan26..."
                  aria-label="Respuesta de la IA"
                />

                {importError && (
                  <p className="import-proposal-error">
                    {importError}
                  </p>
                )}

                <button
                  className="save-button"
                  type="button"
                  disabled={!importText.trim()}
                  onClick={analyzeImportProposal}
                >
                  Analizar propuesta
                </button>
              </div>
            ) : (
              <div className="import-preview">
                {importPreview.days.map((previewDay) => (
                  <section key={previewDay.targetDay.id}>
                    <h3>
                      Día {previewDay.targetDay.day_number}
                      {previewDay.title
                        ? ' · ' + previewDay.title
                        : ''}
                    </h3>

                    {previewDay.items.map((item) => {
                      const title = item.linkedActivity
                        ? item.linkedActivity.name
                        : item.title
                      return (
                        <label
                          className="import-preview-item"
                          key={item.key}
                        >
                          <input
                            type="checkbox"
                            checked={importSelectedKeys.includes(item.key)}
                            onChange={() => toggleImportItem(item.key)}
                          />
                          <span>
                            <strong>
                              {item.start_time || 'Sin hora'} · {title}
                            </strong>
                            <small>
                              {item.type === 'activity'
                                ? 'Actividad existente'
                                : item.type === 'transport'
                                  ? 'Desplazamiento'
                                  : item.type === 'flexible_break'
                                    ? 'Pausa flexible · sin destino fijo'
                                    : item.geographyVerified
                                      ? 'Recomendación externa · geografía verificada'
                                      : '⚠ Recomendación externa · por comprobar'}
                            </small>
                            {item.type === 'external' && (
                              <small>
                                {item.previous_stop
                                  ? 'Desde: ' + item.previous_stop
                                  : 'Origen no indicado'}
                                {' · '}
                                {item.next_stop
                                  ? 'Hacia: ' + item.next_stop
                                  : 'Siguiente parada no indicada'}
                                {Number.isFinite(Number(item.detour_minutes))
                                  ? ' · Desvío: ' + item.detour_minutes + ' min'
                                  : ' · Desvío no indicado'}
                              </small>
                            )}
                            {item.type === 'external' &&
                              item.verification_note && (
                                <small>{item.verification_note}</small>
                              )}
                          </span>
                        </label>
                      )
                    })}
                  </section>
                ))}

                {importError && (
                  <p className="import-proposal-error">
                    {importError}
                  </p>
                )}

                {importSuccess && (
                  <p className="import-proposal-success">
                    {importSuccess}
                  </p>
                )}

                {!importSuccess &&
                  importPreview.days.some((previewDay) =>
                    previewDay.items.some(
                      (item) =>
                        item.type === 'external' &&
                        !item.geographyVerified
                    )
                  ) && (
                    <p className="import-proposal-warning">
                      Las recomendaciones externas no verificadas están
                      desmarcadas. Revísalas en Google Maps antes de
                      incluirlas.
                    </p>
                  )}

                {!importSuccess && (
                  <button
                    className="copy-prompt-button"
                    type="button"
                    disabled={
                      importSelectedKeys.length === 0 ||
                      importingProposal
                    }
                    onClick={importSelectedProposal}
                  >
                    {importingProposal
                      ? 'Importando...'
                      : 'Importar ' +
                        importSelectedKeys.length +
                        ' elementos'}
                  </button>
                )}

                <button
                  className="regenerate-prompt-button"
                  type="button"
                  disabled={importingProposal}
                  onClick={() => {
                    setImportPreview(null)
                    setImportError('')
                    setImportSuccess('')
                  }}
                >
                  Volver al texto pegado
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