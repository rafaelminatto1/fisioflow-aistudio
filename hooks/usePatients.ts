// hooks/usePatients.ts
import { useState, useCallback, useEffect } from 'react';
import { Patient, PatientSummary } from '../types';
import * as patientService from '../services/patientService';
import { useToast } from '../contexts/ToastContext';
import { eventService } from '../services/eventService';

interface UsePatientsResult {
  patients: PatientSummary[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  fetchInitialPatients: (filters: { searchTerm: string; statusFilter: string }) => void;
  fetchMorePatients: () => void;
  addPatient: (patientData: Omit<Patient, 'id' | 'lastVisit'>) => Promise<void>;
}

export const usePatients = (): UsePatientsResult => {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentFilters, setCurrentFilters] = useState({ searchTerm: '', statusFilter: 'All' });

  const { showToast } = useToast();

  const fetchPatients = useCallback(async (filters: { searchTerm: string; statusFilter: string }, cursor?: string | null) => {
    if (cursor) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const result = await patientService.getPatients({ ...filters, cursor, limit: 15 });
      setPatients(prev => cursor ? [...prev, ...result.patients] : result.patients);
      setNextCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
    } catch (err) {
      setError(err as Error);
      showToast('Falha ao carregar pacientes.', 'error');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [showToast]);

  const fetchInitialPatients = useCallback((filters: { searchTerm: string; statusFilter: string }) => {
    setCurrentFilters(filters);
    fetchPatients(filters, null);
  }, [fetchPatients]);

  const fetchMorePatients = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    fetchPatients(currentFilters, nextCursor);
  }, [isLoadingMore, hasMore, nextCursor, fetchPatients, currentFilters]);

  const addPatient = async (patientData: Omit<Patient, 'id' | 'lastVisit'>) => {
    try {
      await patientService.addPatient(patientData);
      showToast("Paciente adicionado com sucesso!", "success");
      // The event listener will handle the refetch
    } catch (err) {
      showToast("Falha ao adicionar paciente.", "error");
    }
  };

  // Listen for global patient changes to refresh the list
  useEffect(() => {
    const handlePatientsChanged = () => {
        fetchInitialPatients(currentFilters);
    };
    eventService.on('patients:changed', handlePatientsChanged);
    return () => {
        eventService.off('patients:changed', handlePatientsChanged);
    };
  }, [currentFilters, fetchInitialPatients]);


  return {
    patients,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchInitialPatients,
    fetchMorePatients,
    addPatient,
  };
};
