import { BookingWithCourse, TrainerAvailability, CalendarDay } from '../types/calendar';

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCalendarGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  
  const days: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

export function buildCalendarDays(
  dates: Date[],
  bookings: BookingWithCourse[],
  availabilities: TrainerAvailability[],
  manualBookings: any[],
  blockedWeekdays: number[],
  currentMonth: number
): CalendarDay[] {
  const today = formatDate(new Date());

  return dates.map(date => {
    const dateString = formatDate(date);
    const dayBookings = bookings.filter(b => {
      if (b.selected_dates && Array.isArray(b.selected_dates)) {
        return b.selected_dates.includes(dateString);
      }
      return b.requested_date === dateString;
    });

    const dayManualBookings = manualBookings.filter(b => b.date === dateString);
    const availability = availabilities.find(a => a.date === dateString) || null;
    const isBlocked = blockedWeekdays.includes(date.getDay());

    let status: CalendarDay['status'] = 'available';
    
    if (isBlocked) {
      status = 'blocked';
    } else if (dayBookings.some(b => b.status === 'booked' || b.status === 'approved')) {
      status = 'booked';
    } else if (dayBookings.some(b => b.status === 'tentative')) {
      status = 'tentative';
    } else if (dayManualBookings.length > 0) {
      status = 'booked';
    } else if (availability) {
      status = availability.status === 'available' ? 'available' : 'not_available';
    } else {
      status = 'not_available';
    }

    return {
      date,
      dateString,
      isCurrentMonth: date.getMonth() === currentMonth,
      isToday: dateString === today,
      status,
      bookings: dayBookings,
      availability,
      manualBooking: dayManualBookings[0] || null,
      isBlocked
    };
  });
}

export function getMonthName(month: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2000, month, 1));
}
