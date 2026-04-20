import { apiClient } from './api-client';
import { Course } from '../types/database';

export interface CourseFormData {
  title: string;
  description: string;
  duration_hours: number;
  duration_unit?: 'days' | 'hours' | 'half_day';
  course_type: string[] | string | null;
  course_mode: string[] | string | null;
  category?: string[] | string | null;
  certificate: string | null;
  professional_development_points?: string | null;
  professional_development_points_other?: string | null;
  assessment: boolean;
  learning_objectives: string[];
  learning_outcomes: string[];
  target_audience: string;
  methodology: string;
  prerequisite: string;
  end_date?: string | null;
  image_url?: string | null;
  status: 'draft' | 'published';
  selectedAvailabilityId?: string | null;
  delivery_languages?: string[];
  hrdc_claimable: boolean;
}

export interface ScheduleItemData {
  day_number: number;
  start_time: string;
  end_time: string;
  module_title: string | string[];
  submodule_title: string | string[] | null;
  duration_minutes: number;
  submodules?: string[];
}

const parseTextToArray = (text: string | string[] | null | undefined): string[] | null => {
  if (!text) return null;
  if (Array.isArray(text)) return text;
  if (typeof text !== 'string') return null;
  return text.split('\n').map(s => s.trim()).filter(Boolean);
};

const normalizeTrainerCourseStatus = (status: string | null | undefined): Course['status'] => {
  switch (status) {
    case 'APPROVED':
    case 'ACTIVE':
      return 'published';
    case 'PENDING_APPROVAL':
      return 'PENDING_APPROVAL';
    case 'DENIED':
      return 'DENIED';
    default:
      return 'draft';
  }
};

// Map frontend CourseFormData → backend Course payload
function mapToBackendCourse(trainerId: string, courseData: CourseFormData) {
  let storedDurationHours: number;
  if (courseData.duration_unit === 'days') {
    storedDurationHours = courseData.duration_hours;
  } else if (courseData.duration_unit === 'half_day') {
    storedDurationHours = 4.5;
  } else {
    storedDurationHours = courseData.duration_hours;
  }

  return {
    trainerId,
    title: courseData.title,
    description: courseData.description,
    durationHours: storedDurationHours,
    durationUnit: courseData.duration_unit || 'hours',
    courseType: courseData.course_type === 'BOTH'
      ? ['IN_HOUSE', 'PUBLIC']
      : Array.isArray(courseData.course_type)
        ? courseData.course_type.map(t => t.toUpperCase().replace('-', '_'))
        : courseData.course_type
          ? [courseData.course_type.toUpperCase().replace('-', '_')]
          : ['IN_HOUSE'],
    courseMode: Array.isArray(courseData.course_mode) && courseData.course_mode.length > 0
      ? courseData.course_mode.map(m => m.toUpperCase())
      : typeof courseData.course_mode === 'string'
        ? [courseData.course_mode.toUpperCase()]
        : ['PHYSICAL'],
    category: courseData.category || null,
    certificate: courseData.certificate || null,
    professionalDevelopmentPoints: courseData.professional_development_points || null,
    professionalDevelopmentPointsOther: courseData.professional_development_points === 'OTHERS'
      ? courseData.professional_development_points_other || null
      : null,
    assessment: courseData.assessment,
    learningObjectives: courseData.learning_objectives,
    learningOutcomes: courseData.learning_outcomes,
    targetAudience: parseTextToArray(courseData.target_audience),
    methodology: parseTextToArray(courseData.methodology),
    prerequisite: parseTextToArray(courseData.prerequisite),
    imageUrl: courseData.image_url || null,
    fixedDate: null,
    startDate: null,
    endDate: courseData.end_date ? new Date(courseData.end_date) : null,
    // Trainer "publish" submits the course for admin approval.
    status: courseData.status === 'published' ? 'PENDING_APPROVAL' : 'DRAFT',
    modules: [],
    trainerAvailabilityId: courseData.selectedAvailabilityId || null,
    deliveryLanguages: courseData.delivery_languages || [],
    hrdcClaimable: courseData.hrdc_claimable,
  };
}

