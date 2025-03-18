import { useDispatch, useSelector } from "react-redux";
import {
  onAddNewEvent,
  onClearState,
  onDeleteEvent,
  onLoadEvents,
  onSetActiveEvent,
  onUpdateEvent,
} from "../store";
import { calendarApi } from "../api";
import { convertEventsToDateEvents } from "../helpers";
import Swal from "sweetalert2";

export const useCalendarStore = () => {
  const dispatch = useDispatch();
  const { events, activeEvent } = useSelector((state) => state.calendar);
  const { user } = useSelector((state) => state.auth);

  const setActiveEvent = (calendarEvent) => {
    dispatch(onSetActiveEvent(calendarEvent));
  };

  const startSavingEvent = async (calendarEvent) => {
    try {
      if (calendarEvent.id) {
        //edit
        await calendarApi.put(`/events/${calendarEvent.id}`, calendarEvent);
        Swal.fire(
          "Edición exitosa",
          "El evento se actualizó correctamente",
          "success"
        );
        dispatch(onUpdateEvent({ ...calendarEvent, user }));
        return;
      }

      //create
      const { data } = await calendarApi.post("/events", calendarEvent);
      Swal.fire(
        "Creación exitosa",
        "El evento se creó correctamente",
        "success"
      );
      dispatch(onAddNewEvent({ ...calendarEvent, id: data?.event.id, user }));
    } catch (error) {
      console.log(error);
      Swal.fire("Error al guardar", error.response.data?.message, "error");
    }
  };

  const startDeletingEvent = async () => {
    try {
      await calendarApi.delete(`/events/${activeEvent.id}`);
      Swal.fire(
        "Eliminación exitosa",
        "El evento se eliminó correctamente",
        "success"
      );
      dispatch(onDeleteEvent());
    } catch (error) {
      console.log(error);
      Swal.fire("Error al eliminar", error.response.data?.message, "error");
    }
  };

  const startLoadingEvents = async () => {
    try {
      const { data } = await calendarApi.get("/events");
      const events = convertEventsToDateEvents(data?.events);
      dispatch(onLoadEvents(events));
    } catch (error) {
      console.log("Error cargando eventos");
      console.log(error);
    }
  };

  return {
    //Properties
    activeEvent,
    events,
    hasEventSelected: !!activeEvent,
    //Methods
    setActiveEvent,
    startSavingEvent,
    startDeletingEvent,
    startLoadingEvents,
  };
};
