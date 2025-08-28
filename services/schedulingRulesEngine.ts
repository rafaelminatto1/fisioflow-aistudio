// services/schedulingRulesEngine.ts
import { Appointment } from '../types';

// The new appointment from the form, before it's fully processed and saved.
// It lacks an ID and patientName, which are added/derived upon saving.
type NewAppointment = Omit<Appointment, 'id' | 'patientName'>;

/**
 * The result of the validation, containing warnings and suggestions.
 */
export interface ValidationResult {
  warnings: string[];
  suggestions: string[];
}

/**
 * Analyzes a new appointment against the patient's history and clinic rules.
 * @param newAppointment - The new appointment to be validated.
 * @param patientAppointments - A list of existing appointments for the patient (excluding the one being edited).
 * @returns A Promise that resolves with an object containing warnings and suggestions.
 */
export async function validateAppointment(
  newAppointment: NewAppointment,
  patientAppointments: Appointment[]
): Promise<ValidationResult> {
  const result: ValidationResult = {
    warnings: [],
    suggestions: [],
  };

  // Simulate a small async delay, like a quick DB check.
  await new Promise(resolve => setTimeout(resolve, 150));

  // --- RULE 1: Duplicate Booking Warning ---
  // Find any existing appointments scheduled for today or later.
  const futureAppointments = patientAppointments.filter(
    app => app.startTime >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  if (futureAppointments.length > 0) {
    // Sort to find the very next appointment to warn about.
    futureAppointments.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
    const nextAppointment = futureAppointments[0];
    const formattedDate = nextAppointment.startTime.toLocaleDateString(
      'pt-BR',
      { day: '2-digit', month: '2-digit' }
    );
    const formattedTime = nextAppointment.startTime.toLocaleTimeString(
      'pt-BR',
      { hour: '2-digit', minute: '2-digit' }
    );
    result.warnings.push(
      `Paciente já possui uma sessão futura agendada para ${formattedDate} às ${formattedTime}.`
    );
  }

  // --- RULE 2: Package Ending Suggestion ---
  const sessionNum = newAppointment.sessionNumber;
  const totalSessionsNum = newAppointment.totalSessions;
  if (sessionNum && totalSessionsNum && sessionNum === totalSessionsNum) {
    result.suggestions.push(
      'Esta é a última sessão do pacote. Lembre-se de discutir a renovação do tratamento com o paciente.'
    );
  }

  // --- RULE 3: First Appointment Suggestion ---
  if (patientAppointments.length === 0) {
    result.suggestions.push(
      'Primeiro agendamento do paciente. Recomenda-se definir o tipo como "Avaliação".'
    );
  }

  // --- RULE 4: Pending Payment Warning ---
  const hasPendingPayments = patientAppointments.some(
    app => app.paymentStatus === 'pending'
  );

  if (hasPendingPayments) {
    result.warnings.push(
      'Lembrete: O paciente possui pagamentos pendentes. Verifique a seção financeira.'
    );
  }

  return result;
}
