// This file is deprecated - Supabase has been migrated to MySQL backend
// All functionality should use apiClient from './lib/api-client' instead
// This stub exists to prevent import errors during migration
// The types are kept for backward compatibility but will be removed in future versions

// Stub Supabase client (does nothing but prevents crashes)
export const supabase = {
  from: () => ({
    select: () => Promise.resolve({ data: null, error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    eq: () => ({ data: null, error: null }),
    order: () => ({ data: null, error: null }),
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      remove: () => Promise.resolve({ data: null, error: null }),
    }),
  },
  rpc: () => Promise.resolve({ data: null, error: null }),
};

// Export types for backward compatibility (used in some components)
export type Course = {
  id: string;
  title: string;
  description: string | null;
  learning_objectives: string[] | null;
  learning_outcomes: string[] | null;
  target_audience: string | null;
  methodology: string | null;
  prerequisite: string | null;
  certificate: string | null;
  assessment: boolean | null;
  modules: any | null;
  price: number | null;
  venue: string | null;
  hrdc_claimable: boolean | null;
  course_type: string | null;
  event_date: string | null;
  category: string | null;
  duration_hours: number | null;
  duration_unit: 'days' | 'hours';
  trainer_id: string | null;
  status: 'draft' | 'published' | null;
  course_sequence: number | null;
  created_at: string;
};

export type Trainer = {
  id: string;
  profile_pic: string | null;
  full_name: string | null;
  ic_number: string | null;
  race: string | null;
  professional_bio: string | null;
  phone_number: string | null;
  email: string | null;
  areas_of_expertise: string[] | null;
  languages_spoken: string[] | null;
  city: string | null;
  state: string | null;
  country: string | null;
  rating: number | null;
  custom_trainer_id: string | null;
  scheduling_type?: 'slot_based' | 'full_day' | null;
  hrdc_accreditation_id: string | null;
  hrdc_accreditation_valid_until: string | null;
  trainer_id: number;
  created_at: string;
  job_title?: string | null;
  year_of_experience?: number | null;
  teaching_style?: string | null;
  languages?: string[] | null;
  topics?: string[] | null;
  education_background?: string[] | null;
  industry_experience?: string[] | null;
  past_clients?: string[] | null;
};

export type TrainerAvailability = {
  id: string;
  trainer_id: string;
  date: string;
  slot: 'morning' | 'afternoon' | 'full_day' | null;
  start_time: string | null;
  end_time: string | null;
  status: 'available' | 'tentative' | 'booked' | 'not_available' | 'paperwork_in_progress';
  created_at: string;
};

export type SelectedSlot = {
  date: string;
  slot: 'morning' | 'afternoon' | 'full_day';
  time: string;
  availability_id?: string;
};

export type BookingRequest = {
  id: string;
  course_id: string;
  trainer_id: string;
  client_id: string;
  request_type: 'public' | 'inhouse';
  client_name: string | null;
  client_email: string | null;
  requested_date: string | null;
  requested_month: string | null;
  requested_time: string | null;
  selected_slots: SelectedSlot[] | null;
  availability_ids: string[] | null;
  status: 'pending' | 'approved' | 'denied' | 'confirmed' | 'tentative' | 'paperwork_in_progress' | 'booked' | 'canceled';
  location: string | null;
  processed_at: string;
  created_at: string;
};

export type Client = {
  id: string;
  company_email: string;
  user_name: string;
  contact_number: string;
  created_at: string;
};

export type CustomCourseRequest = {
  id: string;
  client_id: string;
  course_name: string;
  reason: string;
  industry: string;
  company_name: string;
  contact_person: string;
  email: string;
  preferred_mode: 'In-house' | 'Public' | 'Virtual';
  status: 'pending' | 'approved' | 'rejected' | 'in_progress';
  created_at: string;
};

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
};
