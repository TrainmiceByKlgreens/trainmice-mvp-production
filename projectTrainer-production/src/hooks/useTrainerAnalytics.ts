import { useState, useEffect, useCallback } from 'react';
import { AnalyticsKPIs, FeedbackFilters } from '../types/database';
import { generateTrainerAnalytics } from '../lib/analyticsService';

interface UseTrainerAnalyticsResult {
  analytics: AnalyticsKPIs | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTrainerAnalytics(
  trainerId: string | undefined,
  filters?: FeedbackFilters
): UseTrainerAnalyticsResult {
  const [analytics, setAnalytics] = useState<AnalyticsKPIs | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!trainerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await generateTrainerAnalytics(trainerId, filters);
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [trainerId, filters?.courseId, filters?.courseDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
}
