// src/components/agenda/TimeSlotGrid.tsx
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { format, addMinutes, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { EnrichedAppointment, Therapist, PatientSummary } from '@/types';
import AppointmentCard from './AppointmentCard';

interface TimeSlotGridProps {
  appointments: EnrichedAppointment[];
  therapists: Therapist[];
  selectedDate: Date;
  startHour?: number;
  endHour?: number;
  slotDuration?: number;
  onAppointmentClick: (appointment: EnrichedAppointment) => void;
  onAppointmentMove?: (appointmentId: string, newStartTime: Date, newTherapistId: string) => void;
  onTimeSlotClick?: (date: Date, therapistId: string) => void;
}

interface DragState {
  isDragging: boolean;
  appointmentId: string | null;
  startPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
  originalSlot: { therapistId: string; time: Date } | null;
}

const START_HOUR = 7;
const END_HOUR = 21;
const SLOT_DURATION = 30;
const PIXELS_PER_MINUTE = 2;

export default function TimeSlotGrid({
  appointments,
  therapists,
  selectedDate,
  startHour = START_HOUR,
  endHour = END_HOUR,
  slotDuration = SLOT_DURATION,
  onAppointmentClick,
  onAppointmentMove,
  onTimeSlotClick,
}: TimeSlotGridProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    appointmentId: null,
    startPosition: null,
    currentPosition: null,
    originalSlot: null,
  });
  
  const gridRef = useRef<HTMLDivElement>(null);
  const [hoveredSlot, setHoveredSlot] = useState<{ therapistId: string; time: Date } | null>(null);

  // Generate time slots
  const timeSlots = Array.from(
    { length: (endHour - startHour) * (60 / slotDuration) },
    (_, i) => {
      const totalMinutes = startHour * 60 + i * slotDuration;
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      const time = new Date(selectedDate);
      time.setHours(hour, minute, 0, 0);
      return {
        time,
        label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      };
    }
  );

  // Filter appointments for selected date
  const dayAppointments = appointments.filter(appointment =>
    isSameDay(appointment.startTime, selectedDate)
  );

  // Get appointment position
  const getAppointmentPosition = (appointment: EnrichedAppointment) => {
    const startHour = appointment.startTime.getHours();
    const startMinute = appointment.startTime.getMinutes();
    const endHour = appointment.endTime.getHours();
    const endMinute = appointment.endTime.getMinutes();

    const startMinutesFromMidnight = startHour * 60 + startMinute;
    const endMinutesFromMidnight = endHour * 60 + endMinute;
    const startMinutesFromStartHour = startMinutesFromMidnight - START_HOUR * 60;
    const duration = endMinutesFromMidnight - startMinutesFromMidnight;

    return {
      top: startMinutesFromStartHour * PIXELS_PER_MINUTE,
      height: duration * PIXELS_PER_MINUTE,
    };
  };

  // Get slot from mouse position
  const getSlotFromPosition = useCallback((x: number, y: number) => {
    if (!gridRef.current) return null;
    
    const rect = gridRef.current.getBoundingClientRect();
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;
    
    // Calculate therapist column
    const timeColumnWidth = 64; // w-16 = 64px
    const therapistColumnWidth = (rect.width - timeColumnWidth) / therapists.length;
    const therapistIndex = Math.floor((relativeX - timeColumnWidth) / therapistColumnWidth);
    
    if (therapistIndex < 0 || therapistIndex >= therapists.length) return null;
    
    // Calculate time slot
    const slotHeight = slotDuration * PIXELS_PER_MINUTE;
    const slotIndex = Math.floor(relativeY / slotHeight);
    
    if (slotIndex < 0 || slotIndex >= timeSlots.length) return null;
    
    return {
      therapistId: therapists[therapistIndex].id,
      time: timeSlots[slotIndex].time,
    };
  }, [therapists, timeSlots]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, appointment: EnrichedAppointment) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onAppointmentMove) return;
    
    setDragState({
      isDragging: true,
      appointmentId: appointment.id,
      startPosition: { x: e.clientX, y: e.clientY },
      currentPosition: { x: e.clientX, y: e.clientY },
      originalSlot: {
        therapistId: appointment.therapistId,
        time: appointment.startTime,
      },
    });
  }, [onAppointmentMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return;
    
    setDragState(prev => ({
      ...prev,
      currentPosition: { x: e.clientX, y: e.clientY },
    }));
    
    const slot = getSlotFromPosition(e.clientX, e.clientY);
    setHoveredSlot(slot);
  }, [dragState.isDragging, getSlotFromPosition]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.appointmentId || !onAppointmentMove) {
      setDragState({
        isDragging: false,
        appointmentId: null,
        startPosition: null,
        currentPosition: null,
        originalSlot: null,
      });
      setHoveredSlot(null);
      return;
    }
    
    const slot = getSlotFromPosition(e.clientX, e.clientY);
    
    if (slot && (
      slot.therapistId !== dragState.originalSlot?.therapistId ||
      slot.time.getTime() !== dragState.originalSlot?.time.getTime()
    )) {
      onAppointmentMove(dragState.appointmentId, slot.time, slot.therapistId);
    }
    
    setDragState({
      isDragging: false,
      appointmentId: null,
      startPosition: null,
      currentPosition: null,
      originalSlot: null,
    });
    setHoveredSlot(null);
  }, [dragState, onAppointmentMove, getSlotFromPosition]);

  // Add global mouse event listeners
  React.useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full flex" ref={gridRef}>
        {/* Time column */}
        <div className="w-16 border-r bg-gray-50 flex-shrink-0">
          <div className="h-12 border-b" /> {/* Header spacer */}
          <div className="relative">
            {timeSlots.map((slot, index) => (
              <div
                key={slot.label}
                className="h-[60px] border-b border-gray-200 flex items-start justify-end pr-2 pt-1"
              >
                <span className="text-xs text-gray-500">
                  {slot.label.endsWith('00') ? slot.label : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Therapists columns */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-full">
            {/* Therapists header */}
            <div className="flex border-b bg-gray-50 h-12">
              {therapists.map((therapist) => (
                <div key={therapist.id} className="flex-1 min-w-[200px] p-3 border-r">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {therapist.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {therapist.specialization}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="relative flex">
              {therapists.map((therapist) => {
                const therapistAppointments = dayAppointments.filter(
                  app => app.therapistId === therapist.id
                );
                
                return (
                  <div
                    key={therapist.id}
                    className="flex-1 min-w-[200px] border-r relative"
                  >
                    {/* Time slots background */}
                    {timeSlots.map((slot, index) => {
                      const isHovered = hoveredSlot?.therapistId === therapist.id && 
                                       hoveredSlot?.time.getTime() === slot.time.getTime();
                      
                      return (
                        <div
                          key={slot.label}
                          className={cn(
                            "h-[60px] border-b border-gray-100 cursor-pointer transition-colors",
                            isHovered && "bg-blue-50",
                            "hover:bg-gray-50"
                          )}
                          onClick={() => onTimeSlotClick?.(slot.time, therapist.id)}
                        />
                      );
                    })}

                    {/* Appointments */}
                    {therapistAppointments.map((appointment) => {
                      const position = getAppointmentPosition(appointment);
                      const isDragging = dragState.appointmentId === appointment.id;
                      
                      return (
                        <div
                          key={appointment.id}
                          className={cn(
                            "absolute left-1 right-1 z-10 transition-opacity",
                            isDragging && "opacity-50"
                          )}
                          style={{
                            top: `${position.top}px`,
                            height: `${position.height}px`,
                          }}
                        >
                          <div
                            className="h-full cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => handleMouseDown(e, appointment)}
                            onClick={(e) => {
                              if (!dragState.isDragging) {
                                onAppointmentClick(appointment);
                              }
                            }}
                          >
                            <AppointmentCard appointment={appointment} />
                          </div>
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
      
      {/* Drag preview */}
      {dragState.isDragging && dragState.currentPosition && (
        <div
          className="fixed pointer-events-none z-50 opacity-80"
          style={{
            left: dragState.currentPosition.x - 100,
            top: dragState.currentPosition.y - 30,
            width: '200px',
          }}
        >
          {(() => {
            const appointment = appointments.find(a => a.id === dragState.appointmentId);
            return appointment ? <AppointmentCard appointment={appointment} /> : null;
          })()}
        </div>
      )}
    </div>
  );
}