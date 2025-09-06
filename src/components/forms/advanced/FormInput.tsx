import React, { useState, useCallback, useEffect } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { FormField, useFieldState } from './FormField';
import { FormInputProps } from '@/types/forms';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Componente de input avançado com validação e estados visuais
 */
export function FormInput({
  name,
  label,
  description,
  required = false,
  disabled = false,
  className,
  type = 'text',
  placeholder,
  mask,
  maxLength,
  validation,
}: FormInputProps) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  const { state, setState, setValidating, setValid, setInvalid } = useFieldState();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Aplica máscara ao valor
  const applyMask = useCallback((value: string, maskPattern?: string) => {
    if (!maskPattern) return value;

    // Remove caracteres não numéricos
    const cleanValue = value.replace(/\D/g, '');
    let maskedValue = '';
    let valueIndex = 0;

    for (let i = 0; i < maskPattern.length && valueIndex < cleanValue.length; i++) {
      if (maskPattern[i] === '0') {
        maskedValue += cleanValue[valueIndex];
        valueIndex++;
      } else {
        maskedValue += maskPattern[i];
      }
    }

    return maskedValue;
  }, []);

  // Validação em tempo real
  const validateField = useCallback(async (value: string) => {
    if (!validation) return;

    setValidating();
    
    try {
      const result = await validation(value);
      if (result === true) {
        setValid();
      } else if (typeof result === 'string') {
        setInvalid();
      }
    } catch (error) {
      setInvalid();
    }
  }, [validation, setValidating, setValid, setInvalid]);

  // Atualiza estado baseado no fieldState do react-hook-form
  useEffect(() => {
    if (fieldState.error) {
      setInvalid();
    } else if (fieldState.isDirty && !fieldState.invalid) {
      setValid();
    }
  }, [fieldState.error, fieldState.isDirty, fieldState.invalid, setInvalid, setValid]);

  // Handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Aplica máscara se definida
    if (mask) {
      value = applyMask(value, mask);
    }
    
    // Aplica limite de caracteres
    if (maxLength && value.length > maxLength) {
      value = value.slice(0, maxLength);
    }
    
    field.onChange(value);
    
    // Validação em tempo real se o campo já foi tocado
    if (fieldState.isTouched && validation) {
      validateField(value);
    }
  }, [field, mask, maxLength, applyMask, fieldState.isTouched, validation, validateField]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    field.onBlur();
    
    // Validação no blur
    if (validation) {
      validateField(e.target.value);
    }
  }, [field, validation, validateField]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Determina o tipo do input
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Componente do input
  const inputElement = (
    <div className="relative">
      <input
        {...field}
        type={inputType}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={cn(
          'w-full px-3 py-2 text-sm transition-all duration-200',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-0',
          isFocused && 'bg-blue-50/50',
          disabled && 'cursor-not-allowed',
          type === 'password' && 'pr-10'
        )}
        disabled={disabled}
      />
      
      {/* Botão para mostrar/ocultar senha */}
      {type === 'password' && (
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2',
            'text-gray-400 hover:text-gray-600 transition-colors',
            'focus:outline-none focus:text-gray-600'
          )}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      )}
      
      {/* Contador de caracteres */}
      {maxLength && isFocused && (
        <div className="absolute -bottom-5 right-0 text-xs text-gray-400">
          {field.value?.length || 0}/{maxLength}
        </div>
      )}
    </div>
  );

  return (
    <FormField
      name={name}
      label={label}
      description={description}
      required={required}
      disabled={disabled}
      className={className}
      error={fieldState.error?.message}
      state={state}
    >
      {inputElement}
    </FormField>
  );
}

/**
 * Máscaras predefinidas comuns
 */
export const inputMasks = {
  cpf: '000.000.000-00',
  cnpj: '00.000.000/0000-00',
  phone: '(00) 00000-0000',
  cep: '00000-000',
  date: '00/00/0000',
  time: '00:00',
  currency: 'R$ 0.000,00',
};

/**
 * Componente especializado para CPF
 */
export function FormInputCPF(props: Omit<FormInputProps, 'mask' | 'type'>) {
  return (
    <FormInput
      {...props}
      type="text"
      mask={inputMasks.cpf}
      maxLength={14}
      placeholder="000.000.000-00"
    />
  );
}

/**
 * Componente especializado para telefone
 */
export function FormInputPhone(props: Omit<FormInputProps, 'mask' | 'type'>) {
  return (
    <FormInput
      {...props}
      type="tel"
      mask={inputMasks.phone}
      maxLength={15}
      placeholder="(00) 00000-0000"
    />
  );
}

/**
 * Componente especializado para CEP
 */
export function FormInputCEP(props: Omit<FormInputProps, 'mask' | 'type'>) {
  return (
    <FormInput
      {...props}
      type="text"
      mask={inputMasks.cep}
      maxLength={9}
      placeholder="00000-000"
    />
  );
}

/**
 * Componente especializado para email
 */
export function FormInputEmail(props: Omit<FormInputProps, 'type'>) {
  return (
    <FormInput
      {...props}
      type="email"
      placeholder="seu@email.com"
    />
  );
}

/**
 * Componente especializado para senha
 */
export function FormInputPassword(props: Omit<FormInputProps, 'type'>) {
  return (
    <FormInput
      {...props}
      type="password"
      placeholder="••••••••"
    />
  );
}