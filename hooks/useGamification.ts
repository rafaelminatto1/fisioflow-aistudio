
// hooks/useGamification.ts
import { useState, useEffect, useCallback } from 'react';
import { GamificationProgress } from '../types';
import * as gamificationService from '../services/gamificationService';
import { useToast } from '../contexts/ToastContext';

export const useGamification = (patientId?: string) => {
    const [progress, setProgress] = useState<GamificationProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchProgress = useCallback(async () => {
        if (!patientId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const data = await gamificationService.getGamificationProgress(patientId);
            setProgress(data);
        } catch (error) {
            console.error("Failed to fetch gamification progress:", error);
            showToast('Falha ao carregar seus dados de engajamento.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [patientId, showToast]);

    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    return { progress, isLoading, refetch: fetchProgress };
};