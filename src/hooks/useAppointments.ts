// hooks/useAppointments.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Appointment, EnrichedAppointment, Patient, Therapist, AppointmentTypeColors } from '@/types';
import * as appointmentService from '@/services/appointmentService';
import { useData } from '@/contexts/DataContext';
import { eventService } from '@/services/eventService';

interface UseAppointmentsResult {
  appointments: EnrichedAppointment[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useAppointments = (startDate?: Date, endDate?: Date): UseAppointmentsResult => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { patients, therapists } = useData();
  
  const fetchAppointments = useCallback(async () => {
      if (!startDate || !endDate) {
          setIsLoading(false);
          setAppointments([]);
          return;
      }
      setIsLoading(true);
      try {
          const fetchedAppointments = await appointmentService.getAppointments(startDate, endDate);
          setAppointments(fetchedAppointments);
          setError(null);
      } catch (err) {
          setError(err as Error);
      } finally {
          setIsLoading(false);
      }
  }, [startDate, endDate]);

  useEffect(() => {
      fetchAppointments();
      
      eventService.on('appointments:changed', fetchAppointments);
      
      return () => {
          eventService.off('appointments:changed', fetchAppointments);
      };
  }, [fetchAppointments]);

  const enrichedAppointments = useMemo((): EnrichedAppointment[] => {
    const patientMap = new Map<string, Patient>(patients.map(p => [p.id, p]));
    const therapistMap = new Map<string, Therapist>(therapists.map(t => [t.id, t]));

    return appointments.map(app => ({
        ...app,
        patientPhone: patientMap.get(app.patientId)?.phone || '',
        therapistColor: therapistMap.get(app.therapistId)?.color || 'slate',
        typeColor: AppointmentTypeColors[app.type] || 'slate',
        patientMedicalAlerts: patientMap.get(app.patientId)?.medicalAlerts,
    }));
  }, [appointments, patients, therapists]);

  return { 
    appointments: enrichedAppointments, 
    isLoading, 
    error, 
    refetch: fetchAppointments
  };
};