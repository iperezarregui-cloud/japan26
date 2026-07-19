import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const initialNeighborhoods = [
  'Shinjuku',
  'Shibuya',
  'Harajuku',
  'Asakusa',
  'Ueno',
  'Akihabara',
  'Ginza',
  'Roppongi',
  'Odaiba',
  'Ikebukuro',
  'Otros',
]

function Neighborhoods({
  cityId,
  selectedNeighborhood,
  onSelectNeighborhood,
  onNeighborhoodsChange,
}) {
  const [neighborhoods, setNeighborhoods] =
    useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showManager, setShowManager] =
    useState(false)

  const [editingNeighborhood, setEditingNeighborhood] =
    useState(null)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    if (cityId === 'tokyo') {
      loadNeighborhoods()
    }
  }, [cityId])

  async function loadNeighborhoods() {
    setLoading(true)
    setErrorMessage('')

    const result = await supabase
      .from('neighborhoods')
      .select('*')
      .eq('city', 'tokyo')
      .order('position', {
        ascending: true,
      })
      .order('name', {
        ascending: true,
      })

    if (result.error) {
      console.error(
        'Error al cargar los barrios:',
        result.error
      )

      setErrorMessage(
        'No se pudieron cargar los barrios.'
      )

      setLoading(false)
      return
    }

    let loadedNeighborhoods = result.data || []

    if (loadedNeighborhoods.length === 0) {
      loadedNeighborhoods =
        await createInitialNeighborhoods()
    }

    updateNeighborhoods(loadedNeighborhoods)
    setLoading(false)
  }

  async function createInitialNeighborhoods() {
    const initialRows = initialNeighborhoods.map(
      (name, index) => ({
        city: 'tokyo',
        name,
        position: index,
      })
    )

    const result = await supabase
      .from('neighborhoods')
      .insert(initialRows)
      .select()

    if (result.error) {
      console.error(
        'Error al crear los barrios iniciales:',
        result.error
      )

      setErrorMessage(
        'No se pudieron crear los barrios iniciales: ' +
          result.error.message
      )

      return []
    }

    return (result.data || []).sort(
      (first, second) =>
        first.position - second.position
    )
  }

  function updateNeighborhoods(nextNeighborhoods) {
    setNeighborhoods(nextNeighborhoods)

    if (onNeighborhoodsChange) {
      onNeighborhoodsChange(
        nextNeighborhoods.map(
          (neighborhood) => neighborhood.name
        )
      )
    }
  }

  function toggleManager() {
    setShowManager((currentValue) => !currentValue)
    setEditingNeighborhood(null)
    setErrorMessage('')
  }

  async function addNeighborhood(event) {
    event.preventDefault()

    if (saving) {
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)

    const name = String(
      formData.get('name') || ''
    ).trim()

    if (!name) {
      setErrorMessage(
        'Escribe el nombre del barrio.'
      )
      return
    }

    const duplicated = neighborhoods.some(
      (neighborhood) =>
        neighborhood.name.toLowerCase() ===
        name.toLowerCase()
    )

    if (duplicated) {
      setErrorMessage(
        'Ya existe un barrio con ese nombre.'
      )
      return
    }

    setSaving(true)
    setErrorMessage('')

    const result = await supabase
      .from('neighborhoods')
      .insert({
        city: 'tokyo',
        name,
        position: neighborhoods.length,
      })
      .select()
      .single()

    if (result.error) {
      console.error(
        'Error al añadir el barrio:',
        result.error
      )

      setErrorMessage(
        'No se pudo añadir el barrio: ' +
          result.error.message
      )
    } else {
      updateNeighborhoods([
        ...neighborhoods,
        result.data,
      ])

      form.reset()
    }

    setSaving(false)
  }

  function startEditing(neighborhood) {
    setEditingNeighborhood(neighborhood)
    setErrorMessage('')
  }

  function cancelEditing() {
    setEditingNeighborhood(null)
    setErrorMessage('')
  }

  async function renameNeighborhood(event) {
    event.preventDefault()

    if (!editingNeighborhood || saving) {
      return
    }

    const formData = new FormData(
      event.currentTarget
    )

    const newName = String(
      formData.get('name') || ''
    ).trim()

    if (!newName) {
      setErrorMessage(
        'El nombre del barrio es obligatorio.'
      )
      return
    }

    const duplicated = neighborhoods.some(
      (neighborhood) =>
        neighborhood.id !==
          editingNeighborhood.id &&
        neighborhood.name.toLowerCase() ===
          newName.toLowerCase()
    )

    if (duplicated) {
      setErrorMessage(
        'Ya existe un barrio con ese nombre.'
      )
      return
    }

    const oldName = editingNeighborhood.name

    setSaving(true)
    setErrorMessage('')

    const neighborhoodResult = await supabase
      .from('neighborhoods')
      .update({
        name: newName,
      })
      .eq('id', editingNeighborhood.id)
      .select()
      .single()

    if (neighborhoodResult.error) {
      console.error(
        'Error al renombrar el barrio:',
        neighborhoodResult.error
      )

      setErrorMessage(
        'No se pudo renombrar el barrio: ' +
          neighborhoodResult.error.message
      )

      setSaving(false)
      return
    }

    const activitiesResult = await supabase
      .from('activities')
      .update({
        neighborhood: newName,
      })
      .eq('city', 'tokyo')
      .eq('neighborhood', oldName)

    if (activitiesResult.error) {
      console.error(
        'Error al actualizar las actividades:',
        activitiesResult.error
      )

      setErrorMessage(
        'El barrio se renombró, pero algunas actividades podrían conservar el nombre anterior.'
      )
    }

    const nextNeighborhoods = neighborhoods.map(
      (neighborhood) => {
        if (
          neighborhood.id ===
          editingNeighborhood.id
        ) {
          return neighborhoodResult.data
        }

        return neighborhood
      }
    )

    updateNeighborhoods(nextNeighborhoods)

    if (
      selectedNeighborhood === oldName &&
      onSelectNeighborhood
    ) {
      onSelectNeighborhood(newName)
    }

    setEditingNeighborhood(null)
    setSaving(false)
  }

  async function deleteNeighborhood(neighborhood) {
    const shouldDelete = window.confirm(
      '¿Quieres eliminar el barrio “' +
        neighborhood.name +
        '”? Las actividades asociadas pasarán a Sin barrio.'
    )

    if (!shouldDelete) {
      return
    }

    setSaving(true)
    setErrorMessage('')

    const activitiesResult = await supabase
      .from('activities')
      .update({
        neighborhood: null,
      })
      .eq('city', 'tokyo')
      .eq('neighborhood', neighborhood.name)

    if (activitiesResult.error) {
      console.error(
        'Error al desasignar actividades:',
        activitiesResult.error
      )

      setErrorMessage(
        'No se pudieron desasignar las actividades del barrio.'
      )

      setSaving(false)
      return
    }

    const result = await supabase
      .from('neighborhoods')
      .delete()
      .eq('id', neighborhood.id)

    if (result.error) {
      console.error(
        'Error al eliminar el barrio:',
        result.error
      )

      setErrorMessage(
        'No se pudo eliminar el barrio: ' +
          result.error.message
      )
    } else {
      const nextNeighborhoods =
        neighborhoods.filter(
          (currentNeighborhood) =>
            currentNeighborhood.id !==
            neighborhood.id
        )

      updateNeighborhoods(nextNeighborhoods)

      if (
        selectedNeighborhood ===
          neighborhood.name &&
        onSelectNeighborhood
      ) {
        onSelectNeighborhood('all')
      }
    }

    setSaving(false)
  }

  async function moveNeighborhood(
    neighborhood,
    direction
  ) {
    if (saving) {
      return
    }

    const currentIndex = neighborhoods.findIndex(
      (currentNeighborhood) =>
        currentNeighborhood.id ===
        neighborhood.id
    )

    const targetIndex =
      direction === 'up'
        ? currentIndex - 1
        : currentIndex + 1

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= neighborhoods.length
    ) {
      return
    }

    const nextNeighborhoods = [
      ...neighborhoods,
    ]

    const targetNeighborhood =
      nextNeighborhoods[targetIndex]

    nextNeighborhoods[currentIndex] =
      targetNeighborhood

    nextNeighborhoods[targetIndex] =
      neighborhood

    const reorderedNeighborhoods =
      nextNeighborhoods.map(
        (currentNeighborhood, index) => ({
          ...currentNeighborhood,
          position: index,
        })
      )

    updateNeighborhoods(reorderedNeighborhoods)
    setSaving(true)
    setErrorMessage('')

    const firstResult = await supabase
      .from('neighborhoods')
      .update({
        position: targetIndex,
      })
      .eq('id', neighborhood.id)

    const secondResult = await supabase
      .from('neighborhoods')
      .update({
        position: currentIndex,
      })
      .eq('id', targetNeighborhood.id)

    if (
      firstResult.error ||
      secondResult.error
    ) {
      console.error(
        'Error al reordenar barrios:',
        firstResult.error ||
          secondResult.error
      )

      setErrorMessage(
        'No se pudo guardar el nuevo orden.'
      )

      await loadNeighborhoods()
    }

    setSaving(false)
  }

  if (cityId !== 'tokyo') {
    return null
  }

  if (loading) {
    return (
      <div className="neighborhoods-loading">
        <span>⏳</span>
        <p>Cargando barrios...</p>
      </div>
    )
  }

  return (
    <section className="neighborhoods-section">
      <div className="neighborhoods-toolbar">
        <div>
          <p className="section-label">
            BARRIO
          </p>

          <p className="neighborhoods-help">
            Filtra la lista por zona de Tokio.
          </p>
        </div>

        <button
          className="manage-neighborhoods-button"
          type="button"
          onClick={toggleManager}
        >
          {showManager
            ? 'Cerrar'
            : '+ Gestionar barrios'}
        </button>
      </div>

      <div className="neighborhood-filter">
        <button
          className={
            selectedNeighborhood === 'all'
              ? 'selected'
              : ''
          }
          type="button"
          onClick={() =>
            onSelectNeighborhood('all')
          }
        >
          Todos
        </button>

        <button
          className={
            selectedNeighborhood === 'none'
              ? 'selected'
              : ''
          }
          type="button"
          onClick={() =>
            onSelectNeighborhood('none')
          }
        >
          Sin barrio
        </button>

        {neighborhoods.map((neighborhood) => (
          <button
            className={
              selectedNeighborhood ===
              neighborhood.name
                ? 'selected'
                : ''
            }
            type="button"
            key={neighborhood.id}
            onClick={() =>
              onSelectNeighborhood(
                neighborhood.name
              )
            }
          >
            {neighborhood.name}
          </button>
        ))}
      </div>

      {errorMessage && (
        <div className="auth-message error neighborhoods-error">
          <strong>
            Ha ocurrido un problema
          </strong>

          <p>{errorMessage}</p>
        </div>
      )}

      {showManager && (
        <div className="neighborhoods-manager">
          <form
            className="neighborhood-add-form"
            onSubmit={addNeighborhood}
          >
            <label>
              Nuevo barrio

              <input
                name="name"
                type="text"
                placeholder="Ej. Shimokitazawa"
                required
              />
            </label>

            <button
              className="save-button"
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Guardando...'
                : 'Añadir barrio'}
            </button>
          </form>

          <div className="neighborhoods-list">
            {neighborhoods.map(
              (neighborhood, index) => (
                <article
                  className="neighborhood-row"
                  key={neighborhood.id}
                >
                  {editingNeighborhood?.id ===
                  neighborhood.id ? (
                    <form
                      className="neighborhood-edit-form"
                      onSubmit={renameNeighborhood}
                    >
                      <input
                        name="name"
                        type="text"
                        defaultValue={
                          neighborhood.name
                        }
                        required
                      />

                      <button
                        type="submit"
                        disabled={saving}
                      >
                        Guardar
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <>
                      <strong>
                        {neighborhood.name}
                      </strong>

                      <div className="neighborhood-row-actions">
                        <button
                          type="button"
                          disabled={
                            saving || index === 0
                          }
                          onClick={() =>
                            moveNeighborhood(
                              neighborhood,
                              'up'
                            )
                          }
                          aria-label={
                            'Subir ' +
                            neighborhood.name
                          }
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          disabled={
                            saving ||
                            index ===
                              neighborhoods.length -
                                1
                          }
                          onClick={() =>
                            moveNeighborhood(
                              neighborhood,
                              'down'
                            )
                          }
                          aria-label={
                            'Bajar ' +
                            neighborhood.name
                          }
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            startEditing(
                              neighborhood
                            )
                          }
                        >
                          Editar
                        </button>

                        <button
                          className="neighborhood-delete-button"
                          type="button"
                          onClick={() =>
                            deleteNeighborhood(
                              neighborhood
                            )
                          }
                        >
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </article>
              )
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default Neighborhoods