// services/acompanhamentoService.ts
import { Patient, Appointment, AppointmentStatus } from '../types';

interface CategorizedPatients {
    abandonment: Patient[];
    highRisk: Patient[];
    attention: Patient[];
    regular: Patient[];
}

const hasFutureAppointment = (patientId: string, allAppointments: Appointment[]): boolean => {
    const now = new Date();
    return allAppointments.some(app => 
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
    allAppointments: Appointment[],
): Promise<CategorizedPatients> => {

    const categorized: CategorizedPatients = {
        abandonment: [],
        highRisk: [],
        attention: [],
        regular: [],
    };

    const patientIdsInAlerts = new Set<string>();

    for (const patient of allPatients) {
        if (patient.status !== 'Active') continue;

        const patientAppointments = allAppointments.filter(app => app.patientId === patient.id)
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

        // 1. Check for Abandonment (highest priority)
        const daysSinceLastVisit = getDaysSince(patient.lastVisit);
        if (daysSinceLastVisit > 7 && !hasFutureAppointment(patient.id, allAppointments)) {
            categorized.abandonment.push(patient);
            patientIdsInAlerts.add(patient.id);
            continue; 
        }

        // 2. Check for Consecutive Absences
        const recentScheduled = patientAppointments
            .filter(app => app.startTime < new Date()) // only past/today appointments
            .slice(0, 3);
            
        if (recentScheduled.length >= 2 && recentScheduled.every(app => app.status === AppointmentStatus.NoShow)) {
            categorized.highRisk.push(patient);
            patientIdsInAlerts.add(patient.id);
            continue;
        }
        
        // Mock logic for "Nearing Discharge" and "Missed Discharge"
        if (patient.id === '1') { // Ana Beatriz Costa - Nearing discharge
             categorized.attention.push(patient);
             patientIdsInAlerts.add(patient.id);
             continue;
        }
        if (patient.id === '8') { // Júlia Pereira - Missed discharge
             categorized.highRisk.push(patient);
             patientIdsInAlerts.add(patient.id);
             continue;
        }
    }
    
    // 4. Regular Patients (active and have appointment in next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const regularPatientIds = new Set<string>();
    allAppointments.forEach(app => {
        if (app.startTime > new Date() && app.startTime <= sevenDaysFromNow && app.status === AppointmentStatus.Scheduled) {
            regularPatientIds.add(app.patientId);
        }
    });

    allPatients.forEach(patient => {
        if (patient.status === 'Active' && !patientIdsInAlerts.has(patient.id) && regularPatientIds.has(patient.id)) {
            categorized.regular.push(patient);
        }
    });


    return categorized;
};