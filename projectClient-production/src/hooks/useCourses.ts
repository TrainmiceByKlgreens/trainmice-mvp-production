import { useState, useEffect, useCallback } from 'react';
import { apiClient, Course } from '../lib/api-client';

// ---------------------------
// Fetch all courses
// ---------------------------
export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchCourses() {
    try {
      setLoading(true);
      const data = await apiClient.getCourses();
      setCourses(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  return { courses, loading, error, refetch: fetchCourses };
}

// ---------------------------
// Fetch single course by ID
// ---------------------------
export function useCourse(id: string | undefined) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    try {
      if (!id) {
        setCourse(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      console.log('[useCourse] Fetching course with ID:', id);

      const data = await apiClient.getCourse(id);

      console.log('[useCourse] Query result:', { data });

      if (!data) {
        console.warn('[useCourse] No course found for ID:', id);
        setError('Course not found');
      } else {
        setCourse(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('[useCourse] Error:', errorMessage);
      setError(errorMessage);
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  return { course, loading, error, refetch: fetchCourse };
}
