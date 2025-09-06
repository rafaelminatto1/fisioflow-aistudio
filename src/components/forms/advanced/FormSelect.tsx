import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { FormField, useFieldState } from './FormField';
import { FormSelectProps } from '@/types/forms';
import { ChevronDown, Search, X, Check } from 'lucide-react';

/**
 * Componente de select avançado com busca e múltipla seleção
 */
export function FormSelect({
  name,
  label,
  description,
  required = false,
  disabled = false,
  className,
  options,
  placeholder = 'Selecione uma opção',
  searchable = false,
  multiple = false,
  onSearch,
}: FormSelectProps) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  const { state, setValid, setInvalid } = useFieldState();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Filtra opções baseado na busca
  useEffect(() => {
    if (!searchQuery) {
      setFilteredOptions(options);
      return;
    }

    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredOptions(filtered);
    setHighlightedIndex(-1);
  }, [searchQuery, options]);

  // Atualiza estado baseado no fieldState
  useEffect(() => {
    if (fieldState.error) {
      setInvalid();
    } else if (fieldState.isDirty && !fieldState.invalid) {
      setValid();
    }
  }, [fieldState.error, fieldState.isDirty, fieldState.invalid, setInvalid, setValid]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Foca no input de busca quando abre
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Handlers
  const handleToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => !prev);
    setSearchQuery('');
  }, [disabled]);

  const handleOptionSelect = useCallback((optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(field.value) ? field.value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v: string) => v !== optionValue)
        : [...currentValues, optionValue];
      field.onChange(newValues);
    } else {
      field.onChange(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  }, [field, multiple]);

  const handleRemoveValue = useCallback((valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      const currentValues = Array.isArray(field.value) ? field.value : [];
      const newValues = currentValues.filter((v: string) => v !== valueToRemove);
      field.onChange(newValues);
    } else {
      field.onChange('');
    }
  }, [field, multiple]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  }, [onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex].value);
        }
        break;
    }
  }, [isOpen, filteredOptions, highlightedIndex, handleOptionSelect]);

  // Scroll para opção destacada
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current) {
      const optionElement = optionsRef.current.children[highlightedIndex] as HTMLElement;
      if (optionElement) {
        optionElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Helpers para renderização
  const getSelectedOptions = () => {
    if (multiple) {
      const values = Array.isArray(field.value) ? field.value : [];
      return options.filter(option => values.includes(option.value));
    } else {
      return options.filter(option => option.value === field.value);
    }
  };

  const isOptionSelected = (optionValue: string) => {
    if (multiple) {
      const values = Array.isArray(field.value) ? field.value : [];
      return values.includes(optionValue);
    }
    return field.value === optionValue;
  };

  const selectedOptions = getSelectedOptions();
  const hasValue = multiple ? selectedOptions.length > 0 : !!field.value;

  // Componente do select
  const selectElement = (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full px-3 py-2 text-left text-sm transition-all duration-200',
          'focus:outline-none focus:ring-0',
          'flex items-center justify-between gap-2',
          disabled && 'cursor-not-allowed opacity-60'
        )}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex-1 min-w-0">
          {hasValue ? (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md',
                    multiple
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-900'
                  )}
                >
                  {option.label}
                  {multiple && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveValue(option.value, e)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={cn(
          'absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg',
          'max-h-60 overflow-hidden'
        )}>
          {/* Campo de busca */}
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Buscar..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Lista de opções */}
          <div
            ref={optionsRef}
            className="max-h-48 overflow-y-auto"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                {searchQuery ? 'Nenhuma opção encontrada' : 'Nenhuma opção disponível'}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = isOptionSelected(option.value);
                const isHighlighted = index === highlightedIndex;
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionSelect(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm transition-colors',
                      'flex items-center justify-between',
                      'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                      isHighlighted && 'bg-blue-50',
                      isSelected && 'bg-blue-100 text-blue-900',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
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
      {selectElement}
    </FormField>
  );
}

/**
 * Componente de select simples (sem busca)
 */
export function FormSelectSimple(props: Omit<FormSelectProps, 'searchable' | 'onSearch'>) {
  return <FormSelect {...props} searchable={false} />;
}

/**
 * Componente de select com múltipla seleção
 */
export function FormSelectMultiple(props: Omit<FormSelectProps, 'multiple'>) {
  return <FormSelect {...props} multiple={true} />;
}