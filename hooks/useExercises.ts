
// hooks/useExercises.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Exercise } from '../types';
import * as exerciseService from '../services/exerciseService';
import { useToast } from '../contexts/ToastContext';

export const useExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { exercises: exData, categories: catData } = await exerciseService.getExerciseData();
      setExercises(exData);
      setCategories(catData);
      setError(null);
    } catch (err) {
      setError(err as Error);
      showToast('Falha ao carregar exercícios.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const uniqueBodyParts = useMemo(() => {
    const allParts = exercises.flatMap(ex => ex.bodyParts);
    return Array.from(new Set(allParts)).sort((a: string, b: string) => a.localeCompare(b));
  }, [exercises]);

  const uniqueEquipment = useMemo(() => {
    const allEquipment = exercises.flatMap(ex => ex.equipment);
    return Array.from(new Set(allEquipment)).sort((a: string, b: string) => a.localeCompare(b));
  }, [exercises]);

  const addExercise = async (exerciseData: Omit<Exercise, 'id'>) => {
    try {
      await exerciseService.addExercise(exerciseData);
      showToast('Exercício adicionado com sucesso!', 'success');
      await fetchData();
    } catch {
      showToast('Falha ao adicionar exercício.', 'error');
    }
  };

  const updateExercise = async (exerciseData: Exercise) => {
    try {
      await exerciseService.updateExercise(exerciseData);
      showToast('Exercício atualizado com sucesso!', 'success');
       await fetchData();
    } catch {
      showToast('Falha ao atualizar exercício.', 'error');
    }
  };

  const deleteExercise = async (id: string) => {
    try {
      await exerciseService.deleteExercise(id);
      showToast('Exercício excluído com sucesso!', 'success');
       await fetchData();
    } catch {
      showToast('Falha ao excluir exercício.', 'error');
    }
  };

  const addCategory = async (name: string) => {
    try {
        await exerciseService.addCategory(name);
        showToast(`Grupo "${name}" criado com sucesso!`, 'success');
        await fetchData();
    } catch {
        showToast('Falha ao criar grupo.', 'error');
    }
  };
  
  const updateCategory = async (oldName: string, newName: string) => {
      try {
          await exerciseService.updateCategory(oldName, newName);
          showToast('Grupo renomeado com sucesso!', 'success');
          await fetchData();
      } catch {
          showToast('Falha ao renomear grupo.', 'error');
      }
  };

  const copyCategory = async (originalName: string, newName: string) => {
      try {
          await exerciseService.copyCategory(originalName, newName);
          showToast(`Grupo "${originalName}" copiado para "${newName}"!`, 'success');
          await fetchData();
      } catch {
          showToast('Falha ao copiar grupo.', 'error');
      }
  };

  const deleteCategory = async (name: string) => {
      try {
          await exerciseService.deleteCategory(name);
          showToast(`Grupo "${name}" e seus exercícios foram excluídos.`, 'success');
          await fetchData();
      } catch {
          showToast('Falha ao excluir grupo.', 'error');
      }
  };

  return { 
    exercises, 
    categories,
    isLoading, 
    error, 
    refetch: fetchData, 
    addExercise, 
    updateExercise, 
    deleteExercise,
    addCategory,
    updateCategory,
    copyCategory,
    deleteCategory,
    uniqueBodyParts,
    uniqueEquipment,
  };
};