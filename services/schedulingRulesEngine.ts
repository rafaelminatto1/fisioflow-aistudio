// services/schedulingRulesEngine.ts
import { Appointment } from '../types';
import { 
  isWithinBusinessHours, 
  hasMinimumGapBetweenAppointments, 
  isUnderDailyAppointmentLimit 
} from './scheduling/conflictDetection';

// The new appointment from the form, before it's fully processed and saved.
// It lacks an ID and patientName, which are added/derived upon saving.
type NewAppointment = Omit<Appointment, 'id' | 'patientName'>;

/**
 * The result of the validation, containing warnings and suggestions.
 */
export interface ValidationResult {
  warnings: string[];
  suggestions: string[];
  errors: string[];
  isValid: boolean;
}

/**
 * Configuration for scheduling rules.
 */
export interface SchedulingConfig {
  minimumGapBetweenAppointments: number; // minutes
  maxAppointmentsPerDay: number;
  allowWeekendAppointments: boolean;
  requireBusinessHours: boolean;
  maxAdvanceBookingDays: number;
}

const defaultConfig: SchedulingConfig = {
  minimumGapBetweenAppointments: 60,
  maxAppointmentsPerDay: 12,
  allowWeekendAppointments: true,
  requireBusinessHours: true,
  maxAdvanceBookingDays: 90,
};

/**
 * Analyzes a new appointment against the patient's history and clinic rules.
 * @param newAppointment - The new appointment to be validated.
 * @param patientAppointments - A list of existing appointments for the patient (excluding the one being edited).
 * @param allAppointments - All appointments in the system for conflict detection.
 * @param config - Configuration for scheduling rules.
 * @returns A Promise that resolves with an object containing warnings, suggestions, and errors.
 */
