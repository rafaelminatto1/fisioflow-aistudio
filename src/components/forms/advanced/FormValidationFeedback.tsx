'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Loader2, Info, TrendingUp } from 'lucide-react';
import { ValidationState } from './useProgressiveValidation';

export interface FormValidationFeedbackProps {
  validationState: ValidationState;
  showProgress?: boolean;
  showSummary?: boolean;
  className?: string;
}

export interface FieldValidationIndicatorProps {
  isValid?: boolean;
  hasError?: boolean;
  isValidating?: boolean;
  isTouched?: boolean;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showMessage?: boolean;
}

export interface ValidationProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  animated?: boolean;
}

/**
 * Componente de feedback visual para validação de formulários
 */
export const FormValidationFeedback: React.FC<FormValidationFeedbackProps> = ({
  validationState,
  showProgress = true,
  showSummary = true,
  className = ''
}) => {
  const { progress, errors, validatedFields, touchedFields, isValid, isValidating } = validationState;
  
  const errorCount = Object.keys(errors).length;
  const validFieldCount = validatedFields.size;
  const touchedFieldCount = touchedFields.size;

  const getProgressVariant = (): 'default' | 'success' | 'warning' | 'error' => {
    if (errorCount > 0) return 'error';
    if (progress === 100) return 'success';
    if (progress > 50) return 'warning';
    return 'default';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showProgress && (
        <div className='space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <span className='font-medium text-slate-700'>
              Progresso do Formulário
            </span>
            <span className='text-slate-500'>
              {progress}% completo
            </span>
          </div>
          <ValidationProgressBar
            progress={progress}
            variant={getProgressVariant()}
            animated={isValidating}
            showPercentage={false}
          />
        </div>
      )}

      {showSummary && (
        <div className='grid grid-cols-3 gap-4 text-sm'>
          <div className='flex items-center gap-2 text-green-600'>
            <CheckCircle className='w-4 h-4' />
            <span>{validFieldCount} válidos</span>
          </div>
          <div className='flex items-center gap-2 text-blue-600'>
            <Info className='w-4 h-4' />
            <span>{touchedFieldCount} preenchidos</span>
          </div>
          <div className='flex items-center gap-2 text-red-600'>
            <AlertCircle className='w-4 h-4' />
            <span>{errorCount} com erro</span>
          </div>
        </div>
      )}

      {errorCount > 0 && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
          <div className='flex items-center gap-2 text-red-800 font-medium mb-2'>
            <AlertCircle className='w-4 h-4' />
            <span>Campos que precisam de atenção:</span>
          </div>
          <ul className='space-y-1 text-sm text-red-700'>
            {Object.entries(errors).map(([field, error]) => (
              <li key={field} className='flex items-start gap-2'>
                <span className='font-medium capitalize'>
                  {field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                </span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isValid && progress === 100 && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
          <div className='flex items-center gap-2 text-green-800'>
            <CheckCircle className='w-4 h-4' />
            <span className='font-medium'>Formulário válido e pronto para envio!</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Indicador visual para validação de campo individual
 */
export const FieldValidationIndicator: React.FC<FieldValidationIndicatorProps> = ({
  isValid = false,
  hasError = false,
  isValidating = false,
  isTouched = false,
  error,
  size = 'md',
  showIcon = true,
  showMessage = true
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const getIcon = () => {
    if (isValidating) {
      return <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />;
    }
    if (hasError && isTouched) {
      return <AlertCircle className={`${sizeClasses[size]} text-red-500`} />;
    }
    if (isValid && isTouched) {
      return <CheckCircle className={`${sizeClasses[size]} text-green-500`} />;
    }
    return null;
  };

  const getStatusClass = () => {
    if (isValidating) return 'text-blue-600';
    if (hasError && isTouched) return 'text-red-600';
    if (isValid && isTouched) return 'text-green-600';
    return 'text-slate-400';
  };

  return (
    <div className='flex items-center gap-2'>
      {showIcon && getIcon()}
      {showMessage && error && hasError && isTouched && (
        <span className={`text-sm ${getStatusClass()}`}>
          {error}
        </span>
      )}
    </div>
  );
};

/**
 * Barra de progresso para validação
 */
export const ValidationProgressBar: React.FC<ValidationProgressBarProps> = ({
  progress,
  showPercentage = false,
  size = 'md',
  variant = 'default',
  animated = false
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    default: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  const backgroundClasses = {
    default: 'bg-blue-100',
    success: 'bg-green-100',
    warning: 'bg-yellow-100',
    error: 'bg-red-100'
  };

  return (
    <div className='space-y-1'>
      <div className={`w-full ${backgroundClasses[variant]} rounded-full ${sizeClasses[size]} overflow-hidden`}>
        <div
          className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full transition-all duration-300 ease-out ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <div className='flex justify-between text-xs text-slate-500'>
          <span>0%</span>
          <span className='font-medium'>{Math.round(progress)}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
};

/**
 * Componente de resumo de validação para formulários complexos
 */
export interface ValidationSummaryProps {
  validationState: ValidationState;
  fieldLabels?: Record<string, string>;
  onFieldFocus?: (fieldName: string) => void;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  validationState,
  fieldLabels = {},
  onFieldFocus
}) => {
  const { errors, validatedFields, progress, isValid } = validationState;
  
  const errorFields = Object.keys(errors);
  const validFields = Array.from(validatedFields).filter(field => !errors[field]);

  const getFieldLabel = (fieldName: string) => {
    return fieldLabels[fieldName] || fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
  };

  return (
    <div className='bg-slate-50 rounded-lg p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='font-semibold text-slate-800 flex items-center gap-2'>
          <TrendingUp className='w-4 h-4' />
          Resumo da Validação
        </h3>
        <span className={`text-sm font-medium ${
          isValid ? 'text-green-600' : 'text-slate-600'
        }`}>
          {progress}% completo
        </span>
      </div>

      <ValidationProgressBar
        progress={progress}
        variant={isValid ? 'success' : errorFields.length > 0 ? 'error' : 'default'}
        size='sm'
      />

      {errorFields.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-red-800 mb-2'>
            Campos com erro ({errorFields.length}):
          </h4>
          <div className='space-y-1'>
            {errorFields.map(field => (
              <button
                key={field}
                onClick={() => onFieldFocus?.(field)}
                className='flex items-start gap-2 text-sm text-red-700 hover:text-red-800 transition-colors w-full text-left'
              >
                <AlertCircle className='w-3 h-3 mt-0.5 flex-shrink-0' />
                <div>
                  <span className='font-medium capitalize'>
                    {getFieldLabel(field)}
                  </span>
                  <span className='text-red-600 ml-1'>- {errors[field]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {validFields.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-green-800 mb-2'>
            Campos válidos ({validFields.length}):
          </h4>
          <div className='flex flex-wrap gap-1'>
            {validFields.map(field => (
              <span
                key={field}
                className='inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full'
              >
                <CheckCircle className='w-3 h-3' />
                {getFieldLabel(field)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormValidationFeedback;