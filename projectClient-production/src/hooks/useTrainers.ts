import { useState, useEffect, useCallback } from 'react';
import { apiClient, Trainer } from '../lib/api-client';

export function useTrainers() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrainers();
  }, []);

  async function fetchTrainers() {
    try {
      setLoading(true);
      const trainersData = await apiClient.getTrainers();
      
      // Backend already includes avgRating in response
      // Sort by rating (descending), trainers without ratings go to the end
      const sortedTrainers = [...(trainersData || [])].sort((a, b) => {
        const ratingA = a.avgRating ?? a.rating ?? null;
        const ratingB = b.avgRating ?? b.rating ?? null;
        if (ratingA === null && ratingB === null) return 0;
        if (ratingA === null) return 1;
        if (ratingB === null) return -1;
        return ratingB - ratingA;
      });

      setTrainers(sortedTrainers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  }

  return { trainers, loading, error, refetch: fetchTrainers };
}

export function useTrainer(id: string | undefined) {
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainer = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await apiClient.getTrainer(id);
      setTrainer(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTrainer(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrainer();
  }, [fetchTrainer]);

  return { trainer, loading, error, refetch: fetchTrainer };
}

export function useTrainersByCourse(courseId: string | undefined) {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainers = useCallback(async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      // Get course first to get trainer_id
      const course = await apiClient.getCourse(courseId);
      
      if (!course?.trainerId) {
        setTrainers([]);
        return;
      }

      // Fetch the trainer
      const trainer = await apiClient.getTrainer(course.trainerId);
      setTrainers(trainer ? [trainer] : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  return { trainers, loading, error, refetch: fetchTrainers };
}

export function useTrainerByCourseId(trainerId: string | null | undefined) {
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainer = useCallback(async () => {
    if (!trainerId) {
      setLoading(false);
      setTrainer(null);
      setError(null);
      return;
    }

    console.log('[useTrainerByCourseId] Fetching trainer with ID:', trainerId);

    try {
      setLoading(true);
      setError(null);

      const data = await apiClient.getTrainer(trainerId);

      console.log('[useTrainerByCourseId] Query result:', { data });

      if (!data) {
        console.warn('[useTrainerByCourseId] No trainer found for ID:', trainerId);
        setError('Trainer not found in database');
        setTrainer(null);
      } else {
        setTrainer(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('[useTrainerByCourseId] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [trainerId]);

  useEffect(() => {
    fetchTrainer();
  }, [fetchTrainer]);

  return { trainer, loading, error, refetch: fetchTrainer };
}
