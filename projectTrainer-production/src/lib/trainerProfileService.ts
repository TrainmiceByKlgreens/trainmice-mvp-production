import { apiClient } from './api-client';
import {
  Trainer,
  TrainerQualification,
  TrainerWorkHistory,
  TrainerCourseConducted,
  TrainerPastClient
} from '../types/database';

// ================================================================
// TRAINER PROFILE CRUD OPERATIONS
// ================================================================

export async function fetchTrainerProfile(trainerId: string): Promise<Trainer | null> {
  try {
    const trainer = await apiClient.getTrainer(trainerId);
    if (!trainer) return null;

    // Map backend camelCase to frontend snake_case
    return {
      id: trainer.id,
      trainer_id: 0, // Not used in new system
      custom_trainer_id: trainer.customTrainerId || trainer.custom_trainer_id || '',
      profile_pic: trainer.profilePic || trainer.profile_pic || null,
      ic_number: trainer.icNumber || trainer.ic_number || null,
      full_name: trainer.fullName || trainer.full_name || null,
      race: trainer.race || null,
      phone_number: trainer.phoneNumber || trainer.phone_number || null,
      email: trainer.email || null,
      hrdc_accreditation_id: trainer.hrdcAccreditationId || trainer.hrdc_accreditation_id || null,
      hrdc_accreditation_valid_until: trainer.hrdc_accreditation_valid_until
        ? (typeof trainer.hrdc_accreditation_valid_until === 'string'
          ? trainer.hrdc_accreditation_valid_until.split('T')[0]
          : new Date(trainer.hrdc_accreditation_valid_until).toISOString().split('T')[0])
        : trainer.hrdcAccreditationValidUntil
          ? new Date(trainer.hrdcAccreditationValidUntil).toISOString().split('T')[0]
          : null,
      professional_bio: trainer.professionalBio || trainer.professional_bio || null,
      state: trainer.state || null,
      city: trainer.city || null,
      country: trainer.country || null,
      areas_of_expertise: trainer.areasOfExpertise || trainer.areas_of_expertise || null,
      languages_spoken: trainer.languagesSpoken || trainer.languages_spoken || null,
      created_at: trainer.createdAt || trainer.created_at || new Date().toISOString(),
    } as Trainer;
  } catch (error: any) {
    console.error('Error fetching trainer profile:', error);
    throw new Error(`Failed to fetch trainer profile: ${error.message}`);
  }
}

export async function updateTrainerProfile(
  trainerId: string,
  profileData: Partial<Trainer>
): Promise<Trainer> {
  try {
    // Map frontend snake_case to backend camelCase
    const updateData: any = {};
    if (profileData.profile_pic !== undefined) updateData.profilePic = profileData.profile_pic;
    if (profileData.ic_number !== undefined) updateData.icNumber = profileData.ic_number;
    if (profileData.full_name !== undefined) updateData.fullName = profileData.full_name;
    if (profileData.race !== undefined) updateData.race = profileData.race;
    if (profileData.phone_number !== undefined) updateData.phoneNumber = profileData.phone_number;
    if (profileData.email !== undefined) updateData.email = profileData.email;
    if (profileData.hrdc_accreditation_id !== undefined) updateData.hrdcAccreditationId = profileData.hrdc_accreditation_id;
    if (profileData.hrdc_accreditation_valid_until !== undefined) {
      updateData.hrdcAccreditationValidUntil = profileData.hrdc_accreditation_valid_until
        ? new Date(profileData.hrdc_accreditation_valid_until)
        : null;
    }
    if (profileData.professional_bio !== undefined) updateData.professionalBio = profileData.professional_bio;
    if (profileData.state !== undefined) updateData.state = profileData.state;
    if (profileData.city !== undefined) updateData.city = profileData.city;
    if (profileData.country !== undefined) updateData.country = profileData.country;
    if (profileData.areas_of_expertise !== undefined) updateData.areasOfExpertise = profileData.areas_of_expertise;
    if (profileData.languages_spoken !== undefined) updateData.languagesSpoken = profileData.languages_spoken;

    const trainer = await apiClient.updateTrainer(trainerId, updateData);

    // Map back to frontend format
    return {
      id: trainer.id,
      trainer_id: 0,
      custom_trainer_id: trainer.customTrainerId || trainer.custom_trainer_id || '',
      profile_pic: trainer.profilePic || trainer.profile_pic || null,
      ic_number: trainer.icNumber || trainer.ic_number || null,
      full_name: trainer.fullName || trainer.full_name || null,
      race: trainer.race || null,
      phone_number: trainer.phoneNumber || trainer.phone_number || null,
      email: trainer.email || null,
      hrdc_accreditation_id: trainer.hrdcAccreditationId || trainer.hrdc_accreditation_id || null,
      hrdc_accreditation_valid_until: trainer.hrdcAccreditationValidUntil
        ? new Date(trainer.hrdcAccreditationValidUntil).toISOString().split('T')[0]
        : trainer.hrdc_accreditation_valid_until || null,
      professional_bio: trainer.professionalBio || trainer.professional_bio || null,
      state: trainer.state || null,
      city: trainer.city || null,
      country: trainer.country || null,
      areas_of_expertise: trainer.areasOfExpertise || trainer.areas_of_expertise || null,
      languages_spoken: trainer.languagesSpoken || trainer.languages_spoken || null,
      created_at: trainer.createdAt || trainer.created_at || new Date().toISOString(),
    } as Trainer;
  } catch (error: any) {
    console.error('Error updating trainer profile:', error);
    throw new Error(`Failed to update trainer profile: ${error.message}`);
  }
}

