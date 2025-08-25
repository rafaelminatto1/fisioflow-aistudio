
// components/acompanhamento/AlertCard.tsx
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Patient, AppointmentStatus, AlertPatient } from '../../types';
import { Phone, MessageSquare, CalendarPlus, StickyNote, CheckCircle, XCircle, BrainCircuit, AlertTriangle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import * as patientService from '../../services/patientService';

interface AlertCardProps {
    patient: AlertPatient;
    onOpenObservationModal: (patient: Patient) => void;
    onOpenRescheduleModal: (patient: Patient) => void;
    onOpenAiSuggestion: (patient: AlertPatient) => void;
    onUpdate: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ patient, onOpenObservationModal, onOpenRescheduleModal, onOpenAiSuggestion, onUpdate }) => {
    const { appointments } = useData();
    const { showToast } = useToast();
    const { user } = useAuth();
    const router = useRouter();

    const patientData = useMemo(() => {
        const patientAppointments = appointments
            .filter(a => a.patientId === patient.id)
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

        const pastAppointments = patientAppointments.filter(a => a.startTime < new Date());
        const futureAppointments = patientAppointments.filter(a => a.startTime >= new Date() && a.status === AppointmentStatus.Scheduled);

        const attendance = pastAppointments.slice(-5).map(app => app.status === AppointmentStatus.Completed);
        
        return {
            lastVisit: new Date(patient.lastVisit).toLocaleDateString('pt-BR'),
            nextAppointment: futureAppointments[0] ? new Date(futureAppointments[0].startTime).toLocaleDateString('pt-BR') : 'Nenhuma',
            attendance,
        };
    }, [patient, appointments]);

    const handleLogContact = async (contactType: 'WhatsApp' | 'Ligação') => {
        if (!user) return;
        try {
            await patientService.addCommunicationLog(patient.id, {
                date: new Date().toISOString(),
                type: contactType,
                notes: `Tentativa de contato para acompanhamento via ${contactType}.`,
                actor: user.name,
            });
            showToast(`Contato com ${patient.name} registrado.`, 'success');
            onUpdate();
        } catch (error) {
            showToast('Falha ao registrar contato.', 'error');
        }
    };
    
    const typeInfo = {
        abandonment: { borderColor: 'border-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
        highRisk: { borderColor: 'border-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
        attention: { borderColor: 'border-sky-500', bgColor: 'bg-sky-50', textColor: 'text-sky-700' },
    };
    
    const currentTypeInfo = typeInfo[patient.alertType];

    return (
        <div className={`bg-white rounded-2xl shadow-sm border-t-4 ${currentTypeInfo.borderColor} overflow-hidden flex flex-col h-full`}>
            <div className="p-4 flex-grow">
                <div className="flex items-start justify-between cursor-pointer" onClick={() => router.push(`/pacientes/${patient.id}`)}>
                    <div className="flex items-center">
                        <img src={patient.avatarUrl} alt={patient.name} className="w-12 h-12 rounded-full" />
                        <div className="ml-3">
                            <h3 className="font-bold text-slate-800">{patient.name}</h3>
                            <p className="text-xs text-slate-500">{patient.phone}</p>
                        </div>
                    </div>
                </div>
                
                <div className={`mt-3 p-2 text-xs font-semibold rounded-md flex items-center ${currentTypeInfo.bgColor} ${currentTypeInfo.textColor}`}>
                    <AlertTriangle size={14} className="mr-2 shrink-0" />
                    <p>{patient.alertReason}</p>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-slate-500">Última Visita:</span>
                        <span className="font-semibold text-slate-700">{patientData.lastVisit}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Próxima Consulta:</span>
                        <span className="font-semibold text-slate-700">{patientData.nextAppointment}</span>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 p-2 flex justify-around items-center border-t mt-auto">
                <button onClick={() => onOpenAiSuggestion(patient)} title="Sugestão de Contato com IA" className="flex flex-col items-center text-xs text-slate-600 hover:text-teal-600 p-1 rounded-md w-1/5">
                    <BrainCircuit size={20} />
                    <span>IA</span>
                </button>
                <a href={`https://wa.me/${patient.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={() => handleLogContact('WhatsApp')} title="Enviar WhatsApp" className="flex flex-col items-center text-xs text-slate-600 hover:text-green-600 p-1 rounded-md w-1/5">
                    <MessageSquare size={20} />
                    <span>Chat</span>
                </a>
                 <button onClick={() => onOpenRescheduleModal(patient)} title="Remarcar Consulta" className="flex flex-col items-center text-xs text-slate-600 hover:text-sky-600 p-1 rounded-md w-1/5">
                    <CalendarPlus size={20} />
                    <span>Remarcar</span>
                </button>
                 <button onClick={() => handleLogContact('Ligação')} title="Registrar Ligação" className="flex flex-col items-center text-xs text-slate-600 hover:text-purple-600 p-1 rounded-md w-1/5">
                    <Phone size={20} />
                    <span>Ligação</span>
                </button>
                 <button onClick={() => onOpenObservationModal(patient)} title="Adicionar Observação" className="flex flex-col items-center text-xs text-slate-600 hover:text-amber-600 p-1 rounded-md w-1/5">
                    <StickyNote size={20} />
                    <span>Nota</span>
                </button>
            </div>
        </div>
    );
};

export default AlertCard;
