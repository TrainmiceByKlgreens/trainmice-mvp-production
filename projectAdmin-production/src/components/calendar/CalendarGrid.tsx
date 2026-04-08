import React from 'react';
import { CalendarDay } from '../../types/calendar';
import { CalendarDayCell } from './CalendarDayCell';

interface CalendarGridProps {
  days: CalendarDay[];
  onDayClick: (day: CalendarDay) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarGrid: React.FC<CalendarGridProps> = ({ days, onDayClick }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {WEEKDAYS.map(day => (
          <div
            key={day}
            className="py-2.5 text-xs font-bold text-gray-500 text-center uppercase tracking-wider border-r border-gray-200 last:border-0"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-t border-gray-200">
        {days.map((day, idx) => (
          <CalendarDayCell
            key={day.dateString || idx}
            day={day}
            onClick={() => onDayClick(day)}
          />
        ))}
      </div>
    </div>
  );
};
