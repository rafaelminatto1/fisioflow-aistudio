import {
  Patient,
  PatientAttachment,
  PatientSummary,
  CommunicationLog,
  PainPoint,
} from '../types';
import api from '../lib/api';
import { eventService } from './eventService';

export const getRecentPatients = async (): Promise<Patient[]> => {
  const response = await api.get('/api/patients/recent');
  return response.data;
};

export const getAllPatients = async (): Promise<Patient[]> => {
  const response = await api.get('/api/patients/all');
  return response.data;
};

export const searchPatients = async (
  term: string
): Promise<PatientSummary[]> => {
  if (term.length < 2) return [];
  const response = await api.get(
    `/api/patients/search?term=${encodeURIComponent(term)}`
  );
  return response.data;
};

export const quickAddPatient = async (name: string): Promise<Patient> => {
  const response = await api.post('/api/patients/quick-add', { name });
  eventService.emit('patients:changed');
  return response.data;
};

export const getPatients = async ({
  limit = 15,
  cursor,
  searchTerm,
  statusFilter,
}: {
  limit?: number;
  cursor?: string | null;
  searchTerm?: string;
  statusFilter?: string;
}): Promise<{ patients: PatientSummary[]; nextCursor: string | null }> => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (cursor) params.append('cursor', cursor);
  if (searchTerm) params.append('searchTerm', searchTerm);
  if (statusFilter) params.append('statusFilter', statusFilter);

  const response = await api.get(`/api/patients?${params.toString()}`);
  return response.data;
};

export const getPatientById = async (
  id: string
): Promise<Patient | undefined> => {
  const response = await api.get(`/api/patients/${id}`);
  return response.data;
};

export const addPatient = async (
  patientData: Omit<Patient, 'id' | 'lastVisit'>
): Promise<Patient> => {
  const response = await api.post('/api/patients', patientData);
  eventService.emit('patients:changed');
  return response.data;
};

export const updatePatient = async (
  updatedPatient: Patient
): Promise<Patient> => {
  const response = await api.put(
    `/api/patients/${updatedPatient.id}`,
    updatedPatient
  );
  eventService.emit('patients:changed');
  return response.data;
};

export const addAttachment = async (
  patientId: string,
  file: File
): Promise<PatientAttachment> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(
    `/api/patients/${patientId}/attachments`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  eventService.emit('patients:changed');
  return response.data;
};

export const addCommunicationLog = async (
  patientId: string,
  log: Omit<CommunicationLog, 'id'>
): Promise<Patient> => {
  const response = await api.post(
    `/api/patients/${patientId}/communication-logs`,
    log
  );
  eventService.emit('patients:changed');
  return response.data;
};

export const savePainPoints = async (
  patientId: string,
  painPoints: PainPoint[]
): Promise<Patient> => {
  const response = await api.put(`/api/patients/${patientId}/pain-points`, {
    painPoints,
  });
  eventService.emit('patients:changed');
  return response.data;
};

// Default export
export const patientService = {
  getRecentPatients,
  getAllPatients,
  searchPatients,
  quickAddPatient,
  getPatients,
  getPatientById,
  addPatient,
  updatePatient,
  addAttachment,
  addCommunicationLog,
  savePainPoints
};

export default patientService;
