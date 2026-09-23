import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isSameDay, getMondayOfWeek, addDays } from '../../../utils/date';
import './MiniCalendar.css';

interface MiniCalendarProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  currentDate,
  onSelectDate,
}) => {
  const [prevCurrentDate, setPrevCurrentDate] = useState<Date>(currentDate);
  const [viewDate, setViewDate] = useState<Date>(new Date(currentDate));

  // Adjust viewDate when currentDate changes without triggering cascading effect renders
  if (currentDate.getTime() !== prevCurrentDate.getTime()) {
    setPrevCurrentDate(currentDate);
    setViewDate(new Date(currentDate));
  }

  const today = new Date();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Build calendar matrix (Monday to Sunday)
  const firstDayOfMonth = new Date(year, month, 1);
  const startGridDate = getMondayOfWeek(firstDayOfMonth);

  const daysMatrix: Date[] = [];
  for (let i = 0; i < 35; i++) {
    daysMatrix.push(addDays(startGridDate, i));
  }

  // If the last day doesn't cover all days in month, extend to 42
  const lastDay = daysMatrix[daysMatrix.length - 1];
  const lastDayOfMonth = new Date(year, month + 1, 0);
  if (lastDay < lastDayOfMonth) {
    for (let i = 35; i < 42; i++) {
      daysMatrix.push(addDays(startGridDate, i));
    }
  }

  return (
    <div className="mini-cal">
      <div className="mini-cal__header">
        <span className="mini-cal__title">{`${MONTH_NAMES[month]} ${year}`}</span>
        <div className="mini-cal__nav">
          <button
            type="button"
            className="mini-cal__nav-btn"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            className="mini-cal__nav-btn"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="mini-cal__weekdays" aria-hidden="true">
        <span>M</span>
        <span>T</span>
        <span>W</span>
        <span>T</span>
        <span>F</span>
        <span>S</span>
        <span>S</span>
      </div>

      <div className="mini-cal__grid">
        {daysMatrix.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === month;
          const isCurrentDay = isSameDay(day, today);
          const isSelected = isSameDay(day, currentDate);

          return (
            <button
              key={idx}
              type="button"
              className={`mini-cal__cell ${!isCurrentMonth ? 'mini-cal__cell--dim' : ''} ${
                isCurrentDay ? 'mini-cal__cell--today' : ''
              } ${isSelected && !isCurrentDay ? 'mini-cal__cell--selected' : ''}`}
              onClick={() => onSelectDate(day)}
              aria-label={day.toDateString()}
            >
              <span className="mini-cal__cell-number">{day.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
