
// components/patient-portal/AppointmentCard.tsx
import React from 'react';
import { Appointment, AppointmentStatus } from '../../types';
import { Calendar, Clock, UserCheck, CheckCircle, XCircle } from 'lucide-react';

interface AppointmentCardProps {
    appointment: Appointment;
    therapistName: string;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, therapistName }) => {
    const isPast = appointment.startTime < new Date();
    
    const statusInfo = {
        [AppointmentStatus.Scheduled]: { text: 'Agendado', icon: <Clock className="w-4 h-4 text-blue-500" />, color: 'text-blue-700 bg-blue-100' },
        [AppointmentStatus.Completed]: { text: 'Realizado', icon: <CheckCircle className="w-4 h-4 text-green-500" />, color: 'text-green-700 bg-green-100' },
        [AppointmentStatus.Canceled]: { text: 'Cancelado', icon: <XCircle className="w-4 h-4 text-red-500" />, color: 'text-red-700 bg-red-100' },
        [AppointmentStatus.NoShow]: { text: 'Faltou', icon: <XCircle className="w-4 h-4 text-yellow-500" />, color: 'text-yellow-700 bg-yellow-100' },
    };

    const currentStatus = statusInfo[appointment.status];
    
    return (
        <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${isPast ? 'border-slate-300' : 'border-teal-500'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className={`font-bold text-slate-800 ${isPast ? 'text-slate-600' : ''}`}>
                        {appointment.type}
                    </p>
                    <p className="text-sm text-slate-500">{appointment.title}</p>
                </div>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${currentStatus.color}`}>
                    {currentStatus.icon}
                    <span className="ml-1.5">{currentStatus.text}</span>
                </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col md:flex-row justify-between text-sm text-slate-600 space-y-2 md:space-y-0">
                <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    <span>{appointment.startTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
                </div>
                <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-slate-400" />
                    <span>{appointment.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center">
                    <UserCheck className="w-4 h-4 mr-2 text-slate-400" />
                    <span>{therapistName}</span>
                </div>
            </div>
        </div>
    );
};

export default AppointmentCard;