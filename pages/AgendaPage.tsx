
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { format } from 'date-fns/format';
import { addDays } from 'date-fns/addDays';
import { startOfWeek } from 'date-fns/startOfWeek';
import { isSameDay } from 'date-fns/isSameDay';
import { isToday } from 'date-fns/isToday';
import { setHours } from 'date-fns/setHours';
import { setMinutes } from 'date-fns/setMinutes';
import { ptBR } from 'date-fns/locale/pt-BR';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useAppointments } from '../hooks/useAppointments.ts';
import { EnrichedAppointment, Appointment, AppointmentStatus, Therapist } from '../types.ts';
import { useToast } from '../contexts/ToastContext.tsx';
import * as appointmentService from '../services/appointmentService.ts';
import { useData } from '../contexts/DataContext.tsx';
import AppointmentCard from '../components/AppointmentCard.tsx';
import AppointmentDetailModal from '../components/AppointmentDetailModal.tsx';
import AppointmentFormModal from '../components/AppointmentFormModal.tsx';
import { cn } from '../lib/utils.ts';

const START_HOUR = 7;
const END_HOUR = 21;
const SLOT_DURATION = 30; // minutes
const PIXELS_PER_MINUTE = 2;

const timeSlots = Array.from({ length: (END_HOUR - START_HOUR) * (60 / SLOT_DURATION) }, (_, i) => {
    const totalMinutes = START_HOUR * 60 + i * SLOT_DURATION;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const CurrentTimeIndicator: React.FC = () => {
    const [top, setTop] = useState(0);

    useEffect(() => {
        const updatePosition = () => {
            const now = new Date();
            const minutesFromStart = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
            setTop(minutesFromStart * PIXELS_PER_MINUTE);
        };

        updatePosition();
        const interval = setInterval(updatePosition, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    if (top < 0 || top > (END_HOUR - START_HOUR) * 60 * PIXELS_PER_MINUTE) {
        return null;
    }

    return (
        <div className="absolute left-0 right-0 z-10" style={{ top: `${top}px` }}>
            <div className="relative h-px bg-red-500">
                <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
        </div>
    );
};

export default function AgendaPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
    const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
    
    const { appointments, isLoading, refetch } = useAppointments(weekStart, weekEnd);
    const { patients, therapists } = useData();
    const { showToast } = useToast();

    // Modal states
    const [appointmentToEdit, setAppointmentToEdit] = useState<EnrichedAppointment | null>(null);
    const [selectedAppointment, setSelectedAppointment] = useState<EnrichedAppointment | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [initialFormData, setInitialFormData] = useState<{ date: Date, therapistId: string } | undefined>();
    
    // Drag & Drop states
    const [draggedAppointmentId, setDraggedAppointmentId] = useState<string | null>(null);
    
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

    const handleSlotClick = (day: Date, time: string, therapistId: string) => {
        const [hour, minute] = time.split(':');
        const clickedDate = setMinutes(setHours(day, parseInt(hour)), parseInt(minute));
        
        setInitialFormData({ date: clickedDate, therapistId });
        setAppointmentToEdit(null);
        setIsFormOpen(true);
    };
    
    const handleAppointmentClick = (appointment: EnrichedAppointment) => {
        setSelectedAppointment(appointment);
    };

    const handleEditClick = (appointment: EnrichedAppointment) => {
        setSelectedAppointment(null);
        setAppointmentToEdit(appointment);
        setInitialFormData(undefined);
        setIsFormOpen(true);
    };
    
    const handleSaveAppointment = async (appointmentData: Appointment): Promise<boolean> => {
        try {
            await appointmentService.saveAppointment(appointmentData);
            showToast('Consulta salva com sucesso!', 'success');
            refetch();
            setIsFormOpen(false);
            setAppointmentToEdit(null);
            return true;
        } catch (error) {
            showToast('Falha ao salvar a consulta.', 'error');
            return false;
        }
    };
    
    const handleDeleteAppointment = async (appointmentId: string, seriesId?: string): Promise<boolean> => {
        const appointmentToDelete = appointments.find(a => a.id === appointmentId);
        if (!appointmentToDelete) return false;
        
        const confirmed = window.confirm(seriesId ? 'Excluir esta e todas as futuras ocorrências?' : 'Tem certeza que deseja excluir este agendamento?');
        if (!confirmed) return false;
  
        try {
            if (seriesId) {
                await appointmentService.deleteAppointmentSeries(seriesId, appointmentToDelete.startTime);
            } else {
                await appointmentService.deleteAppointment(appointmentId);
            }
            showToast('Agendamento(s) removido(s) com sucesso!', 'success');
            refetch();
            setIsFormOpen(false);
            setAppointmentToEdit(null);
            setSelectedAppointment(null);
            return true;
        } catch {
            showToast('Falha ao remover agendamento(s).', 'error');
            return false;
        }
    };

    const handleStatusChange = async (appointment: Appointment, newStatus: AppointmentStatus) => {
        try {
            await appointmentService.saveAppointment({ ...appointment, status: newStatus });
            showToast('Status atualizado com sucesso!', 'success');
            refetch();
        } catch { showToast('Falha ao atualizar status.', 'error'); }
    };
  
    const handlePaymentStatusChange = async (appointment: Appointment, newStatus: 'paid' | 'pending') => {
        try {
            await appointmentService.saveAppointment({ ...appointment, paymentStatus: newStatus });
            showToast('Status do pagamento atualizado!', 'success');
            refetch();
        } catch { showToast('Falha ao atualizar pagamento.', 'error'); }
    };
    
    const handleUpdateValue = async (appointmentId: string, newValue: number) => {
        const appointment = appointments.find(a => a.id === appointmentId);
        if (appointment) {
            try {
                await appointmentService.saveAppointment({ ...appointment, value: newValue });
                showToast('Valor atualizado com sucesso!', 'success');
                refetch();
            } catch { showToast('Falha ao atualizar o valor.', 'error'); }
        }
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, appointment: EnrichedAppointment) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData("application/json", JSON.stringify(appointment));
        setDraggedAppointmentId(appointment.id);
    };

    const handleDragEnd = () => setDraggedAppointmentId(null);
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, day: Date, therapistId: string) => {
        e.preventDefault();
        const appointmentData = JSON.parse(e.dataTransfer.getData("application/json")) as EnrichedAppointment;
        const columnEl = e.currentTarget;
        const rect = columnEl.getBoundingClientRect();
        const dropY = e.clientY - rect.top;

        const minutesFromTop = dropY / PIXELS_PER_MINUTE;
        const snappedMinutes = Math.round(minutesFromTop / 15) * 15;
        const newHour = START_HOUR + Math.floor(snappedMinutes / 60);
        const newMinute = snappedMinutes % 60;

        const newStartTime = setMinutes(setHours(day, newHour), newMinute);
        
        const duration = new Date(appointmentData.endTime).getTime() - new Date(appointmentData.startTime).getTime();
        const newEndTime = new Date(newStartTime.getTime() + duration);
        
        const updatedAppointment: Appointment = { ...appointmentData, startTime: newStartTime, endTime: newEndTime, therapistId };
        
        try {
            await appointmentService.saveAppointment(updatedAppointment);
            showToast('Agendamento movido!', 'success');
            refetch();
        } catch (error) {
            showToast('Falha ao mover agendamento.', 'error');
        } finally {
            setDraggedAppointmentId(null);
        }
    };

    const fullSelectedPatient = useMemo(() => patients.find(p => p.id === selectedAppointment?.patientId), [patients, selectedAppointment]);
    const selectedTherapistData = useMemo(() => therapists.find(t => t.id === selectedAppointment?.therapistId), [therapists, selectedAppointment]);

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <header className="p-4 bg-white rounded-t-2xl shadow-sm border-b z-20">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Agenda da Clínica</h1>
                        <p className="text-sm text-slate-500">{format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "d 'de' MMMM yyyy", { locale: ptBR })}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft size={20} /></button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Hoje</button>
                        <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-2 rounded-lg hover:bg-slate-100"><ChevronRight size={20} /></button>
                         <button onClick={() => { setInitialFormData({ date: new Date(), therapistId: therapists[0]?.id }); setIsFormOpen(true); }} className="ml-4 px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 flex items-center shadow-sm"><Plus size={16} className="mr-2"/>Agendar</button>
                    </div>
                </div>
            </header>
            
            <div className="flex-1 flex flex-col overflow-auto bg-white rounded-b-2xl shadow-sm">
                <div className="sticky top-0 bg-white z-10 grid grid-cols-[auto_1fr] shadow-sm">
                    <div className="w-16 border-r border-b"></div>
                    <div className="grid grid-cols-7">
                        {weekDays.map(day => (
                            <div key={day.toISOString()} className={cn("text-center border-r border-b last:border-r-0 py-2", isToday(day) && "bg-sky-50")}>
                                <p className="text-xs font-medium text-slate-500 uppercase">{format(day, 'EEE', { locale: ptBR })}</p>
                                <p className={cn("text-2xl font-bold mt-1", isToday(day) ? "text-sky-600" : "text-slate-900")}>{format(day, 'd')}</p>
                            </div>
                        ))}
                    </div>
                    <div className="w-16 border-r"></div>
                    <div className="grid grid-cols-7">
                        {weekDays.map(day => (
                            <div key={day.toISOString()} className="grid grid-cols-subgrid col-span-1 border-r last:border-r-0" style={{ gridTemplateColumns: `repeat(${therapists.length}, 1fr)` }}>
                                {therapists.map(therapist => (
                                    <div key={therapist.id} className="text-center text-xs font-semibold py-1 border-r last:border-r-0" style={{color: `var(--color-${therapist.color}-600, #333)`}}>
                                        {therapist.name.split(' ')[1] || therapist.name}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-[auto_1fr] overflow-y-auto">
                    <div className="w-16 border-r">
                        {timeSlots.map(time => (
                            <div key={time} className="h-12 text-right pr-2 text-xs text-slate-400 font-medium -mt-1.5 pt-1.5 border-t border-slate-200">
                                {time.endsWith('00') ? time : ''}
                            </div>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-7 relative">
                        {weekDays.map((day) => (
                            <div key={day.toISOString()} className="grid grid-cols-subgrid col-span-1 border-r last:border-r-0 relative" style={{ gridTemplateColumns: `repeat(${therapists.length}, 1fr)`}}>
                                {therapists.map((therapist) => (
                                    <div 
                                        key={therapist.id} 
                                        className="relative border-r last:border-r-0 h-full"
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const clickY = e.clientY - rect.top;
                                            const minutesFromTop = clickY / PIXELS_PER_MINUTE;
                                            const snappedMinutes = Math.floor(minutesFromTop / SLOT_DURATION) * SLOT_DURATION;
                                            const hour = START_HOUR + Math.floor(snappedMinutes / 60);
                                            const minute = snappedMinutes % 60;
                                            handleSlotClick(day, `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`, therapist.id)
                                        }}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, day, therapist.id)}
                                    >
                                        {timeSlots.map(time => <div key={time} className="h-12 border-t border-slate-200"></div>)}
                                        {appointments
                                            .filter(app => app.therapistId === therapist.id && isSameDay(app.startTime, day))
                                            .map(app => (
                                                <AppointmentCard
                                                    key={app.id}
                                                    appointment={app}
                                                    startHour={START_HOUR}
                                                    pixelsPerMinute={PIXELS_PER_MINUTE}
                                                    isBeingDragged={draggedAppointmentId === app.id}
                                                    onClick={() => handleAppointmentClick(app)}
                                                    onDragStart={(e) => handleDragStart(e, app)}
                                                    onDragEnd={handleDragEnd}
                                                />
                                            ))}
                                    </div>
                                ))}
                                {isToday(day) && <CurrentTimeIndicator />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {selectedAppointment && (
                    <AppointmentDetailModal 
                        appointment={selectedAppointment}
                        patient={fullSelectedPatient}
                        therapist={selectedTherapistData}
                        onClose={() => setSelectedAppointment(null)}
                        onEdit={() => handleEditClick(selectedAppointment)}
                        onDelete={handleDeleteAppointment}
                        onStatusChange={(app, status) => { handleStatusChange(app, status); setSelectedAppointment(null); }}
                        onPaymentStatusChange={(app, status) => { handlePaymentStatusChange(app, status); setSelectedAppointment(null); }}
                        onPackagePayment={() => showToast('Funcionalidade de pacote a ser implementada.', 'info')}
                        onUpdateValue={(id, val) => { handleUpdateValue(id, val); setSelectedAppointment(null); }}
                    />
                )}
                {isFormOpen && (
                    <AppointmentFormModal 
                        isOpen={isFormOpen}
                        onClose={() => { setIsFormOpen(false); setAppointmentToEdit(null); }}
                        onSave={handleSaveAppointment}
                        onDelete={handleDeleteAppointment}
                        appointmentToEdit={appointmentToEdit}
                        initialData={initialFormData}
                        patients={patients}
                        therapists={therapists}
                        allAppointments={appointments}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}