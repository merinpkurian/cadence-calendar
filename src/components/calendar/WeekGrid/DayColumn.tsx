import React from 'react';
import type { CalendarDay } from '../../../types/calendar';
import type { CalendarEvent } from '../../../types/event';
import { layoutEventsForDay } from '../../../utils/calendarLayout';
import { CALENDAR_START_HOUR, CALENDAR_END_HOUR, startOfDay } from '../../../utils/date';
import { CalendarEventCard } from '../CalendarEventCard/CalendarEventCard';
import { CurrentTimeIndicator } from '../CurrentTimeIndicator/CurrentTimeIndicator';
import './DayColumn.css';

interface DayColumnProps {
  day: CalendarDay;
  events: CalendarEvent[];
  hourHeight?: number;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date, hour: number) => void;
  onReschedule?: (eventId: string, newStartsAt: string, newEndsAt: string) => void;
  onResize?: (eventId: string, newEndsAt: string) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  day,
  events,
  hourHeight = 60,
  onEventClick,
  onSlotClick,
  onReschedule,
  onResize,
}) => {
  const positionedEvents = layoutEventsForDay(events, hourHeight);
  const totalHours = CALENDAR_END_HOUR - CALENDAR_START_HOUR;
  const hoursList = Array.from({ length: totalHours }, (_, i) => CALENDAR_START_HOUR + i);
  const isWeekend = day.dayName === 'SAT' || day.dayName === 'SUN';
  const isFirstDay = day.dayName === 'MON';
  const isLastDay = day.dayName === 'SUN';
  const isPastDay = startOfDay(day.date).getTime() < startOfDay(new Date()).getTime();

  return (
    <div
      className={`day-col ${day.isToday ? 'day-col--today' : ''} ${isWeekend ? 'day-col--weekend' : ''} ${isFirstDay ? 'day-col--first' : ''} ${isLastDay ? 'day-col--last' : ''}`}
      data-date-key={day.dateKey}
    >
      {/* Day Column Grid Area */}
      <div
        className="day-col__grid"
        style={{ height: `${totalHours * hourHeight}px` }}
      >
        {/* Horizontal Hour Slot Lines */}
        {hoursList.map((hour) => (
          <div
            key={hour}
            className={`day-col__slot ${isPastDay ? 'day-col__slot--past' : ''}`}
            style={{ height: `${hourHeight}px` }}
            onClick={() => onSlotClick?.(day.date, hour)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSlotClick?.(day.date, hour);
              }
            }}
            aria-label={`Schedule event at ${hour}:00 on ${day.dayName} ${day.dayNumber}`}
          />
        ))}

        {/* Current Time Red Bar (only shown on today's column) */}
        {day.isToday && <CurrentTimeIndicator hourHeight={hourHeight} />}

        {/* Positioned Event Cards */}
        {positionedEvents.map((pe) => (
          <CalendarEventCard
            key={pe.event.id}
            event={pe.event}
            top={pe.top}
            height={pe.height}
            leftPercent={pe.leftPercent}
            widthPercent={pe.widthPercent}
            zIndex={pe.zIndex}
            currentDayKey={day.dateKey}
            hourHeight={hourHeight}
            onClick={onEventClick}
            onReschedule={onReschedule}
            onResize={onResize}
          />
        ))}
      </div>
    </div>
  );
};
