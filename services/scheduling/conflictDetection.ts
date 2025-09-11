import { Appointment, Therapist } from '../../types';

/**
 * Checks if two appointments overlap in time.
 * @param a The first appointment.
 * @param b The second appointment.
 * @returns True if they overlap, false otherwise.
 */
const appointmentsOverlap = (a: Appointment, b: Appointment): boolean => {
  return a.startTime < b.endTime && a.endTime > b.startTime;
};

/**
 * Checks if an appointment is within business hours.
 * @param appointment The appointment to check.
 * @returns True if within business hours, false otherwise.
 */
export const isWithinBusinessHours = (appointment: Appointment): boolean => {
  const hour = appointment.startTime.getHours();
  const day = appointment.startTime.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Monday to Friday: 7:00 - 19:00
  if (day >= 1 && day <= 5) {
    return hour >= 7 && hour < 19;
  }
  
  // Saturday: 8:00 - 14:00
  if (day === 6) {
    return hour >= 8 && hour < 14;
  }
  
  // Sunday: closed
  return false;
};

/**
 * Checks if there's enough time between appointments for the same patient.
 * @param newAppointment The new appointment.
 * @param existingAppointments Existing appointments for the same patient.
 * @param minimumGapMinutes Minimum gap required between appointments (default: 60 minutes).
 * @returns True if there's enough gap, false otherwise.
 */
export const hasMinimumGapBetweenAppointments = (
  newAppointment: Appointment,
  existingAppointments: Appointment[],
  minimumGapMinutes: number = 60
): boolean => {
  const minimumGapMs = minimumGapMinutes * 60 * 1000;
  
  return !existingAppointments.some(existing => {
    if (existing.patientId !== newAppointment.patientId) return false;
    
    const timeBetween = Math.abs(
      newAppointment.startTime.getTime() - existing.endTime.getTime()
    );
    const timeBefore = Math.abs(
      existing.startTime.getTime() - newAppointment.endTime.getTime()
    );
    
    return Math.min(timeBetween, timeBefore) < minimumGapMs;
  });
};

/**
 * Checks if a therapist has too many appointments in a day.
 * @param therapistId The therapist ID.
 * @param appointmentDate The date to check.
 * @param existingAppointments All existing appointments.
 * @param maxAppointmentsPerDay Maximum appointments per day (default: 12).
 * @returns True if under the limit, false otherwise.
 */
export const isUnderDailyAppointmentLimit = (
  therapistId: string,
  appointmentDate: Date,
  existingAppointments: Appointment[],
  maxAppointmentsPerDay: number = 12
): boolean => {
  const dayStart = new Date(appointmentDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(appointmentDate);
  dayEnd.setHours(23, 59, 59, 999);
  
  const appointmentsOnDay = existingAppointments.filter(
    app => 
      app.therapistId === therapistId &&
      app.startTime >= dayStart &&
      app.startTime <= dayEnd
  );
  
  return appointmentsOnDay.length < maxAppointmentsPerDay;
};

/**
 * Finds the first conflict for a set of new appointments against existing ones.
 * @param newAppointments An array of new appointments to check.
 * @param existingAppointments All appointments currently in the system.
 * @param ignoreId An optional ID of an appointment to ignore (used when editing).
 * @returns The conflicting appointment if one is found, otherwise undefined.
 */
export const findConflict = (
  newAppointments: Appointment[],
  existingAppointments: Appointment[],
  ignoreId?: string
): Appointment | undefined => {
  const relevantAppointments = existingAppointments.filter(
    app => app.id !== ignoreId
  );

  for (const newApp of newAppointments) {
    const conflict = relevantAppointments.find(existingApp => {
      // Check for conflict only if it's the same therapist
      if (newApp.therapistId === existingApp.therapistId) {
        return appointmentsOverlap(newApp, existingApp);
      }
      return false;
    });

    if (conflict) {
      return conflict;
    }
  }

  return undefined;
};
