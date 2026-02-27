export interface Admin {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trainer {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  phone: string | null;
  specialization: string | null;
  bio: string | null;
  hourly_rate: number | null;
  hrdc_certified: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainerAvailability {
  id: string;
  trainer_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface BlockedDate {
  id: string;
  trainer_id: string;
  blocked_date: string;
  reason: string | null;
  created_at: string;
}

export interface Qualification {
  id: string;
  trainer_id: string;
  title: string;
  institution: string | null;
  year_obtained: number | null;
  description: string | null;
  created_at: string;
}

export interface WorkHistory {
  id: string;
  trainer_id: string;
  company: string;
  position: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  created_at: string;
}

export interface PastClient {
  id: string;
  trainer_id: string;
  client_name: string;
  project_description: string | null;
  year: number | null;
  created_at: string;
}

export interface TrainerDocument {
  id: string;
  trainer_id: string;
  document_name: string;
  document_url: string;
  document_type: string | null;
  uploaded_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  trainer_id: string | null;
  created_by_admin: boolean;
  venue: string | null;
  price: number | null;
  duration_hours: number | null;
  start_date: string | null;
  end_date: string | null;
  hrdc_claimable: boolean;
  brochure_url: string | null;
  category: string[] | null;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'DENIED';
  created_at: string;
  updated_at: string;
}

export interface CourseTrainer {
  id: string;
  course_id: string;
  trainer_id: string;
  assigned_at: string;
}

export interface CustomCourseRequest {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  course_title: string;
  description: string | null;
  preferred_dates: string | null;
  budget: number | null;
  status: 'pending' | 'approved' | 'rejected';
  assigned_trainer_id: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  course_id: string;
  trainer_id: string;
  client_name: string;
  client_email: string;
  booking_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
}

export interface DashboardStats {
  unread_notifications: number;
  pending_bookings: number;
  pending_course_updates: number;
  total_trainers: number;
  active_courses: number;
  pending_requests: number;
}

// Event Status - Only ACTIVE, COMPLETED, CANCELLED (admins create events directly, no approval needed)
export type EventStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Event {
  id: string;
  courseId?: string;
  eventCode?: string | null;
  trainerId?: string | null;
  createdBy?: string | null;
  title: string;
  description?: string | null;
  learningObjectives?: any;
  learningOutcomes?: any;
  targetAudience?: string | null;
  methodology?: string | null;
  prerequisite?: string | null;
  certificate?: string | null;
  professionalDevelopmentPoints?: string | null;
  professionalDevelopmentPointsOther?: string | null;
  assessment?: boolean;
  courseType?: any;
  courseMode?: any;
  durationHours?: number;
  durationUnit?: string | null;
  modules?: any;
  venue?: string | null;
  price?: number | null;
  eventDate: string;
  startDate?: string | null;
  endDate?: string | null;
  category?: string[] | null;
  city?: string | null;
  state?: string | null;
  hrdcClaimable?: boolean;
  brochureUrl?: string | null;
  courseSequence?: number | null;
  status: EventStatus; // Only ACTIVE, COMPLETED, CANCELLED
  maxPacks?: number | null;
  createdAt?: string;
  updatedAt?: string;
  trainer?: {
    id: string;
    fullName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    courseCode: string | null;
    courseType?: string[];
  };
  _count?: {
    registrations: number;
  };
  totalParticipants?: number;
  registrations?: Array<{
    id: string;
    status: string;
    packNumber: number | null;
    numberOfParticipants?: number;
    client: {
      id: string;
      userName: string;
      companyEmail: string;
      contactNumber?: string;
    };
  }>;
}
