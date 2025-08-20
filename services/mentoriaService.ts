// services/mentoriaService.ts
import { Intern, EducationalCase, InternStatus } from '../types';
import { mockInterns, mockEducationalCases, mockTherapists } from '../data/mockData';

let interns: Intern[] = [...mockInterns];
let cases: EducationalCase[] = [...mockEducationalCases];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getMentoriaData = async (): Promise<{ interns: Intern[], cases: EducationalCase[] }> => {
    await delay(500);
    return {
        interns: [...interns].sort((a, b) => a.name.localeCompare(b.name)),
        cases: [...cases].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    };
};

export const saveIntern = async (internData: Omit<Intern, 'id' | 'avatarUrl'> & { id?: string }): Promise<Intern> => {
    await delay(400);
    if (internData.id) {
        // Update
        const index = interns.findIndex(i => i.id === internData.id);
        if (index > -1) {
            const updatedIntern = { ...interns[index], ...internData };
            interns[index] = updatedIntern;
            return updatedIntern;
        }
        throw new Error("Intern not found");
    } else {
        // Create
        const newIntern: Intern = {
            id: `intern_${Date.now()}`,
            ...internData,
            status: internData.status || InternStatus.Active,
            avatarUrl: `https://i.pravatar.cc/150?u=intern_${Date.now()}`
        };
        interns.unshift(newIntern);
        return newIntern;
    }
};

export const saveCase = async (caseData: Omit<EducationalCase, 'id' | 'createdAt' | 'createdBy'> & { id?: string }): Promise<EducationalCase> => {
    await delay(400);
    if (caseData.id) {
        const index = cases.findIndex(c => c.id === caseData.id);
        if (index > -1) {
            const updatedCase = { ...cases[index], ...caseData };
            cases[index] = updatedCase;
            return updatedCase;
        }
        throw new Error("Case not found");
    } else {
        // Create
        const newCase: EducationalCase = {
            id: `case_${Date.now()}`,
            ...caseData,
            createdBy: mockTherapists[0].name, // Mock creator
            createdAt: new Date().toISOString().split('T')[0],
        };
        cases.unshift(newCase);
        return newCase;
    }
};
