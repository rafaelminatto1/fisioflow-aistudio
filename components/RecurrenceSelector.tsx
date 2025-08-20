

import React, { useState } from 'react';
import { Repeat } from 'lucide-react';
import { RecurrenceRule } from '../types';

interface RecurrenceSelectorProps {
    recurrenceRule: RecurrenceRule | undefined;
    onChange: (rule: RecurrenceRule | undefined) => void;
}

const weekDays = [
    { label: 'D', value: 0 }, { label: 'S', value: 1 }, { label: 'T', value: 2 },
    { label: 'Q', value: 3 }, { label: 'Q', value: 4 }, { label: 'S', value: 5 },
    { label: 'S', value: 6 }
];

const RecurrenceSelector: React.FC<RecurrenceSelectorProps> = ({ recurrenceRule, onChange }) => {
    const [isRecurring, setIsRecurring] = useState(!!recurrenceRule);

    const handleToggleRecurring = (checked: boolean) => {
        setIsRecurring(checked);
        if (!checked) {
            onChange(undefined);
        } else {
            // Default to weekly on current day of week, for 1 month
            const today = new Date();
            const untilDate = new Date();
            untilDate.setMonth(untilDate.getMonth() + 1);
            
            onChange({
                frequency: 'weekly',
                days: [today.getDay()],
                until: untilDate.toISOString().split('T')[0]
            });
        }
    };
    
    const handleDayToggle = (dayValue: number) => {
        if (!recurrenceRule) return;
        const newDays = recurrenceRule.days.includes(dayValue)
            ? recurrenceRule.days.filter(d => d !== dayValue)
            : [...recurrenceRule.days, dayValue];
        
        // Ensure at least one day is selected if recurring
        if (newDays.length > 0) {
           onChange({ ...recurrenceRule, days: newDays });
        }
    };
    
    const handleUntilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!recurrenceRule) return;
        onChange({ ...recurrenceRule, until: e.target.value });
    };

    return (
        <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
                <label htmlFor="recurring-toggle" className="flex items-center text-sm font-medium text-slate-700">
                    <Repeat className="w-4 h-4 mr-2 text-slate-400" /> Repetir Consulta
                </label>
                <input
                    type="checkbox"
                    id="recurring-toggle"
                    checked={isRecurring}
                    onChange={(e) => handleToggleRecurring(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
            </div>
            {isRecurring && recurrenceRule && (
                <div className="mt-4 space-y-3 animate-fade-in-fast">
                    <div>
                         <label className="text-xs font-semibold text-slate-600">Repetir Semanalmente nos dias:</label>
                         <div className="mt-2 flex items-center justify-between space-x-1">
                            {weekDays.map(day => (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => handleDayToggle(day.value)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors
                                        ${recurrenceRule.days.includes(day.value) ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}
                                    `}
                                >
                                    {day.label}
                                </button>
                            ))}
                         </div>
                    </div>
                     <div>
                        <label htmlFor="until-date" className="text-xs font-semibold text-slate-600">Até:</label>
                        <input
                            id="until-date"
                            type="date"
                            value={recurrenceRule.until}
                            onChange={handleUntilChange}
                            className="mt-1 w-full p-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-fast { animation: fade-in-fast 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default RecurrenceSelector;