// ================================================================
// QUALIFICATIONS CRUD OPERATIONS
// ================================================================

export async function fetchQualifications(trainerId: string): Promise<TrainerQualification[]> {
  try {
    const response = await apiClient.get<{ qualifications: any[] }>(`/trainers/${trainerId}/qualifications`);
    const quals = response.qualifications || [];

    // Map backend camelCase to frontend snake_case
    return quals.map((q: any) => ({
      id: q.id,
      trainer_id: q.trainerId || q.trainer_id,
      qualification_name: q.title || q.qualification_name,
      institute_name: q.institution || q.institute_name || '',
      year_awarded: q.yearObtained || q.year_awarded || null,
      qualification_type: q.qualification_type || 'professional', // Default if not provided
      created_at: q.createdAt || q.created_at || new Date().toISOString(),
      updated_at: q.updatedAt || q.updated_at || new Date().toISOString(),
    })) as TrainerQualification[];
  } catch (error: any) {
    console.error('Error fetching qualifications:', error);
    throw new Error(`Failed to fetch qualifications: ${error.message}`);
  }
}

export async function createQualification(
  qualificationData: Omit<TrainerQualification, 'id' | 'created_at' | 'updated_at'>
): Promise<TrainerQualification> {
  try {
    // Map frontend snake_case to backend camelCase
    const createData = {
      title: qualificationData.qualification_name,
      institution: qualificationData.institute_name,
      yearObtained: qualificationData.year_awarded,
      description: null, // Not in frontend type but exists in backend
    };

    const response = await apiClient.post<{ qualification: any }>(
      `/trainers/${qualificationData.trainer_id}/qualifications`,
      createData
    );
    const q = response.qualification;

    return {
      id: q.id,
      trainer_id: q.trainerId || q.trainer_id,
      qualification_name: q.title || q.qualification_name,
      institute_name: q.institution || q.institute_name || '',
      year_awarded: q.yearObtained || q.year_awarded || null,
      qualification_type: q.qualification_type || 'professional',
      created_at: q.createdAt || q.created_at || new Date().toISOString(),
      updated_at: q.updatedAt || q.updated_at || new Date().toISOString(),
    } as TrainerQualification;
  } catch (error: any) {
    console.error('Error creating qualification:', error);
    throw new Error(`Failed to create qualification: ${error.message}`);
  }
}

