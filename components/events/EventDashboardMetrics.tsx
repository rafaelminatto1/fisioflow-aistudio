import React, { useMemo } from 'react';
import { Event, EventRegistration, RegistrationStatus } from '../../types';

interface EventDashboardMetricsProps {
    event: Event;
    registrations: EventRegistration[];
}

const EventDashboardMetrics: React.FC<EventDashboardMetricsProps> = ({ event, registrations }) => {
    const { totalRegistered, checkInRate, revenue, checkInCount } = useMemo(() => {
        const total = registrations.length;
        const attended = registrations.filter(r => r.status === RegistrationStatus.Attended).length;
        const rate = total > 0 ? (attended / total) * 100 : 0;
        const rev = event.isFree ? 0 : total * (event.price || 0);

        return {
            totalRegistered: total.toString(),
            checkInRate: rate,
            revenue: `R$ ${rev.toFixed(2).replace('.', ',')}`,
            checkInCount: attended
        };
    }, [event, registrations]);
    
    const checkInRateFormatted = `${checkInRate.toFixed(1)}%`;
    let checkInColor = 'bg-teal-500';
    if (checkInRate < 75) checkInColor = 'bg-amber-500';
    if (checkInRate < 50) checkInColor = 'bg-red-500';

    return (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                     <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                        <p className="text-sm font-medium text-slate-500">Total de Inscritos</p>
                        <p className="text-4xl font-bold text-slate-800 mt-1">{totalRegistered}</p>
                    </div>
                     <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                        <p className="text-sm font-medium text-slate-500">Faturamento Previsto</p>
                        <p className="text-4xl font-bold text-slate-800 mt-1">{revenue}</p>
                    </div>
                </div>
                <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm flex flex-col justify-center">
                    <h4 className="font-semibold text-slate-700 text-center mb-3 text-lg">Taxa de Check-in</h4>
                    <div className="w-full bg-slate-200 rounded-full h-8 relative">
                        <div className={`${checkInColor} h-8 rounded-full transition-all duration-500`} style={{ width: `${checkInRate}%` }}></div>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-sm">{checkInRateFormatted}</span>
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-2">{checkInCount} de {totalRegistered} participantes compareceram.</p>
                </div>
            </div>
        </div>
    );
};

export default EventDashboardMetrics;