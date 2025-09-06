import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  X,
  Calendar,
  Clock,
  User,
  FileText,
  // DollarSign, // Temporariamente comentado
  Check,
  ChevronRight,
  Stethoscope,
  Activity,
  Heart,
  Brain,
} from 'lucide-react';
import PatientSearchInput from './PatientSearchInput';
import { cn } from '../../lib/utils';
import {
  Patient,
  PatientSummary,
  Appointment,
  AppointmentType,
  AppointmentStatus,
} from '../../types';
import * as appointmentService from '../../services/appointmentService';
import { useToast } from '../../contexts/ToastContext';

interface BookingModalProps {
  slot: { date: Date; time: string; therapistId: string };
  onClose: () => void;
  onSuccess: () => void;
}

const appointmentTypes = [
  {
    value: AppointmentType.Evaluation,
    label: 'Avaliação Inicial',
    icon: Stethoscope,
    duration: 60,
    price: 150,
    color: 'purple',
    description: 'Primeira consulta com anamnese completa',
  },
  {
    value: AppointmentType.Session,
    label: 'Sessão Regular',
    icon: Activity,
    duration: 50,
    price: 120,
    color: 'emerald',
    description: 'Sessão de fisioterapia convencional',
  },
  {
    value: AppointmentType.Return,
    label: 'Retorno',
    icon: Heart,
    duration: 30,
    price: 100,
    color: 'blue',
    description: 'Consulta de acompanhamento',
  },
  {
    value: AppointmentType.Pilates,
    label: 'Pilates',
    icon: Brain,
    duration: 50,
    price: 90,
    color: 'amber',
    description: 'Sessão de pilates terapêutico',
  },
];

