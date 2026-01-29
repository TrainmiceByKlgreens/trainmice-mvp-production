import { CalendarDay } from '../../types/database';
import { CalendarDayCell } from './CalendarDayCell';
import { SHORT_WEEKDAY_NAMES } from '../../lib/calendarUtils';

interface CalendarGridProps {
  days: CalendarDay[];
  onDayClick: (day: CalendarDay) => void;
}

export function CalendarGrid({ days, onDayClick }: CalendarGridProps) {
  // Get the first day of the month to determine the starting day of week
  const firstDay = days.length > 0 ? days[0].date.getDay() : 0;
  
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-2">
        {SHORT_WEEKDAY_NAMES.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Add empty cells for days before the first day of the month */}
        {Array.from({ length: firstDay }).map((_, index) => (
          <div key={`empty-${index}`} className="min-h-24" />
        ))}
        
        {/* Render only current month days */}
        {days.map((day, index) => (
          <CalendarDayCell
            key={`${day.dateString}-${index}`}
            day={day}
            onClick={() => onDayClick(day)}
          />
        ))}
      </div>
    </div>
  );
}
