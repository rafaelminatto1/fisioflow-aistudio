'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { FormField } from './FormField';
import { FormFieldProps } from '@/types/forms';
import { cn } from '@/lib/utils';

interface FormTimePickerProps extends Omit<FormFieldProps, 'children'> {
  value?: string; // Format: "HH:mm" or "HH:mm:ss"
  onChange: (time: string) => void;
  placeholder?: string;
  format?: '12h' | '24h';
  showSeconds?: boolean;
  step?: number; // Minutes step (5, 10, 15, 30)
  minTime?: string;
  maxTime?: string;
  presets?: boolean;
  className?: string;
}

interface TimeInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
}

const TimeInput: React.FC<TimeInputProps> = ({ value, onChange, min, max, step = 1, label }) => {
  const handleIncrement = () => {
    const newValue = value + step;
    onChange(newValue > max ? min : newValue);
  };

  const handleDecrement = () => {
    const newValue = value - step;
    onChange(newValue < min ? max : newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleIncrement}
        className="p-1 hover:bg-gray-100 rounded"
      >
        <ChevronUp className="w-3 h-3" />
      </button>
      <div className="flex flex-col items-center py-2">
        <input
          type="text"
          value={value.toString().padStart(2, '0')}
          onChange={handleInputChange}
          className="w-12 text-center text-lg font-mono border-0 focus:outline-none focus:bg-blue-50 rounded"
        />
        <span className="text-xs text-gray-500 mt-1">{label}</span>
      </div>
      <button
        type="button"
        onClick={handleDecrement}
        className="p-1 hover:bg-gray-100 rounded"
      >
        <ChevronDown className="w-3 h-3" />
      </button>
    </div>
  );
};

const parseTime = (timeString: string): { hours: number; minutes: number; seconds: number } => {
  const parts = timeString.split(':');
  return {
    hours: parseInt(parts[0]) || 0,
    minutes: parseInt(parts[1]) || 0,
    seconds: parseInt(parts[2]) || 0
  };
};

