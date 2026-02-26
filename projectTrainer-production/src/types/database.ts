export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'trainer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: 'trainer' | 'admin' | 'client';
}

export interface Client {
  id: string;
  company_email: string;
  user_name: string;
  contact_number: string;
  created_at: string;
}

export interface Trainer {
  id: string;
  trainer_id: number;
  custom_trainer_id: string;
  profile_pic: string | null;
  ic_number: string | null;
  full_name: string | null;
  race: string | null;
  phone_number: string | null;
  email: string | null;
  hrdc_accreditation_id: string | null;
  hrdc_accreditation_valid_until: string | null;
  professional_bio: string | null;
  state: string | null;
  city: string | null;
  country: string | null;
  areas_of_expertise: string[] | null;
  languages_spoken: string[] | null;
  created_at: string;
}

export interface TrainerQualification {
  id: string;
  trainer_id: string;
  qualification_name: string;
  institute_name: string;
  year_awarded: number;
  qualification_type: 'postgraduate' | 'undergraduate' | 'academic' | 'professional';
  created_at: string;
  updated_at: string;
}

export interface TrainerWorkHistory {
  id: string;
  trainer_id: string;
  company_name: string;
  position: string;
  year_from: number;
  year_to: number;
  created_at: string;
  updated_at: string;
}

export interface TrainerCourseConducted {
  id: string;
  trainer_id: string;
  course_id: string;
  course_name: string;
  date_conducted: string;
  location: string | null;
  participants_count: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainerPastClient {
  id: string;
  trainer_id: string;
  client_name: string;
  project_description: string | null;
  year: number | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  learning_objectives: string[] | null;
  learning_outcomes: string[] | null;
  target_audience: string | null;
  methodology: string | null;
  prerequisite: string | null;
  certificate: string | null;
  professional_development_points?: string | null;
  professional_development_points_other?: string | null;
  assessment: boolean;
  course_type: string[] | string | null; // Can be array or string for backward compatibility
  course_mode?: string[] | string | null; // Can be array or string for backward compatibility
  duration_hours: number;
  duration_unit: 'days' | 'hours' | 'half_day';
  event_date: string | null;
  category: string[] | string | null; // Can be array or string for backward compatibility
  price: number | null;
  venue: string | null;
  hrdc_claimable: boolean | null;
  modules: Array<{
    title: string;
    content: string;
    duration: number;
  }>;
  status: 'draft' | 'published';
  course_sequence: number | null;
  created_at: string;
}

export interface CourseMaterial {
  id: string;
  course_id: string;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

export interface CourseSchedule {
  id: string;
  course_id: string;
  day_number: number;
  start_time: string;
  end_time: string;
  module_title: string;
  submodule_title: string | null;
  duration_minutes: number;
  created_at: string;
}

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
  created_at?: string;
}

export interface TrainerBlockedDay {
  id: string;
  trainer_id: string;
  day_of_week: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface TrainerDocument {
  id: string;
  trainer_id: string;
  file_url: string;
  file_name: string;
  document_type: string | null;
  uploaded_at: string;
}

export interface CourseReview {
  id: string;
  trainer_id: string;
  course_id: string;
  rating: number | null;
  review: string | null;
  reviewer_name: string | null;
  created_at: string;
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
  isBlocked: boolean;
}

export interface Feedback {
  id: string;
  trainer_id: string | null;
  trainer_name: string | null;
  course_id: string | null;
  course_name: string | null;
  course_date: string | null;
  participant_name: string | null;
  attendance_duration: string | null;
  q_content_clarity: number | null;
  q_objectives_achieved: number | null;
  q_materials_helpful: number | null;
  q_environment_learning: number | null;
  q_trainer_knowledge: number | null;
  q_engagement: number | null;
  q_new_knowledge: number | null;
  q_application_understanding: number | null;
  q_recommend_course: number | null;
  positive_feedback: string | null;
  improvement_feedback: string | null;
  referrals: string | null;
  requested_topics: string | null;
  team_building_interest: string | null;
  additional_comments: string | null;
  created_at: string;
}

export interface FeedbackFilters {
  courseId?: string | null;
  courseDate?: string | null;
}

export interface MonthlyEvent {
  month: string;
  count: number;
}

export interface RatingBreakdown {
  q_content_clarity: number;
  q_objectives_achieved: number;
  q_materials_helpful: number;
  q_environment_learning: number;
  q_trainer_knowledge: number;
  q_engagement: number;
  q_new_knowledge: number;
  q_application_understanding: number;
  q_recommend_course: number;
}

export interface ParticipationMetrics {
  total_participants: number;
  total_sessions: number;
  repeat_participants: number;
  average_attendance_duration: number;
}

export interface SentimentInsights {
  top_positive_words: string[];
  top_improvement_words: string[];
  sentiment_category: 'Positive' | 'Neutral' | 'Negative';
}

export interface FollowupMetrics {
  needs_followup: number;
  top_followup_reasons: string[];
  inhouse_training_interest: number;
  team_building_interest: number;
}

export interface ReferralMetrics {
  referral_count: number;
  referral_keywords: string[];
}

export interface TrainingDemand {
  top_requested_topics: string[];
  team_building_demand: 'High' | 'Medium' | 'Low';
  inhouse_training_demand: 'High' | 'Medium' | 'Low';
}

export interface AnalyticsKPIs {
  trainer_id: string;
  applied_filters: {
    course_id: string | null;
    course_date: string | null;
  };
  overall_star_rating: number;
  rating_breakdown: RatingBreakdown;
  participation_metrics: ParticipationMetrics;
  sentiment_insights: SentimentInsights;
  followup_metrics: FollowupMetrics;
  referral_metrics: ReferralMetrics;
  training_demand: TrainingDemand;
  events_last_6_months: MonthlyEvent[];
  strengths: string[];
  improvement_areas: string[];
  insight_summary: string;
}