export async function updateQualification(
  id: string,
  qualificationData: Partial<TrainerQualification>
): Promise<TrainerQualification> {
  try {
    // Map frontend snake_case to backend camelCase
    const updateData: any = {};
    if (qualificationData.qualification_name !== undefined) updateData.title = qualificationData.qualification_name;
    if (qualificationData.institute_name !== undefined) updateData.institution = qualificationData.institute_name;
    if (qualificationData.year_awarded !== undefined) updateData.yearObtained = qualificationData.year_awarded;

    const trainerId = qualificationData.trainer_id;
    if (!trainerId) {
      throw new Error('trainer_id is required for updating qualification');
    }

    const response = await apiClient.put<{ qualification: any }>(
      `/trainers/${trainerId}/qualifications/${id}`,
      updateData
    );
    const q = response.qualification;

    return {
      id: q.id,
      trainer_id: q.trainerId || q.trainer_id,
      qualification_name: q.title || q.qualification_name,
      institute_name: q.institution || q.institute_name || '',
      year_awarded: q.yearObtained || q.year_awarded || null,
      qualification_type: q.qualification_type || 'professional',
      created_at: q.createdAt || q.created_at || new Date().toISOString(),
      updated_at: q.updatedAt || q.updated_at || new Date().toISOString(),
    } as TrainerQualification;
  } catch (error: any) {
    console.error('Error updating qualification:', error);
    throw new Error(`Failed to update qualification: ${error.message}`);
  }
}

export async function deleteQualification(id: string): Promise<void> {
  throw new Error('deleteQualification requires trainerId. Please use deleteQualificationWithTrainerId instead.');
}

export async function deleteQualificationWithTrainerId(trainerId: string, id: string): Promise<void> {
  try {
    await apiClient.deleteQualification(trainerId, id);
  } catch (error: any) {
    console.error('Error deleting qualification:', error);
    throw new Error(`Failed to delete qualification: ${error.message}`);
  }
}

// ================================================================
// WORK HISTORY CRUD OPERATIONS
// ================================================================

export async function fetchWorkHistory(trainerId: string): Promise<TrainerWorkHistory[]> {
  try {
    const response = await apiClient.get<{ workHistory: any[] }>(`/trainers/${trainerId}/work-history`);
    const work = response.workHistory || [];

    // Map backend camelCase to frontend snake_case
    return work.map((w: any) => ({
      id: w.id,
      trainer_id: w.trainerId || w.trainer_id,
      company_name: w.company || w.company_name,
      position: w.position || '',
      year_from: w.startDate ? new Date(w.startDate).getUTCFullYear() : (w.year_from || null),
      year_to: w.endDate ? new Date(w.endDate).getUTCFullYear() : (w.year_to || null),
      created_at: w.createdAt || w.created_at || new Date().toISOString(),
      updated_at: w.updatedAt || w.updated_at || new Date().toISOString(),
    })) as TrainerWorkHistory[];
  } catch (error: any) {
    console.error('Error fetching work history:', error);
    throw new Error(`Failed to fetch work history: ${error.message}`);
  }
}

export async function validateWorkHistoryLimit(trainerId: string): Promise<boolean> {
  try {
    const response = await apiClient.get<{ workHistory: any[] }>(`/trainers/${trainerId}/work-history`);
    const count = response.workHistory?.length || 0;
    return count < 5;
  } catch (error: any) {
    console.error('Error checking work history limit:', error);
    throw new Error(`Failed to check work history limit: ${error.message}`);
  }
}

export async function createWorkHistory(
  workHistoryData: Omit<TrainerWorkHistory, 'id' | 'created_at' | 'updated_at'>
): Promise<TrainerWorkHistory> {
  try {
    // Map frontend snake_case to backend camelCase
    const createData = {
      company: workHistoryData.company_name,
      position: workHistoryData.position,
      startDate: workHistoryData.year_from ? new Date(Date.UTC(workHistoryData.year_from, 0, 1)) : null,
      endDate: workHistoryData.year_to ? new Date(Date.UTC(workHistoryData.year_to, 11, 31)) : null,
      description: null, // Not in frontend type but exists in backend
    };

    const response = await apiClient.post<{ workHistory: any }>(
      `/trainers/${workHistoryData.trainer_id}/work-history`,
      createData
    );
    const w = response.workHistory;

    return {
      id: w.id,
      trainer_id: w.trainerId || w.trainer_id,
      company_name: w.company || w.company_name,
      position: w.position || '',
      year_from: w.startDate ? new Date(w.startDate).getUTCFullYear() : (w.year_from || null),
      year_to: w.endDate ? new Date(w.endDate).getUTCFullYear() : (w.year_to || null),
      created_at: w.createdAt || w.created_at || new Date().toISOString(),
      updated_at: w.updatedAt || w.updated_at || new Date().toISOString(),
    } as TrainerWorkHistory;
  } catch (error: any) {
    console.error('Error creating work history:', error);
    if (error.message.includes('Maximum 5 work history entries')) {
      throw new Error('Maximum 5 work history entries allowed. Please delete an existing entry first.');
    }
    throw new Error(`Failed to create work history: ${error.message}`);
  }
}

