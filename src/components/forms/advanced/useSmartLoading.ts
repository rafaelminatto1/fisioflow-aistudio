import { useCallback, useEffect, useState } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';

export interface LoadingState {
  isLoading: boolean;
  isSubmitting: boolean;
  isSaving: boolean;
  isValidating: boolean;
  loadingMessage: string;
  progress: number;
  canCancel: boolean;
}

export interface LoadingStep {
  id: string;
  label: string;
  duration?: number;
  canSkip?: boolean;
}

export interface SmartLoadingOptions {
  steps?: LoadingStep[];
  autoProgress?: boolean;
  showProgress?: boolean;
  minLoadingTime?: number;
  maxLoadingTime?: number;
  onStepChange?: (step: LoadingStep, index: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook para gerenciamento inteligente de estados de loading
 * Fornece feedback visual progressivo e controle de estados
 */
export function useSmartLoading<T extends FieldValues>({
  steps = [],
  autoProgress = true,
  showProgress = true,
  minLoadingTime = 1000,
  maxLoadingTime = 30000,
  onStepChange,
  onComplete,
  onError
}: SmartLoadingOptions = {}) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    isSubmitting: false,
    isSaving: false,
    isValidating: false,
    loadingMessage: '',
    progress: 0,
    canCancel: false
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [stepTimers, setStepTimers] = useState<NodeJS.Timeout[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Inicia o processo de loading
  const startLoading = useCallback((message: string = 'Carregando...', canCancel: boolean = false) => {
    const controller = new AbortController();
    setAbortController(controller);
    setStartTime(Date.now());
    setCurrentStepIndex(0);
    
    setLoadingState({
      isLoading: true,
      isSubmitting: false,
      isSaving: false,
      isValidating: false,
      loadingMessage: message,
      progress: 0,
      canCancel
    });

    // Auto-progresso se habilitado e há steps
    if (autoProgress && steps.length > 0) {
      executeSteps(controller.signal);
    }
  }, [autoProgress, steps]);

  // Inicia submissão de formulário
  const startSubmitting = useCallback((message: string = 'Enviando formulário...') => {
    setLoadingState(prev => ({
      ...prev,
      isSubmitting: true,
      isLoading: true,
      loadingMessage: message,
      canCancel: false
    }));
  }, []);

  // Inicia salvamento
  const startSaving = useCallback((message: string = 'Salvando dados...') => {
    setLoadingState(prev => ({
      ...prev,
      isSaving: true,
      isLoading: true,
      loadingMessage: message,
      canCancel: false
    }));
  }, []);

  // Inicia validação
  const startValidating = useCallback((message: string = 'Validando dados...') => {
    setLoadingState(prev => ({
      ...prev,
      isValidating: true,
      loadingMessage: message
    }));
  }, []);

  // Para todos os estados de loading
  const stopLoading = useCallback(() => {
    // Limpa timers
    stepTimers.forEach(timer => clearTimeout(timer));
    setStepTimers([]);
    
    // Cancela operações
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }

    setLoadingState({
      isLoading: false,
      isSubmitting: false,
      isSaving: false,
      isValidating: false,
      loadingMessage: '',
      progress: 100,
      canCancel: false
    });

    setStartTime(null);
    onComplete?.();
  }, [stepTimers, abortController, onComplete]);

  // Cancela o loading
  const cancelLoading = useCallback(() => {
    if (loadingState.canCancel && abortController) {
      abortController.abort();
      stopLoading();
    }
  }, [loadingState.canCancel, abortController, stopLoading]);

  // Atualiza o progresso manualmente
  const updateProgress = useCallback((progress: number, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
      ...(message && { loadingMessage: message })
    }));
  }, []);

  // Avança para o próximo step
  const nextStep = useCallback((message?: string) => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = steps[nextIndex];
      
      setCurrentStepIndex(nextIndex);
      setLoadingState(prev => ({
        ...prev,
        loadingMessage: message || nextStep.label,
        progress: showProgress ? ((nextIndex + 1) / steps.length) * 100 : prev.progress
      }));

      onStepChange?.(nextStep, nextIndex);
    }
  }, [currentStepIndex, steps, showProgress, onStepChange]);

  // Executa os steps automaticamente
  const executeSteps = useCallback(async (signal: AbortSignal) => {
    try {
      for (let i = 0; i < steps.length; i++) {
        if (signal.aborted) break;

        const step = steps[i];
        const progress = ((i + 1) / steps.length) * 100;

        setCurrentStepIndex(i);
        setLoadingState(prev => ({
          ...prev,
          loadingMessage: step.label,
          progress: showProgress ? progress : prev.progress
        }));

        onStepChange?.(step, i);

        // Aguarda duração do step ou duração padrão
        const stepDuration = step.duration || Math.max(500, minLoadingTime / steps.length);
        
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, stepDuration);
          setStepTimers(prev => [...prev, timer]);
          
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new Error('Operação cancelada'));
          });
        });
      }

      // Completa o loading após todos os steps
      if (!signal.aborted) {
        setLoadingState(prev => ({
          ...prev,
          progress: 100,
          loadingMessage: 'Concluído!'
        }));

        // Para o loading após um breve delay
        setTimeout(() => {
          if (!signal.aborted) {
            stopLoading();
          }
        }, 500);
      }
    } catch (error) {
      if (!signal.aborted) {
        onError?.(error as Error);
        stopLoading();
      }
    }
  }, [steps, showProgress, minLoadingTime, onStepChange, onError, stopLoading]);

  // Wrapper para operações assíncronas com loading
  const withLoading = useCallback(async <R>(
    operation: (signal: AbortSignal) => Promise<R>,
    options: {
      message?: string;
      canCancel?: boolean;
      onProgress?: (progress: number, message?: string) => void;
    } = {}
  ): Promise<R> => {
    const { message = 'Processando...', canCancel = false, onProgress } = options;
    
    startLoading(message, canCancel);
    
    try {
      const controller = abortController || new AbortController();
      
      // Configura callback de progresso
      if (onProgress) {
        const progressCallback = (progress: number, msg?: string) => {
          updateProgress(progress, msg);
          onProgress(progress, msg);
        };
        
        // Injeta callback no contexto da operação
        (operation as any).onProgress = progressCallback;
      }

      const result = await operation(controller.signal);
      
      // Garante tempo mínimo de loading para UX
      const elapsedTime = startTime ? Date.now() - startTime : 0;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      stopLoading();
      return result;
    } catch (error) {
      onError?.(error as Error);
      stopLoading();
      throw error;
    }
  }, [startLoading, abortController, updateProgress, startTime, minLoadingTime, stopLoading, onError]);

  // Timeout automático
  useEffect(() => {
    if (loadingState.isLoading && maxLoadingTime > 0) {
      const timeoutTimer = setTimeout(() => {
        onError?.(new Error('Timeout: Operação demorou muito para completar'));
        stopLoading();
      }, maxLoadingTime);

      return () => clearTimeout(timeoutTimer);
    }
  }, [loadingState.isLoading, maxLoadingTime, onError, stopLoading]);

  // Limpa recursos ao desmontar
  useEffect(() => {
    return () => {
      stepTimers.forEach(timer => clearTimeout(timer));
      if (abortController) {
        abortController.abort();
      }
    };
  }, [stepTimers, abortController]);

  return {
    loadingState,
    startLoading,
    startSubmitting,
    startSaving,
    startValidating,
    stopLoading,
    cancelLoading,
    updateProgress,
    nextStep,
    withLoading,
    currentStep: steps[currentStepIndex],
    currentStepIndex,
    totalSteps: steps.length,
    isLoading: loadingState.isLoading,
    isSubmitting: loadingState.isSubmitting,
    isSaving: loadingState.isSaving,
    isValidating: loadingState.isValidating,
    progress: loadingState.progress,
    message: loadingState.loadingMessage,
    canCancel: loadingState.canCancel
  };
}

