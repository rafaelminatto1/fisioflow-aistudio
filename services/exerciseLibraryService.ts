// services/exerciseLibraryService.ts
import { ExerciseCategory, Protocol, Exercise } from '../types';
import { 
  enhancedProtocols, 
  enhancedExerciseCategories, 
  completeExerciseLibrary 
} from '../data/expandedExerciseLibrary';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getExerciseLibraryData = async () => {
  await delay(500); // Simulate API call
  return {
    protocols: enhancedProtocols,
    exerciseGroups: enhancedExerciseCategories
  };
};

// New enhanced functions for the expanded library
export const searchExercises = async (query: string, filters?: {
  category?: string;
  difficulty?: number;
  bodyPart?: string;
  equipment?: string;
}): Promise<Exercise[]> => {
  await delay(300);
  
  let filteredExercises = completeExerciseLibrary;
  
  // Apply search query
  if (query) {
    const searchTerm = query.toLowerCase();
    filteredExercises = filteredExercises.filter(exercise => 
      exercise.name.toLowerCase().includes(searchTerm) ||
      exercise.description.toLowerCase().includes(searchTerm) ||
      exercise.category.toLowerCase().includes(searchTerm) ||
      exercise.bodyParts.some(part => part.toLowerCase().includes(searchTerm))
    );
  }
  
  // Apply filters
  if (filters) {
    if (filters.category) {
      filteredExercises = filteredExercises.filter(ex => 
        ex.category.toLowerCase() === filters.category?.toLowerCase()
      );
    }
    
    if (filters.difficulty) {
      filteredExercises = filteredExercises.filter(ex => 
        ex.difficulty === filters.difficulty
      );
    }
    
    if (filters.bodyPart) {
      filteredExercises = filteredExercises.filter(ex => 
        ex.bodyParts.some(part => 
          part.toLowerCase().includes(filters.bodyPart?.toLowerCase() || '')
        )
      );
    }
    
    if (filters.equipment) {
      filteredExercises = filteredExercises.filter(ex => 
        ex.equipment.some(eq => 
          eq.toLowerCase().includes(filters.equipment?.toLowerCase() || '')
        )
      );
    }
  }
  
  return filteredExercises.slice(0, 50); // Limit results for performance
};

export const getExerciseById = async (id: string): Promise<Exercise | null> => {
  await delay(200);
  return completeExerciseLibrary.find(ex => ex.id === id) || null;
};

export const getExercisesByCategory = async (category: string): Promise<Exercise[]> => {
  await delay(300);
  return completeExerciseLibrary.filter(ex => 
    ex.category.toLowerCase() === category.toLowerCase()
  );
};

export const getRandomExercises = async (count: number = 10): Promise<Exercise[]> => {
  await delay(200);
  const shuffled = [...completeExerciseLibrary].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const getExerciseStats = async () => {
  await delay(100);
  const stats = {
    totalExercises: completeExerciseLibrary.length,
    categoriesCount: enhancedExerciseCategories.length,
    protocolsCount: enhancedProtocols.length,
    byCategory: enhancedExerciseCategories.map(cat => ({
      category: cat.name,
      count: completeExerciseLibrary.filter(ex => ex.category === cat.name).length
    })),
    byDifficulty: {
      beginner: completeExerciseLibrary.filter(ex => ex.difficulty === 1).length,
      intermediate: completeExerciseLibrary.filter(ex => ex.difficulty === 2).length,
      advanced: completeExerciseLibrary.filter(ex => ex.difficulty === 3).length
    }
  };
  
  return stats;
};
