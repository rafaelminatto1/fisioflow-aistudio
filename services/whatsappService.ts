// services/whatsappService.ts
import { Patient, Appointment, WhatsappMessage } from '../types';
import * as whatsappLogService from './whatsappLogService';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export interface SendMessageResult {
    success: boolean;
    fallbackInitiated: boolean;
}

/**
 * Simulates sending a WhatsApp message with a queue and fallback.
 */
export const sendMessage = async (
    patient: Patient, 
    content: string,
    type: WhatsappMessage['type']
): Promise<SendMessageResult> => {
    
    if (patient.whatsappConsent !== 'opt-in') {
        console.warn(`[WhatsApp SIM] Message blocked for ${patient.name} due to opt-out status.`);
        return { success: false, fallbackInitiated: false };
    }

    const message: WhatsappMessage = {
        id: `wapp_${Date.now()}`,
        patientId: patient.id,
        patientName: patient.name,
        phone: patient.phone,
        type,
        content,
        status: 'sending', // Start as 'sending' to simulate queue
        createdAt: new Date(),
    };
    
    await whatsappLogService.addLog(message);
    
    // Simulate queue and network delay
    await delay(1500 + Math.random() * 1000);

    const didFail = Math.random() < 0.1; // 10% failure rate for simulation

    if (didFail) {
        await whatsappLogService.updateLog(message.id, { status: 'failed' });
        console.log(`[SMS Fallback SIM] WhatsApp failed for ${patient.name}. Initiating SMS fallback.`);
        // In a real app, you would trigger the SMS service here.
        return { success: false, fallbackInitiated: true };
    }

    await whatsappLogService.updateLog(message.id, { status: 'sent' });
    await delay(500);
    await whatsappLogService.updateLog(message.id, { status: 'delivered' });
    
    console.log(`[WhatsApp SIM] Message sent to ${patient.name}: "${content}"`);
    
    // Simulate 'read' status after a while
    setTimeout(() => {
        whatsappLogService.updateLog(message.id, { status: 'read' });
    }, 5000 + Math.random() * 3000);

    return { success: true, fallbackInitiated: false };
};

/**
 * Sends a templated appointment confirmation message.
 */
export const sendAppointmentConfirmation = async (appointment: Appointment, patient: Patient): Promise<SendMessageResult> => {
    const date = appointment.startTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    const time = appointment.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const content = `Olá, ${patient.name.split(' ')[0]}! 👋 Sua consulta de ${appointment.type} foi confirmada para ${date} às ${time}. Mal podemos esperar para te ver! - Equipe FisioFlow`;
    
    return await sendMessage(patient, content, 'confirmation');
};

/**
 * Sends a templated appointment reminder message.
 */
export const sendAppointmentReminder = async (appointment: Appointment, patient: Patient, hoursBefore: number): Promise<SendMessageResult> => {
     const time = appointment.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const content = `Lembrete FisioFlow: Sua consulta é hoje às ${time}. Por favor, chegue com alguns minutos de antecedência. Até já!`;
    
    return await sendMessage(patient, content, 'reminder');
};

/**
 * Sends the Home Exercise Plan (HEP) to the patient.
 */
export const sendHep = async (patient: Patient, hepContent: string): Promise<SendMessageResult> => {
    const content = `Olá, ${patient.name.split(' ')[0]}! Seu fisioterapeuta enviou seu plano de exercícios. Acesse pelo portal ou veja o resumo:\n\n${hepContent}`;
    
    return await sendMessage(patient, content, 'hep');
};