export async function updateWorkHistory(
  id: string,
  workHistoryData: Partial<TrainerWorkHistory>
): Promise<TrainerWorkHistory> {
  try {
    // Map frontend snake_case to backend camelCase
    const updateData: any = {};
    if (workHistoryData.company_name !== undefined) updateData.company = workHistoryData.company_name;
    if (workHistoryData.position !== undefined) updateData.position = workHistoryData.position;
    if (workHistoryData.year_from !== undefined) {
      updateData.startDate = workHistoryData.year_from ? new Date(Date.UTC(workHistoryData.year_from, 0, 1)) : null;
    }
    if (workHistoryData.year_to !== undefined) {
      updateData.endDate = workHistoryData.year_to ? new Date(Date.UTC(workHistoryData.year_to, 11, 31)) : null;
    }

    const trainerId = workHistoryData.trainer_id;
    if (!trainerId) {
      throw new Error('trainer_id is required for updating work history');
    }

    const response = await apiClient.put<{ workHistory: any }>(
      `/trainers/${trainerId}/work-history/${id}`,
      updateData
    );
    const w = response.workHistory;

    return {
      id: w.id,
      trainer_id: w.trainerId || w.trainer_id,
      company_name: w.company || w.company_name,
      position: w.position || '',
      year_from: w.startDate ? new Date(w.startDate).getUTCFullYear() : (w.year_from || null),
      year_to: w.endDate ? new Date(w.endDate).getUTCFullYear() : (w.year_to || null),
      created_at: w.createdAt || w.created_at || new Date().toISOString(),
      updated_at: w.updatedAt || w.updated_at || new Date().toISOString(),
    } as TrainerWorkHistory;
  } catch (error: any) {
    console.error('Error updating work history:', error);
    throw new Error(`Failed to update work history: ${error.message}`);
  }
}

export async function deleteWorkHistory(id: string): Promise<void> {
  throw new Error('deleteWorkHistory requires trainerId. Please use deleteWorkHistoryWithTrainerId instead.');
}

export async function deleteWorkHistoryWithTrainerId(trainerId: string, id: string): Promise<void> {
  try {
    await apiClient.deleteWorkHistory(trainerId, id);
  } catch (error: any) {
    console.error('Error deleting work history:', error);
    throw new Error(`Failed to delete work history: ${error.message}`);
  }
}

// ================================================================
// COURSES CONDUCTED CRUD OPERATIONS
// ================================================================

export async function fetchCoursesConducted(trainerId: string): Promise<TrainerCourseConducted[]> {
  try {
    const coursesConducted = await apiClient.getCoursesConducted(trainerId);

    // Map backend camelCase to frontend snake_case
    return coursesConducted.map((c: any) => ({
      id: c.id,
      trainer_id: c.trainerId || c.trainer_id,
      course_id: c.courseId || c.course_id || '',
      course_name: c.courseName || c.course_name || '',
      date_conducted: c.dateConducted
        ? new Date(c.dateConducted).toISOString().split('T')[0]
        : (c.date_conducted || ''),
      location: c.location || null,
      participants_count: c.participantsCount ?? c.participants_count ?? null,
      notes: c.notes || null,
      created_at: c.createdAt || c.created_at || new Date().toISOString(),
      updated_at: c.updatedAt || c.updated_at || new Date().toISOString(),
    })) as TrainerCourseConducted[];
  } catch (error: any) {
    console.error('Error fetching courses conducted:', error);
    throw new Error(`Failed to fetch courses conducted: ${error.message}`);
  }
}

