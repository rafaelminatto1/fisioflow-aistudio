// components/SaturdayScaleModal.tsx
import React, { useMemo } from 'react';
import { X, Calendar } from 'lucide-react';
import { Appointment } from '../types';

interface SaturdayScaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointments: Appointment[];
}

const SaturdayScaleModal: React.FC<SaturdayScaleModalProps> = ({ isOpen, onClose, appointments }) => {
    
    const saturdaySchedule = useMemo(() => {
        if (!isOpen) return { date: null, schedule: {} };

        const today = new Date();
        const dayOfWeek = today.getDay();
        // If today is Sunday (0), we want to go 6 days forward. If it's Monday (1), 5 days... If it's Saturday (6), 0 days.
        // So, the logic is (6 - dayOfWeek). This works for Sun-Sat (0-6).
        const daysUntilSaturday = (6 - dayOfWeek + 7) % 7; 
        const nextSaturday = new Date(today);
        nextSaturday.setDate(today.getDate() + daysUntilSaturday);
        nextSaturday.setHours(0, 0, 0, 0);

        const saturdayAppointments = appointments.filter(app => {
            const appDate = new Date(app.startTime);
            appDate.setHours(0,0,0,0);
            return appDate.getTime() === nextSaturday.getTime();
        });

        const schedule = saturdayAppointments.reduce((acc, app) => {
            const time = app.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            if (!acc[time]) {
                acc[time] = [];
            }
            acc[time].push(app.patientName);
            return acc;
        }, {} as Record<string, string[]>);
        
        // Sort schedule by time
        const sortedSchedule = Object.fromEntries(
            Object.entries(schedule).sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
        );

        return { date: nextSaturday, schedule: sortedSchedule };

    }, [isOpen, appointments]);

    if (!isOpen) return null;

    const scheduleKeys = Object.keys(saturdaySchedule.schedule);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-5 border-b border-slate-200">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Escala do Próximo Sábado</h2>
                        {saturdaySchedule.date && (
                             <p className="text-sm text-slate-500">{saturdaySchedule.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                    {scheduleKeys.length > 0 ? (
                        <ul className="space-y-4">
                            {scheduleKeys.map(time => (
                                <li key={time}>
                                    <div className="px-2 py-1 bg-slate-100 rounded-md font-bold text-slate-700 text-sm mb-2">{time}</div>
                                    <ul className="space-y-1 pl-4">
                                        {saturdaySchedule.schedule[time].map((patientName, index) => (
                                            <li key={index} className="text-slate-600 list-disc list-inside">{patientName}</li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center text-slate-500 py-10">
                            <Calendar className="mx-auto h-12 w-12 text-slate-300" />
                            <h3 className="mt-2 text-sm font-medium text-slate-900">Nenhum agendamento</h3>
                            <p className="mt-1 text-sm text-slate-500">A agenda para o próximo sábado está vazia.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SaturdayScaleModal;