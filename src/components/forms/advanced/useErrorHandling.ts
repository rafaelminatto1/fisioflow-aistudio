'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Tipos de erro padronizados
export interface FormError {
  type: 'validation' | 'network' | 'server' | 'timeout' | 'unknown';
  message: string;
  field?: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface ErrorHandlingOptions {
  showToast?: boolean;
  logErrors?: boolean;
  retryable?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: FormError) => void;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: (error: FormError) => void;
}

export interface ErrorHandlingState {
  errors: FormError[];
  lastError: FormError | null;
  retryCount: number;
  isRetrying: boolean;
  canRetry: boolean;
}

export interface ErrorHandlingActions {
  addError: (error: Partial<FormError>) => void;
  clearErrors: () => void;
  clearError: (index: number) => void;
  clearFieldErrors: (field: string) => void;
  retry: () => Promise<void>;
  handleAsyncError: <T>(promise: Promise<T>) => Promise<T>;
  createErrorHandler: (type: FormError['type']) => (error: any) => FormError;
}

/**
 * Hook para gerenciamento padronizado de erros em formulários
 * 
 * Funcionalidades:
 * - Categorização automática de erros
 * - Sistema de retry inteligente
 * - Notificações toast automáticas
 * - Log estruturado de erros
 * - Limpeza automática de erros
 */
export const useErrorHandling = (
  options: ErrorHandlingOptions = {}
): ErrorHandlingState & ErrorHandlingActions => {
  const {
    showToast = true,
    logErrors = true,
    retryable = true,
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetry,
    onMaxRetriesReached
  } = options;

  const [errors, setErrors] = useState<FormError[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const lastActionRef = useRef<(() => Promise<void>) | null>(null);

  const lastError = errors[errors.length - 1] || null;
  const canRetry = retryable && retryCount < maxRetries && !isRetrying;

  // Categoriza automaticamente o tipo de erro
  const categorizeError = useCallback((error: any): FormError['type'] => {
    if (error?.name === 'ValidationError' || error?.code === 'VALIDATION_ERROR') {
      return 'validation';
    }
    if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
      return 'network';
    }
    if (error?.name === 'TimeoutError' || error?.code === 'TIMEOUT_ERROR') {
      return 'timeout';
    }
    if (error?.status >= 400 && error?.status < 500) {
      return 'validation';
    }
    if (error?.status >= 500) {
      return 'server';
    }
    return 'unknown';
  }, []);

  // Cria mensagem de erro amigável
  const createFriendlyMessage = useCallback((error: any, type: FormError['type']): string => {
    if (error?.message && typeof error.message === 'string') {
      return error.message;
    }

    switch (type) {
      case 'validation':
        return 'Por favor, verifique os dados informados.';
      case 'network':
        return 'Erro de conexão. Verifique sua internet e tente novamente.';
      case 'server':
        return 'Erro interno do servidor. Tente novamente em alguns instantes.';
      case 'timeout':
        return 'A operação demorou muito para responder. Tente novamente.';
      default:
        return 'Ocorreu um erro inesperado. Tente novamente.';
    }
  }, []);

  // Adiciona um novo erro
  const addError = useCallback((errorData: Partial<FormError>) => {
    const error: FormError = {
      type: errorData.type || 'unknown',
      message: errorData.message || 'Erro desconhecido',
      field: errorData.field,
      code: errorData.code,
      details: errorData.details,
      timestamp: new Date()
    };

    // Se não tem mensagem, cria uma amigável
    if (!errorData.message) {
      error.message = createFriendlyMessage(errorData, error.type);
    }

    setErrors(prev => [...prev, error]);

    // Log do erro
    if (logErrors) {
      console.error('[FormError]', {
        ...error,
        retryCount,
        timestamp: error.timestamp.toISOString()
      });
    }

    // Toast de notificação
    if (showToast) {
      const toastMessage = error.field 
        ? `${error.field}: ${error.message}`
        : error.message;

      switch (error.type) {
        case 'validation':
          toast.error(toastMessage, {
            description: 'Verifique os dados e tente novamente'
          });
          break;
        case 'network':
          toast.error(toastMessage, {
            description: 'Problema de conexão detectado',
            action: canRetry ? {
              label: 'Tentar novamente',
              onClick: () => retry()
            } : undefined
          });
          break;
        case 'server':
          toast.error(toastMessage, {
            description: 'Erro do servidor'
          });
          break;
        default:
          toast.error(toastMessage);
      }
    }

    // Callback personalizado
    if (onError) {
      onError(error);
    }
  }, [createFriendlyMessage, logErrors, showToast, retryCount, canRetry, onError]);

  // Limpa todos os erros
  const clearErrors = useCallback(() => {
    setErrors([]);
    setRetryCount(0);
  }, []);

  // Remove um erro específico
  const clearError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Limpa erros de um campo específico
  const clearFieldErrors = useCallback((field: string) => {
    setErrors(prev => prev.filter(error => error.field !== field));
  }, []);

  // Sistema de retry
  const retry = useCallback(async () => {
    if (!canRetry || !lastActionRef.current) {
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    if (onRetry) {
      onRetry(retryCount + 1);
    }

    try {
      // Delay antes do retry
      await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
      
      // Executa a ação novamente
      await lastActionRef.current();
      
      // Se chegou aqui, deu certo - limpa os erros
      clearErrors();
      
      toast.success('Operação realizada com sucesso!');
    } catch (error) {
      const newRetryCount = retryCount + 1;
      
      if (newRetryCount >= maxRetries) {
        const maxRetriesError: FormError = {
          type: 'unknown',
          message: `Máximo de tentativas atingido (${maxRetries}). Tente novamente mais tarde.`,
          timestamp: new Date()
        };
        
        addError(maxRetriesError);
        
        if (onMaxRetriesReached) {
          onMaxRetriesReached(maxRetriesError);
        }
      } else {
        // Adiciona o erro do retry
        addError({
          type: categorizeError(error),
          message: createFriendlyMessage(error, categorizeError(error)),
          details: { isRetry: true, attempt: newRetryCount }
        });
      }
    } finally {
      setIsRetrying(false);
    }
  }, [canRetry, retryCount, retryDelay, maxRetries, onRetry, onMaxRetriesReached, clearErrors, addError, categorizeError, createFriendlyMessage]);

  // Wrapper para promises com tratamento automático de erro
  const handleAsyncError = useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    try {
      const result = await promise;
      return result;
    } catch (error) {
      const formError: FormError = {
        type: categorizeError(error),
        message: createFriendlyMessage(error, categorizeError(error)),
        code: (error as any)?.code,
        details: error,
        timestamp: new Date()
      };
      
      addError(formError);
      throw error;
    }
  }, [categorizeError, createFriendlyMessage, addError]);

  // Cria handler de erro para um tipo específico
  const createErrorHandler = useCallback((type: FormError['type']) => {
    return (error: any): FormError => {
      const formError: FormError = {
        type,
        message: createFriendlyMessage(error, type),
        code: error?.code,
        details: error,
        timestamp: new Date()
      };
      
      addError(formError);
      return formError;
    };
  }, [createFriendlyMessage, addError]);

  return {
    // State
    errors,
    lastError,
    retryCount,
    isRetrying,
    canRetry,
    
    // Actions
    addError,
    clearErrors,
    clearError,
    clearFieldErrors,
    retry,
    handleAsyncError,
    createErrorHandler
  };
};

