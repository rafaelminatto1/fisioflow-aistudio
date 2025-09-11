'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, Event as CalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  Filter,
  RefreshCw,
} from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup the localizer for date-fns
const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface AppointmentEvent extends CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  status: string;
  patient: {
    id: string;
    name: string;
    phone?: string;
  };
  therapist: {
    id: string;
    name: string;
  };
  value?: number;
  payment_status: string;
  observations?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

interface CalendarData {
  events: AppointmentEvent[];
  timeSlots: Array<{
    time: Date;
    endTime: Date;
    timeString: string;
    available: boolean;
  }>;
  summary: {
    totalAppointments: number;
    confirmedAppointments: number;
    completedAppointments: number;
    totalRevenue: number;
    busySlots: number;
    availableSlots: number;
  };
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface AppointmentCalendarProps {
  therapistId?: string;
  onEventSelect?: (event: AppointmentEvent) => void;
  onSlotSelect?: (slotInfo: { start: Date; end: Date; action: string }) => void;
  onEventDrop?: (event: AppointmentEvent, start: Date, end: Date) => void;
}

export default function AppointmentCalendar({
  therapistId,
  onEventSelect,
  onSlotSelect,
  onEventDrop,
}: AppointmentCalendarProps) {
  const [view, setView] = useState<View>('day');
  const [date, setDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Load calendar data
  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        date: date.toISOString(),
        view,
        ...(therapistId && { therapist_id: therapistId }),
      });

      const response = await fetch(`/api/appointments/calendar?${params}`);
      if (!response.ok) throw new Error('Failed to load calendar data');
      
      const data = await response.json();
      
      if (data.success) {
        // Convert date strings back to Date objects
        const processedData: CalendarData = {
          ...data.data,
          events: data.data.events.map((event: any) => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
          })),
          timeSlots: data.data.timeSlots.map((slot: any) => ({
            ...slot,
            time: new Date(slot.time),
            endTime: new Date(slot.endTime),
          })),
          dateRange: {
            start: new Date(data.data.dateRange.start),
            end: new Date(data.data.dateRange.end),
          },
        };
        setCalendarData(processedData);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  }, [date, view, therapistId]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  // Custom event component
  const EventComponent = ({ event }: { event: AppointmentEvent }) => (
    <div 
      className="h-full w-full p-1 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
      style={{
        backgroundColor: event.backgroundColor,
        color: event.textColor,
        border: `2px solid ${event.borderColor}`,
        borderRadius: '4px',
      }}
      onClick={() => onEventSelect?.(event)}
    >
      <div className="truncate">{event.patient.name}</div>
      <div className="text-xs opacity-75">{event.type}</div>
    </div>
  );

  // Handle slot selection
  const handleSelectSlot = (slotInfo: any) => {
    onSlotSelect?.({
      start: slotInfo.start,
      end: slotInfo.end,
      action: slotInfo.action || 'select',
    });
  };

  // Handle event drop (drag and drop)
  const handleEventDrop = (args: any) => {
    const { event, start, end } = args;
    onEventDrop?.(event, start, end);
    // Reload calendar data after drop
    setTimeout(() => loadCalendarData(), 100);
  };

  // Navigation handlers
  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Agenda</h2>
            {calendarData && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  {calendarData.summary.totalAppointments} consultas
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {calendarData.summary.availableSlots} horários livres
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            
            <button
              onClick={loadCalendarData}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => onSlotSelect?.({ start: new Date(), end: new Date(), action: 'create' })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {calendarData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Agendados</p>
              <p className="text-xl font-semibold text-blue-900">
                {calendarData.summary.confirmedAppointments}
              </p>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Realizados</p>
              <p className="text-xl font-semibold text-green-900">
                {calendarData.summary.completedAppointments}
              </p>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Receita</p>
              <p className="text-xl font-semibold text-purple-900">
                {formatCurrency(calendarData.summary.totalRevenue)}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 font-medium">Disponível</p>
              <p className="text-xl font-semibold text-gray-900">
                {calendarData.summary.availableSlots}h
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visualização
                  </label>
                  <select
                    value={view}
                    onChange={(e) => handleViewChange(e.target.value as View)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="day">Dia</option>
                    <option value="week">Semana</option>
                    <option value="month">Mês</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Calendar */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando agenda...</p>
            </div>
          </div>
        ) : calendarData ? (
          <div className="h-full">
            <Calendar
              localizer={localizer}
              events={calendarData.events}
              startAccessor="start"
              endAccessor="end"
              views={['day', 'week', 'month']}
              view={view}
              date={date}
              onNavigate={handleNavigate}
              onView={handleViewChange}
              onSelectEvent={onEventSelect}
              onSelectSlot={handleSelectSlot}
              onEventDrop={handleEventDrop}
              selectable
              resizable
              draggableAccessor={() => true}
              min={new Date(2024, 0, 1, 9, 0)} // 9:00 AM
              max={new Date(2024, 0, 1, 16, 0)} // 4:00 PM
              step={30}
              timeslots={1}
              culture="pt-BR"
              messages={{
                next: 'Próximo',
                previous: 'Anterior',
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
                agenda: 'Agenda',
                date: 'Data',
                time: 'Horário',
                event: 'Evento',
                noEventsInRange: 'Não há eventos neste período.',
                allDay: 'Dia inteiro',
              }}
              formats={{
                timeGutterFormat: 'HH:mm',
                eventTimeRangeFormat: ({ start, end }) =>
                  `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
                dayHeaderFormat: date => format(date, 'EEEE, dd/MM', { locale: ptBR }),
                dayRangeHeaderFormat: ({ start, end }) =>
                  `${format(start, 'dd/MM')} - ${format(end, 'dd/MM')}`,
              }}
              components={{
                event: EventComponent,
              }}
              style={{ height: '100%' }}
              className="appointment-calendar"
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Erro ao carregar agenda</p>
              <button
                onClick={loadCalendarData}
                className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Calendar Styles */}
      <style jsx global>{`
        .appointment-calendar .rbc-calendar {
          font-family: inherit;
        }
        
        .appointment-calendar .rbc-header {
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          font-weight: 600;
          color: #374151;
        }
        
        .appointment-calendar .rbc-time-slot {
          border-top: 1px solid #f1f5f9;
        }
        
        .appointment-calendar .rbc-timeslot-group {
          border-bottom: 1px solid #e2e8f0;
        }
        
        .appointment-calendar .rbc-current-time-indicator {
          background-color: #3b82f6;
          height: 2px;
        }
        
        .appointment-calendar .rbc-today {
          background-color: #fef3c7;
        }
        
        .appointment-calendar .rbc-selected {
          background-color: #dbeafe;
        }
        
        .appointment-calendar .rbc-slot-selection {
          background-color: #93c5fd;
          border: 1px solid #3b82f6;
        }
      `}</style>
    </div>
  );
}