export async function createCourseConducted(
  courseData: Omit<TrainerCourseConducted, 'id' | 'created_at' | 'updated_at'>
): Promise<TrainerCourseConducted> {
  try {
    // Map frontend snake_case to backend camelCase
    const createData = {
      courseId: courseData.course_id || null,
      courseName: courseData.course_name,
      dateConducted: courseData.date_conducted,
      location: courseData.location || null,
      participantsCount: courseData.participants_count || null,
      notes: courseData.notes || null,
    };

    const response = await apiClient.createCourseConducted(courseData.trainer_id, createData);
    const c = response;

    return {
      id: c.id,
      trainer_id: c.trainerId || c.trainer_id,
      course_id: c.courseId || c.course_id || '',
      course_name: c.courseName || c.course_name || '',
      date_conducted: c.dateConducted
        ? new Date(c.dateConducted).toISOString().split('T')[0]
        : (c.date_conducted || ''),
      location: c.location || null,
      participants_count: c.participantsCount ?? c.participants_count ?? null,
      notes: c.notes || null,
      created_at: c.createdAt || c.created_at || new Date().toISOString(),
      updated_at: c.updatedAt || c.updated_at || new Date().toISOString(),
    } as TrainerCourseConducted;
  } catch (error: any) {
    console.error('Error creating course conducted:', error);
    if (error.message.includes('already been recorded')) {
      throw new Error('This course has already been recorded for this date');
    }
    throw new Error(`Failed to create course conducted: ${error.message}`);
  }
}

export async function updateCourseConducted(
  id: string,
  courseData: Partial<TrainerCourseConducted>
): Promise<TrainerCourseConducted> {
  try {
    // Map frontend snake_case to backend camelCase
    const updateData: any = {};
    if (courseData.course_name !== undefined) updateData.courseName = courseData.course_name;
    if (courseData.date_conducted !== undefined) updateData.dateConducted = courseData.date_conducted;
    if (courseData.location !== undefined) updateData.location = courseData.location || null;
    if (courseData.participants_count !== undefined) updateData.participantsCount = courseData.participants_count || null;
    if (courseData.notes !== undefined) updateData.notes = courseData.notes || null;

    const trainerId = courseData.trainer_id;
    if (!trainerId) {
      throw new Error('trainer_id is required for updating course conducted');
    }

    const response = await apiClient.updateCourseConducted(trainerId, id, updateData);
    const c = response;

    return {
      id: c.id,
      trainer_id: c.trainerId || c.trainer_id,
      course_id: c.courseId || c.course_id || '',
      course_name: c.courseName || c.course_name || '',
      date_conducted: c.dateConducted
        ? new Date(c.dateConducted).toISOString().split('T')[0]
        : (c.date_conducted || ''),
      location: c.location || null,
      participants_count: c.participantsCount ?? c.participants_count ?? null,
      notes: c.notes || null,
      created_at: c.createdAt || c.created_at || new Date().toISOString(),
      updated_at: c.updatedAt || c.updated_at || new Date().toISOString(),
    } as TrainerCourseConducted;
  } catch (error: any) {
    console.error('Error updating course conducted:', error);
    throw new Error(`Failed to update course conducted: ${error.message}`);
  }
}

export async function deleteCourseConducted(id: string): Promise<void> {
  throw new Error('deleteCourseConducted requires trainerId. Please use deleteCourseConductedWithTrainerId instead.');
}

export async function deleteCourseConductedWithTrainerId(trainerId: string, id: string): Promise<void> {
  try {
    await apiClient.deleteCourseConducted(trainerId, id);
  } catch (error: any) {
    console.error('Error deleting course conducted:', error);
    throw new Error(`Failed to delete course conducted: ${error.message}`);
  }
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

export function calculateDuration(yearFrom: number, yearTo: number): string {
  const years = yearTo - yearFrom;
  if (years === 0) {
    return 'Less than 1 year';
  } else if (years === 1) {
    return '1 year';
  } else {
    return `${years} years`;
  }
}

export function formatQualificationType(type: string): string {
  const typeMap: Record<string, string> = {
    postgraduate: 'Postgraduate',
    undergraduate: 'Undergraduate',
    academic: 'Academic',
    professional: 'Professional'
  };
  return typeMap[type] || type;
}

export function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear; year >= 1950; year--) {
    years.push(year);
  }
  return years;
}

export function validateICNumber(icNumber: string): boolean {
  const icPattern = /^\d{6}-\d{2}-\d{4}$/;
  return icPattern.test(icNumber);
}

export function validatePhoneNumber(phoneNumber: string): boolean {
  const phonePattern = /^(\+?60|0)[0-9]{1,2}-?[0-9]{7,8}$/;
  return phonePattern.test(phoneNumber);
}

export function validateEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

// ================================================================
// PAST CLIENTS CRUD OPERATIONS
// ================================================================