/**
 * Hook simplificado para tratamento de erros de campo
 */
export const useFieldErrorHandling = (fieldName: string) => {
  const errorHandling = useErrorHandling({
    showToast: false, // Não mostra toast para erros de campo
    retryable: false  // Campos não precisam de retry
  });

  const fieldErrors = errorHandling.errors.filter(error => error.field === fieldName);
  const hasFieldError = fieldErrors.length > 0;
  const fieldErrorMessage = fieldErrors[0]?.message;

  const addFieldError = useCallback((message: string, type: FormError['type'] = 'validation') => {
    errorHandling.addError({
      type,
      message,
      field: fieldName
    });
  }, [errorHandling.addError, fieldName]);

  const clearFieldError = useCallback(() => {
    errorHandling.clearFieldErrors(fieldName);
  }, [errorHandling.clearFieldErrors, fieldName]);

  return {
    fieldErrors,
    hasFieldError,
    fieldErrorMessage,
    addFieldError,
    clearFieldError
  };
};

/**
 * Utilitários para tratamento de erros comuns
 */
export const ErrorUtils = {
  // Converte erro de validação do Zod
  fromZodError: (zodError: any): Partial<FormError>[] => {
    if (!zodError?.errors) return [];
    
    return zodError.errors.map((error: any) => ({
      type: 'validation' as const,
      message: error.message,
      field: error.path?.join('.'),
      code: error.code
    }));
  },

  // Converte erro de rede
  fromNetworkError: (networkError: any): Partial<FormError> => ({
    type: 'network',
    message: 'Erro de conexão. Verifique sua internet.',
    code: networkError?.code || 'NETWORK_ERROR',
    details: networkError
  }),

  // Converte erro de servidor
  fromServerError: (serverError: any): Partial<FormError> => ({
    type: 'server',
    message: serverError?.message || 'Erro interno do servidor',
    code: serverError?.status?.toString() || 'SERVER_ERROR',
    details: serverError
  }),

  // Converte erro de timeout
  fromTimeoutError: (timeoutError: any): Partial<FormError> => ({
    type: 'timeout',
    message: 'A operação demorou muito para responder',
    code: 'TIMEOUT_ERROR',
    details: timeoutError
  })
};