/**
 * Hook para integração com react-hook-form
 */
export function useFormLoading<T extends FieldValues>(
  form: UseFormReturn<T>,
  options: SmartLoadingOptions = {}
) {
  const loading = useSmartLoading(options);
  
  // Monitora estado de submissão do formulário
  useEffect(() => {
    if (form.formState.isSubmitting && !loading.isSubmitting) {
      loading.startSubmitting();
    } else if (!form.formState.isSubmitting && loading.isSubmitting) {
      loading.stopLoading();
    }
  }, [form.formState.isSubmitting, loading]);

  // Monitora estado de validação
  useEffect(() => {
    if (form.formState.isValidating && !loading.isValidating) {
      loading.startValidating();
    } else if (!form.formState.isValidating && loading.isValidating) {
      loading.stopLoading();
    }
  }, [form.formState.isValidating, loading]);

  return loading;
}

/**
 * Steps pré-definidos para operações comuns
 */
export const commonLoadingSteps = {
  formSubmission: [
    { id: 'validate', label: 'Validando dados...', duration: 800 },
    { id: 'process', label: 'Processando informações...', duration: 1200 },
    { id: 'save', label: 'Salvando no servidor...', duration: 1000 },
    { id: 'complete', label: 'Finalizando...', duration: 500 }
  ],
  
  patientRegistration: [
    { id: 'validate', label: 'Validando dados do paciente...', duration: 600 },
    { id: 'check', label: 'Verificando duplicatas...', duration: 800 },
    { id: 'create', label: 'Criando registro...', duration: 1000 },
    { id: 'notify', label: 'Enviando notificações...', duration: 700 }
  ],
  
  appointmentBooking: [
    { id: 'validate', label: 'Validando agendamento...', duration: 500 },
    { id: 'conflict', label: 'Verificando conflitos...', duration: 800 },
    { id: 'book', label: 'Confirmando horário...', duration: 1000 },
    { id: 'calendar', label: 'Atualizando agenda...', duration: 600 }
  ]
};