export async function validateAppointment(
  newAppointment: NewAppointment,
  patientAppointments: Appointment[],
  allAppointments: Appointment[] = [],
  config: SchedulingConfig = defaultConfig
): Promise<ValidationResult> {
  const result: ValidationResult = {
    warnings: [],
    suggestions: [],
    errors: [],
    isValid: true,
  };

  // Simulate a small async delay, like a quick DB check.
  await new Promise(resolve => setTimeout(resolve, 150));

  // Create a temporary appointment object for validation
  const tempAppointment: Appointment = {
    ...newAppointment,
    id: 'temp-id',
    patientName: 'temp-name',
  };

  // --- CRITICAL VALIDATIONS (ERRORS) ---
  
  // Check if appointment is in the past
  const now = new Date();
  if (newAppointment.startTime < now) {
    result.errors.push('Não é possível agendar para uma data/hora no passado.');
    result.isValid = false;
  }

  // Check business hours
  if (config.requireBusinessHours && !isWithinBusinessHours(tempAppointment)) {
    const day = newAppointment.startTime.getDay();
    if (day === 0) {
      result.errors.push('A clínica não funciona aos domingos.');
    } else if (day === 6) {
      result.errors.push('Aos sábados, a clínica funciona apenas das 8:00 às 14:00.');
    } else {
      result.errors.push('Horário fora do funcionamento da clínica (7:00 às 19:00).');
    }
    result.isValid = false;
  }

  // Check maximum advance booking
  const maxAdvanceDate = new Date();
  maxAdvanceDate.setDate(maxAdvanceDate.getDate() + config.maxAdvanceBookingDays);
  if (newAppointment.startTime > maxAdvanceDate) {
    result.errors.push(`Não é possível agendar com mais de ${config.maxAdvanceBookingDays} dias de antecedência.`);
    result.isValid = false;
  }

  // Check daily appointment limit for therapist
  if (!isUnderDailyAppointmentLimit(
    newAppointment.therapistId,
    newAppointment.startTime,
    allAppointments,
    config.maxAppointmentsPerDay
  )) {
    result.errors.push(`O fisioterapeuta já atingiu o limite de ${config.maxAppointmentsPerDay} atendimentos por dia.`);
    result.isValid = false;
  }

  // --- WARNINGS ---

  // Check minimum gap between appointments for same patient
  if (!hasMinimumGapBetweenAppointments(
    tempAppointment,
    allAppointments,
    config.minimumGapBetweenAppointments
  )) {
    result.warnings.push(
      `Recomenda-se um intervalo mínimo de ${config.minimumGapBetweenAppointments} minutos entre sessões do mesmo paciente.`
    );
  }

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

  // Check for appointments too close in time
  const sameDay = new Date(newAppointment.startTime);
  sameDay.setHours(0, 0, 0, 0);
  const nextDay = new Date(sameDay);
  nextDay.setDate(nextDay.getDate() + 1);
  
  const appointmentsOnSameDay = patientAppointments.filter(
    app => app.startTime >= sameDay && app.startTime < nextDay
  );
  
  if (appointmentsOnSameDay.length > 0) {
    result.warnings.push(
      'Paciente já possui outro agendamento no mesmo dia. Verifique se é necessário.'
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

  // --- ADDITIONAL SUGGESTIONS ---
  
  // Suggest optimal appointment times
  const hour = newAppointment.startTime.getHours();
  if (hour < 9) {
    result.suggestions.push(
      'Agendamento matinal: Ideal para pacientes que preferem horários mais cedo.'
    );
  } else if (hour >= 17) {
    result.suggestions.push(
      'Agendamento no final do dia: Verifique se há tempo suficiente para limpeza e organização.'
    );
  }

  // Weekend appointment suggestion
  const dayOfWeek = newAppointment.startTime.getDay();
  if (dayOfWeek === 6) {
    result.suggestions.push(
      'Agendamento de sábado: Lembre-se de que o horário de funcionamento é reduzido (8:00-14:00).'
    );
  }

  // Frequency analysis
  const recentAppointments = patientAppointments.filter(
    app => {
      const daysDiff = (newAppointment.startTime.getTime() - app.startTime.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff <= 30;
    }
  );

  if (recentAppointments.length >= 8) {
    result.suggestions.push(
      'Paciente com alta frequência de sessões. Considere avaliar a evolução do tratamento.'
    );
  } else if (recentAppointments.length === 0 && patientAppointments.length > 0) {
    const lastAppointment = patientAppointments
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];
    const daysSinceLastAppointment = Math.floor(
      (newAppointment.startTime.getTime() - lastAppointment.startTime.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastAppointment > 30) {
      result.suggestions.push(
        `Paciente retornando após ${daysSinceLastAppointment} dias. Considere uma reavaliação.`
      );
    }
  }

  // Treatment type suggestions
  if (newAppointment.type === 'Avaliação' && patientAppointments.length > 0) {
    result.suggestions.push(
      'Nova avaliação para paciente existente. Verifique se é uma reavaliação ou mudança de tratamento.'
    );
  }

  return result;
}

/**
 * Quick validation for basic appointment conflicts.
 * @param newAppointment The new appointment to validate.
 * @param existingAppointments All existing appointments.
 * @param ignoreId Optional ID to ignore (for editing).
 * @returns Simple validation result.
 */
export const quickValidateAppointment = (
  newAppointment: NewAppointment,
  existingAppointments: Appointment[],
  ignoreId?: string
): { isValid: boolean; message?: string } => {
  // Check for past appointments
  if (newAppointment.startTime < new Date()) {
    return { isValid: false, message: 'Não é possível agendar no passado.' };
  }

  // Check for basic business hours
  const hour = newAppointment.startTime.getHours();
  const day = newAppointment.startTime.getDay();
  
  if (day === 0) {
    return { isValid: false, message: 'Clínica fechada aos domingos.' };
  }
  
  if (day === 6 && (hour < 8 || hour >= 14)) {
    return { isValid: false, message: 'Sábados: funcionamento das 8:00 às 14:00.' };
  }
  
  if (day >= 1 && day <= 5 && (hour < 7 || hour >= 19)) {
    return { isValid: false, message: 'Horário de funcionamento: 7:00 às 19:00.' };
  }

  return { isValid: true };
};