export async function fetchPastClients(trainerId: string): Promise<TrainerPastClient[]> {
  try {
    const response = await apiClient.get<{ pastClients: any[] }>(`/trainers/${trainerId}/past-clients`);
    const clients = response.pastClients || [];

    // Map backend camelCase to frontend snake_case
    return clients.map((c: any) => ({
      id: c.id,
      trainer_id: c.trainerId || c.trainer_id,
      client_name: c.clientName || c.client_name,
      project_description: c.projectDescription || c.project_description || null,
      year: c.year || null,
      created_at: c.createdAt || c.created_at || new Date().toISOString(),
      updated_at: c.updatedAt || c.updated_at || new Date().toISOString(),
    })) as TrainerPastClient[];
  } catch (error: any) {
    console.error('Error fetching past clients:', error);
    throw new Error(`Failed to fetch past clients: ${error.message}`);
  }
}

export async function validatePastClientsLimit(trainerId: string): Promise<boolean> {
  try {
    const response = await apiClient.get<{ pastClients: any[] }>(`/trainers/${trainerId}/past-clients`);
    const count = response.pastClients?.length || 0;
    return count < 5;
  } catch (error: any) {
    console.error('Error checking past clients limit:', error);
    throw new Error(`Failed to check past clients limit: ${error.message}`);
  }
}

export async function createPastClient(
  clientData: Omit<TrainerPastClient, 'id' | 'created_at' | 'updated_at'>
): Promise<TrainerPastClient> {
  try {
    // Map frontend snake_case to backend camelCase
    const createData = {
      clientName: clientData.client_name,
      projectDescription: clientData.project_description || null,
      year: clientData.year || null,
    };

    const response = await apiClient.post<{ pastClient: any }>(
      `/trainers/${clientData.trainer_id}/past-clients`,
      createData
    );
    const c = response.pastClient;

    return {
      id: c.id,
      trainer_id: c.trainerId || c.trainer_id,
      client_name: c.clientName || c.client_name,
      project_description: c.projectDescription || c.project_description || null,
      year: c.year || null,
      created_at: c.createdAt || c.created_at || new Date().toISOString(),
      updated_at: c.updatedAt || c.updated_at || new Date().toISOString(),
    } as TrainerPastClient;
  } catch (error: any) {
    console.error('Error creating past client:', error);
    if (error.message.includes('Maximum 5 past clients')) {
      throw new Error('Maximum 5 past clients allowed. Please delete an existing client first.');
    }
    throw new Error(`Failed to create past client: ${error.message}`);
  }
}

export async function updatePastClient(
  id: string,
  clientData: Partial<TrainerPastClient>
): Promise<TrainerPastClient> {
  try {
    // Map frontend snake_case to backend camelCase
    const updateData: any = {};
    if (clientData.client_name !== undefined) updateData.clientName = clientData.client_name;
    if (clientData.project_description !== undefined) updateData.projectDescription = clientData.project_description;
    if (clientData.year !== undefined) updateData.year = clientData.year;

    const trainerId = clientData.trainer_id;
    if (!trainerId) {
      throw new Error('trainer_id is required for updating past client');
    }

    const response = await apiClient.put<{ pastClient: any }>(
      `/trainers/${trainerId}/past-clients/${id}`,
      updateData
    );
    const c = response.pastClient;

    return {
      id: c.id,
      trainer_id: c.trainerId || c.trainer_id,
      client_name: c.clientName || c.client_name,
      project_description: c.projectDescription || c.project_description || null,
      year: c.year || null,
      created_at: c.createdAt || c.created_at || new Date().toISOString(),
      updated_at: c.updatedAt || c.updated_at || new Date().toISOString(),
    } as TrainerPastClient;
  } catch (error: any) {
    console.error('Error updating past client:', error);
    throw new Error(`Failed to update past client: ${error.message}`);
  }
}

export async function deletePastClient(id: string): Promise<void> {
  throw new Error('deletePastClient requires trainerId. Please use deletePastClientWithTrainerId instead.');
}

export async function deletePastClientWithTrainerId(trainerId: string, id: string): Promise<void> {
  try {
    await apiClient.deletePastClient(trainerId, id);
  } catch (error: any) {
    console.error('Error deleting past client:', error);
    throw new Error(`Failed to delete past client: ${error.message}`);
  }
}
