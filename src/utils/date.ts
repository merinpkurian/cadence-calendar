import type { CalendarDay, CalendarWeek } from '../types/calendar';

export const CALENDAR_START_HOUR = 8; // 8:00 AM
export const CALENDAR_END_HOUR = 20;  // 8:00 PM (12 hours visible)
export const TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR;

/**
 * Returns a new Date set to the start of day (00:00:00.000) in local time.
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns a new Date set to the end of day (23:59:59.999) in local time.
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Adds or subtracts days from a date.
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Checks if two dates are the same calendar day.
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Returns the Monday (start of week) for a given date in local time.
 * In JS, getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday.
 */
export function getMondayOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  // If day is 0 (Sunday), Monday was 6 days ago.
  // Otherwise, Monday was (day - 1) days ago.
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * Formats week range for the calendar header, e.g. "September 14–20, 2026"
 */
export function formatWeekRange(start: Date, end: Date): string {
  const startMonth = MONTH_NAMES[start.getMonth()];
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear === endYear) {
    if (start.getMonth() === end.getMonth()) {
      return `${startMonth} ${start.getDate()}–${end.getDate()}, ${startYear}`;
    }
    return `${MONTH_NAMES_SHORT[start.getMonth()]} ${start.getDate()} – ${MONTH_NAMES_SHORT[end.getMonth()]} ${end.getDate()}, ${startYear}`;
  }
  return `${MONTH_NAMES_SHORT[start.getMonth()]} ${start.getDate()}, ${startYear} – ${MONTH_NAMES_SHORT[end.getMonth()]} ${end.getDate()}, ${endYear}`;
}

/**
 * Builds a CalendarWeek model given any target date within the week.
 */
export function getCalendarWeek(targetDate: Date = new Date(), selectedDate?: Date): CalendarWeek {
  const monday = getMondayOfWeek(targetDate);
  const sunday = endOfDay(addDays(monday, 6));
  const today = new Date();

  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const currentDay = addDays(monday, i);
    const yyyy = currentDay.getFullYear();
    const mm = String(currentDay.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDay.getDate()).padStart(2, '0');

    days.push({
      date: currentDay,
      dateKey: `${yyyy}-${mm}-${dd}`,
      dayName: DAY_NAMES[currentDay.getDay()],
      dayNumber: currentDay.getDate(),
      isToday: isSameDay(currentDay, today),
      isSelected: selectedDate ? isSameDay(currentDay, selectedDate) : false,
    });
  }

  return {
    days,
    startOfWeek: monday,
    endOfWeek: sunday,
    rangeLabel: formatWeekRange(monday, sunday),
    fromIso: monday.toISOString(),
    toIso: sunday.toISOString(),
  };
}

/**
 * Formats a Date object to "11:00 AM" or "2:30 PM".
 */
export function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minStr} ${ampm}`;
}

/**
 * Formats time range e.g. "9:00 – 10:00 AM" or "11:00 AM – 12:00 PM".
 */
export function formatTimeRange(startsAt: string | Date, endsAt: string | Date): string {
  const start = typeof startsAt === 'string' ? new Date(startsAt) : startsAt;
  const end = typeof endsAt === 'string' ? new Date(endsAt) : endsAt;

  const startStr = formatTime(start);
  const endStr = formatTime(end);

  const startAmPm = startStr.slice(-2);
  const endAmPm = endStr.slice(-2);

  // If both are AM or both are PM, we can omit start AM/PM for a cleaner look matching Figma
  if (startAmPm === endAmPm) {
    const startNoAmPm = startStr.replace(` ${startAmPm}`, '');
    return `${startNoAmPm} – ${endStr}`;
  }
  return `${startStr} – ${endStr}`;
}

/**
 * Formats full event date & time for modals, e.g. "Mon, Sep 14 · 2:00 PM"
 */
export function formatEventDateTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const monthName = MONTH_NAMES_SHORT[date.getMonth()];
  const dayNum = date.getDate();
  const time = formatTime(date);
  return `${dayName}, ${monthName} ${dayNum} · ${time}`;
}

/**
 * Calculates top (pixels) and height (pixels) on the calendar grid given start & end ISO strings.
 */
export function getEventPosition(
  startsAt: string,
  endsAt: string,
  hourHeight: number = 60
): { top: number; height: number } {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  const startMinutes = (start.getHours() - CALENDAR_START_HOUR) * 60 + start.getMinutes();
  const durationMinutes = Math.max(15, (end.getTime() - start.getTime()) / 60000);

  const top = (startMinutes / 60) * hourHeight;
  const height = (durationMinutes / 60) * hourHeight;

  return { top, height };
}

/**
 * Snaps minutes to nearest interval (default 15).
 */
export function snapToInterval(minutes: number, interval: number = 15): number {
  return Math.round(minutes / interval) * interval;
}

/**
 * Formats a Date object to YYYY-MM-DD for <input type="date">
 */
export function formatDateForInput(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formats a Date object to HH:mm for <input type="time"> or <select>
 */
export function formatTimeForInput(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Formats Date for date pill in modals: e.g. "Mon, Sep 14"
 */
export function formatPillDate(date: Date): string {
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const monthName = MONTH_NAMES_SHORT[date.getMonth()];
  return `${dayName}, ${monthName} ${date.getDate()}`;
}

/**
 * Combines YYYY-MM-DD and HH:mm strings into a local Date object.
 */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Generates an array of time options at 15-minute intervals from 00:00 to 23:45.
 */
export function generateTimeOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const value = `${hh}:${mm}`;
      const dummyDate = new Date(2026, 0, 1, h, m);
      const label = formatTime(dummyDate);
      options.push({ value, label });
    }
  }
  return options;
}
