// hooks/usePatients.ts
import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import { Patient, PatientSummary } from '@/types';
import * as patientService from '@/services/patientService';
import { useToast } from '@/contexts/ToastContext';
import { eventService } from '@/services/eventService';

// Define a fetcher function for SWR
const fetcher = async (url: string) => {
  const params = new URLSearchParams(url.split('?')[1]);
  const searchTerm = params.get('searchTerm') || '';
  const statusFilter = params.get('statusFilter') || 'All';
  const cursor = params.get('cursor') || undefined;
  const limit = parseInt(params.get('limit') || '15', 10);

  const result = await patientService.getPatients({
    searchTerm,
    statusFilter,
    cursor,
    limit,
  });
  return result;
};

interface UsePatientsResult {
  patients: PatientSummary[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  fetchInitialPatients: (filters: {
    searchTerm: string;
    statusFilter: string;
  }) => void;
  fetchMorePatients: () => void;
  addPatient: (patientData: Omit<Patient, 'id' | 'lastVisit'>) => Promise<void>;
}

export const usePatients = (): UsePatientsResult => {
  const { showToast } = useToast();
  const [currentFilters, setCurrentFilters] = useState({
    searchTerm: '',
    statusFilter: 'All',
  });
  const [allPatients, setAllPatients] = useState<PatientSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // SWR key will change when filters or cursor change
  const swrKey = `/api/patients?searchTerm=${currentFilters.searchTerm}&statusFilter=${currentFilters.statusFilter}&limit=15${nextCursor ? `&cursor=${nextCursor}` : ''}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateIfStale: false,
      onSuccess: newData => {
        if (newData.nextCursor) {
          setNextCursor(newData.nextCursor);
          setHasMore(true);
        } else {
          setHasMore(false);
        }
        setAllPatients(prev => {
          const newPatients = newData.patients.filter(
            np => !prev.some(p => p.id === np.id)
          );
          return nextCursor ? [...prev, ...newPatients] : newData.patients;
        });
      },
      onError: err => {
        showToast('Falha ao carregar pacientes.', 'error');
      },
    }
  );

  const fetchInitialPatients = useCallback(
    (filters: { searchTerm: string; statusFilter: string }) => {
      setCurrentFilters(filters);
      setAllPatients([]);
      setNextCursor(null);
      setHasMore(true);
      mutate();
    },
    [mutate]
  );

  const fetchMorePatients = useCallback(() => {
    if (isLoading || isValidating || !hasMore || !nextCursor) return;
    mutate();
  }, [isLoading, isValidating, hasMore, nextCursor, mutate]);

  const addPatient = async (patientData: Omit<Patient, 'id' | 'lastVisit'>) => {
    try {
      await patientService.addPatient(patientData);
      showToast('Paciente adicionado com sucesso!', 'success');
      mutate();
    } catch (err) {
      showToast('Falha ao adicionar paciente.', 'error');
    }
  };

  useEffect(() => {
    const handlePatientsChanged = () => {
      mutate();
    };
    eventService.on('patients:changed', handlePatientsChanged);
    return () => {
      eventService.off('patients:changed', handlePatientsChanged);
    };
  }, [mutate]);

  return {
    patients: allPatients,
    isLoading: isLoading && allPatients.length === 0,
    isLoadingMore: isLoading && allPatients.length > 0,
    hasMore,
    error,
    fetchInitialPatients,
    fetchMorePatients,
    addPatient,
  };
};
