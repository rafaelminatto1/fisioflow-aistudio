import { Patient, PatientAttachment, PatientSummary, CommunicationLog, PainPoint } from '../types';
import { db } from './mockDb';
import { eventService } from './eventService';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getRecentPatients = async (): Promise<Patient[]> => {
    await delay(200);
    const patients = db.getPatients();
    return [...patients]
        .sort((a,b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime())
        .slice(0, 5);
}

export const getAllPatients = async (): Promise<Patient[]> => {
    await delay(500);
    const patients = db.getPatients();
    const sortedPatients = [...patients].sort((a,b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
    return sortedPatients;
};

export const searchPatients = async (term: string): Promise<PatientSummary[]> => {
    await delay(300);
    if (term.length < 2) return [];
    
    const lowerTerm = term.toLowerCase();
    const allPatients = db.getPatients();
    
    return allPatients
        .filter(p => p.name.toLowerCase().includes(lowerTerm) || p.cpf.includes(lowerTerm))
        .map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            status: p.status,
            lastVisit: p.lastVisit,
            avatarUrl: p.avatarUrl,
            cpf: p.cpf,
        }))
        .slice(0, 10); // Return top 10 matches
};

export const quickAddPatient = async (name: string): Promise<Patient> => {
    await delay(500);
    const newPatient: Patient = {
        id: `patient_${Date.now()}`,
        name: name.trim(),
        cpf: `TEMP-${Date.now()}`, // Temporary CPF
        birthDate: '',
        phone: '',
        email: '',
        emergencyContact: { name: '', phone: '' },
        address: { street: '', city: '', state: '', zip: '' },
        status: 'Active',
        lastVisit: new Date().toISOString(),
        registrationDate: new Date().toISOString(),
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
        consentGiven: true, // Assume consent for quick add, to be confirmed later
        whatsappConsent: 'opt-out',
    };
    db.addPatient(newPatient);
    eventService.emit('patients:changed');
    return newPatient;
};


export const getPatients = async ({ limit = 15, cursor, searchTerm, statusFilter }: {
    limit?: number;
    cursor?: string | null;
    searchTerm?: string;
    statusFilter?: string;
}): Promise<{ patients: PatientSummary[]; nextCursor: string | null }> => {
    await delay(500);

    let filteredPatients = db.getPatients();

    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredPatients = filteredPatients.filter(patient =>
            patient.name.toLowerCase().includes(lowerSearchTerm) ||
            patient.cpf.includes(lowerSearchTerm)
        );
    }

    if (statusFilter && statusFilter !== 'All') {
        const filterMap = {
            'Active': 'Active',
            'Inactive': 'Inactive',
            'Discharged': 'Discharged',
            'Ativo': 'Active',
            'Inativo': 'Inactive',
            'Alta': 'Discharged',
        };
        const internalStatus = filterMap[statusFilter as keyof typeof filterMap] || statusFilter;
        filteredPatients = filteredPatients.filter(patient => patient.status === internalStatus);
    }


    filteredPatients.sort((a, b) => {
        const dateA = new Date(a.registrationDate).getTime();
        const dateB = new Date(b.registrationDate).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return a.id.localeCompare(b.id);
    });

    const startIndex = cursor ? filteredPatients.findIndex(p => p.id === cursor) + 1 : 0;

    if (cursor && startIndex === 0) {
        return { patients: [], nextCursor: null };
    }

    const patientSlice = filteredPatients.slice(startIndex, startIndex + limit);
    
    const nextCursor = patientSlice.length === limit ? patientSlice[patientSlice.length - 1].id : null;

    const patientSummaries: PatientSummary[] = patientSlice.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        status: p.status,
        lastVisit: p.lastVisit,
        avatarUrl: p.avatarUrl,
        medicalAlerts: p.medicalAlerts,
    }));

    return { patients: patientSummaries, nextCursor };
};

export const getPatientById = async (id: string): Promise<Patient | undefined> => {
    await delay(300);
    return db.getPatientById(id);
};

export const addPatient = async (patientData: Omit<Patient, 'id' | 'lastVisit'>): Promise<Patient> => {
    await delay(400);
    const newPatient: Patient = {
        id: `patient_${Date.now()}`,
        ...patientData,
        lastVisit: new Date().toISOString(),
    };
    db.addPatient(newPatient);
    eventService.emit('patients:changed');
    return newPatient;
};

export const updatePatient = async (updatedPatient: Patient): Promise<Patient> => {
    await delay(400);
    db.updatePatient(updatedPatient);
    eventService.emit('patients:changed');
    return updatedPatient;
};

export const addAttachment = async (patientId: string, file: File): Promise<PatientAttachment> => {
    await delay(600);
    const patient = db.getPatientById(patientId);
    if (!patient) {
        throw new Error('Paciente não encontrado.');
    }

    const newAttachment: PatientAttachment = {
        name: file.name,
        url: '#',
        type: file.type,
        size: file.size,
    };

    const updatedPatient = {
        ...patient,
        attachments: [...(patient.attachments || []), newAttachment],
    };
    
    db.updatePatient(updatedPatient);
    eventService.emit('patients:changed');
    
    return newAttachment;
};

export const addCommunicationLog = async (patientId: string, log: Omit<CommunicationLog, 'id'>): Promise<Patient> => {
    await delay(200);
    const patient = db.getPatientById(patientId);
    if (!patient) {
        throw new Error('Paciente não encontrado.');
    }
    const newLog: CommunicationLog = {
        id: `log_${Date.now()}`,
        ...log
    };
    const updatedPatient = {
        ...patient,
        communicationLogs: [newLog, ...(patient.communicationLogs || [])],
    };
    
    db.updatePatient(updatedPatient);
    eventService.emit('patients:changed');
    
    return updatedPatient;
};

export const savePainPoints = async (patientId: string, painPoints: PainPoint[]): Promise<Patient> => {
    await delay(200);
    const patient = db.getPatientById(patientId);
    if (!patient) {
        throw new Error('Paciente não encontrado.');
    }
    
    const updatedPatient = {
        ...patient,
        painPoints,
    };
    
    db.updatePatient(updatedPatient);
    eventService.emit('patients:changed');
    
    return updatedPatient;
};