import {
  Patient,
  PatientAttachment,
  PatientSummary,
  CommunicationLog,
  PainPoint,
} from '../types';
import api from '../lib/api';
import { eventService } from './eventService';

/**
 * Busca os pacientes mais recentes.
 * @returns {Promise<Patient[]>} Uma lista de pacientes recentes.
 */
export const getRecentPatients = async (): Promise<Patient[]> => {
  const response = await api.get('/api/patients/recent');
  return response.data;
};

/**
 * Busca todos os pacientes.
 * @returns {Promise<Patient[]>} Uma lista de todos os pacientes.
 */
export const getAllPatients = async (): Promise<Patient[]> => {
  const response = await api.get('/api/patients/all');
  return response.data;
};

/**
 * Busca pacientes por um termo de pesquisa.
 * @param {string} term - O termo a ser pesquisado.
 * @returns {Promise<PatientSummary[]>} Uma lista de resumos de pacientes que correspondem ao termo.
 */
export const searchPatients = async (
  term: string
): Promise<PatientSummary[]> => {
  if (term.length < 2) return [];
  const response = await api.get(
    `/api/patients/search?term=${encodeURIComponent(term)}`
  );
  return response.data;
};

/**
 * Adiciona um novo paciente rapidamente, apenas com o nome.
 * @param {string} name - O nome do paciente.
 * @returns {Promise<Patient>} O objeto do paciente criado.
 */
export const quickAddPatient = async (name: string): Promise<Patient> => {
  const response = await api.post('/api/patients/quick-add', { name });
  eventService.emit('patients:changed');
  return response.data;
};

/**
 * Busca uma lista paginada de pacientes com filtros.
 * @param {object} params - Parâmetros de busca e paginação.
 * @param {number} [params.limit=15] - O número de pacientes a serem retornados.
 * @param {string | null} [params.cursor] - O cursor para a próxima página de resultados.
 * @param {string} [params.searchTerm] - O termo de busca.
 * @param {string} [params.statusFilter] - O filtro de status.
 * @returns {Promise<{ patients: PatientSummary[]; nextCursor: string | null }>} Um objeto com a lista de pacientes e o próximo cursor.
 */
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

/**
 * Busca um paciente pelo seu ID.
 * @param {string} id - O ID do paciente.
 * @returns {Promise<Patient | undefined>} O objeto do paciente ou undefined se não encontrado.
 */
export const getPatientById = async (
  id: string
): Promise<Patient | undefined> => {
  const response = await api.get(`/api/patients/${id}`);
  return response.data;
};

/**
 * Adiciona um novo paciente com dados completos.
 * @param {Omit<Patient, 'id' | 'lastVisit'>} patientData - Os dados do paciente a serem adicionados.
 * @returns {Promise<Patient>} O objeto do paciente criado.
 */
export const addPatient = async (
  patientData: Omit<Patient, 'id' | 'lastVisit'>
): Promise<Patient> => {
  const response = await api.post('/api/patients', patientData);
  eventService.emit('patients:changed');
  return response.data;
};

/**
 * Atualiza os dados de um paciente existente.
 * @param {Patient} updatedPatient - O objeto do paciente com os dados atualizados.
 * @returns {Promise<Patient>} O objeto do paciente atualizado.
 */
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

/**
 * Adiciona um anexo ao prontuário de um paciente.
 * @param {string} patientId - O ID do paciente.
 * @param {File} file - O arquivo a ser anexado.
 * @returns {Promise<PatientAttachment>} O objeto do anexo criado.
 */
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

/**
 * Adiciona um registro de comunicação ao prontuário de um paciente.
 * @param {string} patientId - O ID do paciente.
 * @param {Omit<CommunicationLog, 'id'>} log - O registro de comunicação a ser adicionado.
 * @returns {Promise<Patient>} O objeto do paciente atualizado.
 */
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

/**
 * Salva os pontos de dor de um paciente.
 * @param {string} patientId - O ID do paciente.
 * @param {PainPoint[]} painPoints - A lista de pontos de dor.
 * @returns {Promise<Patient>} O objeto do paciente atualizado.
 */
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

/**
 * Objeto que agrupa todos os métodos do serviço de pacientes.
 * @namespace patientService
 */
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
