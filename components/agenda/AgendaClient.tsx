// src/components/agenda/AgendaClient.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { addDays, startOfWeek } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import type { User as PrismaUser } from '@prisma/client';
import {
  EnrichedAppointment,
  PatientSummary,
  Therapist,
} from '@/types';
import { useToast } from '../ui/use-toast';
import AppointmentDetailModal from './AppointmentDetailModal';
import CalendarView, { CalendarViewType } from './CalendarView';
// import AppointmentFormModal from './AppointmentFormModal';
import {
  deleteAppointmentAction,
  deleteAppointmentSeriesAction,
} from '../../lib/actions/appointment.actions';



interface AgendaClientProps {
  initialAppointments: any[];
  therapists: PrismaUser[];
  patients: PatientSummary[];
}

export default function AgendaClient({
  initialAppointments,
  therapists,
  patients,
}: AgendaClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('week');
  const [appointments, setAppointments] = useState<EnrichedAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Convert PrismaUser to Therapist with default color
  const convertToTherapist = (user: PrismaUser): Therapist => ({
    id: user.id,
    name: user.name,
    color: 'blue', // Cor padrão, já que não existe no modelo User
    avatarUrl: user.avatarUrl || '',
  });

  // Convert EnrichedAppointment to Appointment
  // Temporariamente comentado para resolver erro de tipos
  /*
  const convertToAppointment = (enriched: EnrichedAppointment): Appointment => {
    const {
      therapistColor,
      typeColor,
      patientPhone,
      patientMedicalAlerts,
      ...appointment
    } = enriched;
    return appointment;
  };
  */

  const [selectedAppointment, setSelectedAppointment] = useState<
    EnrichedAppointment | undefined
  >();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);



  const parseAppointments = (apps: any[]): EnrichedAppointment[] => {
    return apps.map(app => ({
      id: app.id,
      patientId: app.patientId,
      therapistId: app.therapistId,
      startTime: new Date(app.startTime),
      endTime: new Date(app.endTime),
      type: app.type,
      status: app.status,
      notes: app.notes,
      isRecurring: app.isRecurring,
      seriesId: app.seriesId,
      patient: {
        id: app.patient.id,
        name: app.patient.name,
        email: app.patient.email,
        phone: app.patient.phone,
      },
      therapist: {
        id: app.therapist.id,
        name: app.therapist.name,
        email: app.therapist.email,
        specialization: app.therapist.specialization,
        color: app.therapist.color,
      },
    }));
  };

  useEffect(() => {
    if (initialAppointments) {
      setAppointments(parseAppointments(initialAppointments));
    } else {
      fetchAppointments();
    }
  }, [initialAppointments, fetchAppointments]);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/appointments?date=${currentDate.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();
      setAppointments(parseAppointments(data));
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar agendamentos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, toast]);

  const changeWeek = (offset: number) => {
    const newDate = addDays(currentDate, offset * 7);
    setCurrentDate(newDate);
    fetchAppointments();
  };

  // Temporariamente comentado para resolver erro de tipos
  /*
  const handleSaveAppointment = async (appData: Appointment) => {
    const result = await saveAppointmentAction(appData);
    if (result.success) {
      toast({ title: 'Agendamento salvo!' });
      fetchAppointmentsForWeek(currentDate);
      setIsFormOpen(false);
      return true;
    }
    toast({
      title: result.message || 'Erro ao salvar',
      variant: 'destructive',
    });
    return false;
  };
  */

  const handleDeleteAppointment = async (
    appointmentId: string,
    deleteType: 'single' | 'series'
  ) => {
    try {
      if (deleteType === 'series') {
        await deleteAppointmentSeriesAction(appointmentId);
      } else {
        await deleteAppointmentAction(appointmentId);
      }
      
      // Refresh appointments
      fetchAppointments();
      
      toast({
        title: 'Sucesso',
        description: `Agendamento${deleteType === 'series' ? 's' : ''} excluído${deleteType === 'series' ? 's' : ''} com sucesso`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir agendamento',
        variant: 'destructive',
      });
    }
  };

  const handleAppointmentMove = async (appointmentId: string, newStartTime: Date, newTherapistId: string) => {
    try {
      // Encontrar o agendamento atual
      const appointment = appointments.find(app => app.id === appointmentId);
      if (!appointment) return;

      // Calcular nova data de fim baseada na duração original
      const duration = appointment.endTime.getTime() - appointment.startTime.getTime();
      const newEndTime = new Date(newStartTime.getTime() + duration);

      // Atualizar o agendamento
      const updatedAppointment = {
        ...appointment,
        startTime: newStartTime,
        endTime: newEndTime,
        therapistId: newTherapistId
      };

      // Aqui você implementaria a chamada para a API
      // await updateAppointment(appointmentId, updatedAppointment);
      
      // Por enquanto, apenas atualizamos localmente
      setAppointments(prev => 
        prev.map(app => app.id === appointmentId ? updatedAppointment : app)
      );
    } catch (error) {
      console.error('Erro ao mover agendamento:', error);
    }
  };

  const handleTimeSlotClick = (date: Date, therapistId: string) => {
    // Abrir modal de novo agendamento com data e terapeuta pré-selecionados
    setSelectedAppointment(null);
    setIsFormModalOpen(true);
    // Aqui você pode passar a data e therapistId para o modal
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}
      
      <CalendarView
        appointments={appointments}
        therapists={therapists}
        patients={patients}
        currentDate={currentDate}
        viewType={viewType}
        onDateChange={setCurrentDate}
        onViewTypeChange={setViewType}
        onAppointmentClick={(appointment) => {
          setSelectedAppointment(appointment);
          setIsDetailModalOpen(true);
        }}
        onAppointmentMove={handleAppointmentMove}
        onTimeSlotClick={handleTimeSlotClick}
        onRefresh={fetchAppointments}
      />

      {/* Modals */}
      <AnimatePresence>
        {selectedAppointment && isDetailModalOpen && (
          <AppointmentDetailModal
            appointment={selectedAppointment}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedAppointment(undefined);
            }}
            onDelete={handleDeleteAppointment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