export default function BookingModal({
  slot,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<
    Patient | PatientSummary | null
  >(null);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>(
    AppointmentType.Session
  );
  const [duration, setDuration] = useState(50);
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState(120);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const selectedTypeData = appointmentTypes.find(
    t => t.value === appointmentType
  );

  useEffect(() => {
    const type = appointmentTypes.find(t => t.value === appointmentType);
    if (type) {
      setDuration(type.duration);
      setPrice(type.price);
    }
  }, [appointmentType]);

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    setIsSubmitting(true);

    try {
      const startTime = new Date(slot.date);
      if (!slot.time) return;
      const [hour, minute] = slot.time.split(':');
      if (!hour || !minute) return;
      startTime.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);

      const endTime = new Date(startTime.getTime() + duration * 60000);

      const newAppointment: Appointment = {
        id: `app_${Date.now()}`,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientAvatarUrl:
          (selectedPatient as any).avatarUrl ||
          `https://i.pravatar.cc/150?u=${selectedPatient.id}`,
        therapistId: slot.therapistId,
        startTime: startTime,
        endTime: endTime,
        title: `Consulta de ${appointmentType}`,
        type: appointmentType,
        status: AppointmentStatus.Scheduled,
        value: price,
        paymentStatus: 'pending',
        observations: notes,
      };

      await appointmentService.saveAppointment(newAppointment);
      setStep(4);
      setTimeout(onSuccess, 1500);
    } catch (error) {
      console.error('Erro:', error);
      showToast('Erro ao agendar a consulta.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden'
      >
        <div className='bg-gradient-to-r from-sky-500 to-sky-600 p-6 text-white'>
          <div className='flex items-start justify-between'>
            <div>
              <h2 className='text-2xl font-bold'>Novo Agendamento</h2>
              <div className='flex items-center gap-4 mt-2'>
                <div className='flex items-center gap-2'>
                  <Calendar className='w-4 h-4' />
                  <span className='text-sky-100'>
                    {format(slot.date, "d 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Clock className='w-4 h-4' />
                  <span className='text-sky-100'>{slot.time}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className='p-2 hover:bg-white/20 rounded-lg transition-colors'
            >
              <X className='w-5 h-5' />
            </button>
          </div>

          <div className='flex items-center gap-2 mt-6'>
            {[1, 2, 3].map(i => (
              <React.Fragment key={i}>
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full transition-all',
                    step >= i
                      ? 'bg-white text-sky-600 font-bold'
                      : 'bg-white/20 text-sky-100'
                  )}
                >
                  {step > i ? <Check className='w-4 h-4' /> : i}
                </div>
                {i < 3 && (
                  <div
                    className={cn(
                      'flex-1 h-1 rounded-full transition-all',
                      step > i ? 'bg-white' : 'bg-white/20'
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className='p-6'>
          <AnimatePresence mode='wait'>
            {step === 1 && (
              <motion.div
                key='step1'
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className='space-y-6'
              >
                <div>
                  <label className='flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4'>
                    <User className='w-5 h-5 text-sky-500' />
                    Selecione o Paciente
                  </label>
                  <PatientSearchInput
                    onSelectPatient={setSelectedPatient}
                    selectedPatient={selectedPatient}
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key='step2'
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className='space-y-6'
              >
                <div>
                  <label className='flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4'>
                    <Stethoscope className='w-5 h-5 text-sky-500' />
                    Tipo de Atendimento
                  </label>
                  <div className='grid grid-cols-2 gap-4'>
                    {appointmentTypes.map(type => (
                      <motion.button
                        key={type.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setAppointmentType(type.value)}
                        className={cn(
                          'relative p-4 rounded-xl border-2 transition-all text-left',
                          appointmentType === type.value
                            ? 'border-sky-500 bg-sky-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        {appointmentType === type.value && (
                          <motion.div
                            layoutId='selected-type'
                            className='absolute inset-0 bg-gradient-to-r from-sky-500/10 to-sky-600/10 rounded-xl'
                          />
                        )}
                        <div className='relative'>
                          <div className='flex items-start justify-between mb-2'>
                            <type.icon
                              className={cn(
                                'w-6 h-6',
                                appointmentType === type.value
                                  ? 'text-sky-500'
                                  : 'text-gray-400'
                              )}
                            />
                            <span className='text-2xl font-bold text-gray-900'>
                              R${type.price}
                            </span>
                          </div>
                          <h3 className='font-semibold text-gray-900 mb-1'>
                            {type.label}
                          </h3>
                          <p className='text-sm text-gray-600 mb-2'>
                            {type.description}
                          </p>
                          <div className='flex items-center gap-2'>
                            <Clock className='w-4 h-4 text-gray-400' />
                            <span className='text-sm text-gray-600'>
                              {type.duration} minutos
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key='step3'
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className='space-y-6'
              >
                <div>
                  <label className='flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4'>
                    <FileText className='w-5 h-5 text-sky-500' />
                    Confirmação do Agendamento
                  </label>
                  <div className='bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl p-6 space-y-4'>
                    <div className='flex items-center justify-between pb-4 border-b border-sky-200'>
                      <div>
                        <p className='text-sm text-gray-600'>Paciente</p>
                        <p className='font-semibold text-lg text-gray-900'>
                          {selectedPatient?.name}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm text-gray-600'>Valor</p>
                        <p className='font-bold text-2xl text-sky-600'>
                          R$ {price}
                        </p>
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <p className='text-sm text-gray-600'>Tipo</p>
                        <p className='font-medium text-gray-900'>
                          {selectedTypeData?.label}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-gray-600'>Duração</p>
                        <p className='font-medium text-gray-900'>
                          {duration} minutos
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Observações (opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all'
                      placeholder='Adicione observações...'
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key='step4'
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className='flex flex-col items-center justify-center py-12'
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  className='w-20 h-20 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mb-4'
                >
                  <Check className='w-10 h-10 text-white' />
                </motion.div>
                <h3 className='text-2xl font-bold text-gray-900 mb-2'>
                  Agendamento Confirmado!
                </h3>
                <p className='text-gray-600'>Notificação enviada ao paciente</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step < 4 && (
          <div className='flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200'>
            <button
              onClick={step > 1 ? () => setStep(step - 1) : onClose}
              className='px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium'
            >
              {step === 1 ? 'Cancelar' : 'Voltar'}
            </button>
            <button
              onClick={() => {
                if (step < 3) {
                  setStep(step + 1);
                } else {
                  handleSubmit();
                }
              }}
              disabled={
                (step === 1 && !selectedPatient) ||
                (step === 2 && !appointmentType) ||
                isSubmitting
              }
              className={cn(
                'px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2',
                'bg-gradient-to-r from-sky-500 to-sky-600 text-white',
                'hover:from-sky-600 hover:to-sky-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'shadow-lg shadow-sky-500/25'
              )}
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className='w-5 h-5 border-2 border-white border-t-transparent rounded-full'
                  />
                  Agendando...
                </>
              ) : (
                <>
                  {step === 3 ? 'Confirmar' : 'Próximo'}
                  <ChevronRight className='w-4 h-4' />
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
