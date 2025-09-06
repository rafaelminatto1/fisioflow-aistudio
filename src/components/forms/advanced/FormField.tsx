import React from 'react';
import { cn } from '@/lib/utils';
import { FormFieldProps, FieldState } from '@/types/forms';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

/**
 * Componente wrapper para campos de formulário
 * Fornece layout consistente, estados visuais e acessibilidade
 */
export function FormField({
  name,
  label,
  description,
  required = false,
  disabled = false,
  className,
  children,
  error,
  state = 'idle',
}: FormFieldProps) {
  const fieldId = `field-${name}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  // Classes baseadas no estado
  const getStateClasses = (state: FieldState) => {
    switch (state) {
      case 'valid':
        return 'border-green-500 focus-within:border-green-600';
      case 'invalid':
        return 'border-red-500 focus-within:border-red-600';
      case 'validating':
      case 'loading':
        return 'border-blue-500 focus-within:border-blue-600';
      default:
        return 'border-gray-300 focus-within:border-blue-500';
    }
  };

  // Ícone baseado no estado
  const getStateIcon = (state: FieldState) => {
    switch (state) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'validating':
      case 'loading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <label
        htmlFor={fieldId}
        className={cn(
          'block text-sm font-medium transition-colors',
          disabled ? 'text-gray-400' : 'text-gray-700',
          required && 'after:content-["*"] after:ml-1 after:text-red-500'
        )}
      >
        {label}
      </label>

      {/* Campo com wrapper para estado visual */}
      <div className="relative">
        <div
          className={cn(
            'relative rounded-md border transition-all duration-200',
            getStateClasses(state),
            disabled && 'bg-gray-50 opacity-60'
          )}
        >
          {/* Clona o children e adiciona props necessárias */}
          {React.cloneElement(children as React.ReactElement, {
            id: fieldId,
            name,
            disabled,
            'aria-describedby': cn(
              descriptionId,
              errorId
            ).trim() || undefined,
            'aria-invalid': state === 'invalid' || !!error,
            className: cn(
              'w-full border-0 bg-transparent focus:ring-0 focus:outline-none',
              (children as React.ReactElement).props?.className
            ),
          })}

          {/* Ícone de estado */}
          {getStateIcon(state) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getStateIcon(state)}
            </div>
          )}
        </div>
      </div>

      {/* Descrição */}
      {description && (
        <p
          id={descriptionId}
          className="text-sm text-gray-600"
        >
          {description}
        </p>
      )}

      {/* Erro */}
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 flex items-center gap-1"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Componente de grupo de campos
 * Útil para agrupar campos relacionados
 */
export function FormFieldGroup({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn('space-y-4', className)}>
      {title && (
        <legend className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </legend>
      )}
      
      {description && (
        <p className="text-sm text-gray-600 mb-4">
          {description}
        </p>
      )}
      
      <div className="space-y-4">
        {children}
      </div>
    </fieldset>
  );
}

/**
 * Componente para layout de campos em grid
 */
export function FormFieldGrid({
  children,
  columns = 2,
  className,
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn(
      'grid gap-4',
      gridClasses[columns],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Hook para gerenciar estado visual de campo
 */
export function useFieldState(initialState: FieldState = 'idle') {
  const [state, setState] = React.useState<FieldState>(initialState);

  const setValidating = React.useCallback(() => setState('validating'), []);
  const setValid = React.useCallback(() => setState('valid'), []);
  const setInvalid = React.useCallback(() => setState('invalid'), []);
  const setLoading = React.useCallback(() => setState('loading'), []);
  const setIdle = React.useCallback(() => setState('idle'), []);

  return {
    state,
    setState,
    setValidating,
    setValid,
    setInvalid,
    setLoading,
    setIdle,
  };
}