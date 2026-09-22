import React, { useMemo, useRef } from 'react';
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
  const headerDaysRef = useRef<HTMLDivElement>(null);

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerDaysRef.current) {
      headerDaysRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

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

      {/* Week Header - Sits outside and above the scroll container */}
      <div className="week-header">
        <div className="week-header__time-spacer" />
        <div className="week-header__days" ref={headerDaysRef}>
          {week.days.map((day) => {
            const isWeekend = day.dayName === 'SAT' || day.dayName === 'SUN';
            return (
              <div
                key={day.dateKey}
                className={`week-header__cell ${day.isToday ? 'week-header__cell--today' : ''} ${
                  isWeekend ? 'week-header__cell--weekend' : ''
                }`}
              >
                <span className="day-col__name">{day.dayName}</span>
                <div
                  className={`day-col__number-badge ${
                    day.isToday
                      ? 'day-col__number-badge--today'
                      : isWeekend
                      ? 'day-col__number-badge--weekend'
                      : ''
                  }`}
                >
                  <span>{day.dayNumber}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="week-header__scroll-spacer" />
      </div>

      {/* Scrollable Grid - Scrollbar starts strictly below the header section */}
      <div className="week-grid-scroll" onScroll={handleScroll}>
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
