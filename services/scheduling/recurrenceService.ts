
import { Appointment } from '../../types';

/**
 * Generates an array of appointments based on a starting appointment and a recurrence rule.
 * If no recurrence rule is provided, it returns an array with just the single appointment.
 * @param initialAppointment The starting appointment object.
 * @returns An array of all generated appointments in the series.
 */
export const generateRecurrences = (initialAppointment: Appointment): Appointment[] => {
    const { recurrenceRule } = initialAppointment;

    if (!recurrenceRule || recurrenceRule.days.length === 0) {
        return [initialAppointment];
    }
    
    const seriesId = initialAppointment.seriesId || `series_${Date.now()}`;
    const appointments: Appointment[] = [];
    
    const untilDate = new Date(recurrenceRule.until);
    untilDate.setHours(23, 59, 59, 999); // Ensure we include the whole 'until' day
    
    const initialDate = new Date(initialAppointment.startTime);
    // Set to midnight to avoid time-related issues in date looping
    initialDate.setHours(0, 0, 0, 0);

    let currentDate = new Date(initialDate);

    while (currentDate <= untilDate) {
        if (recurrenceRule.days.includes(currentDate.getDay())) {
            // Check if we are creating an appointment on or after the initial date
            if (currentDate >= initialDate) {
                const startTime = new Date(currentDate);
                startTime.setHours(initialAppointment.startTime.getHours(), initialAppointment.startTime.getMinutes());
    
                const endTime = new Date(currentDate);
                endTime.setHours(initialAppointment.endTime.getHours(), initialAppointment.endTime.getMinutes());
    
                appointments.push({
                    ...initialAppointment,
                    id: `app_${seriesId}_${startTime.getTime()}`,
                    startTime,
                    endTime,
                    seriesId: seriesId, // Ensure all have the same series ID
                });
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return appointments;
};
