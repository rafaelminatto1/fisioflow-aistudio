// src/components/agenda/CalendarView.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addWeeks, addMonths, subWeeks, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Clock, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnrichedAppointment } from '@/types';
import AppointmentCard from './AppointmentCard';
import TimeSlotGrid from './TimeSlotGrid';

export type CalendarViewType = 'day' | 'week' | 'month';

interface CalendarViewProps {
  appointments: EnrichedAppointment[];
  therapists: Array<{ id: string; name: string; color?: string }>;
  currentDate: Date;
  viewType: CalendarViewType;
  onDateChange: (date: Date) => void;
  onViewTypeChange: (viewType: CalendarViewType) => void;
  onAppointmentClick: (appointment: EnrichedAppointment) => void;
  onAppointmentMove?: (appointmentId: string, newStartTime: Date, newTherapistId: string) => void;
  onTimeSlotClick?: (date: Date, therapistId: string) => void;
}

const START_HOUR = 7;
const END_HOUR = 21;
const SLOT_DURATION = 30;
const PIXELS_PER_MINUTE = 2;

// Generate time slots from 7:00 to 19:00
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 7; hour <= 19; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 19) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  }, []);

export default function CalendarView({
  appointments,
  therapists,
  currentDate,
  viewType,
  onDateChange,
  onViewTypeChange,
  onAppointmentClick,
  onAppointmentMove,
  onTimeSlotClick,
}: CalendarViewProps) {
  const [selectedTherapist, setSelectedTherapist] = useState<string | null>(null);

  // Navigation functions
  const navigatePrevious = () => {
    switch (viewType) {
      case 'day':
        onDateChange(addDays(currentDate, -1));
        break;
      case 'week':
        onDateChange(subWeeks(currentDate, 1));
        break;
      case 'month':
        onDateChange(subMonths(currentDate, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (viewType) {
      case 'day':
        onDateChange(addDays(currentDate, 1));
        break;
      case 'week':
        onDateChange(addWeeks(currentDate, 1));
        break;
      case 'month':
        onDateChange(addMonths(currentDate, 1));
        break;
    }
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  // Date calculations
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );

  const monthStart = useMemo(
    () => startOfMonth(currentDate),
    [currentDate]
  );

  const monthEnd = useMemo(
    () => endOfMonth(currentDate),
    [currentDate]
  );

  const monthDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const displayedTherapists = useMemo(() => {
    if (selectedTherapist) {
      return therapists.filter(t => t.id === selectedTherapist);
    }
    return therapists;
  }, [therapists, selectedTherapist]);

  // Filter appointments based on current view
  const filteredAppointments = useMemo(() => {
    if (viewType === 'day') {
      return appointments.filter(appointment => 
        isSameDay(appointment.startTime, currentDate)
      );
    }
    if (viewType === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      return appointments.filter(appointment => 
        appointment.startTime >= weekStart && appointment.startTime <= weekEnd
      );
    }
    return appointments;
  }, [appointments, currentDate, viewType]);

  // Header title
  const getHeaderTitle = () => {
    switch (viewType) {
      case 'day':
        return format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: ptBR });
      case 'week':
        return `${format(weekStart, "d 'de' MMMM", { locale: ptBR })} - ${format(addDays(weekStart, 6), "d 'de' MMMM yyyy", { locale: ptBR })}`;
      case 'month':
        return format(currentDate, "MMMM yyyy", { locale: ptBR });
      default:
        return '';
    }
  };

  const renderDayView = () => {
    return (
      <TimeSlotGrid
        appointments={filteredAppointments}
        therapists={therapists}
        selectedDate={currentDate}
        onAppointmentClick={onAppointmentClick}
        onAppointmentMove={onAppointmentMove}
        onTimeSlotClick={onTimeSlotClick}
      />
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Time column */}
          <div className="w-16 border-r bg-gray-50">
            <div className="h-12 border-b" /> {/* Header spacer */}
            <div className="relative">
              {timeSlots.map((time, index) => (
                <div
                  key={time}
                  className="h-[60px] border-b border-gray-200 flex items-start justify-end pr-2 pt-1"
                >
                  <span className="text-xs text-gray-500">{time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Days columns */}
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-full">
              {/* Days header */}
              <div className="flex border-b bg-gray-50">
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="flex-1 min-w-[200px] p-3 border-r">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {format(day, 'EEEE', { locale: ptBR })}
                      </div>
                      <div
                        className={cn(
                          'text-2xl font-bold mt-1',
                          isToday(day) ? 'text-blue-600' : 'text-gray-700'
                        )}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Time grid with appointments */}
              <div className="relative flex">
                {weekDays.map((day) => {
                  const dayAppointments = appointments.filter(appointment =>
                    isSameDay(appointment.startTime, day)
                  );
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className="flex-1 min-w-[200px] border-r relative"
                    >
                      {/* Time slots background */}
                      {timeSlots.map((time, index) => (
                        <div
                          key={time}
                          className="h-[60px] border-b border-gray-100 hover:bg-blue-50 cursor-pointer"
                          onClick={() => {
                            const [hours, minutes] = time.split(':').map(Number);
                            const clickTime = new Date(day);
                            clickTime.setHours(hours, minutes, 0, 0);
                            onTimeSlotClick?.(clickTime, 'week-view');
                          }}
                        />
                      ))}

                      {/* Appointments */}
                      {dayAppointments.map((appointment) => {
                        const startHour = appointment.startTime.getHours();
                        const startMinute = appointment.startTime.getMinutes();
                        const endHour = appointment.endTime.getHours();
                        const endMinute = appointment.endTime.getMinutes();
                        
                        const startSlot = (startHour - 7) * 2 + (startMinute >= 30 ? 1 : 0);
                        const endSlot = (endHour - 7) * 2 + (endMinute >= 30 ? 1 : 0);
                        const duration = Math.max(1, endSlot - startSlot);
                        
                        return (
                          <div
                            key={appointment.id}
                            className="absolute left-1 right-1 z-10"
                            style={{
                              top: `${startSlot * 60}px`,
                              height: `${duration * 60}px`,
                            }}
                            onClick={() => onAppointmentClick(appointment)}
                          >
                            <AppointmentCard appointment={appointment} />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Month header */}
      <div className="grid grid-cols-7 border-b">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
          <div key={day} className="text-center py-3 font-semibold text-slate-600 border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="flex-1 grid grid-cols-7 gap-px bg-slate-200">
        {monthDays.map(day => {
          const dayAppointments = filteredAppointments.filter(app => isSameDay(app.startTime, day));
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "bg-white p-2 min-h-[120px] cursor-pointer hover:bg-slate-50 transition-colors",
                isToday(day) && "bg-sky-50 hover:bg-sky-100"
              )}
              onClick={() => {
                onDateChange(day);
                onViewTypeChange('day');
              }}
            >
              <div className={cn(
                "text-sm font-medium mb-2",
                isToday(day) ? "text-sky-600" : "text-slate-900"
              )}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map(app => (
                  <div
                    key={app.id}
                    className="text-xs p-1 rounded bg-sky-100 text-sky-800 truncate"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick(app);
                    }}
                  >
                    {format(app.startTime, 'HH:mm')} - {app.patientName}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-slate-500">
                    +{dayAppointments.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {getHeaderTitle()}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View type selector */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => onViewTypeChange('day')}
              className={cn(
                "px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                viewType === 'day'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Clock size={14} />
              Dia
            </button>
            <button
              onClick={() => onViewTypeChange('week')}
              className={cn(
                "px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                viewType === 'week'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Calendar size={14} />
              Semana
            </button>
            <button
              onClick={() => onViewTypeChange('month')}
              className={cn(
                "px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                viewType === 'month'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Grid3X3 size={14} />
              Mês
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={navigatePrevious}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={navigateNext}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar content */}
      {viewType === 'day' && renderDayView()}
      {viewType === 'week' && renderWeekView()}
      {viewType === 'month' && renderMonthView()}
    </div>
  );
}