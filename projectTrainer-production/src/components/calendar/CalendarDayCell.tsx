import { CalendarDay } from '../../types/database';

interface CalendarDayCellProps {
  day: CalendarDay;
  onClick: () => void;
}

const getStatusColor = (status: CalendarDay['status']) => {
  switch (status) {
    case 'available':
      return { border: 'border-emerald-200', borderHover: 'hover:border-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-700' };
    case 'not_available':
      return { border: 'border-corporate-100', borderHover: 'hover:border-corporate-300', bg: 'bg-gray-50/50', text: 'text-corporate-400' };
    case 'blocked':
      return { border: 'border-red-200', borderHover: 'hover:border-red-600', bg: 'bg-red-50', text: 'text-red-700' };
    case 'tentative':
      return { border: 'border-yellow-200', borderHover: 'hover:border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' };
    case 'booked':
      return { border: 'border-blue-200', borderHover: 'hover:border-blue-600', bg: 'bg-blue-50', text: 'text-blue-700' };
    default:
      return { border: 'border-corporate-100', borderHover: 'hover:border-corporate-200', bg: 'bg-white', text: 'text-corporate-950' };
  }
};

export function CalendarDayCell({ day, onClick }: CalendarDayCellProps) {
  const { date, isCurrentMonth, isToday, status, bookings } = day;

  const styleObj = getStatusColor(status);

  const baseClasses = 'min-h-[100px] p-3 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-modern-lg border-2 font-sans';
  const monthClasses = isCurrentMonth ? `opacity-100 shadow-modern-sm ${styleObj.bg} ${styleObj.border} ${styleObj.borderHover}` : 'opacity-20 bg-gray-50 border-transparent grayscale pointer-events-none';
  const todayClasses = isToday ? 'ring-2 ring-black ring-offset-2 ring-offset-white shadow-xl' : '';

  return (
    <div
      onClick={isCurrentMonth ? onClick : undefined}
      className={`${baseClasses} ${monthClasses} ${todayClasses}`}
    >
      <div className="flex items-start justify-between mb-4 relative">
        <span
          className={`text-sm font-black tracking-tight ${isCurrentMonth ? styleObj.text : 'text-corporate-400'
            } ${isToday ? 'underline decoration-accent-gold decoration-2 underline-offset-4' : ''}`}
        >
          {date.getDate()}
        </span>
        {isToday && (
          <div className="absolute top-0 right-0 w-2 h-2 bg-black rounded-full animate-pulse shadow-sm" />
        )}
      </div>

      {bookings.length > 0 && isCurrentMonth && (status === 'booked' || status === 'tentative') && (
        <div className="space-y-1.5 mt-2">
          {bookings.slice(0, 2).map((booking) => (
            <div
              key={booking.id}
              className={`px-2 py-1.5 rounded-lg border text-[9px] font-black truncate shadow-sm transition-colors uppercase tracking-tight ${status === 'booked'
                ? 'bg-blue-600/10 border-blue-200 text-blue-700 hover:bg-blue-600/20' 
                : 'bg-white border-corporate-100 text-corporate-950 hover:bg-gray-50'
              }`}
              title={booking.courses?.title || 'Booking'}
            >
              {booking.courses?.title || 'Booking'}
            </div>
          ))}
          {bookings.length > 2 && (
            <div className={`text-[8px] font-black uppercase tracking-widest pl-1 mt-1 ${status === 'booked' ? 'text-accent-gold/60' : 'text-corporate-400'}`}>
              +{bookings.length - 2} Multiple
            </div>
          )}
        </div>
      )}
    </div>
  );
}
