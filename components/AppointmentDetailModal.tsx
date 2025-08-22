
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { X, Edit, Trash2, Play, ChevronDown, DollarSign, Save } from 'lucide-react';
import { Appointment, Patient, Therapist, AppointmentStatus, AppointmentType } from '../types';
import { useToast } from '../contexts/ToastContext';

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  patient: Patient | undefined;
  therapist: Therapist | undefined;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointmentId: string) => void;
  onStatusChange: (appointment: Appointment, newStatus: AppointmentStatus) => void;
  onPaymentStatusChange: (appointment: Appointment, newStatus: 'paid' | 'pending') => void;
  onPackagePayment: (appointment: Appointment) => void;
  onUpdateValue: (appointmentId: string, newValue: number) => void;
}

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({ appointment, patient, therapist, onClose, onEdit, onDelete, onStatusChange, onPaymentStatusChange, onPackagePayment, onUpdateValue }) => {
    const navigate = ReactRouterDOM.useNavigate();
    const { showToast } = useToast();
    const [isEditingValue, setIsEditingValue] = useState(false);
    const [localValue, setLocalValue] = useState(appointment?.value || 0);

    useEffect(() => {
        setLocalValue(appointment?.value || 0);
        setIsEditingValue(false);
    }, [appointment]);

    if (!appointment || !patient || !therapist) return null;

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onStatusChange(appointment, e.target.value as AppointmentStatus);
    };

    const handleValueSave = () => {
        if (localValue !== appointment.value) {
            onUpdateValue(appointment.id, localValue);
        }
        setIsEditingValue(false);
    };
    
    const handleStartSession = () => {
        onClose();
        navigate(`/atendimento/${appointment.id}`);
    };
    
    const sessionButtonText = 'Iniciar Atendimento';

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
                    <div className="flex text-sm"><span className="w-24 text-slate-500 shrink-0">Paciente:</span><ReactRouterDOM.Link to={`/patients/${patient.id}`} className="font-semibold text-blue-600 hover:underline truncate">{patient.name}</ReactRouterDOM.Link></div>
                    <div className="flex text-sm"><span className="w-24 text-slate-500 shrink-0">Celular:</span><span className="font-semibold text-slate-800">{patient.phone || 'Não informado'}</span></div>
                    
                    {appointment.sessionNumber && appointment.totalSessions && (
                        <div className="flex text-sm"><span className="w-24 text-slate-500 shrink-0">Sessão:</span><span className="font-semibold text-slate-800">{appointment.sessionNumber} de {appointment.totalSessions}</span></div>
                    )}
                    
                    <div className="flex text-sm items-center">
                        <span className="w-24 text-slate-500 shrink-0">Valor:</span>
                        {isEditingValue ? (
                            <div className="relative">
                                <input 
                                    type="number"
                                    value={localValue}
                                    onChange={(e) => setLocalValue(Number(e.target.value))}
                                    onBlur={handleValueSave}
                                    onKeyDown={(e) => e.key === 'Enter' && handleValueSave()}
                                    className="w-28 pl-2 pr-1 py-0.5 border border-teal-500 rounded-md ring-2 ring-teal-200"
                                    autoFocus
                                />
                                <button onClick={handleValueSave} className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded bg-green-500 text-white hover:bg-green-600">
                                    <Save className="w-3 h-3"/>
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setIsEditingValue(true)} className="font-semibold text-slate-800 hover:bg-slate-100 p-1 rounded-md flex items-center">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appointment.value)}
                                <Edit className="w-3 h-3 inline-block ml-2 text-slate-400" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center text-sm">
                        <span className="w-24 text-slate-500 shrink-0">Pagamento:</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onPaymentStatusChange(appointment, 'paid')}
                                disabled={appointment.paymentStatus === 'paid'}
                                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors disabled:cursor-not-allowed ${
                                    appointment.paymentStatus === 'paid'
                                    ? 'bg-green-500 text-white shadow-sm'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                }`}
                            >
                                Pagou
                            </button>
                            <button
                                onClick={() => onPaymentStatusChange(appointment, 'pending')}
                                disabled={appointment.paymentStatus === 'pending'}
                                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors disabled:cursor-not-allowed ${
                                    appointment.paymentStatus === 'pending'
                                    ? 'bg-yellow-400 text-white shadow-sm'
                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                }`}
                            >
                                Pendente
                            </button>
                        </div>
                    </div>
                   

                    <div className="flex items-center text-sm pt-1">
                        <label htmlFor="status-select" className="w-24 text-slate-500 shrink-0">Status:</label>
                        <div className="relative">
                            <select
                                id="status-select"
                                value={appointment.status}
                                onChange={handleStatusChange}
                                className="appearance-none text-sm font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 py-1 pl-2 pr-8"
                            >
                                {Object.values(AppointmentStatus).map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>


                <div className="p-4 border-t space-y-3">
                     {appointment.totalSessions && appointment.totalSessions > 1 && (
                         <button
                            onClick={() => onPackagePayment(appointment)}
                            className="w-full text-center bg-teal-50 border border-teal-200 text-teal-700 font-bold py-2 px-4 rounded-lg hover:bg-teal-100 flex items-center justify-center"
                        >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Pagar Pacote
                        </button>
                     )}
                    <div className="flex items-center gap-2">
                        <button
                             onClick={handleStartSession}
                            className="flex-1 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            <Play className="w-4 h-4 mr-2" />
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
                            onClick={() => onDelete(appointment.id)}
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
