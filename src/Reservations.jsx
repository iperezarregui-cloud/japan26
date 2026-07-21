import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const cityInformation = {
  tokyo: {
    name: "Tokio",
    emoji: "🗼",
  },
  hakone: {
    name: "Hakone",
    emoji: "🗻",
  },
  kyoto: {
    name: "Kioto",
    emoji: "⛩️",
  },
  nara: {
    name: "Nara",
    emoji: "🦌",
  },
  osaka: {
    name: "Osaka",
    emoji: "🏯",
  },
  kobe: {
    name: "Kobe",
    emoji: "🥩",
  },
  hiroshima: {
    name: "Hiroshima",
    emoji: "🕊️",
  },
  miyajima: {
    name: "Miyajima",
    emoji: "⛩️",
  },
};

function getCity(cityId) {
  return (
    cityInformation[cityId] || {
      name: cityId || "Sin ciudad",
      emoji: "📍",
    }
  );
}

function formatDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue + "T12:00:00");

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(timeValue) {
  if (!timeValue) {
    return null;
  }

  return timeValue.slice(0, 5);
}

function Reservations({ onOpenCity, onOpenItineraryDay }) {
  const [hotels, setHotels] = useState([]);
  const [transports, setTransports] = useState([]);
  const [activities, setActivities] = useState([]);
  const [days, setDays] = useState([]);

  const [loading, setLoading] = useState(true);

  const [updatingKey, setUpdatingKey] = useState(null);

  const [reservationFilter, setReservationFilter] = useState("pending");

  const [reservationTypeFilter, setReservationTypeFilter] = useState("all");

  const [errorMessage, setErrorMessage] = useState("");
  const [editingActivity, setEditingActivity] = useState(null);

  useEffect(() => {
    loadReservations();
  }, []);

  const summary = useMemo(() => {
    const hotelReservationPending = hotels.filter(
      (hotel) => !hotel.reserved,
    ).length;

    const hotelPaymentPending = hotels.filter((hotel) => !hotel.paid).length;

    const transportReservationPending = transports.filter(
      (transport) => !transport.reserved,
    ).length;

    const transportPaymentPending = transports.filter(
      (transport) => !transport.paid,
    ).length;

    const activityReservationPending = activities.filter(
      (activity) => activity.reservation_status !== "reserved",
    ).length;

    const activityPaymentPending = activities.filter(
      (activity) => !activity.reservation_paid,
    ).length;

    return {
      hotelReservationPending,
      hotelPaymentPending,
      transportReservationPending,
      transportPaymentPending,
      activityReservationPending,
      activityPaymentPending,
      totalReservationPending:
        hotelReservationPending +
        transportReservationPending +
        activityReservationPending,
      totalPaymentPending:
        hotelPaymentPending + transportPaymentPending + activityPaymentPending,
    };
  }, [hotels, transports, activities]);

  const visibleHotels = useMemo(() => {
    return [...hotels]
      .filter((hotel) => {
        if (reservationFilter === "pending") {
          return !hotel.reserved || !hotel.paid;
        }

        if (reservationFilter === "completed") {
          return hotel.reserved && hotel.paid;
        }

        return true;
      })
      .sort((first, second) => {
        const firstDate = first.check_in_date || "9999-12-31";

        const secondDate = second.check_in_date || "9999-12-31";

        if (firstDate !== secondDate) {
          return firstDate.localeCompare(secondDate);
        }

        return first.name.localeCompare(second.name, "es", {
          sensitivity: "base",
        });
      });
  }, [hotels, reservationFilter]);

  const visibleTransports = useMemo(() => {
    const daysById = new Map(
      days.map((currentDay) => [String(currentDay.id), currentDay]),
    );

    return [...transports]
      .filter((transport) => {
        if (reservationFilter === "pending") {
          return !transport.reserved || !transport.paid;
        }

        if (reservationFilter === "completed") {
          return transport.reserved && transport.paid;
        }

        return true;
      })
      .sort((first, second) => {
        const firstDay = daysById.get(String(first.day_id));

        const secondDay = daysById.get(String(second.day_id));

        const firstDayNumber = Number(firstDay?.day_number ?? 999);

        const secondDayNumber = Number(secondDay?.day_number ?? 999);

        if (firstDayNumber !== secondDayNumber) {
          return firstDayNumber - secondDayNumber;
        }

        const firstTime = first.start_time || "99:99:99";

        const secondTime = second.start_time || "99:99:99";

        const timeComparison = firstTime.localeCompare(secondTime);

        if (timeComparison !== 0) {
          return timeComparison;
        }

        return Number(first.position || 0) - Number(second.position || 0);
      });
  }, [transports, reservationFilter, days]);

  const visibleActivities = useMemo(() => {
    return [...activities]
      .filter((activity) => {
        const reserved = activity.reservation_status === "reserved";
        const paid = Boolean(activity.reservation_paid);

        if (reservationFilter === "pending") {
          return !reserved || !paid;
        }

        if (reservationFilter === "completed") {
          return reserved && paid;
        }

        return true;
      })
      .sort((first, second) => {
        const firstDate = first.reservation_date || "9999-12-31";
        const secondDate = second.reservation_date || "9999-12-31";

        if (firstDate !== secondDate) {
          return firstDate.localeCompare(secondDate);
        }

        const firstTime = first.reservation_time || "99:99:99";
        const secondTime = second.reservation_time || "99:99:99";

        if (firstTime !== secondTime) {
          return firstTime.localeCompare(secondTime);
        }

        return first.name.localeCompare(second.name, "es", {
          sensitivity: "base",
        });
      });
  }, [activities, reservationFilter]);

  async function loadReservations() {
    setLoading(true);
    setErrorMessage("");

    const [hotelsResult, transportsResult, activitiesResult, daysResult] =
      await Promise.all([
        supabase.from("hotels").select("*").order("check_in_date", {
          ascending: true,
          nullsFirst: false,
        }),

        supabase
          .from("itinerary_items")
          .select("*")
          .eq("item_type", "transport"),

        supabase.from("activities").select("*").eq("reservation_needed", true),

        supabase
          .from("itinerary_days")
          .select("id, day_number, title, city, travel_date")
          .order("day_number", {
            ascending: true,
          }),
      ]);

    const errors = [];

    if (hotelsResult.error) {
      console.error("Error al cargar hoteles:", hotelsResult.error);

      errors.push("No se pudieron cargar los hoteles.");
    } else {
      setHotels(hotelsResult.data || []);
    }

    if (transportsResult.error) {
      console.error("Error al cargar transportes:", transportsResult.error);

      errors.push("No se pudieron cargar los transportes.");
    } else {
      setTransports(transportsResult.data || []);
    }

    if (activitiesResult.error) {
      console.error(
        "Error al cargar actividades con reserva:",
        activitiesResult.error,
      );

      errors.push(
        "No se pudieron cargar las actividades y restaurantes con reserva.",
      );
    } else {
      setActivities(activitiesResult.data || []);
    }

    if (daysResult.error) {
      console.error("Error al cargar días:", daysResult.error);

      errors.push("No se pudieron cargar los días.");
    } else {
      setDays(daysResult.data || []);
    }

    if (errors.length > 0) {
      setErrorMessage(errors.join(" "));
    }

    setLoading(false);
  }

  function getDay(dayId) {
    return days.find((day) => String(day.id) === String(dayId)) || null;
  }

  function openExternalLink(link) {
    if (!link) {
      return;
    }

    window.open(link, "_blank", "noopener,noreferrer");
  }

  function openHotelCity(hotel) {
    if (onOpenCity) {
      onOpenCity(hotel.city);
    }
  }

  function openTransportDay(transport) {
    if (onOpenItineraryDay) {
      onOpenItineraryDay(transport.day_id);
    }
  }

  async function toggleHotelStatus(hotel, field) {
    if (updatingKey !== null || (field !== "reserved" && field !== "paid")) {
      return;
    }

    const nextValue = !Boolean(hotel[field]);

    let changes;

    if (field === "reserved") {
      changes = {
        reserved: nextValue,
      };
    } else {
      changes = {
        paid: nextValue,
      };
    }

    const updateKey = "hotel-" + hotel.id + "-" + field;

    setUpdatingKey(updateKey);
    setErrorMessage("");

    const result = await supabase
      .from("hotels")
      .update(changes)
      .eq("id", hotel.id)
      .select()
      .single();

    if (result.error) {
      console.error("Error al actualizar hotel:", result.error);

      setErrorMessage(
        "No se pudo actualizar el hotel: " + result.error.message,
      );
    } else {
      setHotels((currentHotels) =>
        currentHotels.map((currentHotel) => {
          if (currentHotel.id === hotel.id) {
            return result.data;
          }

          return currentHotel;
        }),
      );
    }

    setUpdatingKey(null);
  }

  async function toggleTransportStatus(transport, field) {
    if (updatingKey !== null || (field !== "reserved" && field !== "paid")) {
      return;
    }

    const nextValue = !Boolean(transport[field]);

    let changes;

    if (field === "reserved") {
      changes = {
        reserved: nextValue,
      };
    } else {
      changes = {
        paid: nextValue,
      };
    }

    const updateKey = "transport-" + transport.id + "-" + field;

    setUpdatingKey(updateKey);
    setErrorMessage("");

    const result = await supabase
      .from("itinerary_items")
      .update(changes)
      .eq("id", transport.id)
      .select()
      .single();

    if (result.error) {
      console.error("Error al actualizar transporte:", result.error);

      setErrorMessage(
        "No se pudo actualizar el transporte: " + result.error.message,
      );
    } else {
      setTransports((currentTransports) =>
        currentTransports.map((currentTransport) => {
          if (currentTransport.id === transport.id) {
            return result.data;
          }

          return currentTransport;
        }),
      );
    }

    setUpdatingKey(null);
  }

  async function saveActivityReservation(event) {
    event.preventDefault();

    if (!editingActivity || updatingKey !== null) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const peopleValue = String(formData.get("reservation_people") || "").trim();
    const depositValue = String(
      formData.get("reservation_deposit") || "",
    ).trim();

    const changes = {
      reservation_status: String(
        formData.get("reservation_status") || "pending",
      ),
      reservation_date: String(formData.get("reservation_date") || "") || null,
      reservation_time: String(formData.get("reservation_time") || "") || null,
      reservation_people: peopleValue ? Number(peopleValue) : null,
      reservation_code:
        String(formData.get("reservation_code") || "").trim() || null,
      reservation_link:
        String(formData.get("reservation_link") || "").trim() || null,
      reservation_deposit: depositValue ? Number(depositValue) : null,
      reservation_paid: formData.get("reservation_paid") === "on",
      reservation_notes:
        String(formData.get("reservation_notes") || "").trim() || null,
    };

    const updateKey = "activity-" + editingActivity.id;

    setUpdatingKey(updateKey);
    setErrorMessage("");

    const result = await supabase
      .from("activities")
      .update(changes)
      .eq("id", editingActivity.id)
      .select()
      .single();

    if (result.error) {
      console.error("Error al actualizar reserva:", result.error);
      setErrorMessage(
        "No se pudo actualizar la reserva: " + result.error.message,
      );
    } else {
      setActivities((currentActivities) =>
        currentActivities.map((activity) =>
          activity.id === editingActivity.id ? result.data : activity,
        ),
      );
      setEditingActivity(null);
    }

    setUpdatingKey(null);
  }

  if (loading) {
    return (
      <section className="content">
        <article className="reservations-loading">
          <span>⏳</span>

          <h2>Cargando reservas...</h2>

          <p>Recuperando hoteles, transportes, actividades y restaurantes.</p>
        </article>
      </section>
    );
  }

  return (
    <section className="reservations-page">
      <div className="reservations-heading">
        <div>
          <p className="date">PREPARACIÓN DEL VIAJE</p>

          <h2>Reservas</h2>

          <p>
            Comprueba hoteles, transportes, actividades, restaurantes y pagos.
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
          <strong>Ha ocurrido un problema</strong>

          <p>{errorMessage}</p>
        </div>
      )}

      <div className="reservation-summary-grid">
        <article className="reservation-summary-card">
          <span className="reservation-summary-icon">🏨</span>

          <div>
            <span>HOTELES</span>

            <strong>
              {summary.hotelReservationPending} pendientes de reservar
            </strong>

            <small>{summary.hotelPaymentPending} pendientes de pago</small>
          </div>
        </article>

        <article className="reservation-summary-card">
          <span className="reservation-summary-icon">🚆</span>

          <div>
            <span>TRANSPORTES</span>

            <strong>
              {summary.transportReservationPending} pendientes de reservar
            </strong>

            <small>{summary.transportPaymentPending} pendientes de pago</small>
          </div>
        </article>

        <article className="reservation-summary-card">
          <span className="reservation-summary-icon">🎟️</span>
          <div>
            <span>ACTIVIDADES Y RESTAURANTES</span>
            <strong>
              {summary.activityReservationPending} pendientes de reservar
            </strong>
            <small>{summary.activityPaymentPending} pendientes de pago</small>
          </div>
        </article>

        <article className="reservation-summary-card reservation-summary-total">
          <span className="reservation-summary-icon">📋</span>

          <div>
            <span>RESUMEN</span>

            <strong>
              {summary.totalReservationPending} reservas pendientes
            </strong>

            <small>{summary.totalPaymentPending} pagos pendientes</small>
          </div>
        </article>
      </div>

      <div
        className="reservation-type-filters"
        aria-label="Filtrar por tipo de reserva"
      >
        <button
          className={reservationTypeFilter === "all" ? "selected" : ""}
          type="button"
          onClick={() => setReservationTypeFilter("all")}
        >
          📋 Todos
        </button>
        <button
          className={reservationTypeFilter === "hotels" ? "selected" : ""}
          type="button"
          onClick={() => setReservationTypeFilter("hotels")}
        >
          🏨 Hoteles
        </button>
        <button
          className={reservationTypeFilter === "transports" ? "selected" : ""}
          type="button"
          onClick={() => setReservationTypeFilter("transports")}
        >
          🚆 Transportes
        </button>
        <button
          className={reservationTypeFilter === "activities" ? "selected" : ""}
          type="button"
          onClick={() => setReservationTypeFilter("activities")}
        >
          🎟️ Actividades
        </button>
      </div>

      <div className="reservation-filter-caption">Estado</div>

      <div className="reservation-filters">
        <button
          className={reservationFilter === "pending" ? "selected" : ""}
          type="button"
          onClick={() => setReservationFilter("pending")}
        >
          Pendientes
        </button>

        <button
          className={reservationFilter === "all" ? "selected" : ""}
          type="button"
          onClick={() => setReservationFilter("all")}
        >
          Todos
        </button>

        <button
          className={reservationFilter === "completed" ? "selected" : ""}
          type="button"
          onClick={() => setReservationFilter("completed")}
        >
          Completados
        </button>
      </div>

      <section
        className="reservation-group"
        hidden={
          reservationTypeFilter !== "all" &&
          reservationTypeFilter !== "activities"
        }
      >
        <div className="reservation-group-heading">
          <div>
            <p className="section-label">ACTIVIDADES Y RESTAURANTES</p>
            <h3>Experiencias con reserva</h3>
          </div>
          <span>{visibleActivities.length}</span>
        </div>

        {visibleActivities.length === 0 ? (
          <article className="reservation-empty">
            <span>🎟️</span>
            <div>
              <h4>No hay actividades en este filtro</h4>
              <p>Activa Necesita reserva desde Ver y hacer o Comer y beber.</p>
            </div>
          </article>
        ) : (
          <div className="reservation-list">
            {visibleActivities.map((activity) => {
              const city = getCity(activity.city);
              const reservationDate = formatDate(activity.reservation_date);
              const reservationTime = formatTime(activity.reservation_time);
              const isReserved = activity.reservation_status === "reserved";

              return (
                <article
                  className="reservation-item"
                  key={"activity-" + activity.id}
                >
                  <span className="reservation-item-icon">
                    {activity.item_type === "food" ? "🍽️" : "🎟️"}
                  </span>
                  <div className="reservation-item-content">
                    <div className="reservation-item-heading">
                      <div>
                        <span>
                          {city.emoji} {city.name} ·{" "}
                          {activity.item_type === "food"
                            ? "Comer y beber"
                            : "Ver y hacer"}
                        </span>
                        <h4>{activity.name}</h4>
                      </div>
                      <button
                        className="reservation-open-button"
                        type="button"
                        onClick={() => setEditingActivity(activity)}
                      >
                        Editar reserva
                      </button>
                    </div>

                    <p className="reservation-item-detail">
                      {reservationDate || "Fecha sin definir"}
                      {reservationTime ? " · " + reservationTime : ""}
                      {activity.reservation_people
                        ? " · " + activity.reservation_people + " personas"
                        : ""}
                    </p>

                    <div className="reservation-status-actions">
                      <span
                        className={
                          isReserved
                            ? "reservation-status selected"
                            : "reservation-status"
                        }
                      >
                        {isReserved
                          ? "✓ Reservado"
                          : activity.reservation_status === "not_available"
                            ? "Sin reserva"
                            : activity.reservation_status === "cancelled"
                              ? "Cancelado"
                              : activity.reservation_status === "checking"
                                ? "Por comprobar"
                                : "○ Pendiente de reservar"}
                      </span>
                      <span
                        className={
                          activity.reservation_paid
                            ? "reservation-status paid selected"
                            : "reservation-status paid"
                        }
                      >
                        {activity.reservation_paid
                          ? "✓ Pagado"
                          : "○ Pendiente de pago"}
                      </span>
                    </div>

                    <div className="reservation-item-links">
                      {activity.reservation_link && (
                        <button
                          type="button"
                          onClick={() =>
                            openExternalLink(activity.reservation_link)
                          }
                        >
                          Abrir reserva
                        </button>
                      )}
                      {activity.link && (
                        <button
                          type="button"
                          onClick={() => openExternalLink(activity.link)}
                        >
                          Google Maps
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section
        className="reservation-group"
        hidden={
          reservationTypeFilter !== "all" && reservationTypeFilter !== "hotels"
        }
      >
        <div className="reservation-group-heading">
          <div>
            <p className="section-label">HOTELES</p>

            <h3>Alojamientos</h3>
          </div>

          <span>{visibleHotels.length}</span>
        </div>

        {visibleHotels.length === 0 ? (
          <article className="reservation-empty">
            <span>🏨</span>

            <div>
              <h4>No hay hoteles en este filtro</h4>

              <p>Cambia el filtro o añade hoteles desde Ciudades.</p>
            </div>
          </article>
        ) : (
          <div className="reservation-list">
            {visibleHotels.map((hotel) => {
              const city = getCity(hotel.city);

              const checkInDate = formatDate(hotel.check_in_date);

              const checkOutDate = formatDate(hotel.check_out_date);

              const isUpdating = Boolean(
                updatingKey?.startsWith("hotel-" + hotel.id),
              );

              return (
                <article className="reservation-item" key={"hotel-" + hotel.id}>
                  <span className="reservation-item-icon">🏨</span>

                  <div className="reservation-item-content">
                    <div className="reservation-item-heading">
                      <div>
                        <span>
                          {city.emoji} {city.name}
                        </span>

                        <h4>{hotel.name}</h4>
                      </div>

                      <button
                        className="reservation-open-button"
                        type="button"
                        onClick={() => openHotelCity(hotel)}
                      >
                        Ver ciudad
                      </button>
                    </div>

                    {(checkInDate || checkOutDate) && (
                      <p className="reservation-item-detail">
                        {checkInDate || "Entrada pendiente"}
                        {" → "}
                        {checkOutDate || "Salida pendiente"}
                      </p>
                    )}

                    <div className="reservation-status-actions">
                      <button
                        className={
                          hotel.reserved
                            ? "reservation-status selected"
                            : "reservation-status"
                        }
                        type="button"
                        disabled={isUpdating}
                        onClick={() => toggleHotelStatus(hotel, "reserved")}
                      >
                        {hotel.reserved
                          ? "✓ Reservado"
                          : "○ Pendiente de reservar"}
                      </button>

                      <button
                        className={
                          hotel.paid
                            ? "reservation-status paid selected"
                            : "reservation-status paid"
                        }
                        type="button"
                        disabled={isUpdating}
                        onClick={() => toggleHotelStatus(hotel, "paid")}
                      >
                        {hotel.paid ? "✓ Pagado" : "○ Pendiente de pago"}
                      </button>
                    </div>

                    <div className="reservation-item-links">
                      {hotel.maps_link && (
                        <button
                          type="button"
                          onClick={() => openExternalLink(hotel.maps_link)}
                        >
                          Google Maps
                        </button>
                      )}

                      {hotel.booking_link && (
                        <button
                          type="button"
                          onClick={() => openExternalLink(hotel.booking_link)}
                        >
                          Abrir reserva
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section
        className="reservation-group"
        hidden={
          reservationTypeFilter !== "all" &&
          reservationTypeFilter !== "transports"
        }
      >
        <div className="reservation-group-heading">
          <div>
            <p className="section-label">TRANSPORTES</p>

            <h3>Desplazamientos</h3>
          </div>

          <span>{visibleTransports.length}</span>
        </div>

        {visibleTransports.length === 0 ? (
          <article className="reservation-empty">
            <span>🚆</span>

            <div>
              <h4>No hay transportes en este filtro</h4>

              <p>Los transportes se añaden desde los días del itinerario.</p>
            </div>
          </article>
        ) : (
          <div className="reservation-list">
            {visibleTransports.map((transport) => {
              const currentDay = getDay(transport.day_id);

              const city = getCity(currentDay?.city);

              const startTime = formatTime(transport.start_time);

              const endTime = formatTime(transport.end_time);

              const isUpdating = Boolean(
                updatingKey?.startsWith("transport-" + transport.id),
              );

              return (
                <article
                  className="reservation-item"
                  key={"transport-" + transport.id}
                >
                  <span className="reservation-item-icon">🚆</span>

                  <div className="reservation-item-content">
                    <div className="reservation-item-heading">
                      <div>
                        <span>
                          {currentDay
                            ? "Día " +
                              currentDay.day_number +
                              " · " +
                              city.emoji +
                              " " +
                              city.name
                            : "Día no disponible"}
                        </span>

                        <h4>{transport.title}</h4>
                      </div>

                      <button
                        className="reservation-open-button"
                        type="button"
                        disabled={!currentDay}
                        onClick={() => openTransportDay(transport)}
                      >
                        Ver día
                      </button>
                    </div>

                    {(startTime || endTime || transport.description) && (
                      <p className="reservation-item-detail">
                        {startTime || ""}
                        {startTime && endTime ? " → " : ""}
                        {endTime || ""}
                        {(startTime || endTime) && transport.description
                          ? " · "
                          : ""}
                        {transport.description || ""}
                      </p>
                    )}

                    <div className="reservation-status-actions">
                      <button
                        className={
                          transport.reserved
                            ? "reservation-status selected"
                            : "reservation-status"
                        }
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          toggleTransportStatus(transport, "reserved")
                        }
                      >
                        {transport.reserved
                          ? "✓ Reservado"
                          : "○ Pendiente de reservar"}
                      </button>

                      <button
                        className={
                          transport.paid
                            ? "reservation-status paid selected"
                            : "reservation-status paid"
                        }
                        type="button"
                        disabled={isUpdating}
                        onClick={() => toggleTransportStatus(transport, "paid")}
                      >
                        {transport.paid ? "✓ Pagado" : "○ Pendiente de pago"}
                      </button>
                    </div>

                    {transport.link && (
                      <div className="reservation-item-links">
                        <button
                          type="button"
                          onClick={() => openExternalLink(transport.link)}
                        >
                          Abrir enlace
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      {editingActivity && (
        <div
          className="reservation-modal-backdrop"
          onMouseDown={() => setEditingActivity(null)}
        >
          <form
            className="reservation-activity-modal"
            onSubmit={saveActivityReservation}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="activity-form-heading">
              <div>
                <p className="section-label">RESERVA</p>
                <h3>{editingActivity.name}</h3>
              </div>
              <button
                className="form-close-button"
                type="button"
                onClick={() => setEditingActivity(null)}
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <label>
                Estado
                <select
                  name="reservation_status"
                  defaultValue={editingActivity.reservation_status || "pending"}
                >
                  <option value="pending">Pendiente de reservar</option>
                  <option value="reserved">Reservado</option>
                  <option value="not_available">No admite reserva</option>
                  <option value="checking">Por comprobar</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </label>
              <label>
                Personas
                <input
                  name="reservation_people"
                  type="number"
                  min="1"
                  defaultValue={editingActivity.reservation_people || ""}
                />
              </label>
              <label>
                Fecha
                <input
                  name="reservation_date"
                  type="date"
                  defaultValue={editingActivity.reservation_date || ""}
                />
              </label>
              <label>
                Hora
                <input
                  name="reservation_time"
                  type="time"
                  defaultValue={
                    formatTime(editingActivity.reservation_time) || ""
                  }
                />
              </label>
            </div>

            <label>
              Código de confirmación
              <input
                name="reservation_code"
                defaultValue={editingActivity.reservation_code || ""}
              />
            </label>
            <label>
              Enlace de reserva
              <input
                name="reservation_link"
                type="url"
                defaultValue={editingActivity.reservation_link || ""}
              />
            </label>
            <label>
              Depósito o importe pagado
              <input
                name="reservation_deposit"
                type="number"
                min="0"
                step="0.01"
                defaultValue={editingActivity.reservation_deposit || ""}
              />
            </label>
            <label className="reservation-checkbox">
              <input
                name="reservation_paid"
                type="checkbox"
                defaultChecked={Boolean(editingActivity.reservation_paid)}
              />
              Pago completado
            </label>
            <label>
              Notas
              <textarea
                name="reservation_notes"
                rows="3"
                defaultValue={editingActivity.reservation_notes || ""}
              />
            </label>
            <button
              className="save-button"
              type="submit"
              disabled={updatingKey !== null}
            >
              Guardar reserva
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

export default Reservations;
