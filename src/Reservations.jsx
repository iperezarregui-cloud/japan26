import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const cityInformation = {
  tokyo: {
    name: 'Tokio',
    emoji: '🗼',
  },
  hakone: {
    name: 'Hakone',
    emoji: '🗻',
  },
  kyoto: {
    name: 'Kioto',
    emoji: '⛩️',
  },
  nara: {
    name: 'Nara',
    emoji: '🦌',
  },
  osaka: {
    name: 'Osaka',
    emoji: '🏯',
  },
  kobe: {
    name: 'Kobe',
    emoji: '🥩',
  },
  hiroshima: {
    name: 'Hiroshima',
    emoji: '🕊️',
  },
  miyajima: {
    name: 'Miyajima',
    emoji: '⛩️',
  },
}

function getCity(cityId) {
  return (
    cityInformation[cityId] || {
      name: cityId || 'Sin ciudad',
      emoji: '📍',
    }
  )
}

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

function formatTime(timeValue) {
  if (!timeValue) {
    return null
  }

  return timeValue.slice(0, 5)
}

function Reservations({
  onOpenCity,
  onOpenItineraryDay,
}) {
  const [hotels, setHotels] = useState([])
  const [transports, setTransports] =
    useState([])
  const [days, setDays] = useState([])

  const [loading, setLoading] =
    useState(true)

  const [updatingKey, setUpdatingKey] =
    useState(null)

  const [
    reservationFilter,
    setReservationFilter,
  ] = useState('pending')

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    loadReservations()
  }, [])

  const summary = useMemo(() => {
    const hotelReservationPending =
      hotels.filter(
        (hotel) => !hotel.reserved
      ).length

    const hotelPaymentPending =
      hotels.filter(
        (hotel) => !hotel.paid
      ).length

    const transportReservationPending =
      transports.filter(
        (transport) =>
          !transport.reserved
      ).length

    const transportPaymentPending =
      transports.filter(
        (transport) => !transport.paid
      ).length

    return {
      hotelReservationPending,
      hotelPaymentPending,
      transportReservationPending,
      transportPaymentPending,
      totalReservationPending:
        hotelReservationPending +
        transportReservationPending,
      totalPaymentPending:
        hotelPaymentPending +
        transportPaymentPending,
    }
  }, [hotels, transports])

  const visibleTransports = useMemo(() => {
    return transports
      .filter((transport) => {
        if (
          reservationFilter === 'pending'
        ) {
          return (
            !transport.reserved ||
            !transport.paid
          )
        }
  
        if (
          reservationFilter === 'completed'
        ) {
          return (
            transport.reserved &&
            transport.paid
          )
        }
  
        return true
      })
      .sort((first, second) => {
        const firstDay = days.find(
          (day) => day.id === first.day_id
        )
  
        const secondDay = days.find(
          (day) => day.id === second.day_id
        )
  
        const firstDayNumber = Number(
          firstDay?.day_number ?? 999
        )
  
        const secondDayNumber = Number(
          secondDay?.day_number ?? 999
        )
  
        if (
          firstDayNumber !== secondDayNumber
        ) {
          return (
            firstDayNumber -
            secondDayNumber
          )
        }
  
        const firstTime =
          first.start_time || '99:99:99'
  
        const secondTime =
          second.start_time || '99:99:99'
  
        if (firstTime !== secondTime) {
          return firstTime.localeCompare(
            secondTime
          )
        }
  
        return (
          Number(first.position || 0) -
          Number(second.position || 0)
        )
      })
  }, [
    transports,
    reservationFilter,
    days,
  ])
  }, [hotels, reservationFilter])

  const visibleTransports = useMemo(() => {
    return transports.filter(
      (transport) => {
        if (
          reservationFilter === 'pending'
        ) {
          return (
            !transport.reserved ||
            !transport.paid
          )
        }

        if (
          reservationFilter ===
          'completed'
        ) {
          return (
            transport.reserved &&
            transport.paid
          )
        }

        return true
      }
    )
  }, [transports, reservationFilter])

  async function loadReservations() {
    setLoading(true)
    setErrorMessage('')

    const [
      hotelsResult,
      transportsResult,
      daysResult,
    ] = await Promise.all([
      supabase
        .from('hotels')
        .select('*')
        .order('check_in_date', {
          ascending: true,
          nullsFirst: false,
        }),

      supabase
        .from('itinerary_items')
        .select('*')
        .eq('item_type', 'transport')
        .order('start_time', {
          ascending: true,
          nullsFirst: false,
        }),

      supabase
        .from('itinerary_days')
        .select(
          'id, day_number, title, city, travel_date'
        )
        .order('day_number', {
          ascending: true,
        }),
    ])

    const errors = []

    if (hotelsResult.error) {
      console.error(
        'Error al cargar hoteles:',
        hotelsResult.error
      )

      errors.push(
        'No se pudieron cargar los hoteles.'
      )
    } else {
      setHotels(hotelsResult.data || [])
    }

    if (transportsResult.error) {
      console.error(
        'Error al cargar transportes:',
        transportsResult.error
      )

      errors.push(
        'No se pudieron cargar los transportes.'
      )
    } else {
      setTransports(
        transportsResult.data || []
      )
    }

    if (daysResult.error) {
      console.error(
        'Error al cargar días:',
        daysResult.error
      )

      errors.push(
        'No se pudieron cargar los días.'
      )
    } else {
      setDays(daysResult.data || [])
    }

    if (errors.length > 0) {
      setErrorMessage(errors.join(' '))
    }

    setLoading(false)
  }

  function getDay(dayId) {
    return (
      days.find(
        (day) => day.id === dayId
      ) || null
    )
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

  function openHotelCity(hotel) {
    if (onOpenCity) {
      onOpenCity(hotel.city)
    }
  }

  function openTransportDay(transport) {
    if (onOpenItineraryDay) {
      onOpenItineraryDay(
        transport.day_id
      )
    }
  }

  async function toggleHotelStatus(
    hotel,
    field
  ) {
    if (
      updatingKey !== null ||
      (field !== 'reserved' &&
        field !== 'paid')
    ) {
      return
    }

    const nextValue = !Boolean(
      hotel[field]
    )

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

    const updateKey =
      'hotel-' + hotel.id + '-' + field

    setUpdatingKey(updateKey)
    setErrorMessage('')

    const result = await supabase
      .from('hotels')
      .update(changes)
      .eq('id', hotel.id)
      .select()
      .single()

    if (result.error) {
      console.error(
        'Error al actualizar hotel:',
        result.error
      )

      setErrorMessage(
        'No se pudo actualizar el hotel: ' +
          result.error.message
      )
    } else {
      setHotels((currentHotels) =>
        currentHotels.map(
          (currentHotel) => {
            if (
              currentHotel.id === hotel.id
            ) {
              return result.data
            }

            return currentHotel
          }
        )
      )
    }

    setUpdatingKey(null)
  }

  async function toggleTransportStatus(
    transport,
    field
  ) {
    if (
      updatingKey !== null ||
      (field !== 'reserved' &&
        field !== 'paid')
    ) {
      return
    }

    const nextValue = !Boolean(
      transport[field]
    )

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

    const updateKey =
      'transport-' +
      transport.id +
      '-' +
      field

    setUpdatingKey(updateKey)
    setErrorMessage('')

    const result = await supabase
      .from('itinerary_items')
      .update(changes)
      .eq('id', transport.id)
      .select()
      .single()

    if (result.error) {
      console.error(
        'Error al actualizar transporte:',
        result.error
      )

      setErrorMessage(
        'No se pudo actualizar el transporte: ' +
          result.error.message
      )
    } else {
      setTransports(
        (currentTransports) =>
          currentTransports.map(
            (currentTransport) => {
              if (
                currentTransport.id ===
                transport.id
              ) {
                return result.data
              }

              return currentTransport
            }
          )
      )
    }

    setUpdatingKey(null)
  }

  if (loading) {
    return (
      <section className="content">
        <article className="reservations-loading">
          <span>⏳</span>

          <h2>Cargando reservas...</h2>

          <p>
            Recuperando hoteles y transportes.
          </p>
        </article>
      </section>
    )
  }

  return (
    <section className="reservations-page">
      <div className="reservations-heading">
        <div>
          <p className="date">
            PREPARACIÓN DEL VIAJE
          </p>

          <h2>Reservas</h2>

          <p>
            Comprueba hoteles, transportes y
            pagos pendientes.
          </p>
        </div>

        <button
          className="reservations-refresh-button"
          type="button"
          onClick={loadReservations}
        >
          Actualizar
        </button>
      </div>

      {errorMessage && (
        <div className="auth-message error reservations-error">
          <strong>
            Ha ocurrido un problema
          </strong>

          <p>{errorMessage}</p>
        </div>
      )}

      <div className="reservation-summary-grid">
        <article className="reservation-summary-card">
          <span className="reservation-summary-icon">
            🏨
          </span>

          <div>
            <span>HOTELES</span>

            <strong>
              {
                summary.hotelReservationPending
              }{' '}
              pendientes de reservar
            </strong>

            <small>
              {summary.hotelPaymentPending}{' '}
              pendientes de pago
            </small>
          </div>
        </article>

        <article className="reservation-summary-card">
          <span className="reservation-summary-icon">
            🚆
          </span>

          <div>
            <span>TRANSPORTES</span>

            <strong>
              {
                summary.transportReservationPending
              }{' '}
              pendientes de reservar
            </strong>

            <small>
              {
                summary.transportPaymentPending
              }{' '}
              pendientes de pago
            </small>
          </div>
        </article>

        <article className="reservation-summary-card reservation-summary-total">
          <span className="reservation-summary-icon">
            📋
          </span>

          <div>
            <span>RESUMEN</span>

            <strong>
              {
                summary.totalReservationPending
              }{' '}
              reservas pendientes
            </strong>

            <small>
              {summary.totalPaymentPending}{' '}
              pagos pendientes
            </small>
          </div>
        </article>
      </div>

      <div className="reservation-filters">
        <button
          className={
            reservationFilter === 'pending'
              ? 'selected'
              : ''
          }
          type="button"
          onClick={() =>
            setReservationFilter('pending')
          }
        >
          Pendientes
        </button>

        <button
          className={
            reservationFilter === 'all'
              ? 'selected'
              : ''
          }
          type="button"
          onClick={() =>
            setReservationFilter('all')
          }
        >
          Todos
        </button>

        <button
          className={
            reservationFilter ===
            'completed'
              ? 'selected'
              : ''
          }
          type="button"
          onClick={() =>
            setReservationFilter(
              'completed'
            )
          }
        >
          Completados
        </button>
      </div>

      <section className="reservation-group">
        <div className="reservation-group-heading">
          <div>
            <p className="section-label">
              HOTELES
            </p>

            <h3>Alojamientos</h3>
          </div>

          <span>
            {visibleHotels.length}
          </span>
        </div>

        {visibleHotels.length === 0 ? (
          <article className="reservation-empty">
            <span>🏨</span>

            <div>
              <h4>
                No hay hoteles en este filtro
              </h4>

              <p>
                Cambia el filtro o añade hoteles
                desde Ciudades.
              </p>
            </div>
          </article>
        ) : (
          <div className="reservation-list">
            {visibleHotels.map((hotel) => {
              const city = getCity(
                hotel.city
              )

              const checkInDate =
                formatDate(
                  hotel.check_in_date
                )

              const checkOutDate =
                formatDate(
                  hotel.check_out_date
                )

              const isUpdating =
                updatingKey?.startsWith(
                  'hotel-' + hotel.id
                )

              return (
                <article
                  className="reservation-item"
                  key={'hotel-' + hotel.id}
                >
                  <span className="reservation-item-icon">
                    🏨
                  </span>

                  <div className="reservation-item-content">
                    <div className="reservation-item-heading">
                      <div>
                        <span>
                          {city.emoji}{' '}
                          {city.name}
                        </span>

                        <h4>{hotel.name}</h4>
                      </div>

                      <button
                        className="reservation-open-button"
                        type="button"
                        onClick={() =>
                          openHotelCity(hotel)
                        }
                      >
                        Ver ciudad
                      </button>
                    </div>

                    {(checkInDate ||
                      checkOutDate) && (
                      <p className="reservation-item-detail">
                        {checkInDate ||
                          'Entrada pendiente'}
                        {' → '}
                        {checkOutDate ||
                          'Salida pendiente'}
                      </p>
                    )}

                    <div className="reservation-status-actions">
                      <button
                        className={
                          hotel.reserved
                            ? 'reservation-status selected'
                            : 'reservation-status'
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
                        {hotel.reserved
                          ? '✓ Reservado'
                          : '○ Pendiente de reservar'}
                      </button>

                      <button
                        className={
                          hotel.paid
                            ? 'reservation-status paid selected'
                            : 'reservation-status paid'
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
                        {hotel.paid
                          ? '✓ Pagado'
                          : '○ Pendiente de pago'}
                      </button>
                    </div>

                    <div className="reservation-item-links">
                      {hotel.maps_link && (
                        <button
                          type="button"
                          onClick={() =>
                            openExternalLink(
                              hotel.maps_link
                            )
                          }
                        >
                          Google Maps
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
                          Abrir reserva
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="reservation-group">
        <div className="reservation-group-heading">
          <div>
            <p className="section-label">
              TRANSPORTES
            </p>

            <h3>Desplazamientos</h3>
          </div>

          <span>
            {visibleTransports.length}
          </span>
        </div>

        {visibleTransports.length === 0 ? (
          <article className="reservation-empty">
            <span>🚆</span>

            <div>
              <h4>
                No hay transportes en este filtro
              </h4>

              <p>
                Los transportes se añaden desde
                los días del itinerario.
              </p>
            </div>
          </article>
        ) : (
          <div className="reservation-list">
            {visibleTransports.map(
              (transport) => {
                const day = getDay(
                  transport.day_id
                )

                const city = getCity(
                  day?.city
                )

                const startTime =
                  formatTime(
                    transport.start_time
                  )

                const isUpdating =
                  updatingKey?.startsWith(
                    'transport-' +
                      transport.id
                  )

                return (
                  <article
                    className="reservation-item"
                    key={
                      'transport-' +
                      transport.id
                    }
                  >
                    <span className="reservation-item-icon">
                      🚆
                    </span>

                    <div className="reservation-item-content">
                      <div className="reservation-item-heading">
                        <div>
                          <span>
                            {day
                              ? 'Día ' +
                                day.day_number +
                                ' · ' +
                                city.emoji +
                                ' ' +
                                city.name
                              : 'Día no disponible'}
                          </span>

                          <h4>
                            {transport.title}
                          </h4>
                        </div>

                        <button
                          className="reservation-open-button"
                          type="button"
                          disabled={!day}
                          onClick={() =>
                            openTransportDay(
                              transport
                            )
                          }
                        >
                          Ver día
                        </button>
                      </div>

                      {(startTime ||
                        transport.description) && (
                        <p className="reservation-item-detail">
                          {startTime || ''}
                          {startTime &&
                          transport.description
                            ? ' · '
                            : ''}
                          {transport.description ||
                            ''}
                        </p>
                      )}

                      <div className="reservation-status-actions">
                        <button
                          className={
                            transport.reserved
                              ? 'reservation-status selected'
                              : 'reservation-status'
                          }
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            toggleTransportStatus(
                              transport,
                              'reserved'
                            )
                          }
                        >
                          {transport.reserved
                            ? '✓ Reservado'
                            : '○ Pendiente de reservar'}
                        </button>

                        <button
                          className={
                            transport.paid
                              ? 'reservation-status paid selected'
                              : 'reservation-status paid'
                          }
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            toggleTransportStatus(
                              transport,
                              'paid'
                            )
                          }
                        >
                          {transport.paid
                            ? '✓ Pagado'
                            : '○ Pendiente de pago'}
                        </button>
                      </div>

                      {transport.link && (
                        <div className="reservation-item-links">
                          <button
                            type="button"
                            onClick={() =>
                              openExternalLink(
                                transport.link
                              )
                            }
                          >
                            Abrir enlace
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                )
              }
            )}
          </div>
        )}
      </section>
    </section>
  )
}

export default Reservations