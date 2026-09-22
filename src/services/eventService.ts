import { apiClient } from './api';
import type { CalendarEvent, CreateEventPayload, UpdateEventPayload } from '../types/event';

export const eventService = {
  /**
   * Fetches events overlapping the given ISO range (visible week only)
   * GET /events?from={from}&to={to}
   */
  async getEvents(from: string, to: string): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({ from, to });
    return apiClient<CalendarEvent[]>(`/events?${params.toString()}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  /**
   * Creates a new event via POST /events
   */
  async createEvent(payload: CreateEventPayload): Promise<CalendarEvent> {
    return apiClient<CalendarEvent>('/events', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: true,
    });
  },

  /**
   * Updates an event via PATCH /events/:id (Chaos endpoint with injected latency & ~8% 500 failure)
   */
  async updateEvent(id: string, payload: UpdateEventPayload): Promise<CalendarEvent> {
    return apiClient<CalendarEvent>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      requiresAuth: true,
    });
  },

  /**
   * Deletes an event via DELETE /events/:id
   */
  async deleteEvent(id: string): Promise<void> {
    await apiClient<void>(`/events/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  },
};
