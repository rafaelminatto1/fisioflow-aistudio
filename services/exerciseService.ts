// services/exerciseService.ts
import { Exercise } from '../types';
import { mockExercises } from '../data/mockData';

let exercises: Exercise[] = [...mockExercises];
// Derive initial categories from the data, ensuring uniqueness and sorting
let categories: string[] = Array.from(
  new Set(mockExercises.map(ex => ex.category))
).sort();

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getExerciseData = async (): Promise<{
  exercises: Exercise[];
  categories: string[];
}> => {
  await delay(500);
  return {
    exercises: [...exercises].sort((a, b) => a.name.localeCompare(b.name)),
    categories: [...categories],
  };
};

export const getExerciseByName = async (
  name: string
): Promise<Exercise | undefined> => {
  await delay(50); // a quick lookup
  return exercises.find(ex => ex.name.toLowerCase() === name.toLowerCase());
};

export const addExercise = async (
  exerciseData: Omit<Exercise, 'id'>
): Promise<Exercise> => {
  await delay(400);
  const newExercise: Exercise = {
    id: `ex_${Date.now()}`,
    ...exerciseData,
  };
  if (!categories.includes(newExercise.category)) {
    categories.push(newExercise.category);
    categories.sort();
  }
  exercises.unshift(newExercise);
  return newExercise;
};

export const updateExercise = async (
  updatedExercise: Exercise
): Promise<Exercise> => {
  await delay(400);
  exercises = exercises.map(ex =>
    ex.id === updatedExercise.id ? updatedExercise : ex
  );
  // Add new category if it doesn't exist from an edit
  if (!categories.includes(updatedExercise.category)) {
    categories.push(updatedExercise.category);
    categories.sort();
  }
  return updatedExercise;
};

export const deleteExercise = async (id: string): Promise<void> => {
  await delay(400);
  exercises = exercises.filter(ex => ex.id !== id);
};

export const addCategory = async (name: string): Promise<void> => {
  await delay(100);
  if (!categories.includes(name)) {
    categories.push(name);
    categories.sort();
  }
};

export const updateCategory = async (
  oldName: string,
  newName: string
): Promise<void> => {
  await delay(200);
  const index = categories.indexOf(oldName);
  if (index > -1) {
    categories[index] = newName;
    categories.sort();
  }
  exercises = exercises.map(ex =>
    ex.category === oldName ? { ...ex, category: newName } : ex
  );
};

export const copyCategory = async (
  originalName: string,
  newName: string
): Promise<void> => {
  await delay(300);
  if (!categories.includes(newName)) {
    categories.push(newName);
    categories.sort();
  }
  const exercisesToCopy = exercises.filter(ex => ex.category === originalName);
  const copiedExercises = exercisesToCopy.map(ex => ({
    ...ex,
    id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${ex.name}`, // Don't add (copy) to exercise name, only group name changes
    category: newName,
  }));
  exercises.push(...copiedExercises);
};

export const deleteCategory = async (name: string): Promise<void> => {
  await delay(200);
  categories = categories.filter(c => c !== name);
  exercises = exercises.filter(ex => ex.category !== name);
};
