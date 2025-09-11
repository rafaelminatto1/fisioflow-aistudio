import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const calendarQuerySchema = z.object({
  date: z.string().transform(val => new Date(val)),
  therapist_id: z.string().optional(),
  view: z.enum(['day', 'week', 'month']).default('day'),
});

// GET /api/appointments/calendar - Get appointments for calendar view
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = calendarQuerySchema.parse({
      date: searchParams.get('date') || new Date().toISOString(),
      therapist_id: searchParams.get('therapist_id'),
      view: searchParams.get('view'),
    });

    const { date, therapist_id, view } = query;

    // Calculate date range based on view
    let startDate: Date;
    let endDate: Date;

    if (view === 'day') {
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    } else if (view === 'week') {
      const dayOfWeek = date.getDay();
      startDate = new Date(date);
      startDate.setDate(date.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else { // month
      startDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Build where clause
    const where: any = {
      start_time: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ['Agendado', 'Realizado', 'Concluido'], // Exclude cancelled and no-show
      },
    };

    if (therapist_id) {
      where.therapist_id = therapist_id;
    }

    // Get appointments
    const appointments = await prisma.appointments.findMany({
      where,
      orderBy: { start_time: 'asc' },
      include: {
        patients: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Generate time slots for the day view (9:00 AM to 4:00 PM, 30-min intervals)
    const generateTimeSlots = (selectedDate: Date) => {
      const slots = [];
      const startHour = 9; // 9:00 AM
      const endHour = 16; // 4:00 PM
      const interval = 30; // 30 minutes

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minutes = 0; minutes < 60; minutes += interval) {
          const slotTime = new Date(selectedDate);
          slotTime.setHours(hour, minutes, 0, 0);
          
          const endSlotTime = new Date(slotTime);
          endSlotTime.setMinutes(endSlotTime.getMinutes() + interval);

          slots.push({
            time: slotTime,
            endTime: endSlotTime,
            timeString: slotTime.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }),
            available: true, // Will be updated based on appointments
          });
        }
      }
      return slots;
    };

    // For day view, include time slots
    let timeSlots = [];
    if (view === 'day') {
      timeSlots = generateTimeSlots(date);
      
      // Mark slots as unavailable if there are appointments
      appointments.forEach(appointment => {
        timeSlots.forEach(slot => {
          const slotStart = slot.time.getTime();
          const slotEnd = slot.endTime.getTime();
          const appointmentStart = appointment.start_time.getTime();
          const appointmentEnd = appointment.end_time.getTime();

          // Check if slot overlaps with appointment
          if (
            (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
            (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
            (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
          ) {
            slot.available = false;
          }
        });
      });
    }

    // Transform appointments for calendar
    const calendarEvents = appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.patients.name,
      start: appointment.start_time,
      end: appointment.end_time,
      type: appointment.type,
      status: appointment.status,
      patient: appointment.patients,
      therapist: appointment.users,
      value: appointment.value ? Number(appointment.value) : null,
      payment_status: appointment.payment_status,
      observations: appointment.observations,
      backgroundColor: getAppointmentColor(appointment.type, appointment.status),
      borderColor: getAppointmentBorderColor(appointment.status),
      textColor: '#ffffff',
    }));

    // Get summary statistics
    const summary = {
      totalAppointments: appointments.length,
      confirmedAppointments: appointments.filter(a => a.status === 'Agendado').length,
      completedAppointments: appointments.filter(a => a.status === 'Realizado' || a.status === 'Concluido').length,
      totalRevenue: appointments
        .filter(a => a.status === 'Realizado' || a.status === 'Concluido')
        .reduce((sum, a) => sum + (a.value ? Number(a.value) : 0), 0),
      busySlots: timeSlots.filter(slot => !slot.available).length,
      availableSlots: timeSlots.filter(slot => slot.available).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        events: calendarEvents,
        timeSlots: view === 'day' ? timeSlots : [],
        summary,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}

// Helper functions for appointment colors
function getAppointmentColor(type: string, status: string) {
  if (status === 'Cancelado') return '#6b7280'; // gray
  if (status === 'Faltou') return '#ef4444'; // red
  if (status === 'Concluido' || status === 'Realizado') return '#10b981'; // green

  // Colors by type for active appointments
  switch (type) {
    case 'Avaliacao': return '#3b82f6'; // blue
    case 'Sessao': return '#8b5cf6'; // purple
    case 'Retorno': return '#06b6d4'; // cyan
    case 'Pilates': return '#f59e0b'; // amber
    case 'Urgente': return '#ef4444'; // red
    case 'Teleconsulta': return '#10b981'; // green
    default: return '#6b7280'; // gray
  }
}

function getAppointmentBorderColor(status: string) {
  if (status === 'Cancelado') return '#374151';
  if (status === 'Faltou') return '#dc2626';
  if (status === 'Concluido' || status === 'Realizado') return '#059669';
  return '#1f2937'; // default dark border
}