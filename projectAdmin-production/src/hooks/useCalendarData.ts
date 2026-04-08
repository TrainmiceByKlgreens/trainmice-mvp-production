import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../lib/api-client';
import { BookingWithCourse, TrainerAvailability } from '../types/calendar';
import { formatDate } from '../lib/calendarUtils';

interface UseCalendarDataReturn {
  bookings: BookingWithCourse[];
  manualBookings: any[];
  availabilities: TrainerAvailability[];
  blockedWeekdays: number[];
  blockedDates: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCalendarData(trainerId: string, startDate: Date, endDate: Date): UseCalendarDataReturn {
  const [bookings, setBookings] = useState<BookingWithCourse[]>([]);
  const [manualBookings, setManualBookings] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<TrainerAvailability[]>([]);
  const [blockedWeekdays, setBlockedWeekdays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startTs = startDate.getTime();
  const endTs = endDate.getTime();

  const fetchData = useCallback(async () => {
    if (!trainerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startStr = formatDate(startDate);
      const endStr = formatDate(endDate);

      // Fetch bookings (using common /bookings endpoint which should work for both)
      // or /admin/bookings - but /bookings is what's used in and TrainerCalendarView.tsx
      const bookingResponse = await apiClient.get<{ bookingRequests: any[] }>('/bookings');
      const allBookingRequests = bookingResponse.bookingRequests || [];

      // Fetch events for this trainer
      const allEvents = await apiClient.getEvents({ trainerId, status: 'ACTIVE' }) || [];
      const eventsList = Array.isArray(allEvents) ? allEvents : (allEvents as any).events || [];

      // Filter bookings by trainer and date range
      const filteredBookings: BookingWithCourse[] = allBookingRequests
        .filter((b: any) => b.trainer_id === trainerId || b.trainerId === trainerId)
        .map((booking: any) => {
          let requestedDate = booking.requested_date || booking.requestedDate || null;
          if (requestedDate && typeof requestedDate === 'string' && requestedDate.includes('T')) {
            requestedDate = requestedDate.split('T')[0];
          }

          return {
            ...booking,
            requested_date: requestedDate,
            status: (booking.status || '').toLowerCase(),
            selected_dates: booking.selected_dates || booking.selectedDates || null,
          };
        })
        .filter((b: any) => {
          if (!b.requested_date) return false;
          const status = (b.status || '').toLowerCase();
          if (status === 'cancelled' || status === 'denied') return false;
          const dStr = b.requested_date.split('T')[0];
          return dStr >= startStr && dStr <= endStr;
        });

      // Convert events to booking-like format
      const eventBookings: BookingWithCourse[] = eventsList
        .map((event: any) => {
          let eventDate = event.eventDate || event.event_date || null;
          let endDate = event.endDate || event.end_date || null;

          if (eventDate && typeof eventDate === 'string' && eventDate.includes('T')) {
            eventDate = eventDate.split('T')[0];
          }
          if (endDate && typeof endDate === 'string' && endDate.includes('T')) {
            endDate = endDate.split('T')[0];
          }

          const courseData = event.course || {};
          const eventTitle = event.title || courseData.title || 'Event';

          return {
            id: event.id,
            course_id: event.courseId || event.course_id,
            trainer_id: event.trainerId || event.trainer_id,
            requested_date: eventDate,
            end_date: endDate,
            status: 'booked' as const,
            courses: {
              ...courseData,
              title: eventTitle,
            },
            selected_dates: event.selected_dates || event.selectedDates || null,
          } as any;
        })
        .filter((b: any) => {
          if (!b.requested_date) return false;
          const dStr = b.requested_date.split('T')[0];
          return (dStr >= startStr && dStr <= endStr) || (b.end_date && b.end_date.split('T')[0] >= startStr && b.end_date.split('T')[0] <= endStr);
        });

      // Combine and de-duplicate (similar logic to Trainer project)
      const allCalendarBookings = [...filteredBookings, ...eventBookings];

      // Fetch availability
      const availabilityResponse = await apiClient.getTrainerAvailability(trainerId, {
        startDate: startStr,
        endDate: endStr,
      });
      const availabilityArray = Array.isArray(availabilityResponse)
        ? availabilityResponse
        : (availabilityResponse as any)?.availability || [];

      const normalizedAvailability: TrainerAvailability[] = availabilityArray.map((item: any) => ({
        id: item.id,
        trainer_id: item.trainerId || item.trainer_id,
        date: (item.date || item.dateString || '').split('T')[0] || item.date,
        status: (item.status || 'AVAILABLE').toString().toLowerCase(),
        start_time: item.startTime || item.start_time || null,
        end_time: item.endTime || item.end_time || null,
      })) as any;

      // Fetch blocked days
      const blockedResponse = await apiClient.getTrainerBlockedDays(trainerId);
      const blockedDays = blockedResponse.blockedDays || [];

      // Fetch manual bookings if endpoint exists
      let trainerBookings = [];
      try {
        // Admin project's apiClient might not have getTrainerBookings, check useCalendarData in Trainer project
        // Actually, let's keep it empty or try to call it if it exists
        if ((apiClient as any).getTrainerBookings) {
          trainerBookings = await (apiClient as any).getTrainerBookings(trainerId, {
            startDate: startStr,
            endDate: endStr,
          });
        }
      } catch (err) {
        console.warn('Could not fetch manual trainer bookings:', err);
      }

      setBookings(allCalendarBookings);
      setManualBookings(trainerBookings || []);
      setAvailabilities(normalizedAvailability);
      setBlockedWeekdays(blockedDays);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [trainerId, startTs, endTs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const expandedBlockedDates = useMemo(() => {
    const dates: string[] = [];
    const cur = new Date(startDate);
    while (cur <= endDate) {
      if (blockedWeekdays.includes(cur.getDay())) {
        dates.push(formatDate(cur));
      }
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }, [blockedWeekdays, startTs, endTs]);

  return {
    bookings,
    manualBookings,
    availabilities,
    blockedWeekdays,
    blockedDates: expandedBlockedDates,
    loading,
    error,
    refetch: fetchData,
  };
}
