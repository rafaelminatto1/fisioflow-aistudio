// services/mockDb.ts
import {
  Patient,
  Appointment,
  SoapNote,
  TreatmentPlan,
  ExercisePrescription,
} from '../types';
import {
  mockPatients,
  mockAppointments,
  mockSoapNotes,
  mockTreatmentPlans,
  mockExercisePrescriptions,
} from '../data/mockData';

// Create mutable copies of the mock data to act as our "database"
let patients = [...mockPatients];
let appointments = [...mockAppointments];
let soapNotes = [...mockSoapNotes];
let treatmentPlans = [...mockTreatmentPlans];
let exercisePrescriptions = [...mockExercisePrescriptions];

// A central place to manage all mock data, ensuring consistency.
export const db = {
  // Patients
  getPatients: (): Patient[] => [...patients],
  getPatientById: (id: string): Patient | undefined =>
    patients.find(p => p.id === id),
  addPatient: (patient: Patient): void => {
    patients.unshift(patient);
  },
  updatePatient: (updatedPatient: Patient): void => {
    patients = patients.map(p =>
      p.id === updatedPatient.id ? updatedPatient : p
    );
  },

  // Appointments
  getAppointments: (): Appointment[] => [...appointments],
  saveAppointment: (appointmentData: Appointment): void => {
    const index = appointments.findIndex(a => a.id === appointmentData.id);
    if (index > -1) {
      appointments[index] = appointmentData;
    } else {
      appointments.push(appointmentData);
    }
  },
  deleteAppointment: (id: string): void => {
    appointments = appointments.filter(a => a.id !== id);
  },
  deleteAppointmentSeries: (seriesId: string, fromDate: Date): void => {
    appointments = appointments.filter(
      a => !(a.seriesId === seriesId && a.startTime >= fromDate)
    );
  },

  // SoapNotes
  getSoapNotes: (): SoapNote[] => [...soapNotes],
  saveSoapNote: (note: SoapNote): void => {
    const index = soapNotes.findIndex(n => n.id === note.id);
    if (index > -1) {
      soapNotes[index] = note;
    } else {
      soapNotes.unshift(note);
    }
  },

  // Treatment Plans
  getTreatmentPlans: (): TreatmentPlan[] => [...treatmentPlans],
  updateTreatmentPlan: (updatedPlan: TreatmentPlan): void => {
    const index = treatmentPlans.findIndex(p => p.id === updatedPlan.id);
    if (index > -1) {
      treatmentPlans[index] = updatedPlan;
    }
  },

  // Exercise Prescriptions
  getExercisePrescriptions: (): ExercisePrescription[] => [
    ...exercisePrescriptions,
  ],
  setExercisePrescriptionsForPlan: (
    planId: string,
    newExercises: ExercisePrescription[]
  ): void => {
    // Remove old and add new
    exercisePrescriptions = exercisePrescriptions.filter(
      ex => ex.treatmentPlanId !== planId
    );
    exercisePrescriptions.push(...newExercises);
  },
};
