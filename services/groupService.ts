
import { Group } from '../types';
import { mockGroups } from '../data/mockData';

let groups: Group[] = [...mockGroups];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getGroups = async (): Promise<Group[]> => {
    await delay(500);
    return [...groups].sort((a, b) => a.name.localeCompare(b.name));
};

export const getGroupById = async (id: string): Promise<Group | undefined> => {
    await delay(300);
    return groups.find(g => g.id === id);
};

export const saveGroup = async (groupData: Omit<Group, 'id' | 'capacity' | 'status'> & { id?: string }): Promise<Group> => {
    await delay(400);
    if (groupData.id) {
        // Update
        const existingGroup = groups.find(g => g.id === groupData.id)!;
        const updatedGroup: Group = { 
            ...existingGroup, 
            ...groupData,
            capacity: {
                ...existingGroup.capacity,
                current: groupData.members.length,
            }
        };
        groups = groups.map(g => (g.id === groupData.id ? updatedGroup : g));
        return updatedGroup;
    } else {
        // Create
        const newGroup: Group = {
            id: `group_${Date.now()}`,
            ...groupData,
            capacity: {
                max: 8, // Default max
                current: groupData.members.length,
            },
            status: 'active',
        };
        groups.unshift(newGroup);
        return newGroup;
    }
};