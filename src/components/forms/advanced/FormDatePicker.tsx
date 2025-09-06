'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { FormField } from './FormField';
import { FormFieldProps } from '@/types/forms';
import { cn } from '@/lib/utils';

interface FormDatePickerProps extends Omit<FormFieldProps, 'children'> {
  value?: Date | string;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  showTime?: boolean;
  format?: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
  shortcuts?: boolean;
  className?: string;
}

interface CalendarProps {
  selected?: Date;
  onSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({
  selected,
  onSelect,
  minDate,
  maxDate,
  disabledDates = [],
  className
}) => {
  const [currentMonth, setCurrentMonth] = useState(
    selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date()
  );

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const today = new Date();

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return disabledDates.some(disabled => 
      disabled.toDateString() === date.toDateString()
    );
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!isDateDisabled(date)) {
      onSelect(date);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className={cn('p-3 bg-white border rounded-lg shadow-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigateMonth('prev')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          type="button"
          onClick={() => navigateMonth('next')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-xs font-medium text-gray-500 text-center">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="p-2" />
        ))}
        
        {/* Days of the month */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const isSelected = selected && date.toDateString() === selected.toDateString();
          const isToday = date.toDateString() === today.toDateString();
          const isDisabled = isDateDisabled(date);

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              className={cn(
                'p-2 text-sm rounded hover:bg-blue-50 transition-colors',
                {
                  'bg-blue-500 text-white hover:bg-blue-600': isSelected,
                  'bg-blue-100 text-blue-600': isToday && !isSelected,
                  'text-gray-300 cursor-not-allowed hover:bg-transparent': isDisabled,
                  'hover:bg-gray-100': !isSelected && !isDisabled
                }
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const formatDate = (date: Date, format: string): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  switch (format) {
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
    case 'MM/dd/yyyy':
      return `${month}/${day}/${year}`;
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

const parseDate = (dateString: string, format: string): Date | null => {
  if (!dateString) return null;
  
  try {
    let day: number, month: number, year: number;
    
    switch (format) {
      case 'dd/MM/yyyy': {
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        day = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        year = parseInt(parts[2]);
        break;
      }
      case 'MM/dd/yyyy': {
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        month = parseInt(parts[0]) - 1;
        day = parseInt(parts[1]);
        year = parseInt(parts[2]);
        break;
      }
      case 'yyyy-MM-dd': {
        const parts = dateString.split('-');
        if (parts.length !== 3) return null;
        year = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        day = parseInt(parts[2]);
        break;
      }
      default:
        return null;
    }
    
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Selecione uma data',
  minDate,
  maxDate,
  disabledDates,
  format = 'dd/MM/yyyy',
  shortcuts = true,
  className,
  ...fieldProps
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedDate = React.useMemo(() => {
    if (value instanceof Date) return value;
    if (typeof value === 'string') return parseDate(value, format);
    return null;
  }, [value, format]);

  useEffect(() => {
    if (selectedDate) {
      setInputValue(formatDate(selectedDate, format));
    } else {
      setInputValue('');
    }
  }, [selectedDate, format]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const parsedDate = parseDate(newValue, format);
    if (parsedDate) {
      onChange(parsedDate);
    } else if (newValue === '') {
      onChange(undefined);
    }
  };

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleShortcut = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    onChange(date);
    setIsOpen(false);
  };

  return (
    <FormField {...fieldProps}>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={cn(
              'w-full px-3 py-2 pr-10 border border-gray-300 rounded-md',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:bg-gray-50 disabled:text-gray-500',
              fieldProps.error && 'border-red-500 focus:ring-red-500',
              fieldProps.success && 'border-green-500 focus:ring-green-500',
              className
            )}
            disabled={fieldProps.disabled}
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={fieldProps.disabled}
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 left-0">
            <div className="flex">
              <Calendar
                selected={selectedDate || undefined}
                onSelect={handleDateSelect}
                minDate={minDate}
                maxDate={maxDate}
                disabledDates={disabledDates}
              />
              
              {shortcuts && (
                <div className="ml-2 p-3 bg-white border rounded-lg shadow-lg">
                  <h4 className="text-sm font-medium mb-2 text-gray-700">Atalhos</h4>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleShortcut(0)}
                      className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShortcut(1)}
                      className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Amanhã
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShortcut(7)}
                      className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    >
                      +7 dias
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShortcut(30)}
                      className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    >
                      +30 dias
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
};

// Componente simplificado para casos básicos
export const FormDatePickerSimple: React.FC<Omit<FormDatePickerProps, 'shortcuts'>> = (props) => (
  <FormDatePicker {...props} shortcuts={false} />
);

export default FormDatePicker;