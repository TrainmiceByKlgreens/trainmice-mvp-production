import { CalendarDay, BookingWithCourse, TrainerAvailability } from '../types/database';

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const SHORT_WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2);
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

export function getCalendarGrid(year: number, month: number): Date[] {
  const lastDay = new Date(year, month + 1, 0);
  const grid: Date[] = [];

  // Only include dates from the current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    grid.push(new Date(year, month, day));
  }

  return grid;
}

export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

export function isDateBlocked(date: Date, blockedWeekdays: number[]): boolean {
  const dayOfWeek = getDayOfWeek(date);
  return blockedWeekdays.includes(dayOfWeek);
}

export function isDateInFuture(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate > today;
}

export function getBookingsForDate(
  bookings: BookingWithCourse[],
  date: Date,
): BookingWithCourse[] {
  const dateString = formatDate(date);
  return bookings.filter((booking) => {
    if (!booking.requested_date) return false;
    
    // Normalize requested_date to YYYY-MM-DD format for comparison
    const bookingStartDate = booking.requested_date.split('T')[0]; // Remove time if present
    
    // If there's an end_date, check if the date falls within the range
    if (booking.end_date) {
      const bookingEndDate = booking.end_date.split('T')[0];
      return dateString >= bookingStartDate && dateString <= bookingEndDate;
    }
    
    // Otherwise, check for exact match
    return bookingStartDate === dateString;
  });
}

const toLowerStatus = (status?: string | null) => status ? status.toLowerCase() : '';

export function resolveDayStatus(
  bookings: BookingWithCourse[],
  availability: TrainerAvailability | null,
  isBlocked: boolean
): CalendarDay['status'] {
  if (isBlocked) return 'blocked';

  // Check for confirmed/booked bookings first (highest priority)
  const bookedBookings = bookings.filter((b) => {
    const status = toLowerStatus(b.status);
    return status === 'booked' || status === 'confirmed';
  });
  if (bookedBookings.length > 0) return 'booked';

  // Only APPROVED bookings are considered tentative (not pending)
  const tentativeBookings = bookings.filter((b) => {
    const status = toLowerStatus(b.status);
    return status === 'approved' || status === 'tentative';
  });
  if (tentativeBookings.length > 0) return 'tentative';

  // Only show as available if there's an availability record with status 'available'
  // If no availability record exists, show as 'not_available'
  if (availability) {
    const availabilityStatus = toLowerStatus(availability.status);
    if (availabilityStatus === 'not_available') return 'not_available';
    if (availabilityStatus === 'available') return 'available';
    if (availabilityStatus === 'booked') return 'booked';
    if (availabilityStatus === 'tentative') return 'tentative';
  }

  // If no availability record exists in database, default to 'not_available'
  // This ensures dates are only shown as available if explicitly set in trainer_availability table
  return 'not_available';
}

export function buildCalendarDays(
  dates: Date[],
  bookings: BookingWithCourse[],
  availabilities: TrainerAvailability[],
  blockedWeekdays: number[],
  currentMonth: number
): CalendarDay[] {
  return dates.map((date) => {
    const dateString = formatDate(date);
    const dayBookings = getBookingsForDate(bookings, date);
    const availability = availabilities.find((a) => a.date === dateString) || null;
    const isBlocked = isDateBlocked(date, blockedWeekdays);

    return {
      date,
      dateString,
      isCurrentMonth: date.getMonth() === currentMonth,
      isToday: isToday(date),
      status: resolveDayStatus(dayBookings, availability, isBlocked),
      bookings: dayBookings.sort((a, b) => new Date(a.processed_at).getTime() - new Date(b.processed_at).getTime()),
      availability,
      isBlocked
    };
  });
}

export function getMonthName(month: number): string {
  const date = new Date(2000, month, 1);
  return date.toLocaleString('default', { month: 'long' });
}

export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function isDateEditable(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate >= today;
}

export function isSlotEditable(date: Date, isBlocked: boolean): boolean {
  if (isBlocked) return false;
  return isDateEditable(date);
}
