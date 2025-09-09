import { useState, useCallback, useMemo } from 'react';

export interface FormError {
  field?: string;
  message: string;
  type: 'validation' | 'server' | 'network' | 'custom';
  timestamp: number;
}

export interface FormErrorState {
  errors: FormError[];
  hasErrors: boolean;
  errorCount: number;
}

export interface FormErrorActions {
  addError: (error: Omit<FormError, 'timestamp'>) => void;
  removeError: (index: number) => void;
  clearErrors: () => void;
  clearFieldErrors: (field: string) => void;
  getFieldErrors: (field: string) => FormError[];
  hasFieldError: (field: string) => boolean;
}

export interface UseFormErrorsReturn extends FormErrorState, FormErrorActions {}

/**
 * Hook para gerenciar erros em formulários
 */
export function useFormErrors(): UseFormErrorsReturn {
  const [errors, setErrors] = useState<FormError[]>([]);

  const addError = useCallback((error: Omit<FormError, 'timestamp'>) => {
    const newError: FormError = {
      ...error,
      timestamp: Date.now(),
    };
    
    setErrors(prev => [...prev, newError]);
  }, []);

  const removeError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearFieldErrors = useCallback((field: string) => {
    setErrors(prev => prev.filter(error => error.field !== field));
  }, []);

  const getFieldErrors = useCallback((field: string) => {
    return errors.filter(error => error.field === field);
  }, [errors]);

  const hasFieldError = useCallback((field: string) => {
    return errors.some(error => error.field === field);
  }, [errors]);

  const hasErrors = useMemo(() => errors.length > 0, [errors.length]);
  const errorCount = useMemo(() => errors.length, [errors.length]);

  return {
    errors,
    hasErrors,
    errorCount,
    addError,
    removeError,
    clearErrors,
    clearFieldErrors,
    getFieldErrors,
    hasFieldError,
  };
}