import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Edit2,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';
import type { CalendarEvent } from '../../../types/event';
import { formatPillDate, formatTimeRange } from '../../../utils/date';
import './EventDetailsPopover.css';

interface EventDetailsPopoverProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => Promise<void>;
}

export const EventDetailsPopover: React.FC<EventDetailsPopoverProps> = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const startDate = new Date(event.startsAt);
  const dateFormatted = formatPillDate(startDate);
  const timeFormatted = formatTimeRange(event.startsAt, event.endsAt);
  const colorHex = event.color || '#3366FF';

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onDelete(event.id);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete event.';
      setError(msg);
      setIsDeleting(false);
    }
  };

  return (
    <div className="event-details-portal">
      <div className="event-details-backdrop" onClick={onClose} aria-hidden="true" />

      <div
        className="event-details-card"
        style={{ '--event-color': colorHex } as React.CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
      >
        {/* Left accent color bar */}
        <div className="event-details-card__accent" aria-hidden="true" />

        <div className="event-details-card__content">
          {/* Header */}
          <div className="event-details-header">
            <h3 className="event-details-title">{event.title}</h3>

            <div className="event-details-actions">
              <button
                type="button"
                className="event-details-action-btn"
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
                aria-label="Edit event"
                disabled={isDeleting}
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                className="event-details-action-btn event-details-action-btn--delete"
                onClick={handleDelete}
                aria-label="Delete event"
                disabled={isDeleting}
              >
                <Trash2 size={15} />
              </button>
              <button
                type="button"
                className="event-details-action-btn"
                onClick={onClose}
                aria-label="Close details"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {error && (
            <div className="event-details-alert">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Metadata Rows */}
          <div className="event-details-meta">
            {/* Date & Time */}
            <div className="event-details-row">
              <CalendarIcon size={16} className="event-details-icon" />
              <span>{`${dateFormatted} · ${timeFormatted}`}</span>
            </div>

            {/* Location */}
            {event.location && (
              <div className="event-details-row">
                <MapPin size={16} className="event-details-icon" />
                <span>{event.location}</span>
              </div>
            )}

            {/* Guests (visual fallback) */}
            <div className="event-details-row">
              <Users size={16} className="event-details-icon" />
              <div className="event-details-guests">
                <span className="event-details-avatar">JA</span>
                <span className="event-details-avatar event-details-avatar--orange">VK</span>
                <span className="event-details-guest-label">You and Vendor lead</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <>
              <div className="event-details-divider" />
              <p className="event-details-description">{event.description}</p>
            </>
          )}

          {/* Visual Join Call Button */}
          <button
            type="button"
            className="event-details-join-btn"
            onClick={() => {
              /* Out of scope: visual only */
            }}
          >
            Join call
          </button>
        </div>
      </div>
    </div>
  );
};