export async function createCourse(trainerId: string, courseData: CourseFormData) {
  try {
    const payload = mapToBackendCourse(trainerId, courseData);
    const result = await apiClient.post<{ course: any }>('/courses', payload);
    return result.course as Course;
  } catch (error: any) {
    console.error('Error creating course:', error);
    throw new Error(error?.message || 'Failed to create course');
  }
}

export async function updateCourse(courseId: string, courseData: Partial<CourseFormData>) {
  try {
    const updatePayload: any = {};

    // Map only provided fields
    if (courseData.title !== undefined) updatePayload.title = courseData.title;
    if (courseData.description !== undefined) updatePayload.description = courseData.description;

    // Handle duration conversion - same logic as createCourse
    if (courseData.duration_hours !== undefined || courseData.duration_unit !== undefined) {
      const durationUnit = courseData.duration_unit;
      const durationHours = courseData.duration_hours;

      if (durationHours !== undefined && durationUnit !== undefined) {
        let storedDurationHours: number;
        if (durationUnit === 'days') {
          storedDurationHours = durationHours;
        } else if (durationUnit === 'half_day') {
          storedDurationHours = 4.5;
        } else {
          storedDurationHours = durationHours;
        }
        updatePayload.durationHours = storedDurationHours;
      } else if (courseData.duration_hours !== undefined) {
        updatePayload.durationHours = courseData.duration_hours;
      }

      if (courseData.duration_unit !== undefined) {
        updatePayload.durationUnit = courseData.duration_unit;
      }
    }
    if (courseData.course_type !== undefined) {
      if (Array.isArray(courseData.course_type)) {
        updatePayload.courseType = courseData.course_type.map((t: string) =>
          t.toUpperCase().replace('-', '_')
        );
      } else if (courseData.course_type) {
        updatePayload.courseType = [courseData.course_type.toUpperCase().replace('-', '_')];
      } else {
        updatePayload.courseType = null;
      }
    }
    if (courseData.course_mode !== undefined) {
      if (Array.isArray(courseData.course_mode)) {
        updatePayload.courseMode = courseData.course_mode.map((m: string) =>
          m.toUpperCase().replace('VIRTUAL', 'ONLINE').replace('BOTH', 'HYBRID')
        );
      } else if (courseData.course_mode) {
        const mode = courseData.course_mode.toUpperCase().replace('VIRTUAL', 'ONLINE').replace('BOTH', 'HYBRID');
        updatePayload.courseMode = [mode];
      } else {
        updatePayload.courseMode = null;
      }
    }
    if (courseData.professional_development_points !== undefined) {
      updatePayload.professionalDevelopmentPoints = courseData.professional_development_points;
    }
    if (courseData.professional_development_points_other !== undefined) {
      updatePayload.professionalDevelopmentPointsOther = courseData.professional_development_points_other;
    }
    if (courseData.category !== undefined) updatePayload.category = courseData.category;
    if (courseData.certificate !== undefined) updatePayload.certificate = courseData.certificate;
    if (courseData.assessment !== undefined) updatePayload.assessment = courseData.assessment;
    if (courseData.learning_objectives !== undefined) updatePayload.learningObjectives = courseData.learning_objectives;
    if (courseData.learning_outcomes !== undefined) updatePayload.learningOutcomes = courseData.learning_outcomes;
    if (courseData.target_audience !== undefined) updatePayload.targetAudience = parseTextToArray(courseData.target_audience);
    if (courseData.methodology !== undefined) updatePayload.methodology = parseTextToArray(courseData.methodology);
    if (courseData.prerequisite !== undefined) updatePayload.prerequisite = parseTextToArray(courseData.prerequisite);
    if (courseData.image_url !== undefined) updatePayload.imageUrl = courseData.image_url;
    if (courseData.status !== undefined) {
      // Trainer "publish" submits the course for admin approval.
      updatePayload.status = courseData.status === 'published' ? 'PENDING_APPROVAL' : 'DRAFT';
    }

    // Handle end_date (trainers cannot set fixedDate - events created only by admin)
    if (courseData.end_date !== undefined) {
      if (courseData.end_date && courseData.end_date.trim() !== '') {
        updatePayload.endDate = new Date(courseData.end_date);
      } else {
        updatePayload.endDate = null;
      }
    }

    if (courseData.delivery_languages !== undefined) {
      updatePayload.deliveryLanguages = courseData.delivery_languages;
    }

    if (courseData.hrdc_claimable !== undefined) {
      updatePayload.hrdcClaimable = courseData.hrdc_claimable;
    }

    // Ensure fixedDate is always null for trainer updates
    updatePayload.fixedDate = null;

    // Log the payload for debugging
    console.log('Updating course with payload:', JSON.stringify(updatePayload, null, 2));
    console.log('Course ID:', courseId);
    console.log('Original courseData:', JSON.stringify(courseData, null, 2));

    try {
      const result = await apiClient.put<{ course: any }>(`/courses/${courseId}`, updatePayload);
      if (!result || !result.course) {
        throw new Error('Invalid response from server: course data missing');
      }
      return result.course as Course;
    } catch (error: any) {
      console.error('API call failed:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Error updating course:', error);
    throw new Error(error?.message || 'Failed to update course');
  }
}

export async function fetchTrainerCourses(trainerId: string) {
  try {
    const result = await apiClient.get<{ courses: any[] }>(`/courses?trainerId=${encodeURIComponent(trainerId)}`);
    return (result.courses || []).map((raw) => {
      const durationUnit = raw.durationUnit ?? raw.duration_unit ?? 'hours';
      const durationHours = raw.durationHours ?? raw.duration_hours;

      // If unit is days, the stored value is already in days (not hours)
      // So we use it directly without conversion
      // The stored value for days is the raw day count (e.g., 2 for 2 days)
      // The stored value for hours is the raw hour count (e.g., 6 for 6 hours)
      // No conversion needed - use the stored value as-is

      return {
        id: raw.id,
        trainer_id: raw.trainerId || raw.trainer_id,
        title: raw.title,
        description: raw.description ?? null,
        learning_objectives: raw.learningObjectives ?? [],
        learning_outcomes: raw.learningOutcomes ?? [],
        target_audience: raw.targetAudience ?? null,
        methodology: raw.methodology ?? null,
        prerequisite: raw.prerequisite ?? null,
        certificate: raw.certificate ?? null,
        professional_development_points: raw.professionalDevelopmentPoints ?? null,
        professional_development_points_other: raw.professionalDevelopmentPointsOther ?? null,
        assessment: raw.assessment ?? false,
        course_type: Array.isArray(raw.courseType) ? raw.courseType : (raw.courseType ? [raw.courseType] : null),
        course_mode: Array.isArray(raw.courseMode) ? raw.courseMode : (raw.courseMode ? [raw.courseMode] : null),
        duration_hours: durationHours,
        duration_unit: durationUnit,
        event_date: raw.fixedDate ? new Date(raw.fixedDate).toISOString().split('T')[0] : (raw.startDate ? new Date(raw.startDate).toISOString().split('T')[0] : null),
        end_date: raw.endDate ? new Date(raw.endDate).toISOString().split('T')[0] : null,
        image_url: apiClient.resolveImageUrl(raw.imageUrl ?? raw.image_url ?? null),
        category: raw.category ?? null,
        price: raw.price ?? null,
        venue: raw.venue ?? null,
        isRead: raw.isRead ?? true,
        hrdc_claimable: raw.hrdcClaimable ?? null,
        modules: raw.modules ?? [],
        status: normalizeTrainerCourseStatus(raw.status),
        course_sequence: null,
        created_at: raw.createdAt || raw.created_at,
        delivery_languages: raw.deliveryLanguages ?? [],
        course_trainers: (raw.courseTrainers || raw.course_trainers || []).map((ct: any) => ({
          id: ct.id,
          courseId: ct.courseId || ct.course_id,
          trainerId: ct.trainerId || ct.trainer_id,
          role: ct.role,
          assignedAt: ct.assignedAt || ct.assigned_at,
          trainer: ct.trainer ? {
            id: ct.trainer.id,
            fullName: ct.trainer.fullName || ct.trainer.full_name,
            profilePic: apiClient.resolveImageUrl(ct.trainer.profilePic || ct.trainer.profile_pic || null),
          } : undefined
        })),
        courseNotes: raw.courseNotes || [],
        adminCourseNotes: raw.adminCourseNotes || [],
      };
    }) as Course[];
  } catch (error: any) {
    console.error('Error fetching trainer courses:', error);
    throw new Error(error?.message || 'Failed to load courses');
  }
}

export async function fetchCourseById(courseId: string) {
  try {
    const result = await apiClient.get<{ course: any }>(`/courses/${courseId}`);
    const raw = result.course;
    if (!raw) return null;
    return {
      id: raw.id,
      trainer_id: raw.trainerId || raw.trainer_id,
      title: raw.title,
      description: raw.description ?? null,
      learning_objectives: raw.learningObjectives ?? [],
      learning_outcomes: raw.learningOutcomes ?? [],
      target_audience: raw.targetAudience ?? null,
      methodology: raw.methodology ?? null,
      prerequisite: raw.prerequisite ?? null,
      certificate: raw.certificate ?? null,
      professional_development_points: raw.professionalDevelopmentPoints ?? null,
      professional_development_points_other: raw.professionalDevelopmentPointsOther ?? null,
      assessment: raw.assessment ?? false,
      course_type: Array.isArray(raw.courseType) ? raw.courseType : (raw.courseType ? [raw.courseType] : null),
      course_mode: Array.isArray(raw.courseMode) ? raw.courseMode : (raw.courseMode ? [raw.courseMode] : null),
      duration_hours: raw.durationHours ?? raw.duration_hours,
      duration_unit: raw.durationUnit ?? raw.duration_unit ?? 'hours',
      event_date: raw.fixedDate
        ? new Date(raw.fixedDate).toISOString().split('T')[0]
        : (raw.startDate ? new Date(raw.startDate).toISOString().split('T')[0] : null),
      image_url: apiClient.resolveImageUrl(raw.imageUrl ?? raw.image_url ?? null),
      category: raw.category ?? null,
      price: raw.price ?? null,
      venue: raw.venue ?? null,
      isRead: raw.isRead ?? true,
      hrdc_claimable: raw.hrdcClaimable ?? null,
      modules: raw.modules ?? [],
      status: normalizeTrainerCourseStatus(raw.status),
      course_sequence: null,
      created_at: raw.createdAt || raw.created_at,
      delivery_languages: raw.deliveryLanguages ?? [],
      course_trainers: (raw.courseTrainers || raw.course_trainers || []).map((ct: any) => ({
        id: ct.id,
        courseId: ct.courseId || ct.course_id,
        trainerId: ct.trainerId || ct.trainer_id,
        role: ct.role,
        assignedAt: ct.assignedAt || ct.assigned_at,
        trainer: ct.trainer ? {
          id: ct.trainer.id,
          fullName: ct.trainer.fullName || ct.trainer.full_name,
          profilePic: apiClient.resolveImageUrl(ct.trainer.profilePic || ct.trainer.profile_pic || null),
          professionalBio: ct.trainer.professionalBio || ct.trainer.professional_bio,
        } : undefined
      })),
      courseNotes: raw.courseNotes || [],
      adminCourseNotes: raw.adminCourseNotes || [],
    } as Course;
  } catch (error: any) {
    console.error('Error fetching course by id:', error);
    throw new Error(error?.message || 'Failed to load course');
  }
}

export async function deleteCourse(courseId: string) {
  try {
    await apiClient.delete(`/courses/${courseId}`);
  } catch (error: any) {
    console.error('Error deleting course:', error);
    throw new Error(error?.message || 'Failed to delete course');
  }
}

export async function saveCourseSchedule(courseId: string, scheduleItems: ScheduleItemData[]) {
  try {
    const payload = scheduleItems.map((item) => {
      // module_title is now a string (one module per row)
      const moduleTitle = typeof item.module_title === 'string'
        ? item.module_title
        : (Array.isArray(item.module_title) && item.module_title.length > 0 ? item.module_title[0] : '');

      // Ensure submodule_title is an array or null
      let submoduleTitleArray: string[] | null = null;
      if (item.submodule_title) {
        if (Array.isArray(item.submodule_title)) {
          submoduleTitleArray = item.submodule_title;
        } else {
          submoduleTitleArray = [item.submodule_title];
        }
      } else if (item.submodules && Array.isArray(item.submodules) && item.submodules.length > 0) {
        submoduleTitleArray = item.submodules;
      }

      return {
        dayNumber: item.day_number,
        startTime: item.start_time,
        endTime: item.end_time,
        moduleTitle: moduleTitle,
        submoduleTitle: submoduleTitleArray,
        durationMinutes: item.duration_minutes,
      };
    });
    const result = await apiClient.put<{ schedule: any[] }>(`/courses/${courseId}/schedule`, {
      items: payload,
    });
    return (result.schedule || []).map((s) => {
      const moduleTitle = typeof s.moduleTitle === 'string' ? s.moduleTitle : '';
      const submoduleTitle = Array.isArray(s.submoduleTitle)
        ? s.submoduleTitle
        : (s.submoduleTitle ? [s.submoduleTitle] : null);

      return {
        id: s.id,
        course_id: s.courseId,
        day_number: s.dayNumber,
        start_time: s.startTime,
        end_time: s.endTime,
        module_title: moduleTitle,
        module_titles: [moduleTitle],
        submodule_title: submoduleTitle && submoduleTitle.length > 0 ? submoduleTitle[0] : null,
        submodules: submoduleTitle || [],
        duration_minutes: s.durationMinutes,
        created_at: s.createdAt,
      };
    }) as any[];
  } catch (error: any) {
    console.error('Failed to save schedule:', error);
    throw new Error(error?.message || 'Failed to save schedule');
  }
}

export async function fetchCourseSchedule(courseId: string) {
  try {
    const result = await apiClient.get<{ course: any }>(`/courses/${courseId}`);
    const schedule = result.course?.courseSchedule || [];
    return schedule.map((s: any) => {
      const moduleTitle = typeof s.moduleTitle === 'string' ? s.moduleTitle : '';
      const submoduleTitle = Array.isArray(s.submoduleTitle)
        ? s.submoduleTitle
        : (s.submoduleTitle ? [s.submoduleTitle] : null);

      return {
        id: s.id,
        course_id: s.courseId,
        day_number: s.dayNumber,
        start_time: s.startTime,
        end_time: s.endTime,
        module_title: moduleTitle,
        module_titles: [moduleTitle],
        submodule_title: submoduleTitle && submoduleTitle.length > 0 ? submoduleTitle[0] : null,
        submodules: submoduleTitle || [],
        duration_minutes: s.durationMinutes,
        created_at: s.createdAt,
      };
    }) as any[];
  } catch (error: any) {
    console.error('Error fetching course schedule:', error);
    throw new Error(error?.message || 'Failed to load course schedule');
  }
}

export async function uploadCourseMaterial(
  courseId: string,
  file: File
) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const result = await apiClient.post<{ material: any }>(`/courses/${courseId}/materials`, formData);

    return {
      id: result.material.id,
      course_id: result.material.courseId,
      file_url: apiClient.resolveImageUrl(result.material.fileUrl || result.material.file_url || null),
      file_name: result.material.fileName,
      uploaded_at: result.material.uploadedAt,
    };
  } catch (error: any) {
    console.error('Error uploading course material:', error);
    throw new Error(error?.message || 'Failed to upload course material');
  }
}

