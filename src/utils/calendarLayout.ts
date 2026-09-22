import type { CalendarEvent } from '../types/event';
import type { PositionedEvent } from '../types/calendar';
import { getEventPosition } from './date';

interface InternalEventData {
  event: CalendarEvent;
  startTime: number; // epoch ms
  endTime: number;   // epoch ms
  top: number;
  height: number;
}

/**
 * Computes layout coordinates and overlap sub-columns for events on a given day.
 * Ensures overlapping events (such as simultaneous client calls) render side-by-side.
 */
export function layoutEventsForDay(
  events: CalendarEvent[],
  hourHeight: number = 60
): PositionedEvent[] {
  if (!events.length) return [];

  // 1. Prepare event bounds and pixel coordinates
  const items: InternalEventData[] = events
    .map((event) => {
      const start = new Date(event.startsAt);
      const end = new Date(event.endsAt);
      const { top, height } = getEventPosition(event.startsAt, event.endsAt, hourHeight);
      return {
        event,
        startTime: start.getTime(),
        endTime: Math.max(start.getTime() + 15 * 60000, end.getTime()),
        top,
        height: Math.max(28, height), // Minimum 28px height for readability
      };
    })
    .sort((a, b) => {
      // Sort primarily by start time, secondarily by longest duration
      if (a.startTime !== b.startTime) {
        return a.startTime - b.startTime;
      }
      return (b.endTime - b.startTime) - (a.endTime - a.startTime);
    });

  // 2. Build collision clusters
  const clusters: InternalEventData[][] = [];
  let currentCluster: InternalEventData[] = [];
  let clusterEnd = -1;

  for (const item of items) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.endTime;
    } else {
      // If this item starts before the cluster ends, it belongs to the same cluster
      if (item.startTime < clusterEnd) {
        currentCluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.endTime);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
        clusterEnd = item.endTime;
      }
    }
  }

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // 3. Assign sub-columns within each cluster
  const positioned: PositionedEvent[] = [];

  for (const cluster of clusters) {
    const colEndTimes: number[] = [];
    const itemAssignments: Array<{ item: InternalEventData; colIndex: number }> = [];

    for (const item of cluster) {
      let placed = false;
      for (let c = 0; c < colEndTimes.length; c++) {
        if (colEndTimes[c] <= item.startTime) {
          colEndTimes[c] = item.endTime;
          itemAssignments.push({ item, colIndex: c });
          placed = true;
          break;
        }
      }

      if (!placed) {
        const newColIndex = colEndTimes.length;
        colEndTimes.push(item.endTime);
        itemAssignments.push({ item, colIndex: newColIndex });
      }
    }

    const totalCols = colEndTimes.length;
    const widthPercent = 100 / totalCols;

    for (const { item, colIndex } of itemAssignments) {
      positioned.push({
        event: item.event,
        top: item.top,
        height: item.height,
        leftPercent: colIndex * widthPercent,
        widthPercent: widthPercent - 1, // 1% gap for visual separation
        zIndex: colIndex + 1,
      });
    }
  }

  return positioned;
}

/**
 * Calculates new startsAt and endsAt ISO strings after a drag-to-reschedule operation.
 */
export function calculateRescheduledTimes(
  event: CalendarEvent,
  targetDateKey: string,
  snappedTopPx: number,
  hourHeight: number = 60
): { startsAt: string; endsAt: string } {
  const originalStart = new Date(event.startsAt);
  const originalEnd = new Date(event.endsAt);
  const durationMs = originalEnd.getTime() - originalStart.getTime();

  const startMinutesFrom8Am = (snappedTopPx / hourHeight) * 60;
  const totalMinutesFromMidnight = 8 * 60 + Math.round(startMinutesFrom8Am);

  const [year, month, day] = targetDateKey.split('-').map(Number);
  const newStart = new Date(
    year,
    month - 1,
    day,
    Math.floor(totalMinutesFromMidnight / 60),
    totalMinutesFromMidnight % 60,
    0,
    0
  );
  const newEnd = new Date(newStart.getTime() + durationMs);

  return {
    startsAt: newStart.toISOString(),
    endsAt: newEnd.toISOString(),
  };
}

/**
 * Calculates new endsAt ISO string after a vertical resize operation.
 */
export function calculateResizedTimes(
  event: CalendarEvent,
  snappedHeightPx: number,
  hourHeight: number = 60
): { endsAt: string } {
  const newDurationMinutes = Math.max(15, (snappedHeightPx / hourHeight) * 60);
  const start = new Date(event.startsAt);
  const newEnd = new Date(start.getTime() + newDurationMinutes * 60000);

  return {
    endsAt: newEnd.toISOString(),
  };
}

