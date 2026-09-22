import type { CalendarEvent } from './event';

export type CalendarViewMode = 'day' | 'week' | 'month';

export interface CalendarDay {
  date: Date;
  dateKey: string; // YYYY-MM-DD
  dayName: string; // 'Mon', 'Tue', etc.
  dayNumber: number; // 14, 15, etc.
  isToday: boolean;
  isSelected: boolean;
}

export interface CalendarWeek {
  days: CalendarDay[];
  startOfWeek: Date; // Monday 00:00:00 local
  endOfWeek: Date;   // Sunday 23:59:59.999 local
  rangeLabel: string; // e.g. "September 14–20, 2026"
  fromIso: string;   // ISO string for API query
  toIso: string;     // ISO string for API query
}

export interface PositionedEvent {
  event: CalendarEvent;
  top: number;       // In pixels
  height: number;    // In pixels
  leftPercent: number; // 0 to 100
  widthPercent: number; // e.g. 50% for 2 overlapping events
  zIndex: number;
}
