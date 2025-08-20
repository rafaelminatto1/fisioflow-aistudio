// services/schedulingSettingsService.ts
import { SchedulingSettings, Appointment, AppointmentType } from '../types';

const SETTINGS_KEY = 'fisioflow_scheduling_settings';

const DEFAULT_SETTINGS: SchedulingSettings = {
    limits: {
        weekday: [
            { id: 'wd1', startTime: '07:00', endTime: '13:00', limit: 3 },
            { id: 'wd2', startTime: '13:00', endTime: '15:00', limit: 1 },
            { id: 'wd3', startTime: '15:00', endTime: '21:00', limit: 4 },
        ],
        saturday: [
            { id: 'sat1', startTime: '07:00', endTime: '13:00', limit: 3 },
        ],
    },
    maxEvaluationsPerSlot: 1,
};

class SchedulingSettingsService {
    getSettings(): SchedulingSettings {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error("Failed to parse scheduling settings from localStorage", error);
        }
        return DEFAULT_SETTINGS;
    }

    saveSettings(settings: SchedulingSettings): void {
        try {
            // Sort rules by start time before saving
            settings.limits.weekday.sort((a, b) => a.startTime.localeCompare(b.startTime));
            settings.limits.saturday.sort((a, b) => a.startTime.localeCompare(b.startTime));
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save scheduling settings to localStorage", error);
        }
    }

    getSlotOccupancy(date: Date, allAppointments: Appointment[], ignoreId?: string) {
        const settings = this.getSettings();
        const day = date.getDay();
        const time = date.toTimeString().slice(0, 5);
    
        const isSaturday = day === 6;
        const rules = isSaturday ? settings.limits.saturday : settings.limits.weekday;
        const rule = rules.find(r => time >= r.startTime && time < r.endTime) || { limit: 0 };
    
        const appointmentsInSlot = allAppointments.filter(app => {
            if (ignoreId && app.id === ignoreId) return false;
            return app.startTime.getTime() === date.getTime();
        });
        
        const evaluationsInSlot = appointmentsInSlot.filter(app => app.type === AppointmentType.Evaluation);
    
        const isPatientLimitFull = appointmentsInSlot.length >= rule.limit;
        const isEvalLimitFull = evaluationsInSlot.length >= settings.maxEvaluationsPerSlot;

        return {
            patientCount: appointmentsInSlot.length,
            patientLimit: rule.limit,
            evalCount: evaluationsInSlot.length,
            evalLimit: settings.maxEvaluationsPerSlot,
            isFull: rule.limit === 0 || isPatientLimitFull,
            isPatientLimitFull: rule.limit === 0 || isPatientLimitFull,
            isEvalLimitFull,
        };
    }
}

export const schedulingSettingsService = new SchedulingSettingsService();