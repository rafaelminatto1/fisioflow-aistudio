import { Appointment } from '../../types';

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
    const relevantAppointments = existingAppointments.filter(app => app.id !== ignoreId);

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
