// hooks/useTherapists.ts
import { useState, useEffect, useCallback } from 'react';
import { Therapist } from '@/types';
import * as therapistService from '@/services/therapistService';
import { useToast } from '@/contexts/ToastContext';

interface UseTherapistsResult {
  therapists: Therapist[];
  isLoading: boolean;
  error: Error | null;
}

export const useTherapists = (): UseTherapistsResult => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { showToast } = useToast();

  const fetchTherapists = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTherapists = await therapistService.getTherapists();
      setTherapists(fetchedTherapists);
      setError(null);
    } catch (err) {
      setError(err as Error);
      showToast("Falha ao carregar lista de terapeutas.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTherapists();
  }, [fetchTherapists]);


  return { therapists, isLoading, error };
};
