// src/components/agenda/AppointmentDetailModal.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, Edit, Trash2, Play, DollarSign, Repeat, Video } from 'lucide-react';
import { Patient, Therapist, EnrichedAppointment, PatientSummary } from '@/types';
import { useToast } from '../ui/use-toast';

interface AppointmentDetailModalProps {
  appointment: EnrichedAppointment | null;
  patient: Patient | PatientSummary | undefined;
  therapist: Therapist | undefined;
  onClose: () => void;
  onEdit: (appointment: EnrichedAppointment) => void;
  onDelete: (appointmentId: string, seriesId?: string) => void;
}

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({ appointment, patient, therapist, onClose, onEdit, onDelete }) => {
    const router = useRouter();
    const { toast } = useToast();

    if (!appointment || !patient || !therapist) return null;
    
    const handleStartSession = () => {
        onClose();
        if (appointment.type === 'Teleconsulta') { // Use string literal from enum
            router.push(`/teleconsulta/${appointment.id}`);
        } else {
            router.push(`/atendimento/${appointment.id}`);
        }
    };
    
    const isTeleconsulta = appointment.type === 'Teleconsulta';
    const sessionButtonText = isTeleconsulta ? 'Iniciar Teleconsulta' : 'Iniciar Atendimento';
    const SessionIcon = isTeleconsulta ? Video : Play;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b bg-slate-50 rounded-t-lg">
                    <h2 className="font-bold text-slate-700">
                        Horário: {appointment.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {appointment.endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200">
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </header>

                <div className="p-4 space-y-3">
                    <div className="flex text-sm"><span className="w-24 text-slate-500 shrink-0">Fisioterapeuta:</span><span className="font-semibold text-slate-800">{therapist.name}</span></div>
                    <div className="flex text-sm"><span className="w-24 text-slate-500 shrink-0">Paciente:</span><a href={`/pacientes/${patient.id}`} className="font-semibold text-blue-600 hover:underline truncate">{patient.name}</a></div>
                </div>

                <div className="p-4 border-t space-y-3">
                    <div className="flex items-center gap-2">
                        <button
                             onClick={handleStartSession}
                            className="flex-1 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            <SessionIcon className="w-4 h-4 mr-2" />
                            {sessionButtonText}
                        </button>
                        <button
                            onClick={() => onEdit(appointment)}
                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                            title="Editar Agendamento"
                        >
                            <Edit className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => onDelete(appointment.id, appointment.seriesId)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                            title="Excluir Agendamento"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppointmentDetailModal;
