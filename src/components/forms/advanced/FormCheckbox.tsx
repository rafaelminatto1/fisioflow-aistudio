'use client';

import React from 'react';
import { Check, Minus } from 'lucide-react';
import { FormField } from './FormField';
import { FormFieldProps } from '@/types/forms';
import { cn } from '@/lib/utils';

interface FormCheckboxProps extends Omit<FormFieldProps, 'children'> {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card' | 'switch';
  className?: string;
  checkboxClassName?: string;
}

interface FormCheckboxGroupProps extends Omit<FormFieldProps, 'children'> {
  options: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  value?: string[];
  onChange: (values: string[]) => void;
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card';
  className?: string;
}

const sizeClasses = {
  sm: {
    checkbox: 'w-4 h-4',
    icon: 'w-3 h-3',
    text: 'text-sm'
  },
  md: {
    checkbox: 'w-5 h-5',
    icon: 'w-4 h-4',
    text: 'text-base'
  },
  lg: {
    checkbox: 'w-6 h-6',
    icon: 'w-5 h-5',
    text: 'text-lg'
  }
};

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  checked = false,
  onChange,
  indeterminate = false,
  size = 'md',
  variant = 'default',
  className,
  checkboxClassName,
  ...fieldProps
}) => {
  const handleChange = () => {
    if (!fieldProps.disabled) {
      onChange(!checked);
    }
  };

  const sizeClass = sizeClasses[size];

  if (variant === 'switch') {
    return (
      <FormField {...fieldProps}>
        <label className={cn('flex items-center cursor-pointer', className)}>
          <div className="relative">
            <input
              type="checkbox"
              checked={checked}
              onChange={handleChange}
              disabled={fieldProps.disabled}
              className="sr-only"
            />
            <div
              className={cn(
                'block w-12 h-6 rounded-full transition-colors duration-200',
                checked ? 'bg-blue-500' : 'bg-gray-300',
                fieldProps.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200',
                  checked && 'transform translate-x-6'
                )}
              />
            </div>
          </div>
          {fieldProps.label && (
            <span className={cn('ml-3', sizeClass.text, fieldProps.disabled && 'text-gray-500')}>
              {fieldProps.label}
            </span>
          )}
        </label>
      </FormField>
    );
  }

  if (variant === 'card') {
    return (
      <FormField {...fieldProps}>
        <label
          className={cn(
            'flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200',
            checked ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
            fieldProps.disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <div className="flex-shrink-0 mt-1">
            <div
              className={cn(
                'flex items-center justify-center border-2 rounded transition-all duration-200',
                sizeClass.checkbox,
                checked || indeterminate
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-white border-gray-300',
                fieldProps.error && 'border-red-500',
                fieldProps.success && 'border-green-500',
                checkboxClassName
              )}
            >
              {indeterminate ? (
                <Minus className={sizeClass.icon} />
              ) : checked ? (
                <Check className={sizeClass.icon} />
              ) : null}
            </div>
          </div>
          <div className="ml-3 flex-1">
            {fieldProps.label && (
              <div className={cn('font-medium', sizeClass.text, fieldProps.disabled && 'text-gray-500')}>
                {fieldProps.label}
              </div>
            )}
            {fieldProps.description && (
              <div className={cn('text-gray-500 mt-1', size === 'sm' ? 'text-xs' : 'text-sm')}>
                {fieldProps.description}
              </div>
            )}
          </div>
        </label>
      </FormField>
    );
  }

  // Default variant
  return (
    <FormField {...fieldProps}>
      <label className={cn('flex items-center cursor-pointer', className)}>
        <div className="relative flex-shrink-0">
          <input
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            disabled={fieldProps.disabled}
            className="sr-only"
          />
          <div
            className={cn(
              'flex items-center justify-center border-2 rounded transition-all duration-200',
              sizeClass.checkbox,
              checked || indeterminate
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white border-gray-300 hover:border-gray-400',
              fieldProps.disabled && 'opacity-50 cursor-not-allowed',
              fieldProps.error && 'border-red-500',
              fieldProps.success && 'border-green-500',
              checkboxClassName
            )}
          >
            {indeterminate ? (
              <Minus className={sizeClass.icon} />
            ) : checked ? (
              <Check className={sizeClass.icon} />
            ) : null}
          </div>
        </div>
        {fieldProps.label && (
          <span className={cn('ml-3', sizeClass.text, fieldProps.disabled && 'text-gray-500')}>
            {fieldProps.label}
          </span>
        )}
      </label>
    </FormField>
  );
};

export const FormCheckboxGroup: React.FC<FormCheckboxGroupProps> = ({
  options,
  value = [],
  onChange,
  layout = 'vertical',
  columns = 2,
  size = 'md',
  variant = 'default',
  className,
  ...fieldProps
}) => {
  const handleOptionChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter(v => v !== optionValue));
    }
  };

  const isAllSelected = options.length > 0 && value.length === options.filter(opt => !opt.disabled).length;
  const isIndeterminate = value.length > 0 && value.length < options.filter(opt => !opt.disabled).length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allValues = options.filter(opt => !opt.disabled).map(opt => opt.value);
      onChange(allValues);
    } else {
      onChange([]);
    }
  };

  const layoutClasses = {
    vertical: 'space-y-3',
    horizontal: 'flex flex-wrap gap-4',
    grid: `grid gap-3 grid-cols-${columns}`
  };

  return (
    <FormField {...fieldProps}>
      <div className={cn('space-y-4', className)}>
        {/* Select All Option */}
        {options.length > 1 && (
          <div className="border-b border-gray-200 pb-3">
            <FormCheckbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={handleSelectAll}
              label="Selecionar todos"
              size={size}
              disabled={fieldProps.disabled}
            />
          </div>
        )}

        {/* Options */}
        <div className={layoutClasses[layout]}>
          {options.map((option) => {
            const isChecked = value.includes(option.value);
            const isDisabled = fieldProps.disabled || option.disabled;

            if (variant === 'card') {
              return (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200',
                    isChecked ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={cn(
                        'flex items-center justify-center border-2 rounded transition-all duration-200',
                        sizeClasses[size].checkbox,
                        isChecked
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white border-gray-300'
                      )}
                    >
                      {isChecked && <Check className={sizeClasses[size].icon} />}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className={cn('font-medium', sizeClasses[size].text)}>
                      {option.label}
                    </div>
                    {option.description && (
                      <div className={cn('text-gray-500 mt-1', size === 'sm' ? 'text-xs' : 'text-sm')}>
                        {option.description}
                      </div>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleOptionChange(option.value, e.target.checked)}
                    disabled={isDisabled}
                    className="sr-only"
                  />
                </label>
              );
            }

            return (
              <FormCheckbox
                key={option.value}
                checked={isChecked}
                onChange={(checked) => handleOptionChange(option.value, checked)}
                label={option.label}
                description={option.description}
                size={size}
                disabled={isDisabled}
              />
            );
          })}
        </div>
      </div>
    </FormField>
  );
};

// Componente simplificado para casos básicos
export const FormCheckboxSimple: React.FC<Omit<FormCheckboxProps, 'variant'>> = (props) => (
  <FormCheckbox {...props} variant="default" />
);

// Componente switch
export const FormSwitch: React.FC<Omit<FormCheckboxProps, 'variant'>> = (props) => (
  <FormCheckbox {...props} variant="switch" />
);

export default FormCheckbox;