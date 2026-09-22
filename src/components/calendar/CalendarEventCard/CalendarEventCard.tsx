import React, { useState, useRef } from 'react';
import { MapPin } from 'lucide-react';
import type { CalendarEvent } from '../../../types/event';
import { formatTimeRange } from '../../../utils/date';
import { calculateRescheduledTimes, calculateResizedTimes } from '../../../utils/calendarLayout';
import './CalendarEventCard.css';

interface CalendarEventCardProps {
  event: CalendarEvent;
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
  zIndex?: number;
  currentDayKey: string;
  hourHeight?: number;
  onClick?: (event: CalendarEvent) => void;
  onReschedule?: (eventId: string, newStartsAt: string, newEndsAt: string) => void;
  onResize?: (eventId: string, newEndsAt: string) => void;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  event,
  top,
  height,
  leftPercent,
  widthPercent,
  zIndex = 1,
  currentDayKey,
  hourHeight = 60,
  onClick,
  onReschedule,
  onResize,
}) => {
  const [interactionType, setInteractionType] = useState<'none' | 'drag' | 'resize'>('none');
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const [dragDeltaY, setDragDeltaY] = useState(0);
  const [resizeDeltaY, setResizeDeltaY] = useState(0);
  const [targetDayKey, setTargetDayKey] = useState(currentDayKey);

  const cardRef = useRef<HTMLDivElement>(null);
  const startPointerRef = useRef({ x: 0, y: 0 });
  const initialTopRef = useRef(top);
  const initialHeightRef = useRef(height);
  const targetDayKeyRef = useRef(currentDayKey);
  const snappedTopRef = useRef(top);
  const snappedHeightRef = useRef(height);

  // Total calendar hours: 8 AM to 8 PM = 12 hours
  const totalCalendarHeight = 12 * hourHeight;

  // Handle Drag-to-reschedule
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only primary mouse button
    // Ignore if click was on the resize handle
    if ((e.target as HTMLElement).closest('.calendar-event-card__resize-handle')) {
      return;
    }

    startPointerRef.current = { x: e.clientX, y: e.clientY };
    initialTopRef.current = top;
    snappedTopRef.current = top;
    targetDayKeyRef.current = currentDayKey;

    let hasStartedDrag = false;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startPointerRef.current.x;
      const deltaY = moveEvent.clientY - startPointerRef.current.y;
      const dist = Math.hypot(deltaX, deltaY);

      if (!hasStartedDrag && dist >= 5) {
        hasStartedDrag = true;
        setInteractionType('drag');
      }

      if (hasStartedDrag) {
        // Clamp top so event stays within 8 AM - 8 PM
        const maxTop = Math.max(0, totalCalendarHeight - height);
        const rawTop = initialTopRef.current + deltaY;
        const clampedTop = Math.min(Math.max(0, rawTop), maxTop);
        const snapped = Math.round(clampedTop / 15) * 15;
        snappedTopRef.current = snapped;

        setDragDeltaY(snapped - initialTopRef.current);
        setDragDeltaX(deltaX);

        // Detect day column using column bounding rectangles
        const dayCols = document.querySelectorAll<HTMLElement>('.day-col[data-date-key]');
        for (const col of dayCols) {
          const rect = col.getBoundingClientRect();
          if (moveEvent.clientX >= rect.left && moveEvent.clientX <= rect.right) {
            const dateKey = col.getAttribute('data-date-key');
            if (dateKey && dateKey !== targetDayKeyRef.current) {
              targetDayKeyRef.current = dateKey;
              setTargetDayKey(dateKey);
            }
            break;
          }
        }
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      if (hasStartedDrag) {
        setInteractionType('none');
        setDragDeltaX(0);
        setDragDeltaY(0);

        const newTimes = calculateRescheduledTimes(
          event,
          targetDayKeyRef.current,
          snappedTopRef.current,
          hourHeight
        );

        if (
          newTimes.startsAt !== event.startsAt ||
          newTimes.endsAt !== event.endsAt
        ) {
          onReschedule?.(event.id, newTimes.startsAt, newTimes.endsAt);
        }
      } else {
        onClick?.(event);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Handle vertical resize
  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    startPointerRef.current = { x: e.clientX, y: e.clientY };
    initialHeightRef.current = height;
    snappedHeightRef.current = height;
    setInteractionType('resize');

    const handleResizePointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startPointerRef.current.y;
      const rawHeight = initialHeightRef.current + deltaY;
      const maxHeight = Math.max(15, totalCalendarHeight - initialTopRef.current);
      const clampedHeight = Math.min(Math.max(15, rawHeight), maxHeight);
      const snapped = Math.max(15, Math.round(clampedHeight / 15) * 15);
      snappedHeightRef.current = snapped;
      setResizeDeltaY(snapped - initialHeightRef.current);
    };

    const handleResizePointerUp = () => {
      window.removeEventListener('pointermove', handleResizePointerMove);
      window.removeEventListener('pointerup', handleResizePointerUp);

      setInteractionType('none');
      setResizeDeltaY(0);

      if (snappedHeightRef.current !== initialHeightRef.current) {
        const newTimes = calculateResizedTimes(
          event,
          snappedHeightRef.current,
          hourHeight
        );
        onResize?.(event.id, newTimes.endsAt);
      }
    };

    window.addEventListener('pointermove', handleResizePointerMove);
    window.addEventListener('pointerup', handleResizePointerUp);
  };

  const timeLabel = formatTimeRange(event.startsAt, event.endsAt);
  const colorHex = event.color || '#3366FF';

  const effectiveHeight =
    interactionType === 'resize' ? Math.max(15, height + resizeDeltaY) : height;
  const effectiveTop =
    interactionType === 'drag' ? Math.max(0, top + dragDeltaY) : top;
  const isInteracting = interactionType !== 'none';

  // Format live time string for drag/resize preview without reading refs during render
  const formatMinutes = (mins: number) => {
    let h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m < 10 ? '0' : ''}${m} ${ampm}`;
  };

  let displayTime = timeLabel;
  if (interactionType === 'drag') {
    const startMin = 8 * 60 + Math.round((effectiveTop / hourHeight) * 60);
    const durMin = Math.round((height / hourHeight) * 60);
    const endMin = startMin + durMin;
    const timeStr = `${formatMinutes(startMin)} – ${formatMinutes(endMin)}`;
    displayTime = targetDayKey !== currentDayKey ? `${targetDayKey} • ${timeStr}` : timeStr;
  } else if (interactionType === 'resize') {
    const startMin = 8 * 60 + Math.round((top / hourHeight) * 60);
    const durMin = Math.round((effectiveHeight / hourHeight) * 60);
    const endMin = startMin + durMin;
    displayTime = `${formatMinutes(startMin)} – ${formatMinutes(endMin)}`;
  }

  return (
    <div
      ref={cardRef}
      className={`calendar-event-card ${isInteracting ? 'calendar-event-card--dragging' : ''}`}
      style={{
        top: `${effectiveTop}px`,
        height: `${effectiveHeight}px`,
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        transform: interactionType === 'drag' ? `translate3d(${dragDeltaX}px, 0, 0)` : undefined,
        zIndex: isInteracting ? 50 : zIndex,
        '--event-color': colorHex,
      } as React.CSSProperties}
      onPointerDown={handlePointerDown}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(event);
        }
      }}
      aria-label={`${event.title}, ${timeLabel}${event.location ? `, at ${event.location}` : ''}`}
    >
      <div className="calendar-event-card__inner">
        <div className="calendar-event-card__title" title={event.title}>
          {event.title}
        </div>
        <div className="calendar-event-card__time">
          {displayTime}
        </div>
        {event.location && effectiveHeight >= 54 && (
          <div className="calendar-event-card__location" title={event.location}>
            <MapPin size={11} className="calendar-event-card__location-icon" />
            <span>{event.location}</span>
          </div>
        )}
      </div>

      {/* Resize Handle at Bottom Edge */}
      <div
        className="calendar-event-card__resize-handle"
        onPointerDown={handleResizePointerDown}
        title="Drag to resize event duration"
        aria-hidden="true"
      />
    </div>
  );
};
