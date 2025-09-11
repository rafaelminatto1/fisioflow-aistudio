'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface Patient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface Therapist {
  id: string;
  name: string;
  email?: string;
}

interface AppointmentFormData {
  patient_id: string;
  therapist_id: string;
  start_time: string;
  end_time: string;
  type: 'Avaliacao' | 'Sessao' | 'Retorno' | 'Pilates' | 'Urgente' | 'Teleconsulta';
  status: 'Agendado' | 'Realizado' | 'Concluido' | 'Cancelado' | 'Faltou';
  value?: number;
  payment_status: 'pending' | 'confirmed' | 'failed';
  observations?: string;
  series_id?: string;
  session_number?: number;
  total_sessions?: number;
}

interface NewAppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  appointment?: any;
  initialDate?: Date;
  initialTime?: string;
}

export default function NewAppointmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  appointment,
  initialDate,
  initialTime,
}: NewAppointmentFormModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [searchPatient, setSearchPatient] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<AppointmentFormData>({
    patient_id: '',
    therapist_id: '',
    start_time: '',
    end_time: '',
    type: 'Sessao',
    status: 'Agendado',
    value: 0,
    payment_status: 'pending',
    observations: '',
    series_id: '',
    session_number: 1,
    total_sessions: 1,
  });

  // Initialize form data
  useEffect(() => {
    if (appointment) {
      setFormData({
        patient_id: appointment.patient?.id || '',
        therapist_id: appointment.therapist?.id || '',
        start_time: new Date(appointment.start_time).toISOString().slice(0, 16),
        end_time: new Date(appointment.end_time).toISOString().slice(0, 16),
        type: appointment.type,
        status: appointment.status,
        value: appointment.value || 0,
        payment_status: appointment.payment_status,
        observations: appointment.observations || '',
        series_id: appointment.series_id || '',
        session_number: appointment.session_number || 1,
        total_sessions: appointment.total_sessions || 1,
      });
    } else if (initialDate && initialTime) {
      const startTime = new Date(initialDate);
      const [hours, minutes] = initialTime.split(':');
      startTime.setHours(parseInt(hours), parseInt(minutes));
      
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1); // Default 1 hour duration
      
      setFormData(prev => ({
        ...prev,
        start_time: startTime.toISOString().slice(0, 16),
        end_time: endTime.toISOString().slice(0, 16),
      }));
    } else if (initialDate) {
      const startTime = new Date(initialDate);
      startTime.setHours(9, 0); // Default 9:00 AM
      
      const endTime = new Date(startTime);
      endTime.setHours(10, 0); // Default 10:00 AM
      
      setFormData(prev => ({
        ...prev,
        start_time: startTime.toISOString().slice(0, 16),
        end_time: endTime.toISOString().slice(0, 16),
      }));
    }
  }, [appointment, initialDate, initialTime, isOpen]);

  // Load patients
  const loadPatients = async (search = '') => {
    try {
      const params = new URLSearchParams({
        limit: '20',
        ...(search && { search }),
        status: 'Active',
      });

      const response = await fetch(`/api/patients?${params}`);
      if (!response.ok) throw new Error('Failed to load patients');
      
      const data = await response.json();
      if (data.success) {
        setPatients(data.data);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  // Load therapists (users)
  const loadTherapists = async () => {
    try {
      // For now, we'll use a mock list since we don't have a users endpoint
      setTherapists([
        { id: 'therapist_1', name: 'Dr. João Silva', email: 'joao@fisioflow.com' },
        { id: 'therapist_2', name: 'Dra. Maria Santos', email: 'maria@fisioflow.com' },
        { id: 'therapist_3', name: 'Dr. Pedro Oliveira', email: 'pedro@fisioflow.com' },
      ]);
    } catch (error) {
      console.error('Error loading therapists:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPatients();
      loadTherapists();
    }
  }, [isOpen]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchPatient) {
        loadPatients(searchPatient);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchPatient]);

  // Auto-calculate end time when start time changes
  const handleStartTimeChange = (startTime: string) => {
    setFormData(prev => {
      const start = new Date(startTime);
      const end = new Date(start);
      
      // Default durations by appointment type
      const durations = {
        'Avaliacao': 60, // 1 hour
        'Sessao': 60, // 1 hour
        'Retorno': 30, // 30 minutes
        'Pilates': 60, // 1 hour
        'Urgente': 30, // 30 minutes
        'Teleconsulta': 30, // 30 minutes
      };
      
      end.setMinutes(end.getMinutes() + durations[prev.type]);
      
      return {
        ...prev,
        start_time: startTime,
        end_time: end.toISOString().slice(0, 16),
      };
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patient_id) newErrors.patient_id = 'Paciente é obrigatório';
    if (!formData.therapist_id) newErrors.therapist_id = 'Terapeuta é obrigatório';
    if (!formData.start_time) newErrors.start_time = 'Data/hora início é obrigatória';
    if (!formData.end_time) newErrors.end_time = 'Data/hora fim é obrigatória';
    
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      
      if (start >= end) {
        newErrors.end_time = 'Hora fim deve ser posterior ao início';
      }
      
      if (start < new Date()) {
        newErrors.start_time = 'Não é possível agendar no passado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const url = appointment?.id ? `/api/appointments/${appointment.id}` : '/api/appointments';
      const method = appointment?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          value: formData.value || null,
          session_number: formData.session_number || null,
          total_sessions: formData.total_sessions || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar agendamento');
      }

      if (data.success) {
        showToast(
          appointment ? 'Agendamento atualizado com sucesso!' : 'Agendamento criado com sucesso!',
          'success'
        );
        onSubmit();
        onClose();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      showToast(error.message || 'Erro ao salvar agendamento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const appointmentTypeLabels = {
    'Avaliacao': 'Avaliação',
    'Sessao': 'Sessão',
    'Retorno': 'Retorno',
    'Pilates': 'Pilates',
    'Urgente': 'Urgente',
    'Teleconsulta': 'Teleconsulta',
  };

  const statusLabels = {
    'Agendado': 'Agendado',
    'Realizado': 'Realizado',
    'Concluido': 'Concluído',
    'Cancelado': 'Cancelado',
    'Faltou': 'Faltou',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b bg-white rounded-t-xl">
              <h2 className="text-xl font-semibold text-gray-900">
                {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Paciente *
                </label>
                <div className="relative">
                  <select
                    value={formData.patient_id}
                    onChange={(e) => handleInputChange('patient_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.patient_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione um paciente</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} {patient.phone ? `- ${patient.phone}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.patient_id && (
                    <p className="text-red-600 text-sm mt-1">{errors.patient_id}</p>
                  )}
                </div>
              </div>

              {/* Therapist Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terapeuta *
                </label>
                <select
                  value={formData.therapist_id}
                  onChange={(e) => handleInputChange('therapist_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.therapist_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione um terapeuta</option>
                  {therapists.map(therapist => (
                    <option key={therapist.id} value={therapist.id}>
                      {therapist.name}
                    </option>
                  ))}
                </select>
                {errors.therapist_id && (
                  <p className="text-red-600 text-sm mt-1">{errors.therapist_id}</p>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Data/Hora Início *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.start_time ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.start_time && (
                    <p className="text-red-600 text-sm mt-1">{errors.start_time}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Data/Hora Fim *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.end_time ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.end_time && (
                    <p className="text-red-600 text-sm mt-1">{errors.end_time}</p>
                  )}
                </div>
              </div>

              {/* Type and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Consulta *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(appointmentTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Value and Payment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.value || ''}
                    onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Pagamento
                  </label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => handleInputChange('payment_status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pendente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="failed">Falhou</option>
                  </select>
                </div>
              </div>

              {/* Session Info (if applicable) */}
              {formData.type === 'Sessao' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sessão Número
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.session_number || ''}
                      onChange={(e) => handleInputChange('session_number', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total de Sessões
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.total_sessions || ''}
                      onChange={(e) => handleInputChange('total_sessions', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Observations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Observações
                </label>
                <textarea
                  value={formData.observations || ''}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Observações adicionais sobre o agendamento..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {loading ? 'Salvando...' : (appointment ? 'Atualizar' : 'Criar Agendamento')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}