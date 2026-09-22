import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  AlignLeft,
  Trash2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Modal } from '../../common/Modal/Modal';
import { Button } from '../../common/Button/Button';
import {
  formatDateForInput,
  formatTimeForInput,
  combineDateAndTime,
  generateTimeOptions,
} from '../../../utils/date';
import { eventService } from '../../../services/eventService';
import { EVENT_COLORS, type CalendarEvent, type EventColor } from '../../../types/event';
import './EventModal.css';

interface EventModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialEvent?: CalendarEvent | null;
  initialDate?: Date | null;
  initialHour?: number | null;
  onClose: () => void;
  onSaved: (event: CalendarEvent) => void;
  onDeleted?: (eventId: string) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  mode,
  initialEvent,
  initialDate,
  initialHour,
  onClose,
  onSaved,
  onDeleted,
}) => {
  // Initialize state directly from props without synchronous effect cascading re-renders
  const [title, setTitle] = useState<string>(() => {
    return mode === 'edit' && initialEvent ? initialEvent.title : '';
  });

  const [dateStr, setDateStr] = useState<string>(() => {
    if (mode === 'edit' && initialEvent) {
      return formatDateForInput(new Date(initialEvent.startsAt));
    }
    return formatDateForInput(initialDate || new Date());
  });

  const [startTimeStr, setStartTimeStr] = useState<string>(() => {
    if (mode === 'edit' && initialEvent) {
      return formatTimeForInput(new Date(initialEvent.startsAt));
    }
    const hour = initialHour !== undefined && initialHour !== null ? initialHour : 9;
    return `${String(hour).padStart(2, '0')}:00`;
  });

  const [endTimeStr, setEndTimeStr] = useState<string>(() => {
    if (mode === 'edit' && initialEvent) {
      return formatTimeForInput(new Date(initialEvent.endsAt));
    }
    const hour = initialHour !== undefined && initialHour !== null ? initialHour : 9;
    const endH = String(Math.min(23, hour + 1)).padStart(2, '0');
    return `${endH}:00`;
  });

  const [location, setLocation] = useState<string>(() => {
    return mode === 'edit' && initialEvent?.location ? initialEvent.location : '';
  });

  const [description, setDescription] = useState<string>(() => {
    return mode === 'edit' && initialEvent?.description ? initialEvent.description : '';
  });

  const [selectedColor, setSelectedColor] = useState<EventColor>(() => {
    if (mode === 'edit' && initialEvent && EVENT_COLORS.includes(initialEvent.color as EventColor)) {
      return initialEvent.color as EventColor;
    }
    return '#3366FF';
  });

  const [titleError, setTitleError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const timeOptions = generateTimeOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError('');
    setTimeError('');
    setServerError('');

    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }

    const startDateTime = combineDateAndTime(dateStr, startTimeStr);
    const endDateTime = combineDateAndTime(dateStr, endTimeStr);

    if (endDateTime.getTime() <= startDateTime.getTime()) {
      setTimeError('End time must be later than start time');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'create') {
        const created = await eventService.createEvent({
          title: title.trim(),
          startsAt: startDateTime.toISOString(),
          endsAt: endDateTime.toISOString(),
          location: location.trim() || undefined,
          description: description.trim() || undefined,
          color: selectedColor,
        });
        onSaved(created);
        onClose();
      } else if (mode === 'edit' && initialEvent) {
        const updated = await eventService.updateEvent(initialEvent.id, {
          title: title.trim(),
          startsAt: startDateTime.toISOString(),
          endsAt: endDateTime.toISOString(),
          location: location.trim() || null,
          description: description.trim() || null,
          color: selectedColor,
        });
        onSaved(updated);
        onClose();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save event. Please try again.';
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialEvent || !onDeleted) return;

    setIsDeleting(true);
    setServerError('');
    try {
      await eventService.deleteEvent(initialEvent.id);
      onDeleted(initialEvent.id);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete event.';
      setServerError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="480px"
      headerTag={
        <div className="event-modal-tag">
          <span
            className="event-modal-tag__dot"
            style={{ backgroundColor: selectedColor }}
            aria-hidden="true"
          />
          <span className="event-modal-tag__text">
            {mode === 'create' ? 'NEW EVENT' : 'EDIT EVENT'}
          </span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="event-modal-form" noValidate>
        {serverError && (
          <div className="event-modal-alert">
            <AlertCircle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Large Title Input */}
        <div className="event-modal-title-field">
          <input
            type="text"
            className="event-modal-title-input"
            placeholder="Add title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError('');
            }}
            autoFocus
            aria-label="Event title"
          />
          {titleError && <span className="event-modal-field-error">{titleError}</span>}
        </div>

        {/* Date & Time Row */}
        <div className="event-modal-row">
          <CalendarIcon size={18} className="event-modal-row__icon" />
          <div className="event-modal-row__content">
            <div className="event-modal-datetime-pills">
              {/* Date & Start Time Pill */}
              <div className="event-modal-pill">
                <input
                  type="date"
                  className="event-modal-date-picker"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  aria-label="Event date"
                />
                <span className="event-modal-pill__separator">·</span>
                <select
                  className="event-modal-time-select"
                  value={startTimeStr}
                  onChange={(e) => {
                    setStartTimeStr(e.target.value);
                    if (timeError) setTimeError('');
                  }}
                  aria-label="Start time"
                >
                  {timeOptions.map((opt) => (
                    <option key={`start-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* End Time Pill */}
              <div className="event-modal-pill">
                <select
                  className="event-modal-time-select"
                  value={endTimeStr}
                  onChange={(e) => {
                    setEndTimeStr(e.target.value);
                    if (timeError) setTimeError('');
                  }}
                  aria-label="End time"
                >
                  {timeOptions.map((opt) => (
                    <option key={`end-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {timeError && <span className="event-modal-field-error">{timeError}</span>}

            {/* Repeat checkbox (visual only per out of scope requirements) */}
            <label className="event-modal-repeat">
              <input
                type="checkbox"
                defaultChecked={mode === 'edit'}
                className="event-modal-repeat__checkbox"
                disabled
              />
              <span className="event-modal-repeat__label">
                {mode === 'create' ? 'Does not repeat' : 'Repeat weekly on Monday'}
              </span>
            </label>
          </div>
        </div>

        {/* Location Row */}
        <div className="event-modal-row">
          <MapPin size={18} className="event-modal-row__icon" />
          <div className="event-modal-row__content">
            <input
              type="text"
              className="event-modal-field-input"
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              aria-label="Event location"
            />
          </div>
        </div>

        {/* Guests Row (Visual per out of scope requirements) */}
        <div className="event-modal-row">
          <Users size={18} className="event-modal-row__icon" />
          <div className="event-modal-row__content event-modal-guests">
            <span className="event-modal-guest-pill">
              <span className="event-modal-guest-avatar">JA</span>
              <span>You</span>
            </span>
            {mode === 'edit' && (
              <span className="event-modal-guest-pill">
                <span className="event-modal-guest-avatar event-modal-guest-avatar--orange">PS</span>
                <span>Priya S.</span>
              </span>
            )}
            <button
              type="button"
              className="event-modal-add-guest"
              aria-label="Add guests (visual)"
            >
              <Plus size={12} />
              <span>Add guests</span>
            </button>
          </div>
        </div>

        {/* Description Row */}
        <div className="event-modal-row">
          <AlignLeft size={18} className="event-modal-row__icon" />
          <div className="event-modal-row__content">
            <textarea
              className="event-modal-textarea"
              placeholder="Add description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              aria-label="Event description"
            />
          </div>
        </div>

        {/* Color Palette Selector */}
        <div className="event-modal-colors">
          {EVENT_COLORS.map((hex) => {
            const isSelected = selectedColor === hex;
            return (
              <button
                key={hex}
                type="button"
                className={`event-modal-color-swatch ${
                  isSelected ? 'event-modal-color-swatch--active' : ''
                }`}
                style={{ backgroundColor: hex }}
                onClick={() => setSelectedColor(hex)}
                aria-label={`Select color ${hex}`}
                aria-pressed={isSelected}
              />
            );
          })}
        </div>

        {/* Modal Actions Footer */}
        <div className="event-modal-footer">
          {mode === 'edit' && (
            <Button
              type="button"
              variant="danger-outline"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              isLoading={isDeleting}
              onClick={handleDelete}
            >
              Delete
            </Button>
          )}

          <div className="event-modal-footer__right">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isLoading || isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              disabled={isDeleting}
            >
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
