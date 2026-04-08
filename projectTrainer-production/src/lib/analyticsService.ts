import { apiClient } from './api-client';
import {
  FeedbackFilters,
  AnalyticsKPIs,
} from '../types/database';

// Delegate analytics to backend (which computes metrics from MySQL data)
export async function generateTrainerAnalytics(
  trainerId: string,
  filters?: FeedbackFilters
): Promise<AnalyticsKPIs> {
  const params = new URLSearchParams();
  // Only add filters if they have values
  if (filters?.courseId && filters.courseId.trim() !== '') {
    params.append('courseId', filters.courseId);
  }
  if (filters?.courseDate && filters.courseDate.trim() !== '') {
    params.append('courseDate', filters.courseDate);
  }

  const path = params.toString()
    ? `/trainers/${trainerId}/analytics?${params.toString()}`
    : `/trainers/${trainerId}/analytics`;

  const result = await apiClient.get<{ analytics: AnalyticsKPIs }>(path);
  return result.analytics;
}

// For filters dropdowns, reuse backend analytics helpers
export async function fetchTrainerCourses(trainerId: string) {
  const result = await apiClient.get<{ courses: { id: string; title: string }[] }>(
    `/trainers/${trainerId}/analytics/courses`
  );
  return result.courses || [];
}

export async function fetchCourseDates(trainerId: string, courseId: string) {
  const result = await apiClient.get<{ dates: string[] }>(
    `/trainers/${trainerId}/analytics/course-dates?courseId=${encodeURIComponent(courseId)}`
  );
  return result.dates || [];
}
