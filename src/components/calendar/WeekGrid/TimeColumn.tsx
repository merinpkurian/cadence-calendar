import React from 'react';
import { CALENDAR_START_HOUR, CALENDAR_END_HOUR } from '../../../utils/date';
import './TimeColumn.css';

interface TimeColumnProps {
  hourHeight?: number;
}

export const TimeColumn: React.FC<TimeColumnProps> = ({ hourHeight = 60 }) => {
  const hours: string[] = [];

  for (let h = CALENDAR_START_HOUR; h < CALENDAR_END_HOUR; h++) {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    hours.push(`${displayHour} ${period}`);
  }

  return (
    <div className="time-column" aria-hidden="true">
      {/* Empty space matching the day header height */}
      <div className="time-column__header-spacer" />

      <div className="time-column__labels">
        {hours.map((label, idx) => (
          <div
            key={idx}
            className="time-column__label"
            style={{ height: `${hourHeight}px` }}
          >
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
