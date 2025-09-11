'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Repeat } from 'lucide-react';
import { RecurrenceRule, RecurrenceType } from '../../types';

interface RecurrenceSelectorProps {
  value?: RecurrenceRule;
  onChange: (rule: RecurrenceRule | null) => void;
  disabled?: boolean;
}

const RecurrenceSelector: React.FC<RecurrenceSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [isEnabled, setIsEnabled] = useState(!!value);

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      onChange(null);
    } else {
      // Set default rule
      onChange({
        type: 'weekly',
        interval: 1,
        endDate: null,
        occurrences: null
      });
    }
  };

  const handleRuleChange = (updates: Partial<RecurrenceRule>) => {
    if (!isEnabled || !value) return;
    
    onChange({
      ...value,
      ...updates
    });
  };

  const recurrenceOptions = [
    { value: 'daily', label: 'Diariamente' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'biweekly', label: 'Quinzenalmente' },
    { value: 'monthly', label: 'Mensalmente' }
  ];

  return (
    <div className="space-y-4">
      {/* Toggle Recurrence */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="enable-recurrence"
          checked={isEnabled}
          onChange={(e) => handleToggle(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="enable-recurrence" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <Repeat className="w-4 h-4" />
          <span>Agendamento recorrente</span>
        </label>
      </div>

      {/* Recurrence Configuration */}
      {isEnabled && value && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          {/* Frequency Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequência
            </label>
            <select
              value={value.type}
              onChange={(e) => handleRuleChange({ type: e.target.value as RecurrenceType })}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {recurrenceOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Repetir a cada
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="12"
                value={value.interval}
                onChange={(e) => handleRuleChange({ interval: parseInt(e.target.value) || 1 })}
                disabled={disabled}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                {value.type === 'daily' && (value.interval === 1 ? 'dia' : 'dias')}
                {value.type === 'weekly' && (value.interval === 1 ? 'semana' : 'semanas')}
                {value.type === 'biweekly' && (value.interval === 1 ? 'quinzena' : 'quinzenas')}
                {value.type === 'monthly' && (value.interval === 1 ? 'mês' : 'meses')}
              </span>
            </div>
          </div>

          {/* End Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Terminar
            </label>
            <div className="space-y-3">
              {/* Never ends */}
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="never-ends"
                  name="end-condition"
                  checked={!value.endDate && !value.occurrences}
                  onChange={() => handleRuleChange({ endDate: null, occurrences: null })}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="never-ends" className="text-sm text-gray-700">
                  Nunca
                </label>
              </div>

              {/* End by date */}
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="end-by-date"
                  name="end-condition"
                  checked={!!value.endDate}
                  onChange={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    handleRuleChange({ endDate: tomorrow, occurrences: null });
                  }}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="end-by-date" className="text-sm text-gray-700">
                  Em uma data específica
                </label>
                {value.endDate && (
                  <input
                    type="date"
                    value={value.endDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      handleRuleChange({ endDate: date });
                    }}
                    disabled={disabled}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* End by occurrences */}
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="end-by-occurrences"
                  name="end-condition"
                  checked={!!value.occurrences}
                  onChange={() => handleRuleChange({ occurrences: 10, endDate: null })}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="end-by-occurrences" className="text-sm text-gray-700">
                  Após
                </label>
                {value.occurrences && (
                  <>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={value.occurrences}
                      onChange={(e) => handleRuleChange({ occurrences: parseInt(e.target.value) || 1 })}
                      disabled={disabled}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">ocorrências</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <div className="flex items-center space-x-2 text-blue-800">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Resumo:</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {getRecurrenceDescription(value)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

function getRecurrenceDescription(rule: RecurrenceRule): string {
  let description = 'Repetir ';
  
  if (rule.interval === 1) {
    switch (rule.type) {
      case 'daily':
        description += 'todos os dias';
        break;
      case 'weekly':
        description += 'toda semana';
        break;
      case 'biweekly':
        description += 'a cada duas semanas';
        break;
      case 'monthly':
        description += 'todo mês';
        break;
    }
  } else {
    switch (rule.type) {
      case 'daily':
        description += `a cada ${rule.interval} dias`;
        break;
      case 'weekly':
        description += `a cada ${rule.interval} semanas`;
        break;
      case 'biweekly':
        description += `a cada ${rule.interval * 2} semanas`;
        break;
      case 'monthly':
        description += `a cada ${rule.interval} meses`;
        break;
    }
  }

  if (rule.endDate) {
    description += ` até ${rule.endDate.toLocaleDateString('pt-BR')}`;
  } else if (rule.occurrences) {
    description += ` por ${rule.occurrences} vezes`;
  }

  return description;
}

export default RecurrenceSelector;