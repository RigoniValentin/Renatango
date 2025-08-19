export interface CreateEventRequest {
  title: string;
  description?: string;
  startDate: string | Date;
  endDate?: string | Date;
  type: "class" | "workshop" | "special" | "capacitation";
  category?: string;
  color?: string;
  isRecurring?: boolean;
  recurringDays?: number[];
  location?: string;
  maxParticipants?: number;
  instructor?: string;
  price?: number;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  type?: "class" | "workshop" | "special" | "capacitation";
  category?: string;
  color?: string;
  isRecurring?: boolean;
  recurringDays?: number[];
  location?: string;
  maxParticipants?: number;
  instructor?: string;
  price?: number;
  isActive?: boolean;
}

export interface EventResponse {
  _id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  type: "class" | "workshop" | "special" | "capacitation";
  category?: string;
  color: string;
  isRecurring: boolean;
  recurringDays: number[];
  location?: string;
  maxParticipants?: number;
  instructor?: string;
  price?: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringEventInstance {
  originalEventId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  type: "class" | "workshop" | "special" | "capacitation";
  category?: string;
  color: string;
  location?: string;
  maxParticipants?: number;
  instructor?: string;
  price?: number;
  isRecurring: true;
  isInstance: true; // Marca que es una instancia generada
}

export interface EventQueryParams {
  type?: "class" | "workshop" | "special" | "capacitation";
  year?: number;
  month?: number;
  category?: string;
  instructor?: string;
  isActive?: boolean;
  limit?: number;
  page?: number;
}

export interface MonthEventsResponse {
  year: number;
  month: number;
  events: (EventResponse | RecurringEventInstance)[];
  totalEvents: number;
  recurringInstancesGenerated: number;
}
