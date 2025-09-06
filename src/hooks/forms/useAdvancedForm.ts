import { useState, useCallback } from 'react';
import { useForm, FieldValues, UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';
import { UseAdvancedFormReturn, ValidationConfig } from '@/types/forms';

// Configuração padrão de validação
const defaultValidationConfig: ValidationConfig = {
  mode: 'onChange',
  reValidateMode: 'onChange',
  shouldFocusError: true,
};

/**
 * Hook avançado para formulários com validação robusta
 * Integra react-hook-form com zod e adiciona funcionalidades extras
 */
export function useAdvancedForm<T extends FieldValues>(
  schema: ZodSchema<T>,
  options?: {
    defaultValues?: Partial<T>;
    validationConfig?: Partial<ValidationConfig>;
    onSubmit?: (data: T) => Promise<void> | void;
    onError?: (error: any) => void;
  }
): UseAdvancedFormReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Mescla configurações de validação
  const validationConfig = {
    ...defaultValidationConfig,
    ...options?.validationConfig,
  };

  // Configuração do react-hook-form
  const formConfig: UseFormProps<T> = {
    resolver: zodResolver(schema),
    mode: validationConfig.mode,
    reValidateMode: validationConfig.reValidateMode,
    shouldFocusError: validationConfig.shouldFocusError,
    defaultValues: options?.defaultValues,
  };

  const form = useForm<T>(formConfig);

  // Handler de submit com tratamento de erros
  const handleSubmit = useCallback(
    async (data: T) => {
      if (!options?.onSubmit) return;

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        await options.onSubmit(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setSubmitError(errorMessage);
        
        if (options?.onError) {
          options.onError(error);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [options]
  );

  // Sobrescreve o handleSubmit do form
  const originalHandleSubmit = form.handleSubmit;
  form.handleSubmit = (onValid, onInvalid) => {
    return originalHandleSubmit(
      async (data) => {
        if (onValid) {
          await onValid(data);
        } else {
          await handleSubmit(data);
        }
      },
      onInvalid
    );
  };

  return {
    form,
    isSubmitting,
    setIsSubmitting,
    submitError,
    setSubmitError,
  };
}

/**
 * Hook para validação progressiva
 * Muda o modo de validação baseado na interação do usuário
 */
export function useProgressiveValidation(fieldName: string) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [validationMode, setValidationMode] = useState<'onBlur' | 'onChange'>('onBlur');

  const handleInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      setValidationMode('onChange');
    }
  }, [hasInteracted]);

  return {
    validationMode,
    hasInteracted,
    setHasInteracted: handleInteraction,
  };
}

/**
 * Hook para gerenciar estados de loading por campo
 */
export function useFormLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setFieldLoading = useCallback((fieldName: string, isLoading: boolean) => {
    setLoadingStates(prev => ({ 
      ...prev, 
      [fieldName]: isLoading 
    }));
  }, []);

  const isAnyFieldLoading = Object.values(loadingStates).some(Boolean);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    loadingStates,
    setFieldLoading,
    isAnyFieldLoading,
    clearAllLoading,
  };
}

/**
 * Hook para gerenciar erros de formulário
 */
export function useFormErrors() {
  const [errors, setErrors] = useState<Array<{
    field: string;
    message: string;
    type: 'validation' | 'server' | 'network';
    timestamp: Date;
  }>>([]);

  const addError = useCallback((error: {
    field: string;
    message: string;
    type: 'validation' | 'server' | 'network';
  }) => {
    setErrors(prev => [...prev, { ...error, timestamp: new Date() }]);
  }, []);

  const clearErrors = useCallback((field?: string) => {
    if (field) {
      setErrors(prev => prev.filter(error => error.field !== field));
    } else {
      setErrors([]);
    }
  }, []);

  const getFieldErrors = useCallback((field: string) => {
    return errors.filter(error => error.field === field);
  }, [errors]);

  const hasErrors = errors.length > 0;
  const hasFieldError = useCallback((field: string) => {
    return errors.some(error => error.field === field);
  }, [errors]);

  return {
    errors,
    addError,
    clearErrors,
    getFieldErrors,
    hasErrors,
    hasFieldError,
  };
}

/**
 * Hook para debounce de validação
 * Útil para validações que fazem chamadas à API
 */
export function useValidationDebounce(callback: Function, delay: number = 300) {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: any[]) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      callback(...args);
    }, delay);

    setDebounceTimer(timer);
  }, [callback, delay, debounceTimer]);

  return debouncedCallback;
}