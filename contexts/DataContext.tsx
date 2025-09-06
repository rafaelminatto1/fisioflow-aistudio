import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { Patient, Therapist, Appointment } from '../src/types';
import * as therapistService from '../services/therapistService';
import * as appointmentService from '../services/appointmentService';
import * as patientService from '../services/patientService';
import PageLoader from '../src/components/ui/PageLoader';
import { eventService } from '../services/eventService';

interface DataContextType {
  patients: Patient[];
  therapists: Therapist[];
  appointments: Appointment[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  loadAllPatients: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (fetchPatients = false) => {
    setIsLoading(true);
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const promises: [Promise<Therapist[]>, Promise<Appointment[]>, Promise<Patient[]>?] = [
        therapistService.getTherapists(),
        appointmentService.getAppointments(ninetyDaysAgo, new Date()),
      ];
      
      if (fetchPatients) {
        promises.push(patientService.getAllPatients());
      }

      const [therapistsData, appointmentsData, patientsData] = await Promise.all(promises);
      
      setTherapists(therapistsData);
      setAppointments(appointmentsData);
      if (patientsData) {
        setPatients(patientsData);
      }
      
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAllPatients = useCallback(async () => {
    if (patients.length > 0) return;
    try {
        const patientsData = await patientService.getAllPatients();
        setPatients(patientsData);
    } catch (err) {
        setError(err as Error);
    }
  }, [patients.length]);


  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Event listener to keep context in sync
  useEffect(() => {
    const handleDataChange = () => {
        // Refetch context data, including patients if they were already loaded
        fetchData(patients.length > 0);
    };

    eventService.on('patients:changed', handleDataChange);
    eventService.on('appointments:changed', handleDataChange);
    
    return () => {
      eventService.off('patients:changed', handleDataChange);
      eventService.off('appointments:changed', handleDataChange);
    };
  }, [fetchData, patients.length]);

  if (isLoading && therapists.length === 0) {
    return <PageLoader />;
  }
  
  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">Falha ao carregar dados essenciais: {error.message}</div>;
  }

  return (
    <DataContext.Provider value={{
      patients,
      therapists,
      appointments,
      isLoading,
      error,
      refetch: () => fetchData(true),
      loadAllPatients,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
