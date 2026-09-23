import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarSidebar } from '../../components/calendar/CalendarSidebar/CalendarSidebar';
import { CalendarHeader } from '../../components/calendar/CalendarHeader/CalendarHeader';
import { WeekGrid } from '../../components/calendar/WeekGrid/WeekGrid';
import { EventModal } from '../../components/modals/EventModal/EventModal';
import { EventDetailsPopover } from '../../components/modals/EventDetailsPopover/EventDetailsPopover';
import { getCalendarWeek, addDays, startOfDay, formatDateForInput } from '../../utils/date';
import { eventService } from '../../services/eventService';
import { useToast } from '../../hooks/useToast';
import type { CalendarEvent } from '../../types/event';
import './CalendarPage.css';

type ActiveModalType = 'none' | 'create' | 'edit' | 'details';

export const CalendarPage: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize currentDate with URL search param or sessionStorage fallback (Test 4: refresh persistence)
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const paramDate = searchParams.get('date');
    if (paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate)) {
      const [y, m, d] = paramDate.split('-').map(Number);
      const parsed = new Date(y, m - 1, d, 12, 0, 0);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    const sessionDate = sessionStorage.getItem('cadence_view_date');
    if (sessionDate && /^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
      const [y, m, d] = sessionDate.split('-').map(Number);
      const parsed = new Date(y, m - 1, d, 12, 0, 0);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Modal State
  const [activeModal, setActiveModal] = useState<ActiveModalType>('none');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [createHour, setCreateHour] = useState<number | null>(null);

  // Optimistic Mutation & Rollback Tracking
  const mutationVersions = useRef<Record<string, number>>({});
  const lastConfirmedStates = useRef<Record<string, CalendarEvent>>({});
  const activeMutations = useRef<
    Record<
      string,
      Map<
        number,
        {
          version: number;
          eventId: string;
          previousState: CalendarEvent;
          optimisticState: CalendarEvent;
        }
      >
    >
  >({});

  // Compute visible week model
  const calendarWeek = useMemo(() => {
    return getCalendarWeek(currentDate);
  }, [currentDate]);

  // Fetch events for visible week only
  useEffect(() => {
    let isSubscribed = true;

    async function loadEvents() {
      try {
        const data = await eventService.getEvents(calendarWeek.fromIso, calendarWeek.toIso);
        if (isSubscribed) {
          setEvents(data);
          setError(null);
        }
      } catch (err) {
        if (isSubscribed) {
          const msg = err instanceof Error ? err.message : 'Failed to load events for this week';
          setError(msg);
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      isSubscribed = false;
    };
  }, [calendarWeek.fromIso, calendarWeek.toIso, reloadTrigger]);

  // Navigation handlers with URL and session sync
  const updateVisibleDate = (newDate: Date) => {
    setIsLoading(true);
    setCurrentDate(newDate);
    const dateKey = formatDateForInput(newDate);
    sessionStorage.setItem('cadence_view_date', dateKey);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('date', dateKey);
        return next;
      },
      { replace: true }
    );
  };

  const handlePrevWeek = () => {
    updateVisibleDate(addDays(currentDate, -7));
  };

  const handleNextWeek = () => {
    updateVisibleDate(addDays(currentDate, 7));
  };

  const handleToday = () => {
    updateVisibleDate(new Date());
  };

  const handleSelectDate = (date: Date) => {
    updateVisibleDate(date);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setReloadTrigger((prev) => prev + 1);
  };

  // Event modal openers
  const handleCreateClick = () => {
    // If viewing a past week/date, default create date to today
    const today = startOfDay(new Date());
    const viewDay = startOfDay(currentDate);
    const defaultDate = viewDay < today ? new Date() : currentDate;
    setCreateDate(defaultDate);
    setCreateHour(null);
    setSelectedEvent(null);
    setActiveModal('create');
  };

  const handleSlotClick = (date: Date, hour: number) => {
    // Disallow scheduling on past dates
    const slotDay = startOfDay(date);
    const today = startOfDay(new Date());
    if (slotDay < today) {
      showToast('Cannot schedule events on past dates', 'error');
      return;
    }
    setCreateDate(date);
    setCreateHour(hour);
    setSelectedEvent(null);
    setActiveModal('create');
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setActiveModal('details');
  };

  const handleEditFromDetails = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setActiveModal('edit');
  };

  const handleCloseModal = () => {
    setActiveModal('none');
    setSelectedEvent(null);
  };

  // CRUD calendar synchronization
  const handleEventSaved = (savedEvent: CalendarEvent) => {
    delete lastConfirmedStates.current[savedEvent.id];
    delete activeMutations.current[savedEvent.id];
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === savedEvent.id);
      if (exists) {
        return prev.map((e) => (e.id === savedEvent.id ? savedEvent : e));
      }
      return [...prev, savedEvent];
    });
    handleCloseModal();
  };

  const handleEventDeleted = (deletedId: string) => {
    delete lastConfirmedStates.current[deletedId];
    delete activeMutations.current[deletedId];
    setEvents((prev) => prev.filter((e) => e.id !== deletedId));
    handleCloseModal();
  };

  const handleDeleteFromDetails = async (deletedId: string) => {
    await eventService.deleteEvent(deletedId);
    handleEventDeleted(deletedId);
  };

  /**
   * Optimistic Event Mutation with Per-Event Versioning & Rollback
   * Protects against flaky PATCH /events/:id endpoint (~8% 500 error, 300-900ms delay)
   * and prevents race conditions from rapid concurrent mutations.
   */
  const mutateOptimisticEvent = async (
    eventId: string,
    optimisticPatch: { startsAt?: string; endsAt?: string }
  ) => {
    const currentEvent = events.find((e) => e.id === eventId);
    if (!currentEvent) return;

    // Preserve baseline server state before uncommitted mutations started
    if (!lastConfirmedStates.current[eventId]) {
      lastConfirmedStates.current[eventId] = { ...currentEvent };
    }

    // 1. Increment per-event mutation version
    const currentVersion = (mutationVersions.current[eventId] || 0) + 1;
    mutationVersions.current[eventId] = currentVersion;

    const updatedEvent: CalendarEvent = {
      ...currentEvent,
      ...optimisticPatch,
    };

    // Store mutation tracking record
    if (!activeMutations.current[eventId]) {
      activeMutations.current[eventId] = new Map();
    }
    activeMutations.current[eventId].set(currentVersion, {
      version: currentVersion,
      eventId,
      previousState: currentEvent,
      optimisticState: updatedEvent,
    });

    // 2. Immediately update UI (0ms delay)
    setEvents((prev) => prev.map((e) => (e.id === eventId ? updatedEvent : e)));

    // 3. Send PATCH request to backend
    try {
      const serverResult = await eventService.updateEvent(eventId, {
        startsAt: optimisticPatch.startsAt,
        endsAt: optimisticPatch.endsAt,
      });

      // Update confirmed state with authoritative server data
      lastConfirmedStates.current[eventId] = serverResult;
      activeMutations.current[eventId]?.delete(currentVersion);

      // 4. Commit response ONLY if this is still the latest mutation
      if (mutationVersions.current[eventId] === currentVersion) {
        setEvents((prev) => prev.map((e) => (e.id === eventId ? serverResult : e)));
        delete lastConfirmedStates.current[eventId];
      }
    } catch {
      const mutationRecord = activeMutations.current[eventId]?.get(currentVersion);
      activeMutations.current[eventId]?.delete(currentVersion);

      // 5. Rollback ONLY if this failed mutation is still the latest user action
      if (mutationVersions.current[eventId] === currentVersion) {
        const rollbackTarget =
          lastConfirmedStates.current[eventId] || mutationRecord?.previousState || currentEvent;
        setEvents((prev) => prev.map((e) => (e.id === eventId ? rollbackTarget : e)));
        delete lastConfirmedStates.current[eventId];

        showToast(
          "Couldn't update the event. Your previous time has been restored.",
          'error'
        );
      } else {
        // Discard stale failure: A newer mutation is already in-flight or completed
      }
    }
  };

  const handleReschedule = (eventId: string, newStartsAt: string, newEndsAt: string) => {
    mutateOptimisticEvent(eventId, { startsAt: newStartsAt, endsAt: newEndsAt });
  };

  const handleResize = (eventId: string, newEndsAt: string) => {
    mutateOptimisticEvent(eventId, { endsAt: newEndsAt });
  };

  return (
    <div className="calendar-page">
      {/* Left Sidebar */}
      <CalendarSidebar
        currentDate={currentDate}
        onSelectDate={handleSelectDate}
        onCreateEventClick={handleCreateClick}
      />

      {/* Main Calendar View Area */}
      <div className="calendar-page__main">
        <CalendarHeader
          rangeLabel={calendarWeek.rangeLabel}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onToday={handleToday}
          onAddEventClick={handleCreateClick}
        />

        <WeekGrid
          week={calendarWeek}
          events={events}
          isLoading={isLoading}
          error={error}
          onRetry={handleRetry}
          onEventClick={handleEventClick}
          onSlotClick={handleSlotClick}
          onReschedule={handleReschedule}
          onResize={handleResize}
        />
      </div>

      {/* Create / Edit Event Modal */}
      {(activeModal === 'create' || activeModal === 'edit') && (
        <EventModal
          key={`${activeModal}-${selectedEvent?.id || 'new'}-${createDate?.getTime() || 0}-${createHour || 0}`}
          isOpen={true}
          mode={activeModal}
          initialEvent={selectedEvent}
          initialDate={createDate}
          initialHour={createHour}
          onClose={handleCloseModal}
          onSaved={handleEventSaved}
          onDeleted={handleEventDeleted}
        />
      )}

      {/* Event Details Popover / Card */}
      {activeModal === 'details' && selectedEvent && (
        <EventDetailsPopover
          isOpen={true}
          event={selectedEvent}
          onClose={handleCloseModal}
          onEdit={handleEditFromDetails}
          onDelete={handleDeleteFromDetails}
        />
      )}
    </div>
  );
};
