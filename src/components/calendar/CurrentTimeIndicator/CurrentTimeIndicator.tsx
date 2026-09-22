import React, { useState, useEffect } from 'react';
import { CALENDAR_START_HOUR, CALENDAR_END_HOUR } from '../../../utils/date';
import './CurrentTimeIndicator.css';

interface CurrentTimeIndicatorProps {
  hourHeight?: number;
}

export const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({
  hourHeight = 60,
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = now.getHours() + now.getMinutes() / 60;
  if (currentHour < CALENDAR_START_HOUR || currentHour > CALENDAR_END_HOUR) {
    return null;
  }

  const topPx = (currentHour - CALENDAR_START_HOUR) * hourHeight;

  return (
    <div
      className="current-time-indicator"
      style={{ top: `${topPx}px` }}
      aria-hidden="true"
    >
      <div className="current-time-indicator__dot" />
      <div className="current-time-indicator__line" />
    </div>
  );
};
