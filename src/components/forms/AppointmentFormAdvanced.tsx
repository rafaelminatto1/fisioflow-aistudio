'use client';

import React, { useMemo } from 'react';
import { X, Save, Calendar, Clock } from 'lucide-react';
import {
  Appointment,
  Patient,
  AppointmentStatus,
  AppointmentType,
  Therapist,
  PatientSummary,
  RecurrenceRule,
} from '../../../types';
import { useToast } from '../../../contexts/ToastContext';
import {
  useAdvancedForm,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormTimePicker,
  FormDatePicker,
  appointmentSchema,
  AppointmentFormData
} from '../forms/advanced';
import PatientSearchInput from '../../../components/agenda/PatientSearchInput';
import RecurrenceSelector from '../../../components/RecurrenceSelector';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { findConflict } from '../../../services/scheduling/conflictDetection';
import { generateRecurrences } from '../../../services/scheduling/recurrenceService';
import { schedulingSettingsService } from '../../../services/schedulingSettingsService';

interface AppointmentFormAdvancedProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => Promise<boolean>;
  onDelete?: (id: string, seriesId?: string) => Promise<boolean>;
  appointmentToEdit?: Appointment;
  initialData?: { date: Date; therapistId?: string };
  patients: Patient[] | PatientSummary[];
  therapists: Therapist[];
  allAppointments: Appointment[];
}

