

// services/notificationService.ts
import { Notification, User, Role, AppointmentStatus } from '../src/types';
import { mockNotifications, mockAppointments, mockUsers, mockPatients } from '../data/mockData';
import * as treatmentService from './treatmentService';
import * as whatsappService from './whatsappService';

let notifications: Notification[] = [...mockNotifications];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const generateRemindersIfNeeded = async (user: User | null): Promise<void> => {
    if (!user) return;

    const todayStr = new Date().toDateString();

    // --- Therapist In-App and Patient WhatsApp Appointment Reminders ---
    if (user.role === Role.Therapist || user.role === Role.Admin) {
        const reminderKey = `appointment_reminder_sent_${user.id}_${todayStr}`;
        if (sessionStorage.getItem(reminderKey)) return;

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);

        const upcomingAppointments = mockAppointments.filter(app => {
            const appDate = app.startTime;
            return (
                app.therapistId === user.id &&
                (appDate.toDateString() === now.toDateString() || appDate.toDateString() === tomorrow.toDateString()) &&
                app.status === AppointmentStatus.Scheduled
            );
        });
        
        // In-app reminders for therapists
        upcomingAppointments.forEach(app => {
             const reminderExists = notifications.some(n => 
                n.userId === user.id &&
                n.type === 'appointment_reminder' &&
                n.message.includes(app.patientName) &&
                n.message.includes(app.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
             );

             if (!reminderExists) {
                  const when = app.startTime.toDateString() === now.toDateString() ? 'hoje' : 'amanhã';
                  const newNotification: Notification = {
                      id: `notif_appt_${app.id}`,
                      userId: user.id,
                      message: `Lembrete: Consulta com ${app.patientName} ${when} às ${app.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`,
                      isRead: false,
                      createdAt: new Date(),
                      type: 'appointment_reminder',
                  };
                  notifications.unshift(newNotification);
             }
        });

        // WhatsApp reminders for patients (for today's appointments)
        const todaysAppointmentsForWhatsapp = upcomingAppointments.filter(app => app.startTime.toDateString() === todayStr && app.startTime > now);
        for (const app of todaysAppointmentsForWhatsapp) {
            const patient = mockPatients.find(p => p.id === app.patientId);
            if (patient) {
                await whatsappService.sendAppointmentReminder(app, patient, 0); 
            }
        }
        
        if (upcomingAppointments.length > 0) {
             sessionStorage.setItem(reminderKey, 'true');
        }
    }
    
    // --- Patient In-App Exercise Reminders ---
    if (user.role === Role.Patient && user.patientId) {
        const reminderKey = `exercise_reminder_sent_${user.id}_${todayStr}`;
        if (sessionStorage.getItem(reminderKey)) return;

        const plan = await treatmentService.getPlanByPatientId(user.patientId);
        if (plan && plan.exercises && plan.exercises.length > 0) {
            const newNotification: Notification = {
                id: `notif_ex_${Date.now()}`,
                userId: user.id,
                message: 'Lembrete diário: Não se esqueça de fazer seus exercícios de hoje para acelerar sua recuperação!',
                isRead: false,
                createdAt: new Date(),
                type: 'exercise_reminder',
            };
            notifications.unshift(newNotification);
            sessionStorage.setItem(reminderKey, 'true');
        }
    }
};

export const getNotifications = async (userId: string): Promise<Notification[]> => {
    await delay(300);
    return [...notifications]
        .filter(n => n.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const markAsRead = async (notificationId: string, userId: string): Promise<Notification | undefined> => {
    await delay(100);
    const notification = notifications.find(n => n.id === notificationId && n.userId === userId);
    if (notification) {
        notification.isRead = true;
    }
    return notification;
};

export const markAllAsRead = async (userId: string): Promise<Notification[]> => {
    await delay(200);
    const userNotifications = notifications.filter(n => n.userId === userId);
    userNotifications.forEach(n => n.isRead = true);
    return userNotifications;
};

export const sendBroadcast = async (message: string, targetGroup: Role): Promise<void> => {
    await delay(500);
    const targetUsers = mockUsers.filter(u => u.role === targetGroup);
    
    targetUsers.forEach(user => {
        const newNotification: Notification = {
            id: `notif_${Date.now()}_${user.id}`,
            userId: user.id,
            message: `Comunicado: ${message}`,
            isRead: false,
            createdAt: new Date(),
            type: 'announcement',
        };
        notifications.unshift(newNotification);
    });
};
