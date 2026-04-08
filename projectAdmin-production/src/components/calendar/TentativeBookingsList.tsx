import React from 'react';
import { BookingWithCourse } from '../../types/calendar';
import { StatusBadge } from './StatusBadge';
import { Calendar, User, ChevronRight, AlertCircle } from 'lucide-react';

interface TentativeBookingsListProps {
  bookings: BookingWithCourse[];
  onBookingClick: (booking: BookingWithCourse) => void;
}

export const TentativeBookingsList: React.FC<TentativeBookingsListProps> = ({ bookings, onBookingClick }) => {
  const tentativeBookings = bookings.filter(b => 
    ['tentative', 'pending', 'paperwork_in_progress'].includes((b.status || '').toLowerCase())
  );

  if (tentativeBookings.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <AlertCircle className="w-4 h-4 text-orange-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Tentative/Pending Bookings</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tentativeBookings.map((booking) => (
          <button
            key={booking.id}
            onClick={() => onBookingClick(booking)}
            className="flex flex-col p-4 rounded-lg bg-white border border-gray-200 shadow-sm transition-all hover:border-teal-500 hover:shadow-md text-left"
          >
            <div className="flex justify-between items-start mb-3">
              <StatusBadge status={booking.status} />
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-500" />
            </div>

            <h4 className="text-sm font-bold text-gray-900 mb-3 line-clamp-1">
              {booking.courses?.title || 'Course Request'}
            </h4>

            <div className="grid grid-cols-2 gap-2 mt-auto">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                <span className="truncate">{booking.requested_date || 'TBC'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <User className="w-3.5 h-3.5" />
                <span className="truncate">{booking.client_name || 'Anonymous'}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
