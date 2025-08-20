// services/whatsappLogService.ts
import { WhatsappMessage } from '../types';

const LOG_KEY = 'fisioflow_whatsapp_log';

const getLogsFromStorage = (): WhatsappMessage[] => {
    const data = sessionStorage.getItem(LOG_KEY);
    if (data) {
        const parsed = JSON.parse(data);
        return parsed.map((log: any) => ({ ...log, createdAt: new Date(log.createdAt) }));
    }
    return [];
};

const saveLogsToStorage = (logs: WhatsappMessage[]) => {
    sessionStorage.setItem(LOG_KEY, JSON.stringify(logs));
};

export const getLogs = async (): Promise<WhatsappMessage[]> => {
    await new Promise(res => setTimeout(res, 300)); // Simulate delay
    const logs = getLogsFromStorage();
    return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const addLog = async (message: WhatsappMessage): Promise<void> => {
    const logs = getLogsFromStorage();
    logs.unshift(message);
    saveLogsToStorage(logs);
};

export const updateLog = async (messageId: string, updates: Partial<WhatsappMessage>): Promise<void> => {
    const logs = getLogsFromStorage();
    const index = logs.findIndex(log => log.id === messageId);
    if (index > -1) {
        logs[index] = { ...logs[index], ...updates };
        saveLogsToStorage(logs);
    }
};