const formatTime = (hours: number, minutes: number, seconds: number, format: '12h' | '24h', showSeconds: boolean): string => {
  if (format === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const timeStr = showSeconds 
      ? `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return `${timeStr} ${period}`;
  } else {
    return showSeconds 
      ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
};

const isTimeInRange = (time: string, minTime?: string, maxTime?: string): boolean => {
  if (!minTime && !maxTime) return true;
  
  const timeMinutes = timeToMinutes(time);
  
  if (minTime) {
    const minMinutes = timeToMinutes(minTime);
    if (timeMinutes < minMinutes) return false;
  }
  
  if (maxTime) {
    const maxMinutes = timeToMinutes(maxTime);
    if (timeMinutes > maxMinutes) return false;
  }
  
  return true;
};

const timeToMinutes = (time: string): number => {
  const { hours, minutes } = parseTime(time);
  return hours * 60 + minutes;
};

export const FormTimePicker: React.FC<FormTimePickerProps> = ({
  value = '',
  onChange,
  placeholder = 'Selecione um horário',
  format = '24h',
  showSeconds = false,
  step = 1,
  minTime,
  maxTime,
  presets = true,
  className,
  ...fieldProps
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { hours, minutes, seconds } = parseTime(value);
  const [tempHours, setTempHours] = useState(hours);
  const [tempMinutes, setTempMinutes] = useState(minutes);
  const [tempSeconds, setTempSeconds] = useState(seconds);
  const [period, setPeriod] = useState<'AM' | 'PM'>(hours >= 12 ? 'PM' : 'AM');

  useEffect(() => {
    if (value) {
      const formatted = formatTime(hours, minutes, seconds, format, showSeconds);
      setInputValue(formatted);
      setTempHours(format === '12h' ? (hours === 0 ? 12 : hours > 12 ? hours - 12 : hours) : hours);
      setTempMinutes(minutes);
      setTempSeconds(seconds);
      setPeriod(hours >= 12 ? 'PM' : 'AM');
    } else {
      setInputValue('');
    }
  }, [value, format, showSeconds, hours, minutes, seconds]);

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
    
    // Try to parse the input
    const timeRegex = format === '12h' 
      ? /^(\d{1,2}):(\d{2})(?::(\d{2}))? ?(AM|PM)?$/i
      : /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
    
    const match = newValue.match(timeRegex);
    if (match) {
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const s = parseInt(match[3]) || 0;
      const p = match[4]?.toUpperCase();
      
      if (format === '12h' && p) {
        if (p === 'PM' && h !== 12) h += 12;
        if (p === 'AM' && h === 12) h = 0;
      }
      
      const timeString = showSeconds ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` 
                                     : `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      
      if (isTimeInRange(timeString, minTime, maxTime)) {
        onChange(timeString);
      }
    }
  };

  const handleTimeChange = () => {
    let finalHours = tempHours;
    
    if (format === '12h') {
      if (period === 'PM' && tempHours !== 12) {
        finalHours = tempHours + 12;
      } else if (period === 'AM' && tempHours === 12) {
        finalHours = 0;
      }
    }
    
    const timeString = showSeconds 
      ? `${finalHours.toString().padStart(2, '0')}:${tempMinutes.toString().padStart(2, '0')}:${tempSeconds.toString().padStart(2, '0')}`
      : `${finalHours.toString().padStart(2, '0')}:${tempMinutes.toString().padStart(2, '0')}`;
    
    if (isTimeInRange(timeString, minTime, maxTime)) {
      onChange(timeString);
    }
  };

  const handlePresetClick = (presetTime: string) => {
    if (isTimeInRange(presetTime, minTime, maxTime)) {
      onChange(presetTime);
      setIsOpen(false);
    }
  };

  const commonPresets = [
    { label: 'Manhã', times: ['08:00', '09:00', '10:00', '11:00'] },
    { label: 'Tarde', times: ['13:00', '14:00', '15:00', '16:00', '17:00'] },
    { label: 'Noite', times: ['18:00', '19:00', '20:00', '21:00'] }
  ];

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
            <Clock className="w-4 h-4" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 left-0">
            <div className="flex">
              {/* Time Picker */}
              <div className="p-4 bg-white border rounded-lg shadow-lg">
                <div className="flex items-center justify-center space-x-2">
                  <TimeInput
                    value={tempHours}
                    onChange={(h) => {
                      setTempHours(h);
                      handleTimeChange();
                    }}
                    min={format === '12h' ? 1 : 0}
                    max={format === '12h' ? 12 : 23}
                    label="Hora"
                  />
                  
                  <div className="text-2xl font-bold text-gray-400">:</div>
                  
                  <TimeInput
                    value={tempMinutes}
                    onChange={(m) => {
                      setTempMinutes(m);
                      handleTimeChange();
                    }}
                    min={0}
                    max={59}
                    step={step}
                    label="Min"
                  />
                  
                  {showSeconds && (
                    <>
                      <div className="text-2xl font-bold text-gray-400">:</div>
                      <TimeInput
                        value={tempSeconds}
                        onChange={(s) => {
                          setTempSeconds(s);
                          handleTimeChange();
                        }}
                        min={0}
                        max={59}
                        label="Seg"
                      />
                    </>
                  )}
                  
                  {format === '12h' && (
                    <div className="flex flex-col ml-4">
                      <button
                        type="button"
                        onClick={() => {
                          setPeriod('AM');
                          handleTimeChange();
                        }}
                        className={cn(
                          'px-3 py-1 text-sm rounded-t border',
                          period === 'AM' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPeriod('PM');
                          handleTimeChange();
                        }}
                        className={cn(
                          'px-3 py-1 text-sm rounded-b border border-t-0',
                          period === 'PM' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        PM
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Presets */}
              {presets && (
                <div className="ml-2 p-3 bg-white border rounded-lg shadow-lg">
                  <h4 className="text-sm font-medium mb-3 text-gray-700">Horários Comuns</h4>
                  <div className="space-y-3">
                    {commonPresets.map((preset) => (
                      <div key={preset.label}>
                        <h5 className="text-xs font-medium text-gray-500 mb-1">{preset.label}</h5>
                        <div className="grid grid-cols-2 gap-1">
                          {preset.times.map((time) => {
                            const isDisabled = !isTimeInRange(time, minTime, maxTime);
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => handlePresetClick(time)}
                                disabled={isDisabled}
                                className={cn(
                                  'px-2 py-1 text-xs rounded hover:bg-blue-50 text-left',
                                  isDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'
                                )}
                              >
                                {formatTime(...parseTime(time), hours, minutes, seconds, format, false)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
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
export const FormTimePickerSimple: React.FC<Omit<FormTimePickerProps, 'presets' | 'showSeconds'>> = (props) => (
  <FormTimePicker {...props} presets={false} showSeconds={false} />
);

export default FormTimePicker;