// services/acompanhamentoService.ts
import {
  Patient,
  Appointment,
  AppointmentStatus,
  AlertPatient,
} from '../types';
import { mockPatients } from '../data/mockData';
import * as treatmentService from './treatmentService';

interface CategorizedPatients {
  abandonment: AlertPatient[];
  highRisk: AlertPatient[];
  attention: AlertPatient[];
  regular: Patient[];
}

const hasFutureAppointment = (
  patientId: string,
  allAppointments: Appointment[]
): boolean => {
  const now = new Date();
  return allAppointments.some(
    app =>
      app.patientId === patientId &&
      app.startTime > now &&
      app.status === AppointmentStatus.Scheduled
  );
};

const getDaysSince = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getCategorizedPatients = async (
  allPatients: Patient[],
  allAppointments: Appointment[]
): Promise<CategorizedPatients> => {
  const categorized: CategorizedPatients = {
    abandonment: [],
    highRisk: [],
    attention: [],
    regular: [],
  };

  const patientIdsInAlerts = new Set<string>();
  const treatmentPlans = new Map<string, any>();

  for (const patient of allPatients) {
    if (patient.status !== 'Active') continue;

    const patientAppointments = allAppointments
      .filter(app => app.patientId === patient.id)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    // 1. Check for Abandonment (highest priority)
    const daysSinceLastVisit = getDaysSince(patient.lastVisit);
    if (
      daysSinceLastVisit > 7 &&
      !hasFutureAppointment(patient.id, allAppointments)
    ) {
      categorized.abandonment.push({
        ...patient,
        alertType: 'abandonment',
        alertReason: `Última visita há ${daysSinceLastVisit} dias, sem novo agendamento.`,
      });
      patientIdsInAlerts.add(patient.id);
      continue;
    }

    // 2. Check for High Risk
    const recentScheduled = patientAppointments
      .filter(app => app.startTime < new Date())
      .slice(0, 2);

    if (
      recentScheduled.length >= 2 &&
      recentScheduled.every(app => app.status === AppointmentStatus.NoShow)
    ) {
      categorized.highRisk.push({
        ...patient,
        alertType: 'highRisk',
        alertReason: `Faltou às últimas ${recentScheduled.length} consultas. Contato urgente.`,
      });
      patientIdsInAlerts.add(patient.id);
      continue;
    }

    // 3. Check for Attention Points
    if (!treatmentPlans.has(patient.id)) {
      treatmentPlans.set(
        patient.id,
        await treatmentService.getPlanByPatientId(patient.id)
      );
    }
    const plan = treatmentPlans.get(patient.id);

    if (plan) {
      const totalSessions = plan.durationWeeks * plan.frequencyPerWeek;
      const completedSessions = patientAppointments.filter(
        a => a.status === AppointmentStatus.Completed
      ).length;

      if (
        completedSessions >= totalSessions * 0.8 &&
        completedSessions < totalSessions
      ) {
        // Between 80% and 100% of plan
        categorized.attention.push({
          ...patient,
          alertType: 'attention',
          alertReason: `Próximo da alta (${completedSessions}/${totalSessions} sessões). Planejar próximos passos.`,
        });
        patientIdsInAlerts.add(patient.id);
        continue;
      }
    }
  }

  // 4. Regular Patients (everyone else active)
  allPatients.forEach(patient => {
    if (patient.status === 'Active' && !patientIdsInAlerts.has(patient.id)) {
      categorized.regular.push(patient);
    }
  });

  return categorized;
};
