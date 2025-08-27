// src/components/agenda/AppointmentFormModal.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Calendar, Clock } from 'lucide-react';
import { Appointment, Patient, AppointmentStatus, AppointmentType, Therapist, PatientSummary } from '@/types';
import { useToast } from '../ui/use-toast';
import PatientSearchInput from './PatientSearchInput';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// import RecurrenceSelector from './RecurrenceSelector';
// import { findConflict } from '@/services/scheduling/conflictDetection';
// import { generateRecurrences } from '@/services/scheduling/recurrenceService';

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => Promise<boolean>;
  onDelete: (id: string, seriesId?: string) => Promise<boolean>;
  appointmentToEdit?: Appointment;
  initialData?: { date: Date, therapistId?: string };
  patients: PatientSummary[];
  therapists: Therapist[];
  allAppointments: Appointment[];
}

const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({ isOpen, onClose, onSave, onDelete, appointmentToEdit, initialData, patients, therapists, allAppointments }) => {
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [appointmentType, setAppointmentType] = useState(AppointmentType.Session);
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();
  
  const slotDate = useMemo(() => appointmentToEdit?.startTime || initialData?.date || new Date(), [appointmentToEdit, initialData]);
  const [slotTime, setSlotTime] = useState(useMemo(() => format(slotDate, 'HH:mm'), [slotDate]));
  const [therapistId, setTherapistId] = useState(appointmentToEdit?.therapistId || initialData?.therapistId || therapists[0]?.id || '');
  
  useEffect(() => {
    if (isOpen) {
        if (appointmentToEdit) {
            const patient = patients.find(p => p.id === appointmentToEdit.patientId);
            setSelectedPatient(patient || null);
            setAppointmentType(appointmentToEdit.type);
            const dur = (new Date(appointmentToEdit.endTime).getTime() - new Date(appointmentToEdit.startTime).getTime()) / (60 * 1000);
            setDuration(dur);
            setNotes(appointmentToEdit.observations || '');
            setTherapistId(appointmentToEdit.therapistId);
            setSlotTime(format(new Date(appointmentToEdit.startTime), 'HH:mm'));
        } else {
            setSelectedPatient(null);
            setAppointmentType(AppointmentType.Session);
            setDuration(60);
            setNotes('');
            setTherapistId(initialData?.therapistId || therapists[0]?.id || '');
            setSlotTime(format(initialData?.date || new Date(), 'HH:mm'));
        }
    }
  }, [appointmentToEdit, initialData, isOpen, patients, therapists]);

  const handleSaveClick = async () => {
    if (!selectedPatient) {
      toast({ title: 'Selecione um paciente para agendar.', variant: 'destructive' });
      return;
    }
    
    setIsSaving(true);
    
    const startTime = new Date(slotDate);
    const [hour, minute] = slotTime.split(':');
    startTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
    
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const baseAppointment: Appointment = {
      id: appointmentToEdit?.id || `app_new_${Date.now()}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientAvatarUrl: (selectedPatient as any).avatarUrl,
      therapistId: therapistId,
      title: appointmentToEdit?.title || `${appointmentType}`,
      startTime: startTime,
      endTime: endTime,
      status: appointmentToEdit?.status || AppointmentStatus.Scheduled,
      type: appointmentType,
      observations: notes,
      value: appointmentToEdit?.value || 120,
      paymentStatus: appointmentToEdit?.paymentStatus || 'pending',
    };

    await onSave(baseAppointment);
    setIsSaving(false);
  };

  if (!isOpen) return null;
  const title = appointmentToEdit ? 'Editar Agendamento' : 'Novo Agendamento';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Paciente *</label>
            <PatientSearchInput
              onSelectPatient={setSelectedPatient}
              selectedPatient={selectedPatient}
              patients={patients}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fisioterapeuta</label>
            <select
              value={therapistId}
              onChange={(e) => setTherapistId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Atendimento</label>
            <select
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            >
              {Object.values(AppointmentType).map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 px-4 py-3 bg-slate-50 rounded-b-lg border-t">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition text-sm">Cancelar</button>
          <button
            onClick={handleSaveClick}
            disabled={!selectedPatient || isSaving}
            className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center text-sm"
          >
            <Save className="w-4 h-4 mr-2"/>
            {isSaving ? 'Salvando...' : 'Confirmar Agendamento'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentFormModal;