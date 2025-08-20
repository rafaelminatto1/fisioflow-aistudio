
// components/acompanhamento/AlertCard.tsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Patient, AppointmentStatus } from '../../types';
import { Phone, MessageSquare, CalendarPlus, StickyNote, CheckCircle, XCircle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import * as patientService from '../../services/patientService';

type AlertType = 'abandonment' | 'highRisk' | 'attention';

interface AlertCardProps {
    patient: Patient;
    type: AlertType;
    onOpenObservationModal: (patient: Patient) => void;
    onOpenRescheduleModal: (patient: Patient) => void;
    onUpdate: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ patient, type, onOpenObservationModal, onOpenRescheduleModal, onUpdate }) => {
    const { appointments } = useData();
    const { showToast } = useToast();
    const { user } = useAuth();
    const navigate = useNavigate();

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
    
    let borderColorClass = '';
    switch (type) {
        case 'abandonment': borderColorClass = 'border-red-500'; break;
        case 'highRisk': borderColorClass = 'border-amber-500'; break;
        case 'attention': borderColorClass = 'border-sky-500'; break;
    }

    return (
        <div className={`bg-white rounded-2xl shadow-sm border-t-4 ${borderColorClass} overflow-hidden flex flex-col h-full`}>
            <div className="p-4 flex-grow">
                <div className="flex items-start justify-between cursor-pointer" onClick={() => navigate(`/patients/${patient.id}`)}>
                    <div className="flex items-center">
                        <img src={patient.avatarUrl} alt={patient.name} className="w-12 h-12 rounded-full" />
                        <div className="ml-3">
                            <h3 className="font-bold text-slate-800">{patient.name}</h3>
                            <p className="text-xs text-slate-500">{patient.phone}</p>
                        </div>
                    </div>
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
                     <div>
                        <span className="text-slate-500">Assiduidade (últimas 5):</span>
                        <div className="flex gap-1.5 mt-1">
                            {patientData.attendance.map((attended, index) => (
                                <div key={index} title={attended ? 'Presente' : 'Faltou'} className={`w-full h-2 rounded-full ${attended ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 p-2 flex justify-around items-center border-t mt-auto">
                <a href={`https://wa.me/${patient.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={() => handleLogContact('WhatsApp')} className="flex flex-col items-center text-xs text-slate-600 hover:text-green-600 p-1 rounded-md w-1/4">
                    <MessageSquare size={20} />
                    <span>WhatsApp</span>
                </a>
                 <button onClick={() => onOpenRescheduleModal(patient)} className="flex flex-col items-center text-xs text-slate-600 hover:text-sky-600 p-1 rounded-md w-1/4">
                    <CalendarPlus size={20} />
                    <span>Remarcar</span>
                </button>
                 <button onClick={() => handleLogContact('Ligação')} className="flex flex-col items-center text-xs text-slate-600 hover:text-purple-600 p-1 rounded-md w-1/4">
                    <Phone size={20} />
                    <span>Registrar</span>
                </button>
                 <button onClick={() => onOpenObservationModal(patient)} className="flex flex-col items-center text-xs text-slate-600 hover:text-amber-600 p-1 rounded-md w-1/4">
                    <StickyNote size={20} />
                    <span>Observação</span>
                </button>
            </div>
        </div>
    );
};

export default AlertCard;
