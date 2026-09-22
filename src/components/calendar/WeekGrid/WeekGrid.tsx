import React, { useMemo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { CalendarWeek } from '../../../types/calendar';
import type { CalendarEvent } from '../../../types/event';
import { TimeColumn } from './TimeColumn';
import { DayColumn } from './DayColumn';
import './WeekGrid.css';

interface WeekGridProps {
  week: CalendarWeek;
  events: CalendarEvent[];
  hourHeight?: number;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date, hour: number) => void;
  onReschedule?: (eventId: string, newStartsAt: string, newEndsAt: string) => void;
  onResize?: (eventId: string, newEndsAt: string) => void;
}

export const WeekGrid: React.FC<WeekGridProps> = ({
  week,
  events,
  hourHeight = 60,
  isLoading = false,
  error = null,
  onRetry,
  onEventClick,
  onSlotClick,
  onReschedule,
  onResize,
}) => {
  // Group events by local YYYY-MM-DD
  const eventsByDayKey = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const d = new Date(event.startsAt);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(event);
    }
    return map;
  }, [events]);

  return (
    <div className="week-grid-container">
      {/* Error state */}
      {error && (
        <div className="week-grid-alert week-grid-alert--error">
          <AlertCircle size={18} />
          <span>{error}</span>
          {onRetry && (
            <button type="button" className="week-grid-retry-btn" onClick={onRetry}>
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="week-grid-loading" aria-label="Loading events">
          <div className="week-grid-loading__spinner" />
        </div>
      )}

      <div className="week-grid-scroll">
        <div className="week-grid" data-calendar-grid="true">
          {/* Left Time Labels Column */}
          <TimeColumn hourHeight={hourHeight} />

          {/* 7 Day Columns */}
          {week.days.map((day) => (
            <DayColumn
              key={day.dateKey}
              day={day}
              events={eventsByDayKey.get(day.dateKey) || []}
              hourHeight={hourHeight}
              onEventClick={onEventClick}
              onSlotClick={onSlotClick}
              onReschedule={onReschedule}
              onResize={onResize}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
