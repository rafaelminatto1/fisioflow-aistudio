'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Plus, 
  User, 
  Phone, 
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Check,
  X
} from 'lucide-react';
import AppointmentStatusManager from './AppointmentStatusManager';

interface TimeSlot {
  time: string;
  timeString: string;
  available: boolean;
  appointment?: {
    id: string;
    patient: {
      id: string;
      name: string;
      phone?: string;
    };
    therapist: {
      id: string;
      name: string;
    };
    type: string;
    status: string;
    value?: number;
    observations?: string;
    duration: number;
  };
}

interface DailyTimelineProps {
  date: Date;
  therapistId?: string;
  onNewAppointment: (time: string) => void;
  onEditAppointment: (appointment: any) => void;
  onStatusUpdate: (appointmentId: string, newStatus: string) => void;
}

export default function DailyTimeline({
  date,
  therapistId,
  onNewAppointment,
  onEditAppointment,
  onStatusUpdate,
}: DailyTimelineProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);

  // Generate time slots from 9:00 AM to 4:00 PM (30-minute intervals)
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9:00 AM
    const endHour = 16; // 4:00 PM
    const interval = 30; // 30 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += interval) {
        const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const timeString = `${hour}:${minutes.toString().padStart(2, '0')}`;
        
        slots.push({
          time,
          timeString,
          available: true, // Will be updated based on appointments
        });
      }
    }
    return slots;
  };

  // Load appointments for the selected date
  const loadAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        date: date.toISOString(),
        view: 'day',
        ...(therapistId && { therapist_id: therapistId }),
      });

      const response = await fetch(`/api/appointments/calendar?${params}`);
      if (!response.ok) throw new Error('Failed to load appointments');
      
      const data = await response.json();
      
      if (data.success) {
        // Create base time slots
        const baseSlots = generateTimeSlots();
        
        // Map appointments to time slots
        const slotsWithAppointments = baseSlots.map(slot => {
          const slotTime = new Date(date);
          const [hours, minutes] = slot.time.split(':');
          slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Find appointment that overlaps with this slot
          const appointment = data.data.events.find((event: any) => {
            const appointmentStart = new Date(event.start);
            const appointmentEnd = new Date(event.end);
            const slotEnd = new Date(slotTime.getTime() + 30 * 60 * 1000); // 30 minutes later

            return (
              (slotTime >= appointmentStart && slotTime < appointmentEnd) ||
              (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
              (slotTime <= appointmentStart && slotEnd >= appointmentEnd)
            );
          });

          if (appointment) {
            const appointmentStart = new Date(appointment.start);
            const appointmentEnd = new Date(appointment.end);
            const duration = Math.round((appointmentEnd.getTime() - appointmentStart.getTime()) / (1000 * 60));

            return {
              ...slot,
              available: false,
              appointment: {
                id: appointment.id,
                patient: appointment.patient,
                therapist: appointment.therapist,
                type: appointment.type,
                status: appointment.status,
                value: appointment.value,
                observations: appointment.observations,
                duration,
              },
            };
          }

          return slot;
        });

        setTimeSlots(slotsWithAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [date, therapistId]);

  const getAppointmentTypeColor = (type: string) => {
    const colors = {
      'Avaliacao': 'bg-blue-100 text-blue-800 border-blue-200',
      'Sessao': 'bg-purple-100 text-purple-800 border-purple-200',
      'Retorno': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Pilates': 'bg-amber-100 text-amber-800 border-amber-200',
      'Urgente': 'bg-red-100 text-red-800 border-red-200',
      'Teleconsulta': 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'Avaliacao': 'Avaliação',
      'Sessao': 'Sessão',
      'Retorno': 'Retorno',
      'Pilates': 'Pilates',
      'Urgente': 'Urgente',
      'Teleconsulta': 'Teleconsulta',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const isCurrentTime = (time: string) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    // Only highlight if it's today
    if (today.getTime() !== selectedDate.getTime()) return false;

    const [hours, minutes] = time.split(':');
    const slotTime = new Date();
    slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const slotEndTime = new Date(slotTime.getTime() + 30 * 60 * 1000);

    return now >= slotTime && now < slotEndTime;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">
            {date.toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {timeSlots.filter(slot => !slot.available).length} agendamento(s) • {timeSlots.filter(slot => slot.available).length} horário(s) livre(s)
        </div>
      </div>

      {/* Time Slots */}
      <div className="space-y-2">
        {timeSlots.map((slot, index) => (
          <motion.div
            key={slot.time}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className={`
              border rounded-lg transition-all duration-200
              ${isCurrentTime(slot.time) ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
              ${slot.available 
                ? 'border-gray-200 hover:border-gray-300 hover:shadow-sm' 
                : 'border-gray-300 shadow-sm'
              }
            `}
          >
            {slot.available ? (
              /* Empty Slot */
              <button
                onClick={() => onNewAppointment(slot.time)}
                className="w-full p-4 text-left hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center text-sm font-medium
                      ${isCurrentTime(slot.time) 
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' 
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {slot.time}
                    </div>
                    <span className="text-gray-500 text-sm">Horário disponível</span>
                  </div>
                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </button>
            ) : (
              /* Appointment Slot */
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center text-sm font-medium
                      ${isCurrentTime(slot.time) 
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' 
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {slot.time}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {slot.appointment!.patient.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getAppointmentTypeColor(slot.appointment!.type)}`}>
                          {getTypeLabel(slot.appointment!.type)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {slot.appointment!.duration} min
                        </div>
                        {slot.appointment!.patient.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {slot.appointment!.patient.phone}
                          </div>
                        )}
                        {slot.appointment!.value && (
                          <div className="font-medium text-green-600">
                            {formatCurrency(slot.appointment!.value)}
                          </div>
                        )}
                      </div>

                      {slot.appointment!.observations && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {slot.appointment!.observations}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => onEditAppointment(slot.appointment)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      title="Editar agendamento"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedSlot(expandedSlot === slot.appointment!.id ? null : slot.appointment!.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      title="Mais opções"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Status Manager */}
                <AnimatePresence>
                  {expandedSlot === slot.appointment!.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <AppointmentStatusManager
                        appointmentId={slot.appointment!.id}
                        currentStatus={slot.appointment!.status as any}
                        patientName={slot.appointment!.patient.name}
                        appointmentTime={slot.time}
                        onStatusUpdate={(id, status) => {
                          onStatusUpdate(id, status);
                          loadAppointments(); // Refresh the timeline
                          setExpandedSlot(null);
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Current Time Indicator */}
      {date.toDateString() === new Date().toDateString() && (
        <div className="fixed right-6 bottom-6 bg-blue-600 text-white p-3 rounded-full shadow-lg">
          <Clock className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}