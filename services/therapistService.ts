import { Therapist } from '../types';
import { mockTherapists } from '../data/mockData';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getTherapists = async (): Promise<Therapist[]> => {
  await delay(200);
  return [...mockTherapists];
};
