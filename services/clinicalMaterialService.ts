
// services/clinicalMaterialService.ts
import { mockMaterialCategories } from '../data/mockClinicalMaterials';
import { Material, MaterialCategory } from '../types';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export interface MaterialDetails extends Material {
    category: MaterialCategory;
}

export const getMaterialById = async (id: string): Promise<MaterialDetails | undefined> => {
    await delay(100);
    for (const category of mockMaterialCategories) {
        const material = category.materials.find(m => m.id === id);
        if (material) {
            return { ...material, category };
        }
    }
    return undefined;
};
