// app/api/agendamentos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET - List appointments with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const therapistId = searchParams.get('therapistId');
    const patientId = searchParams.get('patientId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      where.startTime = {
        gte: startDate,
        lt: endDate
      };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (therapistId) {
      where.therapistId = therapistId;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    // Count total appointments
    const totalAppointments = await prisma.appointments.count({ where });

    // Fetch appointments with related data
    const appointments = await prisma.appointments.findMany({
      where,
      skip,
      take: limit,
      include: {
        patients: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            whatsapp_consent: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        soap_notes: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      },
      orderBy: [
        { start_time: 'asc' }
      ]
    });

    // Calculate additional metrics
    const enrichedAppointments = appointments.map(appointment => {
      const duration = Math.round((appointment.end_time.getTime() - appointment.start_time.getTime()) / (1000 * 60)); // duration in minutes
      
      return {
        id: appointment.id,
        patientId: appointment.patient_id,
        therapistId: appointment.therapist_id,
        startTime: appointment.start_time,
        endTime: appointment.end_time,
        type: appointment.type,
        status: appointment.status,
        value: appointment.value,
        paymentStatus: appointment.payment_status,
        observations: appointment.observations,
        seriesId: appointment.series_id,
        sessionNumber: appointment.session_number,
        totalSessions: appointment.total_sessions,
        duration,
        
        // Related data
        patient: appointment.patients,
        therapist: appointment.users,
        hasSoapNotes: appointment.soap_notes.length > 0,
        latestSoapNote: appointment.soap_notes[0] || null
      };
    });

    // Group by time slots for timeline view
    const timeSlots = enrichedAppointments.reduce((acc, appointment) => {
      const timeKey = appointment.startTime.toTimeString().slice(0, 5); // HH:MM format
      if (!acc[timeKey]) {
        acc[timeKey] = [];
      }
      acc[timeKey].push(appointment);
      return acc;
    }, {} as Record<string, typeof enrichedAppointments>);

    return NextResponse.json({
      appointments: enrichedAppointments,
      timeSlots,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalAppointments / limit),
        totalAppointments,
        hasNext: page < Math.ceil(totalAppointments / limit),
        hasPrev: page > 1
      },
      summary: {
        total: totalAppointments,
        agendado: appointments.filter(a => a.status === 'Agendado').length,
        realizado: appointments.filter(a => a.status === 'Realizado').length,
        concluido: appointments.filter(a => a.status === 'Concluido').length,
        cancelado: appointments.filter(a => a.status === 'Cancelado').length,
        faltou: appointments.filter(a => a.status === 'Faltou').length
      }
    });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      patientId,
      therapistId,
      startTime,
      endTime,
      type,
      value,
      observations,
      seriesId,
      sessionNumber,
      totalSessions
    } = body;

    // Validate required fields
    if (!patientId || !therapistId || !startTime || !endTime || !type) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: patientId, therapistId, startTime, endTime, type' },
        { status: 400 }
      );
    }

    // Check if patient exists
    const patient = await prisma.patients.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Check if therapist exists
    const therapist = await prisma.users.findUnique({
      where: { id: therapistId }
    });

    if (!therapist) {
      return NextResponse.json(
        { error: 'Terapeuta não encontrado' },
        { status: 404 }
      );
    }

    // Check for conflicting appointments
    const conflictingAppointment = await prisma.appointments.findFirst({
      where: {
        therapist_id: therapistId,
        status: { not: 'Cancelado' },
        OR: [
          {
            start_time: {
              gte: new Date(startTime),
              lt: new Date(endTime)
            }
          },
          {
            end_time: {
              gt: new Date(startTime),
              lte: new Date(endTime)
            }
          },
          {
            AND: [
              { start_time: { lte: new Date(startTime) } },
              { end_time: { gte: new Date(endTime) } }
            ]
          }
        ]
      }
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'Conflito de horário: já existe agendamento neste período' },
        { status: 409 }
      );
    }

    // Create new appointment
    const newAppointment = await prisma.appointments.create({
      data: {
        id: crypto.randomUUID(),
        patient_id: patientId,
        therapist_id: therapistId,
        start_time: new Date(startTime),
        end_time: new Date(endTime),
        type,
        status: 'Agendado',
        value: value ? parseFloat(value) : null,
        observations: observations?.trim() || null,
        series_id: seriesId || null,
        session_number: sessionNumber ? parseInt(sessionNumber) : null,
        total_sessions: totalSessions ? parseInt(totalSessions) : null
      },
      include: {
        patients: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            whatsapp_consent: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update patient's last visit
    await prisma.patients.update({
      where: { id: patientId },
      data: { last_visit: new Date(startTime) }
    });

    return NextResponse.json({
      message: 'Agendamento criado com sucesso',
      appointment: newAppointment
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Erro ao criar agendamento' },
      { status: 500 }
    );
  }
}