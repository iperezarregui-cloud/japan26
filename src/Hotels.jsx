import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const currencyOptions = [
  {
    value: 'JPY',
    label: 'JPY · Yen japonés',
  },
  {
    value: 'EUR',
    label: 'EUR · Euro',
  },
  {
    value: 'USD',
    label: 'USD · Dólar estadounidense',
  },
  {
    value: 'MYR',
    label: 'MYR · Ringgit malasio',
  },
  {
    value: 'SGD',
    label: 'SGD · Dólar de Singapur',
  },
]

function formatDate(dateValue) {
  if (!dateValue) {
    return null
  }

  const date = new Date(
    dateValue + 'T12:00:00'
  )

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatPrice(price, currency) {
  if (
    price === null ||
    price === undefined ||
    price === ''
  ) {
    return null
  }

  const numericPrice = Number(price)

  if (!Number.isFinite(numericPrice)) {
    return null
  }

  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'JPY',
      maximumFractionDigits:
        currency === 'JPY' ? 0 : 2,
    }).format(numericPrice)
  } catch {
    return (
      numericPrice.toLocaleString('es-ES') +
      ' ' +
      (currency || 'JPY')
    )
  }
}

function Hotels({ cityId, cityName }) {
  const [hotels, setHotels] = useState([])
  const [loadingHotels, setLoadingHotels] =
    useState(true)

  const [savingHotel, setSavingHotel] =
    useState(false)

  const [updatingHotelId, setUpdatingHotelId] =
    useState(null)

  const [showHotelForm, setShowHotelForm] =
    useState(false)

  const [editingHotel, setEditingHotel] =
    useState(null)

  const [errorMessage, setErrorMessage] =
    useState('')

  const sortedHotels = useMemo(() => {
    return [...hotels].sort((first, second) => {
      if (
        first.check_in_date &&
        second.check_in_date
      ) {
        return first.check_in_date.localeCompare(
          second.check_in_date
        )
      }

      if (first.check_in_date) {
        return -1
      }

      if (second.check_in_date) {
        return 1
      }

      return first.name.localeCompare(
        second.name
      )
    })
  }, [hotels])

  useEffect(() => {
    loadHotels()
  }, [cityId])

  async function loadHotels() {
    if (!cityId) {
      setHotels([])
      setLoadingHotels(false)
      return
    }

    setLoadingHotels(true)
    setErrorMessage('')

    const result = await supabase
      .from('hotels')
      .select('*')
      .eq('city', cityId)
      .order('check_in_date', {
        ascending: true,
        nullsFirst: false,
      })
      .order('created_at', {
        ascending: true,
      })

    if (result.error) {
      console.error(
        'Error al cargar los hoteles:',
        result.error
      )

      setErrorMessage(
        'No se pudieron cargar los alojamientos.'
      )
    } else {
      setHotels(result.data || [])
    }

    setLoadingHotels(false)
  }

  function openNewHotelForm() {
    setEditingHotel(null)
    setShowHotelForm(true)
    setErrorMessage('')
  }

  function openEditHotelForm(hotel) {
    setEditingHotel(hotel)
    setShowHotelForm(true)
    setErrorMessage('')
  }

  function closeHotelForm() {
    setEditingHotel(null)
    setShowHotelForm(false)
    setErrorMessage('')
  }

  async function saveHotel(event) {
    event.preventDefault()

    if (savingHotel || !cityId) {
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)

    const name = String(
      formData.get('name') || ''
    ).trim()

    const checkInDate = String(
      formData.get('check_in_date') || ''
    )

    const checkOutDate = String(
      formData.get('check_out_date') || ''
    )

    const priceValue = String(
      formData.get('price') || ''
    ).trim()

    if (!name) {
      setErrorMessage(
        'El nombre del alojamiento es obligatorio.'
      )
      return
    }

    if (
      checkInDate &&
      checkOutDate &&
      checkOutDate < checkInDate
    ) {
      setErrorMessage(
        'La fecha de salida no puede ser anterior a la fecha de entrada.'
      )
      return
    }

    const hotelInformation = {
      city: cityId,
      name,
      check_in_date: checkInDate || null,
      check_out_date: checkOutDate || null,
      address: String(
        formData.get('address') || ''
      ).trim(),
      maps_name: String(
        formData.get('maps_name') || ''
      ).trim(),
      maps_link: String(
        formData.get('maps_link') || ''
      ).trim(),
      booking_link: String(
        formData.get('booking_link') || ''
      ).trim(),
      confirmation_number: String(
        formData.get('confirmation_number') || ''
      ).trim(),
      price: priceValue
        ? Number(priceValue)
        : null,
      currency: String(
        formData.get('currency') || 'JPY'
      ),
      notes: String(
        formData.get('notes') || ''
      ).trim(),
    }

    setSavingHotel(true)
    setErrorMessage('')

    let result

    if (editingHotel) {
      result = await supabase
        .from('hotels')
        .update(hotelInformation)
        .eq('id', editingHotel.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('hotels')
        .insert(hotelInformation)
        .select()
        .single()
    }

    if (result.error) {
      console.error(
        'Error al guardar el hotel:',
        result.error
      )

      setErrorMessage(
        'No se pudo guardar el alojamiento: ' +
          result.error.message
      )
    } else {
      if (editingHotel) {
        setHotels((currentHotels) =>
          currentHotels.map((hotel) => {
            if (
              hotel.id === editingHotel.id
            ) {
              return result.data
            }

            return hotel
          })
        )
      } else {
        setHotels((currentHotels) => [
          ...currentHotels,
          result.data,
        ])
      }

      form.reset()
      closeHotelForm()
    }

    setSavingHotel(false)
  }

  async function toggleHotelStatus(
    hotel,
    field
  ) {
    if (updatingHotelId !== null) {
      return
    }

    if (
      field !== 'reserved' &&
      field !== 'paid'
    ) {
      return
    }

    const nextValue = !Boolean(hotel[field])

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

    setUpdatingHotelId(hotel.id)
    setErrorMessage('')

    const result = await supabase
      .from('hotels')
      .update(changes)
      .eq('id', hotel.id)
      .select()
      .single()

    if (result.error) {
      console.error(
        'Error al actualizar el hotel:',
        result.error
      )

      setErrorMessage(
        'No se pudo actualizar el estado: ' +
          result.error.message
      )
    } else {
      setHotels((currentHotels) =>
        currentHotels.map((currentHotel) => {
          if (
            currentHotel.id === hotel.id
          ) {
            return result.data
          }

          return currentHotel
        })
      )
    }

    setUpdatingHotelId(null)
  }

  async function deleteHotel(hotel) {
    const shouldDelete = window.confirm(
      '¿Quieres eliminar “' +
        hotel.name +
        '”?'
    )

    if (!shouldDelete) {
      return
    }

    setErrorMessage('')

    const result = await supabase
      .from('hotels')
      .delete()
      .eq('id', hotel.id)

    if (result.error) {
      console.error(
        'Error al eliminar el hotel:',
        result.error
      )

      setErrorMessage(
        'No se pudo eliminar el alojamiento.'
      )
      return
    }

    setHotels((currentHotels) =>
      currentHotels.filter(
        (currentHotel) =>
          currentHotel.id !== hotel.id
      )
    )

    if (
      editingHotel &&
      editingHotel.id === hotel.id
    ) {
      closeHotelForm()
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

  if (loadingHotels) {
    return (
      <div className="hotels-loading">
        <span>⏳</span>
        <p>Cargando alojamientos...</p>
      </div>
    )
  }

  return (
    <section className="hotels-section">
      <div className="hotels-heading">
        <div>
          <p className="section-label">
            ALOJAMIENTOS
          </p>

          <p className="hotels-summary">
            {hotels.length === 0
              ? 'Sin alojamientos'
              : hotels.length === 1
                ? '1 alojamiento'
                : hotels.length +
                  ' alojamientos'}
          </p>
        </div>

        <button
          className="add-button"
          type="button"
          onClick={
            showHotelForm
              ? closeHotelForm
              : openNewHotelForm
          }
        >
          {showHotelForm
            ? 'Cancelar'
            : '+ Añadir hotel'}
        </button>
      </div>

      {errorMessage && (
        <div className="auth-message error hotels-error">
          <strong>
            Ha ocurrido un problema
          </strong>

          <p>{errorMessage}</p>
        </div>
      )}

      {showHotelForm && (
        <form
          className="hotel-form"
          onSubmit={saveHotel}
          key={
            editingHotel
              ? 'edit-hotel-' +
                editingHotel.id
              : 'new-hotel'
          }
        >
          <div className="hotel-form-heading">
            <div>
              <p className="section-label">
                {editingHotel
                  ? 'EDITAR ALOJAMIENTO'
                  : 'NUEVO ALOJAMIENTO'}
              </p>

              <h3>
                {editingHotel
                  ? editingHotel.name
                  : 'Hotel en ' + cityName}
              </h3>
            </div>

            <button
              className="form-close-button"
              type="button"
              onClick={closeHotelForm}
              aria-label="Cerrar formulario"
            >
              ×
            </button>
          </div>

          <label>
            Nombre del alojamiento

            <input
              name="name"
              type="text"
              defaultValue={
                editingHotel
                  ? editingHotel.name
                  : ''
              }
              placeholder="Ej. Hotel Gracery Shinjuku"
              required
            />
          </label>

          <div className="hotel-form-grid">
            <label>
              Fecha de entrada

              <input
                name="check_in_date"
                type="date"
                defaultValue={
                  editingHotel &&
                  editingHotel.check_in_date
                    ? editingHotel.check_in_date
                    : ''
                }
              />
            </label>

            <label>
              Fecha de salida

              <input
                name="check_out_date"
                type="date"
                defaultValue={
                  editingHotel &&
                  editingHotel.check_out_date
                    ? editingHotel.check_out_date
                    : ''
                }
              />
            </label>
          </div>

          <label>
            Dirección

            <input
              name="address"
              type="text"
              defaultValue={
                editingHotel
                  ? editingHotel.address || ''
                  : ''
              }
              placeholder="Dirección del alojamiento"
            />
          </label>

          <div className="hotel-form-grid">
            <label>
              Precio total

              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={
                  editingHotel &&
                  editingHotel.price !== null
                    ? editingHotel.price
                    : ''
                }
                placeholder="Ej. 65000"
              />
            </label>

            <label>
              Moneda

              <select
                name="currency"
                defaultValue={
                  editingHotel
                    ? editingHotel.currency ||
                      'JPY'
                    : 'JPY'
                }
              >
                {currencyOptions.map(
                  (currency) => (
                    <option
                      key={currency.value}
                      value={currency.value}
                    >
                      {currency.label}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <label>
            Número de confirmación

            <input
              name="confirmation_number"
              type="text"
              defaultValue={
                editingHotel
                  ? editingHotel.confirmation_number ||
                    ''
                  : ''
              }
              placeholder="Código o referencia de la reserva"
            />
          </label>

          <label>
            Nombre exacto en Google Maps

            <input
              name="maps_name"
              type="text"
              defaultValue={
                editingHotel
                  ? editingHotel.maps_name || ''
                  : ''
              }
              placeholder="Ej. Hotel Gracery Shinjuku"
              required
            />
          </label>

          <label>
            Enlace de Google Maps

            <input
              name="maps_link"
              type="url"
              defaultValue={
                editingHotel
                  ? editingHotel.maps_link || ''
                  : ''
              }
              placeholder="https://maps.google.com/..."
            />
          </label>

          <label>
            Enlace de la reserva

            <input
              name="booking_link"
              type="url"
              defaultValue={
                editingHotel
                  ? editingHotel.booking_link ||
                    ''
                  : ''
              }
              placeholder="Booking, Agoda o web del hotel"
            />
          </label>

          <label>
            Notas

            <textarea
              name="notes"
              rows="3"
              defaultValue={
                editingHotel
                  ? editingHotel.notes || ''
                  : ''
              }
              placeholder="Condiciones, desayuno, cancelación, indicaciones..."
            />
          </label>

          <button
            className="save-button"
            type="submit"
            disabled={savingHotel}
          >
            {savingHotel
              ? 'Guardando...'
              : editingHotel
                ? 'Guardar cambios'
                : 'Guardar alojamiento'}
          </button>
        </form>
      )}

      {sortedHotels.length === 0 &&
        !showHotelForm && (
          <article className="hotels-empty">
            <span>🏨</span>

            <h3>
              No hay alojamientos guardados
            </h3>

            <p>
              Añade el hotel y conserva aquí
              todos los datos de la reserva.
            </p>

            <button
              className="add-button"
              type="button"
              onClick={openNewHotelForm}
            >
              + Añadir alojamiento
            </button>
          </article>
        )}

      {sortedHotels.length > 0 && (
        <div className="hotels-list">
          {sortedHotels.map((hotel) => {
            const checkInDate = formatDate(
              hotel.check_in_date
            )

            const checkOutDate = formatDate(
              hotel.check_out_date
            )

            const formattedPrice = formatPrice(
              hotel.price,
              hotel.currency
            )

            const isUpdating =
              updatingHotelId === hotel.id

            return (
              <article
                className="hotel-card"
                key={hotel.id}
              >
                <div className="hotel-card-icon">
                  🏨
                </div>

                <div className="hotel-card-information">
                  <div className="hotel-card-heading">
                    <div>
                      <p className="hotel-city-label">
                        {cityName}
                      </p>

                      <h3>{hotel.name}</h3>
                    </div>

                    <button
                      className="hotel-edit-button"
                      type="button"
                      onClick={() =>
                        openEditHotelForm(hotel)
                      }
                    >
                      Editar
                    </button>
                  </div>

                  {(checkInDate ||
                    checkOutDate) && (
                    <p className="hotel-dates">
                      {checkInDate ||
                        'Entrada pendiente'}
                      {' → '}
                      {checkOutDate ||
                        'Salida pendiente'}
                    </p>
                  )}

                  {hotel.address && (
                    <p className="hotel-address">
                      📍 {hotel.address}
                    </p>
                  )}

                  <div className="hotel-statuses">
                    <button
                      className={
                        hotel.reserved
                          ? 'hotel-status reserved selected'
                          : 'hotel-status reserved'
                      }
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        toggleHotelStatus(
                          hotel,
                          'reserved'
                        )
                      }
                    >
                      <span>
                        {hotel.reserved
                          ? '✓'
                          : '○'}
                      </span>

                      {hotel.reserved
                        ? 'Reservado'
                        : 'Pendiente de reservar'}
                    </button>

                    <button
                      className={
                        hotel.paid
                          ? 'hotel-status paid selected'
                          : 'hotel-status paid'
                      }
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        toggleHotelStatus(
                          hotel,
                          'paid'
                        )
                      }
                    >
                      <span>
                        {hotel.paid
                          ? '✓'
                          : '○'}
                      </span>

                      {hotel.paid
                        ? 'Pagado'
                        : 'Pendiente de pago'}
                    </button>
                  </div>

                  {isUpdating && (
                    <p className="hotel-updating">
                      Guardando estado...
                    </p>
                  )}

                  {(formattedPrice ||
                    hotel.confirmation_number) && (
                    <div className="hotel-details-grid">
                      {formattedPrice && (
                        <div>
                          <span>PRECIO</span>
                          <strong>
                            {formattedPrice}
                          </strong>
                        </div>
                      )}

                      {hotel.confirmation_number && (
                        <div>
                          <span>CONFIRMACIÓN</span>
                          <strong>
                            {
                              hotel.confirmation_number
                            }
                          </strong>
                        </div>
                      )}
                    </div>
                  )}

                  {hotel.notes && (
                    <p className="hotel-notes">
                      {hotel.notes}
                    </p>
                  )}

                  <div className="hotel-links">
                    {hotel.maps_link && (
                      <button
                        type="button"
                        onClick={() =>
                          openExternalLink(
                            hotel.maps_link
                          )
                        }
                      >
                        Google Maps ↗
                      </button>
                    )}

                    {hotel.booking_link && (
                      <button
                        type="button"
                        onClick={() =>
                          openExternalLink(
                            hotel.booking_link
                          )
                        }
                      >
                        Abrir reserva ↗
                      </button>
                    )}
                  </div>

                  <button
                    className="hotel-delete-button"
                    type="button"
                    onClick={() =>
                      deleteHotel(hotel)
                    }
                  >
                    Eliminar alojamiento
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default Hotels