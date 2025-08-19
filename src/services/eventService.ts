import Event, { IEvent } from "@models/Event";
import {
  CreateEventRequest,
  UpdateEventRequest,
  EventQueryParams,
  RecurringEventInstance,
  EventResponse,
  MonthEventsResponse,
} from "../types/EventTypes";

export class EventService {
  /**
   * Crear un nuevo evento
   */
  async createEvent(
    eventData: CreateEventRequest,
    createdBy: string
  ): Promise<IEvent> {
    const event = new Event({
      ...eventData,
      createdBy,
    });

    return await event.save();
  }

  /**
   * Obtener todos los eventos con filtros opcionales
   */
  async getEvents(queryParams: EventQueryParams): Promise<EventResponse[]> {
    const {
      type,
      year,
      month,
      category,
      instructor,
      isActive = true,
      limit = 50,
      page = 1,
    } = queryParams;

    const filter: any = { isActive };

    // Filtros opcionales
    if (type) filter.type = type;
    if (category) filter.category = new RegExp(category, "i");
    if (instructor) filter.instructor = new RegExp(instructor, "i");

    // Filtro por fecha si se especifica año/mes
    if (year && month) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      filter.startDate = {
        $gte: startOfMonth,
        $lte: endOfMonth,
      };
    }

    const skip = (page - 1) * limit;

    const events = await Event.find(filter)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email")
      .lean();

    return events.map((event) => ({
      ...event,
      _id: event._id.toString(),
      createdBy: event.createdBy.toString(),
    })) as EventResponse[];
  }

  /**
   * Obtener eventos de un mes específico incluyendo instancias recurrentes
   */
  async getEventsByMonth(
    year: number,
    month: number
  ): Promise<MonthEventsResponse> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Obtener eventos normales del mes
    const monthEvents = await Event.find({
      isActive: true,
      $or: [
        // Eventos únicos en el mes
        {
          isRecurring: false,
          startDate: { $gte: startOfMonth, $lte: endOfMonth },
        },
        // Eventos recurrentes (pueden estar fuera del mes pero generar instancias)
        {
          isRecurring: true,
          startDate: { $lte: endOfMonth },
        },
      ],
    })
      .populate("createdBy", "name email")
      .lean();

    const allEventsForMonth: (EventResponse | RecurringEventInstance)[] = [];
    let recurringInstancesGenerated = 0;

    for (const event of monthEvents) {
      if (!event.isRecurring) {
        // Agregar eventos únicos que están en el mes
        if (event.startDate >= startOfMonth && event.startDate <= endOfMonth) {
          allEventsForMonth.push({
            ...event,
            _id: (event._id as any).toString(),
            createdBy: (event.createdBy as any).toString(),
          } as EventResponse);
        }
      } else {
        // Generar instancias recurrentes para el mes
        const instances = this.generateRecurringInstances(
          event as any,
          startOfMonth,
          endOfMonth
        );
        allEventsForMonth.push(...instances);
        recurringInstancesGenerated += instances.length;
      }
    }

    // Ordenar por fecha
    allEventsForMonth.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    return {
      year,
      month,
      events: allEventsForMonth,
      totalEvents: allEventsForMonth.length,
      recurringInstancesGenerated,
    };
  }

  /**
   * Generar instancias de eventos recurrentes para un período
   */
  private generateRecurringInstances(
    event: IEvent,
    startDate: Date,
    endDate: Date
  ): RecurringEventInstance[] {
    const instances: RecurringEventInstance[] = [];

    if (!event.isRecurring || !event.recurringDays.length) {
      return instances;
    }

    const eventStartDate = new Date(event.startDate);
    const duration = event.endDate
      ? new Date(event.endDate).getTime() - eventStartDate.getTime()
      : 0;

    // Comenzar desde el inicio del período o la fecha del evento original
    const iterationStart = new Date(
      Math.max(startDate.getTime(), eventStartDate.getTime())
    );

    const current = new Date(iterationStart);
    current.setHours(
      eventStartDate.getHours(),
      eventStartDate.getMinutes(),
      eventStartDate.getSeconds(),
      0
    );

    while (current <= endDate) {
      const dayOfWeek = current.getDay();

      if (event.recurringDays.includes(dayOfWeek)) {
        const instanceStart = new Date(current);
        const instanceEnd =
          duration > 0
            ? new Date(instanceStart.getTime() + duration)
            : undefined;

        instances.push({
          originalEventId: (event._id as any).toString(),
          title: event.title,
          description: event.description,
          startDate: instanceStart,
          endDate: instanceEnd,
          type: event.type,
          category: event.category,
          color: event.color,
          location: event.location,
          maxParticipants: event.maxParticipants,
          instructor: event.instructor,
          price: event.price,
          isRecurring: true,
          isInstance: true,
        });
      }

      // Avanzar al siguiente día
      current.setDate(current.getDate() + 1);
    }

    return instances;
  }

  /**
   * Obtener evento por ID
   */
  async getEventById(id: string): Promise<IEvent | null> {
    return await Event.findById(id).populate("createdBy", "name email").exec();
  }

  /**
   * Actualizar evento
   */
  async updateEvent(
    id: string,
    updateData: UpdateEventRequest
  ): Promise<IEvent | null> {
    // Obtener el evento actual para validaciones
    const currentEvent = await Event.findById(id);
    if (!currentEvent) {
      return null;
    }

    // Preparar las fechas para validación
    const newStartDate = updateData.startDate
      ? new Date(updateData.startDate)
      : currentEvent.startDate;
    const newEndDate =
      updateData.endDate !== undefined
        ? updateData.endDate
          ? new Date(updateData.endDate)
          : null
        : currentEvent.endDate;

    // Validar que endDate sea posterior a startDate si ambas están presentes
    if (newEndDate && newStartDate && newEndDate <= newStartDate) {
      throw new Error(
        "La fecha de fin debe ser posterior a la fecha de inicio"
      );
    }

    // Realizar la actualización
    return await Event.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: false } // Deshabilitamos validadores de Mongoose ya que validamos manualmente
    ).populate("createdBy", "name email");
  }

  /**
   * Eliminar evento (soft delete)
   */
  async deleteEvent(id: string): Promise<IEvent | null> {
    return await Event.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Eliminar evento permanentemente
   */
  async hardDeleteEvent(id: string): Promise<boolean> {
    const result = await Event.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Obtener estadísticas de eventos
   */
  async getEventStats() {
    const totalEvents = await Event.countDocuments({ isActive: true });
    const eventsByType = await Event.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    const recurringEvents = await Event.countDocuments({
      isActive: true,
      isRecurring: true,
    });

    return {
      totalEvents,
      recurringEvents,
      eventsByType: eventsByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };
  }
}
