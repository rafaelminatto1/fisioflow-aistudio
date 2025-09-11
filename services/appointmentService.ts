import { Appointment } from '../types';
import { db } from './mockDb';
import { eventService } from './eventService';
import { mockPatients } from '../data/mockData';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Busca agendamentos, opcionalmente filtrando por um intervalo de datas.
 * @param {Date} [startDate] - A data de início do intervalo.
 * @param {Date} [endDate] - A data de fim do intervalo.
 * @returns {Promise<Appointment[]>} Uma lista de agendamentos.
 */
export const getAppointments = async (
  startDate?: Date,
  endDate?: Date
): Promise<Appointment[]> => {
  await delay(500);
  const appointments = db.getAppointments();

  if (startDate && endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    return [...appointments].filter(app => {
      const appTime = app.startTime.getTime();
      return appTime >= startDate.getTime() && appTime <= endOfDay.getTime();
    });
  }

  return [...appointments];
};

/**
 * Busca todos os agendamentos de um paciente específico, ordenados por data decrescente.
 * @param {string} patientId - O ID do paciente.
 * @returns {Promise<Appointment[]>} Uma lista de agendamentos do paciente.
 */
export const getAppointmentsByPatientId = async (
  patientId: string
): Promise<Appointment[]> => {
  await delay(300);
  return db
    .getAppointments()
    .filter(a => a.patientId === patientId)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
};

/**
 * Salva um novo agendamento ou atualiza um existente.
 * @param {Appointment} appointmentData - Os dados do agendamento a serem salvos.
 * @returns {Promise<Appointment>} O agendamento salvo.
 */
export const saveAppointment = async (
  appointmentData: Appointment
): Promise<Appointment> => {
  await delay(400);
  const patient = mockPatients.find(p => p.id === appointmentData.patientId);
  const fullAppointmentData = {
    ...appointmentData,
    patientAvatarUrl: patient?.avatarUrl || '',
  };

  db.saveAppointment(fullAppointmentData);
  eventService.emit('appointments:changed');
  return fullAppointmentData;
};

/**
 * Exclui um agendamento específico.
 * @param {string} id - O ID do agendamento a ser excluído.
 * @returns {Promise<void>}
 */
export const deleteAppointment = async (id: string): Promise<void> => {
  await delay(400);
  db.deleteAppointment(id);
  eventService.emit('appointments:changed');
};

/**
 * Exclui uma série de agendamentos a partir de uma data específica.
 * @param {string} seriesId - O ID da série de agendamentos.
 * @param {Date} fromDate - A data a partir da qual os agendamentos devem ser excluídos.
 * @returns {Promise<void>}
 */
export const deleteAppointmentSeries = async (
  seriesId: string,
  fromDate: Date
): Promise<void> => {
  await delay(400);
  db.deleteAppointmentSeries(seriesId, fromDate);
  eventService.emit('appointments:changed');
};
