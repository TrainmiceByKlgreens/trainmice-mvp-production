import React from 'react';
import { CalendarDay } from '../../types/calendar';

interface CalendarDayCellProps {
  day: CalendarDay;
  onClick: () => void;
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({ day, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'booked':
      case 'confirmed':
      case 'approved':
        return 'bg-blue-600';
      case 'blocked':
        return 'bg-red-500';
      case 'tentative':
      case 'pending':
      case 'paperwork_in_progress':
        return 'bg-yellow-500';
      case 'not_available':
        return 'bg-gray-300';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`min-h-[100px] p-2 bg-white border border-gray-200 transition-colors cursor-pointer hover:bg-gray-50 flex flex-col ${
        !day.isCurrentMonth ? 'opacity-40 bg-gray-50/50' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <span
          className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            day.isToday
              ? 'bg-blue-600 text-white'
              : 'text-gray-600'
          }`}
        >
          {day.date.getDate()}
        </span>
        {day.status !== 'not_available' && (
          <div className={`w-2 h-2 rounded-full ${getStatusColor(day.status)}`}></div>
        )}
      </div>

      <div className="flex-1 space-y-1 overflow-hidden pointer-events-none">
        {day.bookings.slice(0, 3).map((booking, idx) => (
          <div
            key={booking.id || idx}
            className={`text-[9px] px-1 py-0.5 rounded font-medium truncate border ${
               ['tentative', 'pending', 'paperwork_in_progress'].includes((booking.status || '').toLowerCase())
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}
          >
            {booking.courses?.title || 'Training Session'}
          </div>
        ))}
        {day.bookings.length > 3 && (
          <div className="text-[8px] text-gray-400 pl-1 font-medium italic">
            + {day.bookings.length - 3} more
          </div>
        )}
        
        {day.manualBooking && !day.bookings.length && (
          <div className="text-[9px] px-1 py-0.5 rounded font-medium truncate bg-gray-100 border border-gray-200 text-gray-600 italic">
            Self-Booked
          </div>
        )}
      </div>
    </div>
  );
};
