import { useState, useEffect } from 'react';
import { apiClient, TrainerAvailability } from '../lib/api-client';

export function useAvailability(trainerId: string | undefined) {
  const [availability, setAvailability] = useState<TrainerAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trainerId) return;
    fetchAvailability();
  }, [trainerId]);

  async function fetchAvailability() {
    if (!trainerId) {
      setAvailability([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiClient.getTrainerAvailability(trainerId);
      // Sort by date ascending
      const sorted = (data || []).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setAvailability(sorted);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  }

  return { availability, loading, error, refetch: fetchAvailability };
}
