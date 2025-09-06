// hooks/useExerciseLibrary.ts
import { useState, useEffect } from 'react';
import { Protocol, ExerciseCategory } from '@/types';
import * as exerciseLibraryService from '@/services/exerciseLibraryService';
import { useToast } from '@/contexts/ToastContext';

const useExerciseLibrary = () => {
    const [protocols, setProtocols] = useState<Protocol[]>([]);
    const [exerciseGroups, setExerciseGroups] = useState<ExerciseCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const { protocols, exerciseGroups } = await exerciseLibraryService.getExerciseLibraryData();
                setProtocols(protocols);
                setExerciseGroups(exerciseGroups);
            } catch (error) {
                console.error("Failed to fetch exercise library data", error);
                showToast('Falha ao carregar a biblioteca de exercícios', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [showToast]);

    return { protocols, exerciseGroups, isLoading };
};

export default useExerciseLibrary;