import { useCallback, useEffect, useState } from 'react';
import { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import { ZodSchema, ZodError } from 'zod';

export interface ValidationState {
  isValid: boolean;
  isValidating: boolean;
  errors: Record<string, string>;
  touchedFields: Set<string>;
  validatedFields: Set<string>;
  progress: number;
}

export interface ProgressiveValidationOptions<T extends FieldValues> {
  schema: ZodSchema<T>;
  form: UseFormReturn<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit';
  debounceMs?: number;
  validateOnMount?: boolean;
  requiredFields?: (keyof T)[];
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  isValidating: boolean;
}

/**
 * Hook para validação progressiva de formulários
 * Fornece validação em tempo real, feedback visual e acompanhamento de progresso
 */
export function useProgressiveValidation<T extends FieldValues>({
  schema,
  form,
  mode = 'onChange',
  debounceMs = 300,
  validateOnMount = false,
  requiredFields = []
}: ProgressiveValidationOptions<T>) {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    isValidating: false,
    errors: {},
    touchedFields: new Set(),
    validatedFields: new Set(),
    progress: 0
  });

  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({});

  // Valida um campo específico
  const validateField = useCallback(async (
    fieldName: FieldPath<T>,
    value: any
  ): Promise<FieldValidationResult> => {
    setValidationState(prev => ({
      ...prev,
      isValidating: true
    }));

    try {
      // Cria um objeto parcial para validação
      const partialData = { [fieldName]: value } as Partial<T>;
      
      // Tenta validar apenas este campo
      const fieldSchema = schema.pick({ [fieldName]: true } as any);
      await fieldSchema.parseAsync(partialData);

      setValidationState(prev => {
        const newErrors = { ...prev.errors };
        delete newErrors[fieldName];
        
        const newValidatedFields = new Set(prev.validatedFields);
        newValidatedFields.add(fieldName);

        return {
          ...prev,
          errors: newErrors,
          validatedFields: newValidatedFields,
          isValidating: false
        };
      });

      return { isValid: true, isValidating: false };
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldError = error.errors.find(e => e.path.includes(fieldName));
        const errorMessage = fieldError?.message || 'Campo inválido';

        setValidationState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [fieldName]: errorMessage
          },
          isValidating: false
        }));

        return {
          isValid: false,
          error: errorMessage,
          isValidating: false
        };
      }

      return { isValid: false, error: 'Erro de validação', isValidating: false };
    }
  }, [schema]);

  // Valida o formulário completo
  const validateForm = useCallback(async (): Promise<boolean> => {
    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      const formData = form.getValues();
      await schema.parseAsync(formData);

      setValidationState(prev => ({
        ...prev,
        isValid: true,
        errors: {},
        isValidating: false,
        progress: 100
      }));

      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          const fieldName = err.path.join('.');
          errors[fieldName] = err.message;
        });

        setValidationState(prev => ({
          ...prev,
          isValid: false,
          errors,
          isValidating: false
        }));
      }

      return false;
    }
  }, [schema, form]);

  // Marca um campo como tocado
  const touchField = useCallback((fieldName: FieldPath<T>) => {
    setValidationState(prev => {
      const newTouchedFields = new Set(prev.touchedFields);
      newTouchedFields.add(fieldName);
      return {
        ...prev,
        touchedFields: newTouchedFields
      };
    });
  }, []);

  // Validação com debounce
  const debouncedValidateField = useCallback((
    fieldName: FieldPath<T>,
    value: any
  ) => {
    // Limpa timer anterior se existir
    if (debounceTimers[fieldName]) {
      clearTimeout(debounceTimers[fieldName]);
    }

    // Cria novo timer
    const timer = setTimeout(() => {
      validateField(fieldName, value);
      setDebounceTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[fieldName];
        return newTimers;
      });
    }, debounceMs);

    setDebounceTimers(prev => ({
      ...prev,
      [fieldName]: timer
    }));
  }, [validateField, debounceMs, debounceTimers]);

  // Calcula o progresso do formulário
  const calculateProgress = useCallback(() => {
    const totalFields = requiredFields.length || Object.keys(form.getValues()).length;
    const validFields = validationState.validatedFields.size;
    const progress = totalFields > 0 ? (validFields / totalFields) * 100 : 0;
    
    setValidationState(prev => ({
      ...prev,
      progress: Math.round(progress)
    }));
  }, [requiredFields, form, validationState.validatedFields]);

  // Obtém o estado de validação de um campo específico
  const getFieldState = useCallback((fieldName: FieldPath<T>) => {
    const isTouched = validationState.touchedFields.has(fieldName);
    const isValidated = validationState.validatedFields.has(fieldName);
    const error = validationState.errors[fieldName];
    const hasError = Boolean(error);

    return {
      isTouched,
      isValidated,
      hasError,
      error,
      isValid: isValidated && !hasError,
      showError: isTouched && hasError
    };
  }, [validationState]);

  // Registra listeners para os campos do formulário
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (!name) return;

      const fieldName = name as FieldPath<T>;
      const fieldValue = value[fieldName];

      // Marca campo como tocado
      if (type === 'change') {
        touchField(fieldName);
      }

      // Valida baseado no modo
      if (mode === 'onChange' && type === 'change') {
        debouncedValidateField(fieldName, fieldValue);
      } else if (mode === 'onBlur' && type === 'blur') {
        validateField(fieldName, fieldValue);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, mode, touchField, debouncedValidateField, validateField]);

  // Calcula progresso quando campos validados mudam
  useEffect(() => {
    calculateProgress();
  }, [calculateProgress]);

  // Validação inicial se habilitada
  useEffect(() => {
    if (validateOnMount) {
      validateForm();
    }
  }, [validateOnMount, validateForm]);

  // Limpa timers ao desmontar
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [debounceTimers]);

  return {
    validationState,
    validateField,
    validateForm,
    touchField,
    getFieldState,
    isFormValid: validationState.isValid,
    isValidating: validationState.isValidating,
    progress: validationState.progress,
    errors: validationState.errors
  };
}

/**
 * Hook simplificado para validação de campo individual
 */
export function useFieldValidation<T extends FieldValues>(
  fieldName: FieldPath<T>,
  schema: ZodSchema<T>,
  form: UseFormReturn<T>
) {
  const { getFieldState, validateField, touchField } = useProgressiveValidation({
    schema,
    form,
    mode: 'onChange'
  });

  const fieldState = getFieldState(fieldName);

  return {
    ...fieldState,
    validate: (value: any) => validateField(fieldName, value),
    touch: () => touchField(fieldName)
  };
}