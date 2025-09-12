import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createAppointmentSchema = z.object({
  patient_id: z.string().min(1, 'ID do paciente é obrigatório'),
  therapist_id: z.string().min(1, 'ID do terapeuta é obrigatório'),
  start_time: z.string().transform(val => new Date(val)),
  end_time: z.string().transform(val => new Date(val)),
  type: z.enum(['Avaliacao', 'Sessao', 'Retorno', 'Pilates', 'Urgente', 'Teleconsulta']),
  status: z.enum(['Agendado', 'Realizado', 'Concluido', 'Cancelado', 'Faltou']).default('Agendado'),
  value: z.number().positive().optional(),
  payment_status: z.enum(['paid', 'pending']).default('pending'),
  observations: z.string().optional(),
  series_id: z.string().optional(),
  session_number: z.number().int().positive().optional(),
  total_sessions: z.number().int().positive().optional(),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  patient_id: z.string().optional(),
  therapist_id: z.string().optional(),
  status: z.enum(['Agendado', 'Realizado', 'Concluido', 'Cancelado', 'Faltou']).optional(),
  type: z.enum(['Avaliacao', 'Sessao', 'Retorno', 'Pilates', 'Urgente', 'Teleconsulta']).optional(),
  date_from: z.string().optional().transform(val => val ? new Date(val) : undefined),
  date_to: z.string().optional().transform(val => val ? new Date(val) : undefined),
  sortBy: z.enum(['start_time', 'created_at', 'patient_name']).default('start_time'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// GET /api/appointments - List appointments with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      patient_id: searchParams.get('patient_id'),
      therapist_id: searchParams.get('therapist_id'),
      status: searchParams.get('status'),
      type: searchParams.get('type'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    const { page, limit, patient_id, therapist_id, status, type, date_from, date_to, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (patient_id) {
      where.patient_id = patient_id;
    }
    
    if (therapist_id) {
      where.therapist_id = therapist_id;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (date_from || date_to) {
      where.start_time = {};
      if (date_from) {
        where.start_time.gte = date_from;
      }
      if (date_to) {
        where.start_time.lte = date_to;
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.appointments.count({ where });

    // Build orderBy clause
    let orderBy: any;
    if (sortBy === 'patient_name') {
      orderBy = { patients: { name: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Get appointments
    const appointments = await prisma.appointments.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: {
        patients: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        soap_notes: {
          select: {
            id: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        assessment_results: {
          select: {
            id: true,
            evaluated_at: true,
          },
          orderBy: { evaluated_at: 'desc' },
          take: 1,
        },
      },
    });

    // Transform data for response
    const transformedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      patient: appointment.patients,
      therapist: appointment.users,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      type: appointment.type,
      status: appointment.status,
      value: appointment.value ? Number(appointment.value) : null,
      payment_status: appointment.payment_status,
      observations: appointment.observations,
      series_id: appointment.series_id,
      session_number: appointment.session_number,
      total_sessions: appointment.total_sessions,
      created_at: appointment.created_at,
      has_soap_note: appointment.soap_notes.length > 0,
      has_assessment: appointment.assessment_results.length > 0,
      duration: Math.round((appointment.end_time.getTime() - appointment.start_time.getTime()) / (1000 * 60)), // minutes
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      data: transformedAppointments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createAppointmentSchema.parse(body);

    // Verify patient exists
    const patient = await prisma.patients.findUnique({
      where: { id: validatedData.patient_id },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Verify therapist exists
    const therapist = await prisma.users.findUnique({
      where: { id: validatedData.therapist_id },
    });

    if (!therapist) {
      return NextResponse.json(
        { success: false, error: 'Terapeuta não encontrado' },
        { status: 404 }
      );
    }

    // Check for time conflicts
    const conflictingAppointment = await prisma.appointments.findFirst({
      where: {
        therapist_id: validatedData.therapist_id,
        status: {
          in: ['Agendado', 'Realizado'],
        },
        OR: [
          {
            // New appointment starts during existing appointment
            AND: [
              { start_time: { lte: validatedData.start_time } },
              { end_time: { gt: validatedData.start_time } },
            ],
          },
          {
            // New appointment ends during existing appointment
            AND: [
              { start_time: { lt: validatedData.end_time } },
              { end_time: { gte: validatedData.end_time } },
            ],
          },
          {
            // Existing appointment is completely within new appointment
            AND: [
              { start_time: { gte: validatedData.start_time } },
              { end_time: { lte: validatedData.end_time } },
            ],
          },
        ],
      },
      include: {
        patients: {
          select: {
            name: true,
          },
        },
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Conflito de horário detectado',
          details: `Já existe um agendamento com ${conflictingAppointment.patients.name} das ${conflictingAppointment.start_time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às ${conflictingAppointment.end_time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        },
        { status: 409 }
      );
    }

    // Generate unique ID
    const appointmentId = `appointment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const appointment = await prisma.appointments.create({
      data: {
        id: appointmentId,
        patient_id: validatedData.patient_id,
        therapist_id: validatedData.therapist_id,
        start_time: validatedData.start_time,
        end_time: validatedData.end_time,
        type: validatedData.type,
        status: validatedData.status,
        value: validatedData.value ? validatedData.value : null,
        payment_status: validatedData.payment_status,
        observations: validatedData.observations,
        series_id: validatedData.series_id,
        session_number: validatedData.session_number,
        total_sessions: validatedData.total_sessions,
      },
      include: {
        patients: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...appointment,
        value: appointment.value ? Number(appointment.value) : null,
        duration: Math.round((appointment.end_time.getTime() - appointment.start_time.getTime()) / (1000 * 60)),
      },
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Erro ao criar agendamento' },
      { status: 500 }
    );
  }
}