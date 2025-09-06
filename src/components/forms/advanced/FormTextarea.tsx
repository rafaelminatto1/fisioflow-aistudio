import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { FormField, useFieldState } from './FormField';
import { FormTextareaProps } from '@/types/forms';

/**
 * Componente de textarea avançado com contador e auto-resize
 */
export function FormTextarea({
  name,
  label,
  description,
  required = false,
  disabled = false,
  className,
  placeholder,
  rows = 3,
  maxLength,
  showCounter = true,
  autoResize = true,
}: FormTextareaProps) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  const { state, setValid, setInvalid } = useFieldState();
  
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentRows, setCurrentRows] = useState(rows);

  // Atualiza estado baseado no fieldState
  useEffect(() => {
    if (fieldState.error) {
      setInvalid();
    } else if (fieldState.isDirty && !fieldState.invalid) {
      setValid();
    }
  }, [fieldState.error, fieldState.isDirty, fieldState.invalid, setInvalid, setValid]);

  // Auto-resize do textarea
  const adjustHeight = useCallback(() => {
    if (!autoResize || !textareaRef.current) return;

    const textarea = textareaRef.current;
    
    // Reset height to calculate scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height
    const scrollHeight = textarea.scrollHeight;
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const minHeight = lineHeight * rows;
    const maxHeight = lineHeight * 10; // Máximo de 10 linhas
    
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    const newRows = Math.ceil(newHeight / lineHeight);
    
    textarea.style.height = `${newHeight}px`;
    setCurrentRows(newRows);
  }, [autoResize, rows]);

  // Ajusta altura quando o valor muda
  useEffect(() => {
    adjustHeight();
  }, [field.value, adjustHeight]);

  // Handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    
    // Aplica limite de caracteres
    if (maxLength && value.length > maxLength) {
      value = value.slice(0, maxLength);
    }
    
    field.onChange(value);
    
    // Ajusta altura se auto-resize estiver ativo
    if (autoResize) {
      // Pequeno delay para garantir que o DOM foi atualizado
      setTimeout(adjustHeight, 0);
    }
  }, [field, maxLength, autoResize, adjustHeight]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    field.onBlur();
  }, [field]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Permite quebra de linha com Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      // Comportamento padrão - não faz nada especial
    }
    
    // Permite Tab para indentação
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      // Insere tab ou remove se Shift+Tab
      if (e.shiftKey) {
        // Remove indentação
        if (start > 0 && value[start - 1] === '\t') {
          const newValue = value.slice(0, start - 1) + value.slice(end);
          field.onChange(newValue);
          
          // Reposiciona cursor
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start - 1;
          }, 0);
        }
      } else {
        // Adiciona indentação
        const newValue = value.slice(0, start) + '\t' + value.slice(end);
        field.onChange(newValue);
        
        // Reposiciona cursor
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);
      }
    }
  }, [field]);

  // Calcula estatísticas do texto
  const textStats = {
    characters: field.value?.length || 0,
    words: field.value ? field.value.trim().split(/\s+/).filter(word => word.length > 0).length : 0,
    lines: field.value ? field.value.split('\n').length : 1,
  };

  // Determina a cor do contador baseado na proximidade do limite
  const getCounterColor = () => {
    if (!maxLength) return 'text-gray-400';
    
    const percentage = (textStats.characters / maxLength) * 100;
    
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 90) return 'text-orange-500';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-gray-400';
  };

  // Componente do textarea
  const textareaElement = (
    <div className="relative">
      <textarea
        {...field}
        ref={textareaRef}
        placeholder={placeholder}
        rows={autoResize ? currentRows : rows}
        maxLength={maxLength}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full px-3 py-2 text-sm transition-all duration-200 resize-none',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-0',
          isFocused && 'bg-blue-50/50',
          disabled && 'cursor-not-allowed opacity-60',
          !autoResize && 'resize-y'
        )}
        disabled={disabled}
        style={{
          minHeight: autoResize ? `${rows * 1.5}rem` : undefined,
        }}
      />
      
      {/* Contador e estatísticas */}
      {(showCounter || isFocused) && (
        <div className={cn(
          'absolute -bottom-6 right-0 flex items-center gap-4 text-xs transition-opacity',
          isFocused ? 'opacity-100' : 'opacity-60'
        )}>
          {/* Estatísticas detalhadas quando focado */}
          {isFocused && (
            <div className="flex items-center gap-2 text-gray-400">
              <span>{textStats.words} palavras</span>
              <span>•</span>
              <span>{textStats.lines} linhas</span>
            </div>
          )}
          
          {/* Contador de caracteres */}
          {showCounter && maxLength && (
            <div className={cn('font-medium', getCounterColor())}>
              {textStats.characters}/{maxLength}
            </div>
          )}
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
      className={cn(className, 'pb-6')} // Espaço extra para o contador
      error={fieldState.error?.message}
      state={state}
    >
      {textareaElement}
    </FormField>
  );
}

/**
 * Componente de textarea simples (sem auto-resize)
 */
export function FormTextareaSimple(props: Omit<FormTextareaProps, 'autoResize'>) {
  return <FormTextarea {...props} autoResize={false} />;
}

/**
 * Componente de textarea para código (com fonte monospace)
 */
export function FormTextareaCode({
  className,
  ...props
}: FormTextareaProps) {
  return (
    <FormTextarea
      {...props}
      className={cn('font-mono text-sm', className)}
      autoResize={true}
    />
  );
}

/**
 * Componente de textarea para observações médicas
 */
export function FormTextareaMedical(props: Omit<FormTextareaProps, 'maxLength' | 'showCounter'>) {
  return (
    <FormTextarea
      {...props}
      maxLength={1000}
      showCounter={true}
      placeholder="Descreva as observações, sintomas, evolução do quadro..."
    />
  );
}

/**
 * Hook para gerenciar templates de texto
 */
export function useTextTemplates(templates: Record<string, string>) {
  const insertTemplate = useCallback((templateKey: string, field: any) => {
    const template = templates[templateKey];
    if (template) {
      const currentValue = field.value || '';
      const newValue = currentValue ? `${currentValue}\n\n${template}` : template;
      field.onChange(newValue);
    }
  }, [templates]);

  return { insertTemplate };
}