const AppointmentFormAdvanced: React.FC<AppointmentFormAdvancedProps> = ({
  isOpen,
  onClose,
  onSave,
  appointmentToEdit,
  initialData,
  patients,
  therapists,
  allAppointments,
}) => {
  const { showToast } = useToast();
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | PatientSummary | null>(null);
  const [recurrenceRule, setRecurrenceRule] = React.useState<RecurrenceRule | undefined>(undefined);
  const [isTeleconsultaEnabled, setIsTeleconsultaEnabled] = React.useState(false);

  const slotDate = useMemo(
    () => appointmentToEdit?.startTime || initialData?.date || new Date(),
    [appointmentToEdit, initialData]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    control
  } = useAdvancedForm({
    schema: appointmentSchema,
    defaultValues: {
      patientId: appointmentToEdit?.patientId || '',
      therapistId: appointmentToEdit?.therapistId || initialData?.therapistId || therapists[0]?.id || '',
      date: format(slotDate, 'yyyy-MM-dd'),
      time: format(slotDate, 'HH:mm'),
      duration: appointmentToEdit ? 
        Math.round((appointmentToEdit.endTime.getTime() - appointmentToEdit.startTime.getTime()) / (60 * 1000)) : 
        60,
      type: appointmentToEdit?.type || AppointmentType.Session,
      observations: appointmentToEdit?.observations || '',
      value: appointmentToEdit?.value || 120
    },
    onSubmit: async (data) => {
      if (!selectedPatient) {
        showToast('Selecione um paciente para agendar.', 'error');
        return;
      }

      const startTime = new Date(`${data.date}T${data.time}:00`);
      const endTime = new Date(startTime.getTime() + data.duration * 60000);

      const baseAppointment: any = {
        id: appointmentToEdit?.id || `app_${Date.now()}`,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientAvatarUrl:
          (selectedPatient as any).avatarUrl ||
          `https://i.pravatar.cc/150?u=${selectedPatient.id}`,
        therapistId: data.therapistId,
        title: appointmentToEdit?.title || `${data.type}`,
        startTime: startTime,
        endTime: endTime,
        status: appointmentToEdit?.status || AppointmentStatus.Scheduled,
        type: data.type,
        observations: data.observations,
        value: data.value,
        paymentStatus: appointmentToEdit?.paymentStatus || 'pending',
        recurrenceRule: recurrenceRule,
      };
      
      if (appointmentToEdit?.seriesId) {
        baseAppointment.seriesId = appointmentToEdit.seriesId;
      }

      const appointmentsToSave = generateRecurrences(baseAppointment);

      const conflict = findConflict(
        appointmentsToSave,
        allAppointments,
        appointmentToEdit?.id
      );
      if (conflict) {
        showToast(
          `Conflito com o agendamento de ${conflict.patientName} em ${format(conflict.startTime, 'dd/MM HH:mm')}.`,
          'error'
        );
        return;
      }

      let success = true;
      for (const app of appointmentsToSave) {
        const result = await onSave(app);
        if (!result) {
          success = false;
          break;
        }
      }

      if (success) {
        showToast(
          appointmentToEdit
            ? 'Agendamento atualizado com sucesso!'
            : 'Agendamento criado com sucesso!',
          'success'
        );
        onClose();
      }
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      setIsTeleconsultaEnabled(
        schedulingSettingsService.getSettings().teleconsultaEnabled
      );
      
      if (appointmentToEdit) {
        const patient = patients.find(p => p.id === appointmentToEdit.patientId);
        setSelectedPatient(patient || null);
        setRecurrenceRule(appointmentToEdit.recurrenceRule);
        setValue('patientId', appointmentToEdit.patientId);
      } else {
        setSelectedPatient(null);
        setRecurrenceRule(undefined);
        reset();
      }
    }
  }, [appointmentToEdit, initialData, isOpen, patients, therapists, setValue, reset]);

  if (!isOpen) return null;

  const title = appointmentToEdit ? 'Editar Agendamento' : 'Novo Agendamento';

  const therapistOptions = therapists.map(t => ({
    value: t.id,
    label: t.name
  }));

  const appointmentTypeOptions = Object.values(AppointmentType)
    .filter(type => isTeleconsultaEnabled || type !== AppointmentType.Teleconsulta)
    .map(type => ({
      value: type,
      label: type
    }));

  const durationOptions = [
    { value: 30, label: '30 minutos' },
    { value: 45, label: '45 minutos' },
    { value: 60, label: '60 minutos' },
    { value: 90, label: '90 minutos' }
  ];

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col'>
        <header className='flex items-center justify-between p-6 border-b border-slate-200'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-sky-100 rounded-lg'>
              <Calendar className='w-5 h-5 text-sky-600' />
            </div>
            <h2 className='text-xl font-bold text-slate-800'>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-slate-100 rounded-full transition-colors'
          >
            <X className='w-5 h-5 text-slate-600' />
          </button>
        </header>

        <div className='bg-sky-50 px-6 py-4 flex items-center gap-6 text-sm border-b border-sky-100'>
          <div className='flex items-center gap-2'>
            <Calendar className='w-4 h-4 text-sky-600' />
            <span className='font-medium text-sky-800'>
              {format(slotDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Clock className='w-4 h-4 text-sky-600' />
            <span className='font-medium text-sky-800'>
              {format(slotDate, 'HH:mm')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='flex-1 flex flex-col'>
          <main className='flex-1 overflow-y-auto p-6 space-y-6'>
            {/* Seleção de Paciente */}
            <FormField
              label='Paciente'
              required
              error={errors.patientId?.message}
            >
              <PatientSearchInput
                onSelectPatient={(patient) => {
                  setSelectedPatient(patient);
                  setValue('patientId', patient?.id || '');
                }}
                selectedPatient={selectedPatient}
              />
            </FormField>

            {/* Informações do Agendamento */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <FormField
                label='Fisioterapeuta'
                required
                error={errors.therapistId?.message}
              >
                <FormSelect
                  control={control}
                  name='therapistId'
                  options={therapistOptions}
                  placeholder='Selecione o fisioterapeuta'
                />
              </FormField>

              <FormField
                label='Tipo de Atendimento'
                required
                error={errors.type?.message}
              >
                <FormSelect
                  control={control}
                  name='type'
                  options={appointmentTypeOptions}
                  placeholder='Selecione o tipo'
                />
              </FormField>
            </div>

            {/* Data e Hora */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <FormField
                label='Data'
                required
                error={errors.date?.message}
              >
                <FormDatePicker
                  control={control}
                  name='date'
                  placeholder='Selecione a data'
                  minDate={new Date()}
                />
              </FormField>

              <FormField
                label='Horário'
                required
                error={errors.time?.message}
              >
                <FormTimePicker
                  control={control}
                  name='time'
                  placeholder='Selecione o horário'
                  format='24h'
                  step={15}
                />
              </FormField>

              <FormField
                label='Duração'
                required
                error={errors.duration?.message}
              >
                <FormSelect
                  control={control}
                  name='duration'
                  options={durationOptions}
                  placeholder='Duração'
                />
              </FormField>
            </div>

            {/* Valor */}
            <FormField
              label='Valor da Consulta (R$)'
              error={errors.value?.message}
            >
              <FormInput
                {...register('value', { valueAsNumber: true })}
                type='number'
                placeholder='120.00'
                step='0.01'
                min='0'
              />
            </FormField>

            {/* Recorrência */}
            {!appointmentToEdit?.seriesId && (
              <FormField label='Recorrência'>
                <RecurrenceSelector
                  recurrenceRule={recurrenceRule}
                  onChange={setRecurrenceRule}
                />
              </FormField>
            )}

            {/* Observações */}
            <FormField
              label='Observações'
              error={errors.observations?.message}
            >
              <FormTextarea
                {...register('observations')}
                placeholder='Observações sobre o atendimento...'
                rows={4}
                maxLength={500}
                showCounter
              />
            </FormField>
          </main>

          <footer className='flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl'>
            <button
              type='button'
              onClick={onClose}
              className='px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={!selectedPatient || isSubmitting}
              className='px-6 py-2.5 text-sm font-medium text-white bg-sky-500 border border-transparent rounded-lg hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors'
            >
              <Save className='w-4 h-4' />
              {isSubmitting ? 'Salvando...' : 'Confirmar Agendamento'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AppointmentFormAdvanced;