import { Course } from './index';

export interface BookingRequest {
  id: string;
  course_id: string | null;
  trainer_id: string | null;
  client_id: string | null;
  request_type: 'public' | 'inhouse' | null;
  client_name: string | null;
  client_email: string | null;
  requested_date: string | null;
  end_date: string | null;
  requested_time: string | null;
  requested_month: string | null;
  selected_slots: string[] | null;
  status: 'pending' | 'approved' | 'denied' | 'tentative' | 'paperwork_in_progress' | 'booked' | 'canceled';
  location: string | null;
  city: string | null;
  state: string | null;
  selected_dates?: string[] | null;
  isRead?: boolean;
  created_at: string;
  processed_at: string;
}

export interface BookingWithCourse extends BookingRequest {
  courses: Course | null;
}

export type AvailabilityStatus = 'available' | 'not_available' | 'tentative' | 'booked';

export interface TrainerAvailability {
  id: string;
  trainer_id: string;
  date: string;
  status: AvailabilityStatus;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
  created_at?: string;
}

export type CalendarFilter = 'all' | 'booked' | 'blocked' | 'available' | 'not_available' | 'tentative';

export interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  status: BookingRequest['status'] | 'available' | 'not_available' | 'blocked';
  bookings: BookingWithCourse[];
  availability: TrainerAvailability | null;
  manualBooking?: any | null;
  isBlocked: boolean;
}
