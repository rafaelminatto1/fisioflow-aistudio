import { useState, useCallback } from 'react';

export interface FormLoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
}

export interface FormLoadingActions {
  setLoading: (loading: boolean, message?: string) => void;
  setProgress: (progress: number) => void;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
}

export interface UseFormLoadingReturn extends FormLoadingState, FormLoadingActions {}

/**
 * Hook para gerenciar estados de loading em formulários
 */
export function useFormLoading(initialMessage?: string): UseFormLoadingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(initialMessage);
  const [progress, setProgressState] = useState<number | undefined>(undefined);

  const setLoading = useCallback((loading: boolean, message?: string) => {
    setIsLoading(loading);
    if (message !== undefined) {
      setLoadingMessage(message);
    }
    if (!loading) {
      setProgressState(undefined);
    }
  }, []);

  const setProgress = useCallback((newProgress: number) => {
    setProgressState(Math.max(0, Math.min(100, newProgress)));
  }, []);

  const startLoading = useCallback((message?: string) => {
    setLoading(true, message);
  }, [setLoading]);

  const stopLoading = useCallback(() => {
    setLoading(false);
    setProgressState(undefined);
  }, [setLoading]);

  return {
    isLoading,
    loadingMessage,
    progress,
    setLoading,
    setProgress,
    startLoading,
    stopLoading,
  };
}