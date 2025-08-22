import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format } from 'date-fns/format';
import { addDays } from 'date-fns/addDays';
import { startOfWeek } from 'date-fns/startOfWeek';
import { isSameDay } from 'date-fns/isSameDay';
import { isToday } from 'date-fns/isToday';
import { setHours } from 'date-fns/setHours';
import { setMinutes } from 'date-fns/setMinutes';
import { parse } from 'date-fns/parse';
import { ptBR } from 'date-fns/locale/pt-BR';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, 
  Grid3x3, List, Plus
} from 'lucide-react';
import BookingModal from '../components/agenda/BookingModal';
import { cn } from '../lib/utils';
import { useAppointments } from '../hooks/useAppointments';
import { EnrichedAppointment, Appointment, AppointmentStatus } from '../types';
import { useToast } from '../contexts/ToastContext';
import * as appointmentService from '../services/appointmentService';
import { useData } from '../contexts/DataContext';
import AppointmentCard from '../components/AppointmentCard';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import PatientTooltip from '../components/PatientTooltip';
import AppointmentContextMenu from '../components/AppointmentContextMenu';
import SaturdayScaleModal from '../components/SaturdayScaleModal';
import AppointmentFormModal from '../components/AppointmentFormModal';

const SLOT_HEIGHT = 40; // in pixels for a 30-minute slot
const START_HOUR = 7;
const END_HOUR = 22;

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');
  const [selectedSlot, setSelectedSlot] = useState<{date: Date, time: string, therapistId: string} | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSaturdayModalOpen, setIsSaturdayModalOpen] = useState(false);
  
  // Interaction states
  const [selectedAppointment, setSelectedAppointment] = useState<EnrichedAppointment | null>(null);
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<EnrichedAppointment | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, appointment: EnrichedAppointment } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number, y: number, appointment: EnrichedAppointment } | null>(null);
  const [draggedAppointment, setDraggedAppointment] = useState<EnrichedAppointment | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ day: Date, time: string } | null>(null);
  const [resizingAppointment, setResizingAppointment] = useState<{ appointment: EnrichedAppointment, initialY: number, initialHeight: number } | null>(null);

  const { showToast } = useToast();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const calendarRef = useRef<HTMLDivElement>(null);

  const { appointments, isLoading, refetch } = useAppointments(weekStart, weekEnd);
  const { patients, therapists } = useData();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const timeSlots = Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => {
    const hour = Math.floor(i / 2) + START_HOUR;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, EnrichedAppointment[]>();
    weekDays.forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        map.set(dayKey, appointments.filter(app => isSameDay(app.startTime, day)));
    });
    return map;
  }, [appointments, weekDays]);

  const todayStats = useMemo(() => {
      const todaysAppointments = appointments.filter(app => isToday(app.startTime));
      const completed = todaysAppointments.filter(app => app.status === AppointmentStatus.Completed);
      const revenue = completed.reduce((sum, app) => sum + app.value, 0);
      return {
          total: todaysAppointments.length,
          completed: completed.length,
          revenue: revenue,
      }
  }, [appointments]);
  
  const handleSlotClick = (date: Date, time: string, therapistId: string) => {
    const slotDateTime = parse(time, 'HH:mm', date);
    if (slotDateTime < new Date() && !isSameDay(slotDateTime, new Date())) return;
    setSelectedSlot({ date, time, therapistId });
    setIsBookingModalOpen(true);
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, appointment: EnrichedAppointment) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(appointment));
    setDraggedAppointment(appointment);
  };

  const handleDragEnd = () => {
    setDraggedAppointment(null);
    setDragOverInfo(null);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, day: Date, time: string) => {
    e.preventDefault();
    if (draggedAppointment) {
      setDragOverInfo({ day, time });
    }
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, day: Date, time: string) => {
    e.preventDefault();
    const appointmentData = JSON.parse(e.dataTransfer.getData('application/json')) as EnrichedAppointment;
    setDraggedAppointment(null);
    setDragOverInfo(null);
    if (!appointmentData) return;

    const appointmentToMove = appointments.find(a => a.id === appointmentData.id);
    if (!appointmentToMove) return;

    const [hour, minute] = time.split(':');
    const newStartTime = setMinutes(setHours(day, parseInt(hour)), parseInt(minute));
    
    if (newStartTime < new Date() && !isSameDay(newStartTime, new Date())) {
        showToast('Não é possível mover agendamentos para o passado.', 'error');
        return;
    }
    
    const duration = appointmentToMove.endTime.getTime() - appointmentToMove.startTime.getTime();
    const newEndTime = new Date(newStartTime.getTime() + duration);
    
    const conflict = appointments.find(app => 
        app.id !== appointmentToMove.id &&
        newStartTime < app.endTime &&
        newEndTime > app.startTime
    );
    
    if (conflict) {
        showToast(`Conflito com o agendamento de ${conflict.patientName}.`, 'error');
        return;
    }

    try {
        await appointmentService.saveAppointment({ ...appointmentToMove, startTime: newStartTime, endTime: newEndTime });
        showToast('Agendamento movido com sucesso!', 'success');
        refetch();
    } catch {
        showToast('Falha ao mover agendamento.', 'error');
    }
  };
  
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>, appointment: EnrichedAppointment) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, appointment });
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

  const handleSaveAppointment = async (appointmentData: Appointment): Promise<boolean> => {
    try {
      await appointmentService.saveAppointment(appointmentData);
      showToast('Consulta salva com sucesso!', 'success');
      refetch();
      setIsAppointmentFormOpen(false);
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
          setIsAppointmentFormOpen(false); // Close form modal if open
          setAppointmentToEdit(null);
          setSelectedAppointment(null); // Close detail modal if open
          return true;
      } catch {
          showToast('Falha ao remover agendamento(s).', 'error');
          return false;
      }
  };
  
  const handleEditClick = (appointment: EnrichedAppointment) => {
    setSelectedAppointment(null); // Close detail modal
    setContextMenu(null); // Close context menu
    setAppointmentToEdit(appointment);
    setIsAppointmentFormOpen(true);
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
  
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, appointment: EnrichedAppointment) => {
    e.preventDefault();
    e.stopPropagation();
    const initialHeight = (appointment.endTime.getTime() - appointment.startTime.getTime()) / (60 * 1000) * (SLOT_HEIGHT / 30);
    setResizingAppointment({ appointment, initialY: e.clientY, initialHeight });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingAppointment || !calendarRef.current) return;
    
    const deltaY = e.clientY - resizingAppointment.initialY;
    let newHeight = resizingAppointment.initialHeight + deltaY;
    
    const snapInterval = SLOT_HEIGHT / 2; // Snap to 15-min intervals
    newHeight = Math.max(snapInterval, Math.round(newHeight / snapInterval) * snapInterval);
    
    const appointmentElement = calendarRef.current.querySelector(`[data-id="${resizingAppointment.appointment.id}"]`) as HTMLDivElement;
    if (appointmentElement) {
      appointmentElement.style.height = `${newHeight}px`;
    }
  }, [resizingAppointment]);

  const handleMouseUp = useCallback(async () => {
    if (resizingAppointment && calendarRef.current) {
      const appointmentElement = calendarRef.current.querySelector(`[data-id="${resizingAppointment.appointment.id}"]`) as HTMLDivElement;
      if (appointmentElement) {
        const newHeight = parseFloat(appointmentElement.style.height);
        const newDurationMinutes = (newHeight / SLOT_HEIGHT) * 30;
        const newEndTime = new Date(resizingAppointment.appointment.startTime.getTime() + newDurationMinutes * 60 * 1000);
        
        try {
            await appointmentService.saveAppointment({ ...resizingAppointment.appointment, endTime: newEndTime });
            showToast('Duração atualizada!', 'success');
            refetch();
        } catch {
            showToast('Falha ao atualizar duração.', 'error');
            appointmentElement.style.height = `${resizingAppointment.initialHeight}px`;
        }
      }
      setResizingAppointment(null);
    }
  }, [resizingAppointment, refetch, showToast]);

  useEffect(() => {
    if (resizingAppointment) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingAppointment, handleMouseMove, handleMouseUp]);
  
  const fullSelectedPatient = useMemo(() => patients.find(p => p.id === selectedAppointment?.patientId), [patients, selectedAppointment]);
  const selectedTherapist = useMemo(() => therapists.find(t => t.id === selectedAppointment?.therapistId), [therapists, selectedAppointment]);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="bg-white rounded-2xl shadow-sm p-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
                <h1 className="text-xl font-bold text-slate-800">Agenda Semanal</h1>
                <p className="text-sm text-slate-500">{format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}</p>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0 self-start sm:self-center">
                <button onClick={() => setIsSaturdayModalOpen(true)} className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Escala de Sábado</button>
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  <button onClick={() => setViewMode('week')} className={cn("p-2 rounded-md", viewMode === 'week' ? 'bg-white shadow text-sky-600' : 'text-slate-600')}><Grid3x3 size={16}/></button>
                  <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-md", viewMode === 'list' ? 'bg-white shadow text-sky-600' : 'text-slate-600')}><List size={16}/></button>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-sky-50 rounded-lg p-3"><p className="text-xs text-sky-800">Total de Hoje</p><p className="text-xl font-bold text-sky-900">{todayStats.total}</p></div>
            <div className="bg-green-50 rounded-lg p-3"><p className="text-xs text-green-800">Concluídos Hoje</p><p className="text-xl font-bold text-green-900">{todayStats.completed}</p></div>
            <div className="bg-emerald-50 rounded-lg p-3"><p className="text-xs text-emerald-800">Faturamento de Hoje</p><p className="text-xl font-bold text-emerald-900">R$ {todayStats.revenue.toLocaleString('pt-BR')}</p></div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-2 rounded-lg hover:bg-slate-100"><ChevronRight size={20} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Hoje</button>
          </div>
           <button onClick={() => handleSlotClick(new Date(), format(new Date(), 'HH:mm'), therapists[0]?.id)} className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 flex items-center shadow-sm"><Plus size={16} className="mr-2"/>Agendar</button>
        </div>
        
        <div ref={calendarRef} className="flex-1 overflow-auto">
          <div className="grid grid-cols-[auto_repeat(7,1fr)] min-w-[1200px]">
            <div className="sticky top-0 z-20 bg-white/70 backdrop-blur-sm">
                <div className="h-20 border-b"></div>
            </div>
            {weekDays.map(day => (
              <div key={day.toString()} className={cn("p-2 text-center border-l border-b sticky top-0 z-20 bg-white/70 backdrop-blur-sm", isToday(day) && "bg-sky-50")}>
                <div className="text-xs font-medium text-slate-500 uppercase">{format(day, 'EEE', { locale: ptBR })}</div>
                <div className={cn("text-2xl font-bold mt-1", isToday(day) ? "text-sky-600" : "text-slate-900")}>{format(day, 'd')}</div>
              </div>
            ))}
            
            <div className="row-start-2">
              {timeSlots.map(time => {
                if (time.endsWith('00')) {
                  return <div key={time} className="h-20 -mt-2.5 pr-2 text-right text-xs text-slate-400 font-medium">{time}</div>
                }
                return null;
              })}
            </div>

            {weekDays.map(day => (
              <div key={day.toString()} className="relative border-l row-start-2">
                {timeSlots.map(time => (
                  <div 
                    key={time} 
                    className="h-10 border-t"
                    onClick={() => handleSlotClick(day, time, therapists[0]?.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day, time)}
                    onDragEnter={(e) => handleDragEnter(e, day, time)}
                  >
                     {dragOverInfo?.day === day && dragOverInfo?.time === time && draggedAppointment && (
                        <div className="absolute bg-green-200/50 rounded-lg pointer-events-none" style={{
                            height: `${(draggedAppointment.endTime.getTime() - draggedAppointment.startTime.getTime()) / (60 * 1000) * (SLOT_HEIGHT / 30)}px`,
                            top: `${timeSlots.indexOf(time) * SLOT_HEIGHT}px`,
                            left: 0,
                            right: 0,
                        }}/>
                    )}
                  </div>
                ))}
                {appointmentsByDay.get(format(day, 'yyyy-MM-dd'))?.map(app => (
                  <AppointmentCard
                    key={app.id}
                    appointment={app}
                    onSelect={() => setSelectedAppointment(app)}
                    onDragStart={(e, id) => handleDragStart(e, app)}
                    onDragEnd={handleDragEnd}
                    onResizeStart={(e, apt) => handleResizeStart(e, apt)}
                    onContextMenu={(e) => handleContextMenu(e, app)}
                    onMouseEnter={(e, apt) => setTooltip({ x: e.pageX, y: e.pageY, appointment: apt })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isBookingModalOpen && selectedSlot && (
          <BookingModal slot={selectedSlot} onClose={() => setIsBookingModalOpen(false)} onSuccess={() => { setIsBookingModalOpen(false); refetch(); }} />
        )}
        {selectedAppointment && (
            <AppointmentDetailModal 
                appointment={selectedAppointment}
                patient={fullSelectedPatient}
                therapist={selectedTherapist}
                onClose={() => setSelectedAppointment(null)}
                onEdit={() => handleEditClick(selectedAppointment)}
                onDelete={(id) => { handleDeleteAppointment(id); setSelectedAppointment(null); }}
                onStatusChange={(app, status) => { handleStatusChange(app, status); setSelectedAppointment(null); }}
                onPaymentStatusChange={(app, status) => { handlePaymentStatusChange(app, status); setSelectedAppointment(null); }}
                onPackagePayment={() => showToast('Funcionalidade de pacote a ser implementada.', 'info')}
                onUpdateValue={(id, val) => { handleUpdateValue(id, val); setSelectedAppointment(null); }}
            />
        )}
        {isAppointmentFormOpen && (
            <AppointmentFormModal 
                isOpen={isAppointmentFormOpen}
                onClose={() => {
                    setIsAppointmentFormOpen(false);
                    setAppointmentToEdit(null);
                }}
                onSave={handleSaveAppointment}
                onDelete={handleDeleteAppointment}
                appointmentToEdit={appointmentToEdit}
                patients={patients}
                therapists={therapists}
                allAppointments={appointments}
            />
        )}
        {contextMenu && (
            <AppointmentContextMenu 
                x={contextMenu.x}
                y={contextMenu.y}
                onClose={() => setContextMenu(null)}
                onSetStatus={(status) => handleStatusChange(contextMenu.appointment, status)}
                onSetPayment={(status) => handlePaymentStatusChange(contextMenu.appointment, status)}
                onEdit={() => handleEditClick(contextMenu.appointment)}
                onDelete={() => handleDeleteAppointment(contextMenu.appointment.id, contextMenu.appointment.seriesId)}
            />
        )}
      </AnimatePresence>
      <SaturdayScaleModal isOpen={isSaturdayModalOpen} onClose={() => setIsSaturdayModalOpen(false)} appointments={appointments} />
      {tooltip && <PatientTooltip appointment={tooltip.appointment} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}