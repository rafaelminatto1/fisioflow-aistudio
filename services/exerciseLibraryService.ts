// services/exerciseLibraryService.ts
import { ExerciseCategory, Protocol } from '../types';
import { mockExerciseGroups, mockProtocols } from '../data/mockExerciseLibrary';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getExerciseLibraryData = async (): Promise<{
  protocols: Protocol[];
  exerciseGroups: ExerciseCategory[];
}> => {
  await delay(500);
  return {
    protocols: mockProtocols,
    exerciseGroups: mockExerciseGroups,
  };
};
