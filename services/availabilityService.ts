// services/availabilityService.ts
import { AvailabilityBlock } from '../types';

const getBlockForDate = (date: Date, title: string, startHour: number, endHour: number, therapistId: string): AvailabilityBlock => {
    const startTime = new Date(date);
    startTime.setHours(startHour, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(endHour, 0, 0, 0);
    return {
        id: `block_${therapistId}_${date.toISOString().split('T')[0]}_${title.toLowerCase()}`,
        therapistId,
        startTime,
        endTime,
        title,
    };
};

// Generate blocks for the next 30 days for demonstration
const generateMockBlocks = (): AvailabilityBlock[] => {
    const blocks: AvailabilityBlock[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        
        // Lunch break for all therapists on weekdays
        if (date.getDay() > 0 && date.getDay() < 6) {
             blocks.push(getBlockForDate(date, 'Almoço', 12, 13, 'therapist_1'));
             blocks.push(getBlockForDate(date, 'Almoço', 12, 13, 'therapist_2'));
             blocks.push(getBlockForDate(date, 'Almoço', 13, 14, 'therapist_3'));
        }
        
        // Team meeting every Wednesday
        if (date.getDay() === 3) {
             blocks.push(getBlockForDate(date, 'Reunião', 11, 12, 'therapist_1'));
             blocks.push(getBlockForDate(date, 'Reunião', 11, 12, 'therapist_2'));
             blocks.push(getBlockForDate(date, 'Reunião', 11, 12, 'therapist_3'));
        }
    }
    return blocks;
};

let availabilityBlocks: AvailabilityBlock[] = generateMockBlocks();

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getAvailabilityBlocks = async (): Promise<AvailabilityBlock[]> => {
    await delay(200);
    return [...availabilityBlocks];
};

export const saveAvailabilityBlock = async (blockData: AvailabilityBlock): Promise<AvailabilityBlock> => {
    await delay(300);
    const index = availabilityBlocks.findIndex(b => b.id === blockData.id);
    if (index > -1) {
        availabilityBlocks[index] = blockData;
    } else {
        availabilityBlocks.push(blockData);
    }
    return blockData;
};

export const deleteAvailabilityBlock = async (id: string): Promise<void> => {
    await delay(300);
    availabilityBlocks = availabilityBlocks.filter(b => b.id !== id);
};