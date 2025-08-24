// pages/AgendaSettingsPage.tsx
import React, { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { SchedulingSettings, TimeSlotLimit } from '../types';
import { schedulingSettingsService } from '../services/schedulingSettingsService';
import PageHeader from '../components/PageHeader';
import { useToast } from '../contexts/ToastContext';

type DayType = 'weekday' | 'saturday';

const TimeSlotRow: React.FC<{
    slot: TimeSlotLimit;
    onUpdate: (field: keyof TimeSlotLimit, value: string | number) => void;
    onRemove: () => void;
}> = ({ slot, onUpdate, onRemove }) => (
    <div className="grid grid-cols-4 gap-3 items-center">
        <input
            type="time"
            value={slot.startTime}
            onChange={e => onUpdate('startTime', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg"
        />
        <input
            type="time"
            value={slot.endTime}
            onChange={e => onUpdate('endTime', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg"
        />
        <input
            type="number"
            min="0"
            value={slot.limit}
            onChange={e => onUpdate('limit', parseInt(e.target.value, 10) || 0)}
            className="w-full p-2 border border-slate-300 rounded-lg"
        />
        <button onClick={onRemove} className="p-2 text-red-500 hover:bg-red-50 rounded-full justify-self-center">
            <Trash2 className="w-5 h-5" />
        </button>
    </div>
);


const AgendaSettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<SchedulingSettings>(() => schedulingSettingsService.getSettings());
    const { showToast } = useToast();

    const handleUpdateSlot = (dayType: DayType, index: number, field: keyof TimeSlotLimit, value: string | number) => {
        setSettings(prevSettings => {
            const newLimits = [...prevSettings.limits[dayType]];
            const updatedSlot = { ...newLimits[index] };

            if (field === 'limit') {
                updatedSlot.limit = Number(value);
            } else if (field === 'startTime' || field === 'endTime' || field === 'id') {
                updatedSlot[field] = String(value);
            }
            
            newLimits[index] = updatedSlot;

            return {
                ...prevSettings,
                limits: {
                    ...prevSettings.limits,
                    [dayType]: newLimits,
                },
            };
        });
    };

    const handleRemoveSlot = (dayType: DayType, index: number) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            limits: {
                ...prevSettings.limits,
                [dayType]: prevSettings.limits[dayType].filter((_, i) => i !== index),
            },
        }));
    };

    const handleAddSlot = (dayType: DayType) => {
        const newSlot: TimeSlotLimit = {
            id: `new_${Date.now()}`,
            startTime: '08:00',
            endTime: '12:00',
            limit: 3,
        };
        setSettings(prevSettings => ({
            ...prevSettings,
            limits: {
                ...prevSettings.limits,
                [dayType]: [...prevSettings.limits[dayType], newSlot],
            },
        }));
    };

    const handleSave = () => {
        schedulingSettingsService.saveSettings(settings);
        showToast('Configurações salvas com sucesso!', 'success');
    };

    return (
        <>
            <PageHeader
                title="Configurações da Agenda"
                subtitle="Defina os limites de agendamento e a capacidade da sua clínica por horário."
            >
                <button onClick={handleSave} className="inline-flex items-center justify-center rounded-lg border border-transparent bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-600">
                    <Save className="w-5 h-5 mr-2" />
                    Salvar Alterações
                </button>
            </PageHeader>

            <div className="space-y-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Limites por Faixa de Horário (Segunda a Sexta)</h3>
                    <p className="text-sm text-slate-500 mb-4">Defina o número máximo de pacientes que podem ser agendados simultaneamente em cada período.</p>
                    <div className="grid grid-cols-4 gap-3 text-sm font-medium text-slate-600 px-1 mb-2">
                        <span>Início</span>
                        <span>Fim</span>
                        <span>Limite Pacientes</span>
                        <span className="text-center">Ação</span>
                    </div>
                    <div className="space-y-2">
                        {settings.limits.weekday.map((slot, index) => (
                            <TimeSlotRow
                                key={slot.id}
                                slot={slot}
                                onUpdate={(field, value) => handleUpdateSlot('weekday', index, field, value)}
                                onRemove={() => handleRemoveSlot('weekday', index)}
                            />
                        ))}
                    </div>
                    <button onClick={() => handleAddSlot('weekday')} className="mt-4 flex items-center text-sm font-semibold text-teal-600 hover:text-teal-700">
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Faixa de Horário
                    </button>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Limites por Faixa de Horário (Sábado)</h3>
                    <div className="grid grid-cols-4 gap-3 text-sm font-medium text-slate-600 px-1 mb-2">
                        <span>Início</span>
                        <span>Fim</span>
                        <span>Limite Pacientes</span>
                        <span className="text-center">Ação</span>
                    </div>
                     <div className="space-y-2">
                        {settings.limits.saturday.map((slot, index) => (
                            <TimeSlotRow
                                key={slot.id}
                                slot={slot}
                                onUpdate={(field, value) => handleUpdateSlot('saturday', index, field, value)}
                                onRemove={() => handleRemoveSlot('saturday', index)}
                            />
                        ))}
                    </div>
                    <button onClick={() => handleAddSlot('saturday')} className="mt-4 flex items-center text-sm font-semibold text-teal-600 hover:text-teal-700">
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Faixa de Horário
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm">
                     <h3 className="text-lg font-semibold text-slate-800 mb-2">Regras Globais</h3>
                     <div>
                         <label htmlFor="max-evals" className="block text-sm font-medium text-slate-700">Máximo de Avaliações por Horário</label>
                         <p className="text-xs text-slate-500 mb-2">Isso se aplica a qualquer horário, independentemente do limite de pacientes, devido à limitação da sala.</p>
                         <input
                            id="max-evals"
                            type="number"
                            min="0"
                            value={settings.maxEvaluationsPerSlot}
                            onChange={e => setSettings(s => ({ ...s, maxEvaluationsPerSlot: parseInt(e.target.value) || 0 }))}
                            className="w-full max-w-xs p-2 border border-slate-300 rounded-lg"
                         />
                     </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Módulos Adicionais</h3>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                            <h4 className="font-semibold text-slate-800">Módulo de Teleconsulta</h4>
                            <p className="text-sm text-slate-500">Permite realizar atendimentos por vídeo diretamente na plataforma.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={settings.teleconsultaEnabled}
                                onChange={e => setSettings(s => ({ ...s, teleconsultaEnabled: e.target.checked }))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                        </label>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AgendaSettingsPage;