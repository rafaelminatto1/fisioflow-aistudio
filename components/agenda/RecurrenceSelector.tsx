import React, { useState } from 'react';
import { Calendar, Repeat, X } from 'lucide-react';
import { RecurrenceRule } from '../../types';
import { format, addMonths } from 'date-fns';

interface RecurrenceSelectorProps {
  recurrence: RecurrenceRule | null;
  setRecurrence: (rule: RecurrenceRule | null) => void;
  startDate: Date;
}

const weekDays = [
  { short: 'D', long: 'Domingo', dayIndex: 0 },
  { short: 'S', long: 'Segunda', dayIndex: 1 },
  { short: 'T', long: 'Terça', dayIndex: 2 },
  { short: 'Q', long: 'Quarta', dayIndex: 3 },
  { short: 'Q', long: 'Quinta', dayIndex: 4 },
  { short: 'S', long: 'Sexta', dayIndex: 5 },
  { short: 'S', long: 'Sábado', dayIndex: 6 }
];

export default function RecurrenceSelector({ recurrence, setRecurrence, startDate }: RecurrenceSelectorProps) {
  const [isRecurrenceEnabled, setIsRecurrenceEnabled] = useState(!!recurrence);

  const handleToggleRecurrence = (enabled: boolean) => {
    setIsRecurrenceEnabled(enabled);
    if (enabled) {
      // Set a default recurrence if it doesn't exist
      if (!recurrence) {
        setRecurrence({
          frequency: 'weekly',
          days: [startDate.getDay()],
          until: format(addMonths(startDate, 3), 'yyyy-MM-dd'),
        });
      }
    } else {
      setRecurrence(null);
    }
  };

  const handleDayToggle = (dayIndex: number) => {
    if (!recurrence) return;
    const newDays = [...recurrence.days];
    if (newDays.includes(dayIndex)) {
      // Prevent removing the initial day of the appointment
      if (dayIndex === startDate.getDay() && newDays.length === 1) return;
      setRecurrence({ ...recurrence, days: newDays.filter(d => d !== dayIndex) });
    } else {
      setRecurrence({ ...recurrence, days: [...newDays, dayIndex].sort() });
    }
  };

  const handleUntilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!recurrence) return;
    setRecurrence({ ...recurrence, until: e.target.value });
  };

  return (
    <div>
      <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
        <Repeat className="w-5 h-5 text-sky-500" />
        Repetir Agendamento
      </label>
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => handleToggleRecurrence(false)}
          className={`px-4 py-2 rounded-lg border-2 font-medium ${!isRecurrenceEnabled ? 'bg-sky-500 text-white border-sky-500' : 'bg-gray-100 text-gray-700 border-gray-100'}`}
        >
          Não Repetir
        </button>
        <button
          onClick={() => handleToggleRecurrence(true)}
          className={`px-4 py-2 rounded-lg border-2 font-medium ${isRecurrenceEnabled ? 'bg-sky-500 text-white border-sky-500' : 'bg-gray-100 text-gray-700 border-gray-100'}`}
        >
          Repetir Semanalmente
        </button>
      </div>

      {isRecurrenceEnabled && recurrence && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Repetir nos dias:</label>
            <div className="flex items-center gap-2">
              {weekDays.map(({ short, dayIndex }) => (
                <button
                  key={dayIndex}
                  onClick={() => handleDayToggle(dayIndex)}
                  disabled={dayIndex === startDate.getDay()}
                  className={`w-10 h-10 rounded-full font-bold text-sm transition-colors ${
                    recurrence.days.includes(dayIndex)
                      ? 'bg-sky-500 text-white'
                      : 'bg-white hover:bg-gray-200 text-gray-700'
                  } ${dayIndex === startDate.getDay() ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  {short}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="until-date" className="block text-sm font-medium text-gray-700 mb-2">
              Repetir até:
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                id="until-date"
                value={recurrence.until}
                onChange={handleUntilChange}
                min={format(startDate, 'yyyy-MM-dd')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
