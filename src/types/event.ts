export const EVENT_COLORS = [
  '#3366FF', // Primary
  '#0EA5A5', // Team
  '#8B5CF6', // Personal
  '#F59E0B', // Reminder
  '#F43F5E', // Danger
] as const;

export type EventColor = (typeof EVENT_COLORS)[number];

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string; // ISO 8601 string
  endsAt: string;   // ISO 8601 string
  color: EventColor | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt: string;
  color?: EventColor;
}

export interface UpdateEventPayload {
  title?: string;
  description?: string | null;
  location?: string | null;
  startsAt?: string;
  endsAt?: string;
  color?: EventColor;
}

/**
 * Encapsulates an optimistic mutation state for safe rollback on flaky server response.
 */
export interface EventMutation {
  mutationId: string;
  eventId: string;
  previousState: CalendarEvent;
  optimisticState: CalendarEvent;
  timestamp: number;
}
