// src/components/agenda/AgendaClient.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import addDays from 'date-fns/addDays';
import startOfWeek from 'date-fns/startOfWeek';
import isSameDay from 'date-fns/isSameDay';
import isToday from 'date-fns/isToday';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import type { User as PrismaUser } from '@prisma/client';
import { EnrichedAppointment, Appointment, AppointmentStatus, Patient, PatientSummary, Therapist } from '../../../types';
import { useToast } from '../../ui/use-toast';
import AppointmentCard from './AppointmentCard';
import AppointmentDetailModal from './AppointmentDetailModal';
import AppointmentFormModal from './AppointmentFormModal';
import { cn } from '../../../lib/utils';
import { saveAppointmentAction, deleteAppointmentAction, deleteAppointmentSeriesAction } from '../../../lib/actions/appointment.actions';

const START_HOUR = 7;
const END_HOUR = 21;
const SLOT_DURATION = 30;
const PIXELS_PER_MINUTE = 2;

const timeSlots = Array.from({ length: (END_HOUR - START_HOUR) * (60 / SLOT_DURATION) }, (_, i) => {
    const totalMinutes = START_HOUR * 60 + i * SLOT_DURATION;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

interface AgendaClientProps {
    initialAppointments: any[];
    therapists: PrismaUser[];
    patients: PatientSummary[];
}

export default function AgendaClient({ initialAppointments, therapists, patients }: AgendaClientProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<EnrichedAppointment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    
    // Modal states
    const [appointmentToEdit, setAppointmentToEdit] = useState<EnrichedAppointment | null>(null);
    const [selectedAppointment, setSelectedAppointment] = useState<EnrichedAppointment | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [initialFormData, setInitialFormData] = useState<{ date: Date, therapistId: string } | undefined>();
    
    const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

    const parseAppointments = (apps: any[]): EnrichedAppointment[] => {
        return apps.map(app => ({
            ...app,
            startTime: new Date(app.startTime),
            endTime: new Date(app.endTime),
        }));
    };

    useEffect(() => {
        setAppointments(parseAppointments(initialAppointments));
    }, [initialAppointments]);

    const fetchAppointmentsForWeek = useCallback(async (date: Date) => {
        setIsLoading(true);
        const start = startOfWeek(date, { weekStartsOn: 1 });
        const end = addDays(start, 7);
        try {
            const res = await fetch(`/api/appointments?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setAppointments(parseAppointments(data));
        } catch (error) {
            toast({ title: "Erro ao buscar agendamentos", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    const changeWeek = (offset: number) => {
        const newDate = addDays(currentDate, offset * 7);
        setCurrentDate(newDate);
        fetchAppointmentsForWeek(newDate);
    };

    const handleSaveAppointment = async (appData: Appointment) => {
        const result = await saveAppointmentAction(appData);
        if(result.success) {
            toast({ title: "Agendamento salvo!" });
            fetchAppointmentsForWeek(currentDate);
            setIsFormOpen(false);
            return true;
        }
        toast({ title: result.message || "Erro ao salvar", variant: "destructive" });
        return false;
    };

    const handleDeleteAppointment = async (id: string, seriesId?: string) => {
        const appToDelete = appointments.find(a => a.id === id);
        if(!appToDelete) return false;

        const confirmed = window.confirm(seriesId ? 'Excluir esta e todas as futuras ocorrências?' : 'Tem certeza que deseja excluir este agendamento?');
        if (!confirmed) return false;

        const result = seriesId 
            ? await deleteAppointmentSeriesAction(seriesId, appToDelete.startTime)
            : await deleteAppointmentAction(id);

        if(result.success) {
            toast({ title: "Agendamento removido" });
            fetchAppointmentsForWeek(currentDate);
            setSelectedAppointment(null);
            setIsFormOpen(false);
            return true;
        }
        toast({ title: result.message || "Erro ao remover", variant: "destructive" });
        return false;
    };


    return (
      <div className="flex-1 flex flex-col overflow-auto bg-white rounded-2xl shadow-sm mt-4">
        <div className="sticky top-0 bg-white z-20 flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-slate-800">
            {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(addDays(weekStart, 6), "d 'de' MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => changeWeek(-1)} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Hoje</button>
            <button onClick={() => changeWeek(1)} className="p-2 rounded-lg hover:bg-slate-100"><ChevronRight size={20} /></button>
            <button onClick={() => setIsFormOpen(true)} className="ml-4 px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 flex items-center shadow-sm"><Plus size={16} className="mr-2"/>Agendar</button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-auto">
          {/* Header */}
          <div className="sticky top-[85px] bg-white z-10 grid grid-cols-[auto_1fr] shadow-sm">
            <div className="w-16 border-r"></div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${therapists.length}, 1fr)` }}>
              {therapists.map(therapist => (
                <div key={therapist.id} className="text-center py-2 border-r last:border-r-0">
                    <p className="font-semibold">{therapist.name}</p>
                </div>
              ))}
            </div>
            <div className="w-16 border-r"></div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${therapists.length}, 1fr)` }}>
                {therapists.map(therapist => (
                    <div key={therapist.id} className="grid grid-cols-7 border-r last:border-r-0">
                        {weekDays.map(day => (
                             <div key={day.toISOString()} className={cn("text-center border-r last:border-r-0 py-2", isToday(day) && "bg-sky-50")}>
                                <p className="text-xs font-medium text-slate-500 uppercase">{format(day, 'EEE', { locale: ptBR })}</p>
                                <p className={cn("text-2xl font-bold mt-1", isToday(day) ? "text-sky-600" : "text-slate-900")}>{format(day, 'd')}</p>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
          </div>
          {/* Main Grid */}
          <div className="flex-1 grid grid-cols-[auto_1fr] overflow-y-auto">
            {/* Time column */}
            <div className="w-16 border-r">
                {timeSlots.map(time => (
                    <div key={time} className="h-12 text-right pr-2 text-xs text-slate-400 font-medium -mt-1.5 pt-1.5 border-t border-slate-200">
                        {time.endsWith('00') ? time : ''}
                    </div>
                ))}
            </div>
            {/* Schedule columns */}
            <div className="grid relative" style={{ gridTemplateColumns: `repeat(${therapists.length}, 1fr)` }}>
                {isLoading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>}
                {therapists.map(therapist => (
                    <div key={therapist.id} className="grid grid-cols-7 border-r last:border-r-0">
                        {weekDays.map(day => (
                            <div key={day.toISOString()} className="relative border-r last:border-r-0 h-full">
                                {timeSlots.map(time => <div key={time} className="h-12 border-t border-slate-200"></div>)}
                                {appointments
                                    .filter(app => app.therapistId === therapist.id && isSameDay(app.startTime, day))
                                    .map(app => (
                                        <AppointmentCard
                                            key={app.id}
                                            appointment={app}
                                            startHour={START_HOUR}
                                            pixelsPerMinute={PIXELS_PER_MINUTE}
                                            onClick={() => setSelectedAppointment(app)}
                                        />
                                    ))}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
            {selectedAppointment && (
                <AppointmentDetailModal
                    appointment={selectedAppointment}
                    patient={patients.find(p => p.id === selectedAppointment.patientId)}
                    therapist={therapists.find(t => t.id === selectedAppointment.therapistId)}
                    onClose={() => setSelectedAppointment(null)}
                    onEdit={() => { setSelectedAppointment(null); setAppointmentToEdit(selectedAppointment); setIsFormOpen(true); }}
                    onDelete={handleDeleteAppointment}
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