export async function fetchCourseMaterials(courseId: string) {
  try {
    const result = await apiClient.get<{ course: any }>(`/courses/${courseId}`);
    const mats = result.course?.courseMaterials || [];
    return mats.map((m: any) => ({
      id: m.id,
      course_id: m.courseId,
      file_url: apiClient.resolveImageUrl(m.fileUrl || m.file_url || null),
      file_name: m.fileName,
      uploaded_at: m.uploadedAt,
    }));
  } catch (error: any) {
    console.error('Error fetching course materials:', error);
    throw new Error(error?.message || 'Failed to load course materials');
  }
}

export async function deleteCourseMaterial(courseId: string, materialId: string) {
  try {
    await apiClient.delete(`/courses/${courseId}/materials/${materialId}`);
  } catch (error: any) {
    console.error('Error deleting course material:', error);
    throw new Error(error?.message || 'Failed to delete course material');
  }
}

export function calculateDurationInMinutes(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  return endTotalMinutes - startTotalMinutes;
}

export function validateScheduleDuration(
  scheduleItems: ScheduleItemData[],
  requiredDurationHours: number
): boolean {
  const totalMinutes = scheduleItems.reduce((sum, item) => sum + item.duration_minutes, 0);
  const requiredMinutes = requiredDurationHours * 60;
  return totalMinutes === requiredMinutes;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function validateWordLimit(text: string, maxWords: number): boolean {
  const wordCount = countWords(text);
  return wordCount <= maxWords;
}
