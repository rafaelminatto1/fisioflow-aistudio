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
        // Ensure even single appointments have the right structure if they become recurring later
        const singleAppointment = { ...initialAppointment };
        delete singleAppointment.recurrenceRule; // Not part of a series
        return [singleAppointment];
    }
    
    const seriesId = initialAppointment.seriesId || `series_${Date.now()}`;
    const appointments: Appointment[] = [];
    
    const untilDate = new Date(recurrenceRule.until);
    untilDate.setHours(23, 59, 59, 999); // Ensure we include the whole 'until' day
    
    let currentDate = new Date(initialAppointment.startTime);
    currentDate.setHours(0, 0, 0, 0); // Start iterating from the beginning of the day

    const duration = initialAppointment.endTime.getTime() - initialAppointment.startTime.getTime();

    while (currentDate <= untilDate) {
        if (recurrenceRule.days.includes(currentDate.getDay())) {
            // Create appointment only if it's on or after the intended start date
            if (currentDate.getTime() >= new Date(initialAppointment.startTime).setHours(0,0,0,0)) {
                const startTime = new Date(currentDate);
                startTime.setHours(initialAppointment.startTime.getHours(), initialAppointment.startTime.getMinutes());
    
                const endTime = new Date(startTime.getTime() + duration);
    
                appointments.push({
                    ...initialAppointment,
                    id: `app_recurr_${seriesId}_${startTime.getTime()}`, // Unique ID for each instance
                    startTime,
                    endTime,
                    seriesId: seriesId,
                });
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return appointments;
};
