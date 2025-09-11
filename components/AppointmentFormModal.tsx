'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
} from '../types';
import { useToast } from '../contexts/ToastContext';
import PatientSearchInput from './agenda/PatientSearchInput';
import ValidationAlert from './agenda/ValidationAlert';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import RecurrenceSelector from './agenda/RecurrenceSelector';
import { findConflict } from '../services/scheduling/conflictDetection';
import { generateRecurrences } from '../services/scheduling/recurrenceService';
import { validateAppointment, ValidationResult } from '../services/schedulingRulesEngine';
import { getAppointmentsByPatientId } from '../services/appointmentService';
import { schedulingSettingsService } from '../services/schedulingSettingsService';

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => Promise<boolean>;
  onDelete: (id: string, seriesId?: string) => Promise<boolean>;
  appointmentToEdit?: Appointment;
  initialData?: { date: Date; therapistId?: string };
  patients: Patient[];
  therapists: Therapist[];
  allAppointments: Appointment[];
}

const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  // onDelete, // Temporariamente comentado
  appointmentToEdit,
  initialData,
  patients,
  therapists,
  allAppointments,
}) => {
  const [selectedPatient, setSelectedPatient] = useState<
    PatientSummary | null
  >(null);
  const [appointmentType, setAppointmentType] = useState(
    AppointmentType.Session
  );
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<
    RecurrenceRule | undefined
  >(undefined);
  const [isTeleconsultaEnabled, setIsTeleconsultaEnabled] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const { showToast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);

  const slotDate = useMemo(
    () => appointmentToEdit?.startTime || initialData?.date || new Date(),
    [appointmentToEdit, initialData]
  );
  const [slotTime, setSlotTime] = useState(
    useMemo(() => format(slotDate, 'HH:mm'), [slotDate])
  );
  const [therapistId, setTherapistId] = useState(
    appointmentToEdit?.therapistId ||
      initialData?.therapistId ||
      therapists[0]?.id ||
      ''
  );

  useEffect(() => {
    if (isOpen) {
      setIsTeleconsultaEnabled(
        schedulingSettingsService.getSettings().teleconsultaEnabled
      );
      if (appointmentToEdit) {
        const patient = patients.find(
          p => p.id === appointmentToEdit.patientId
        );
        setSelectedPatient(patient ? {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          status: patient.status,
          lastVisit: patient.lastVisit,
          avatarUrl: patient.avatarUrl,
          cpf: patient.cpf,
          createdAt: new Date().toISOString(),
          birthDate: patient.birthDate || new Date().toISOString()
        } as PatientSummary : null);
        setAppointmentType(appointmentToEdit.type);
        const dur =
          (appointmentToEdit.endTime.getTime() -
            appointmentToEdit.startTime.getTime()) /
          (60 * 1000);
        setDuration(dur);
        setNotes(appointmentToEdit.observations || '');
        setTherapistId(appointmentToEdit.therapistId);
        setSlotTime(format(appointmentToEdit.startTime, 'HH:mm'));
        setRecurrenceRule(appointmentToEdit.recurrenceRule);
      } else {
        setSelectedPatient(null);
        setAppointmentType(AppointmentType.Session);
        setDuration(60);
        setNotes('');
        setTherapistId(initialData?.therapistId || therapists[0]?.id || '');
        setSlotTime(format(initialData?.date || new Date(), 'HH:mm'));
        setRecurrenceRule(undefined);
      }
    }
  }, [appointmentToEdit, initialData, isOpen, patients, therapists]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, isOpen]);

  // Effect to handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [onClose, isOpen]);

  // Effect para validação em tempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateCurrentAppointment();
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [selectedPatient, therapistId, slotTime, slotDate, duration, appointmentType]);

  // Limpar validação quando modal fechar
  useEffect(() => {
    if (!isOpen) {
      setValidation(null);
    }
  }, [isOpen]);

  // Função para validar agendamento em tempo real
  const validateCurrentAppointment = async () => {
    if (!selectedPatient || !therapistId || !slotTime) {
      setValidation(null);
      return;
    }

    setIsValidating(true);

    try {
      // Buscar agendamentos do paciente para validação
      const patientAppointments = await getAppointmentsByPatientId(selectedPatient.id);
      
      const startTime = new Date(slotDate);
      const [hour, minute] = slotTime.split(':');
      startTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
      const endTime = new Date(startTime.getTime() + duration * 60000);
      
      const appointmentData = {
        id: appointmentToEdit?.id || '',
        patientId: selectedPatient.id,
        therapistId: therapistId,
        startTime,
        endTime,
        status: 'scheduled' as AppointmentStatus,
        type: appointmentType,
        notes: notes || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const selectedTherapist = therapists.find(t => t.id === therapistId);
      if (!selectedTherapist) return;

      const validationResult = await validateAppointment(
        appointmentData,
        selectedPatient,
        selectedTherapist,
        allAppointments,
        patientAppointments
      );

      setValidation(validationResult);
    } catch (error) {
      console.error('Erro ao validar agendamento:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveClick = async () => {
    if (!selectedPatient) {
      showToast('Selecione um paciente para agendar.', 'error');
      return;
    }

    // Validar antes de salvar
    await validateCurrentAppointment();
    
    // Se há erros críticos, não permitir salvar
    if (validation && !validation.isValid) {
      showToast('Corrija os erros antes de salvar o agendamento', 'error');
      return;
    }

    setIsSaving(true);

    const startTime = new Date(slotDate);
    if (!slotTime) return;
    const [hour, minute] = slotTime.split(':');
    if (!hour || !minute) return;
    startTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

    const endTime = new Date(startTime.getTime() + duration * 60000);

    const baseAppointment: any = {
      id: appointmentToEdit?.id || `app_${Date.now()}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientAvatarUrl:
        (selectedPatient as any).avatarUrl ||
        `https://i.pravatar.cc/150?u=${selectedPatient.id}`,
      therapistId: therapistId,
      title: appointmentToEdit?.title || `${appointmentType}`,
      startTime: startTime,
      endTime: endTime,
      status: appointmentToEdit?.status || AppointmentStatus.Scheduled,
      type: appointmentType,
      observations: notes,
      value: appointmentToEdit?.value || 120,
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
      setIsSaving(false);
      return;
    }

    // In a real scenario, this might be a single batch API call
    let success = true;
    for (const app of appointmentsToSave) {
      const result = await onSave(app);
      if (!result) {
        success = false;
        break;
      }
    }

    if (success) {
      onClose();
    }
    setIsSaving(false);
  };

  if (!isOpen) return null;
  const title = appointmentToEdit ? 'Editar Agendamento' : 'Novo Agendamento';

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div
        ref={modalRef}
        className='bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col'
      >
        <div className='flex items-center justify-between p-4 border-b'>
          <h2 className='text-xl font-semibold'>{title}</h2>
          <button
            onClick={onClose}
            className='p-1 hover:bg-slate-100 rounded-full transition'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='bg-sky-50 px-4 py-3 flex items-center gap-4 text-sm'>
          <div className='flex items-center gap-2'>
            <Calendar className='w-4 h-4 text-sky-600' />
            <span className='font-medium'>
              {format(slotDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Clock className='w-4 h-4 text-sky-600' />
            <input
              type='time'
              value={slotTime}
              onChange={e => setSlotTime(e.target.value)}
              className='font-medium bg-transparent border-none p-0 focus:ring-0'
            />
          </div>
        </div>

        <div className='p-4 space-y-4 overflow-y-auto'>
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              Paciente *
            </label>
            <PatientSearchInput
              onSelectPatient={setSelectedPatient}
              selectedPatient={selectedPatient}
              placeholder="Buscar paciente por nome, telefone ou CPF..."
              allowQuickAdd={true}
              showRecentSearches={true}
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              Fisioterapeuta
            </label>
            <select
              value={therapistId}
              onChange={e => setTherapistId(e.target.value)}
              className='w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 text-sm'
            >
              {therapists.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              Tipo de Atendimento
            </label>
            <select
              value={appointmentType}
              onChange={e =>
                setAppointmentType(e.target.value as AppointmentType)
              }
              className='w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 text-sm'
            >
              {Object.values(AppointmentType)
                .filter(
                  type =>
                    isTeleconsultaEnabled ||
                    type !== AppointmentType.Teleconsulta
                )
                .map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              Duração
            </label>
            <div className='flex gap-2'>
              {[30, 45, 60].map(min => (
                <button
                  key={min}
                  onClick={() => setDuration(min)}
                  className={`px-4 py-2 rounded-md border transition text-sm ${
                    duration === min
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {min} min
                </button>
              ))}
            </div>
          </div>

          {!appointmentToEdit?.seriesId && (
            <RecurrenceSelector
              value={recurrenceRule}
              onChange={setRecurrenceRule}
            />
          )}

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              Observações
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className='w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 text-sm'
              placeholder='Observações sobre o atendimento...'
            />
          </div>

          {/* Validações e Alertas */}
          {(validation || isValidating) && (
            <div>
              {isValidating && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm text-gray-600">Validando agendamento...</span>
                </div>
              )}
              {validation && !isValidating && (
                <ValidationAlert validation={validation} />
              )}
            </div>
          )}
        </div>

        <div className='flex items-center justify-end gap-3 px-4 py-3 bg-slate-50 rounded-b-lg border-t'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition text-sm'
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveClick}
            disabled={isSaving || !selectedPatient || isValidating || (validation && !validation.isValid)}
            className={`px-4 py-2 text-white rounded-md flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed transition ${
              validation && !validation.isValid
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-sky-500 hover:bg-sky-600'
            }`}
          >
            <Save className='w-4 h-4 mr-2' />
            {isSaving
              ? 'Salvando...'
              : isValidating
              ? 'Validando...'
              : validation && !validation.isValid
              ? 'Corrija os erros'
              : 'Confirmar Agendamento'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentFormModal;
