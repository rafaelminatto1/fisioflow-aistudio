'use client';

import React from 'react';
import { FormField } from './FormField';
import { FormFieldProps } from '@/types/forms';
import { cn } from '@/lib/utils';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface FormRadioGroupProps extends Omit<FormFieldProps, 'children'> {
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card' | 'button';
  className?: string;
}

const sizeClasses = {
  sm: {
    radio: 'w-4 h-4',
    text: 'text-sm',
    padding: 'p-3'
  },
  md: {
    radio: 'w-5 h-5',
    text: 'text-base',
    padding: 'p-4'
  },
  lg: {
    radio: 'w-6 h-6',
    text: 'text-lg',
    padding: 'p-5'
  }
};

export const FormRadioGroup: React.FC<FormRadioGroupProps> = ({
  options,
  value,
  onChange,
  layout = 'vertical',
  columns = 2,
  size = 'md',
  variant = 'default',
  className,
  ...fieldProps
}) => {
  const sizeClass = sizeClasses[size];
  const name = React.useId();

  const layoutClasses = {
    vertical: 'space-y-3',
    horizontal: 'flex flex-wrap gap-4',
    grid: `grid gap-3 grid-cols-${columns}`
  };

  const renderOption = (option: RadioOption) => {
    const isSelected = value === option.value;
    const isDisabled = fieldProps.disabled || option.disabled;

    if (variant === 'card') {
      return (
        <label
          key={option.value}
          className={cn(
            'flex items-start border rounded-lg cursor-pointer transition-all duration-200',
            sizeClass.padding,
            isSelected 
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
            isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent hover:border-gray-300'
          )}
        >
          <div className="flex-shrink-0 mt-1">
            <div className="relative">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => !isDisabled && onChange(option.value)}
                disabled={isDisabled}
                className="sr-only"
              />
              <div
                className={cn(
                  'flex items-center justify-center border-2 rounded-full transition-all duration-200',
                  sizeClass.radio,
                  isSelected
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300 bg-white',
                  fieldProps.error && 'border-red-500',
                  fieldProps.success && 'border-green-500'
                )}
              >
                {isSelected && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
          </div>
          
          <div className="ml-3 flex-1">
            <div className="flex items-center">
              {option.icon && (
                <div className="mr-2 text-gray-500">
                  {option.icon}
                </div>
              )}
              <div className={cn('font-medium', sizeClass.text)}>
                {option.label}
              </div>
            </div>
            {option.description && (
              <div className={cn('text-gray-500 mt-1', size === 'sm' ? 'text-xs' : 'text-sm')}>
                {option.description}
              </div>
            )}
          </div>
        </label>
      );
    }

    if (variant === 'button') {
      return (
        <label
          key={option.value}
          className={cn(
            'flex items-center justify-center border rounded-lg cursor-pointer transition-all duration-200',
            sizeClass.padding,
            isSelected
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50',
            isDisabled && 'opacity-50 cursor-not-allowed hover:bg-white hover:border-gray-300'
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={isSelected}
            onChange={() => !isDisabled && onChange(option.value)}
            disabled={isDisabled}
            className="sr-only"
          />
          
          <div className="flex items-center">
            {option.icon && (
              <div className="mr-2">
                {option.icon}
              </div>
            )}
            <span className={cn('font-medium', sizeClass.text)}>
              {option.label}
            </span>
          </div>
        </label>
      );
    }

    // Default variant
    return (
      <label
        key={option.value}
        className={cn(
          'flex items-start cursor-pointer',
          isDisabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <div className="flex-shrink-0 mt-1">
          <div className="relative">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => !isDisabled && onChange(option.value)}
              disabled={isDisabled}
              className="sr-only"
            />
            <div
              className={cn(
                'flex items-center justify-center border-2 rounded-full transition-all duration-200',
                sizeClass.radio,
                isSelected
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 bg-white hover:border-gray-400',
                fieldProps.error && 'border-red-500',
                fieldProps.success && 'border-green-500'
              )}
            >
              {isSelected && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
          </div>
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            {option.icon && (
              <div className="mr-2 text-gray-500">
                {option.icon}
              </div>
            )}
            <span className={cn('font-medium', sizeClass.text)}>
              {option.label}
            </span>
          </div>
          {option.description && (
            <div className={cn('text-gray-500 mt-1', size === 'sm' ? 'text-xs' : 'text-sm')}>
              {option.description}
            </div>
          )}
        </div>
      </label>
    );
  };

  return (
    <FormField {...fieldProps}>
      <div className={cn('space-y-1', className)}>
        <div className={layoutClasses[layout]}>
          {options.map(renderOption)}
        </div>
      </div>
    </FormField>
  );
};

// Componentes especializados para casos comuns
export const FormRadioGroupSimple: React.FC<Omit<FormRadioGroupProps, 'variant'>> = (props) => (
  <FormRadioGroup {...props} variant="default" />
);

export const FormRadioGroupCards: React.FC<Omit<FormRadioGroupProps, 'variant'>> = (props) => (
  <FormRadioGroup {...props} variant="card" />
);

export const FormRadioGroupButtons: React.FC<Omit<FormRadioGroupProps, 'variant'>> = (props) => (
  <FormRadioGroup {...props} variant="button" />
);

// Hook para facilitar o uso com opções comuns
export const useRadioOptions = () => {
  const yesNoOptions: RadioOption[] = [
    { value: 'yes', label: 'Sim' },
    { value: 'no', label: 'Não' }
  ];

  const genderOptions: RadioOption[] = [
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Feminino' },
    { value: 'other', label: 'Outro' },
    { value: 'prefer-not-to-say', label: 'Prefiro não informar' }
  ];

  const priorityOptions: RadioOption[] = [
    { value: 'low', label: 'Baixa', description: 'Não urgente' },
    { value: 'medium', label: 'Média', description: 'Moderadamente importante' },
    { value: 'high', label: 'Alta', description: 'Urgente' },
    { value: 'critical', label: 'Crítica', description: 'Extremamente urgente' }
  ];

  const statusOptions: RadioOption[] = [
    { value: 'active', label: 'Ativo', description: 'Em atendimento' },
    { value: 'inactive', label: 'Inativo', description: 'Não está em atendimento' },
    { value: 'pending', label: 'Pendente', description: 'Aguardando confirmação' },
    { value: 'completed', label: 'Concluído', description: 'Tratamento finalizado' }
  ];

  const frequencyOptions: RadioOption[] = [
    { value: 'daily', label: 'Diário' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quinzenal' },
    { value: 'monthly', label: 'Mensal' }
  ];

  return {
    yesNoOptions,
    genderOptions,
    priorityOptions,
    statusOptions,
    frequencyOptions
  };
};

export default FormRadioGroup;