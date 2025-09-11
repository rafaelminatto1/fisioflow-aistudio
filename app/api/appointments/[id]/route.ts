import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating appointment
const updateAppointmentSchema = z.object({
  patient_id: z.string().optional(),
  therapist_id: z.string().optional(),
  start_time: z.string().optional().transform(val => val ? new Date(val) : undefined),
  end_time: z.string().optional().transform(val => val ? new Date(val) : undefined),
  type: z.enum(['Avaliacao', 'Sessao', 'Retorno', 'Pilates', 'Urgente', 'Teleconsulta']).optional(),
  status: z.enum(['Agendado', 'Realizado', 'Concluido', 'Cancelado', 'Faltou']).optional(),
  value: z.number().positive().optional().nullable(),
  payment_status: z.enum(['pending', 'confirmed', 'failed']).optional(),
  observations: z.string().optional().nullable(),
  series_id: z.string().optional().nullable(),
  session_number: z.number().int().positive().optional().nullable(),
  total_sessions: z.number().int().positive().optional().nullable(),
});

// GET /api/appointments/[id] - Get appointment by ID with detailed information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await prisma.appointments.findUnique({
      where: { id: params.id },
      include: {
        patients: {
          select: {
            id: true,
            name: true,
            cpf: true,
            phone: true,
            email: true,
            birth_date: true,
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
          orderBy: { created_at: 'desc' },
          include: {
            users: {
              select: {
                name: true,
              },
            },
          },
        },
        assessment_results: {
          orderBy: { created_at: 'desc' },
          include: {
            assessment: {
              select: {
                name: true,
                category: true,
                type: true,
              },
            },
            users: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    // Calculate additional metrics
    const duration = Math.round((appointment.end_time.getTime() - appointment.start_time.getTime()) / (1000 * 60));
    const isToday = new Date().toDateString() === appointment.start_time.toDateString();
    const isPast = appointment.start_time < new Date();
    const isFuture = appointment.start_time > new Date();

    // Transform response
    const transformedAppointment = {
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
      soap_notes: appointment.soap_notes,
      assessment_results: appointment.assessment_results,
      metrics: {
        duration,
        isToday,
        isPast,
        isFuture,
        hasDocumentation: appointment.soap_notes.length > 0,
        hasAssessments: appointment.assessment_results.length > 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: transformedAppointment,
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar agendamento' },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateAppointmentSchema.parse(body);

    // Check if appointment exists
    const existingAppointment = await prisma.appointments.findUnique({
      where: { id: params.id },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    // If updating patient, verify patient exists
    if (validatedData.patient_id && validatedData.patient_id !== existingAppointment.patient_id) {
      const patient = await prisma.patients.findUnique({
        where: { id: validatedData.patient_id },
      });

      if (!patient) {
        return NextResponse.json(
          { success: false, error: 'Paciente não encontrado' },
          { status: 404 }
        );
      }
    }

    // If updating therapist, verify therapist exists
    if (validatedData.therapist_id && validatedData.therapist_id !== existingAppointment.therapist_id) {
      const therapist = await prisma.users.findUnique({
        where: { id: validatedData.therapist_id },
      });

      if (!therapist) {
        return NextResponse.json(
          { success: false, error: 'Terapeuta não encontrado' },
          { status: 404 }
        );
      }
    }

    // If updating time, check for conflicts
    if (validatedData.start_time || validatedData.end_time) {
      const newStartTime = validatedData.start_time || existingAppointment.start_time;
      const newEndTime = validatedData.end_time || existingAppointment.end_time;
      const therapistId = validatedData.therapist_id || existingAppointment.therapist_id;

      const conflictingAppointment = await prisma.appointments.findFirst({
        where: {
          id: { not: params.id }, // Exclude current appointment
          therapist_id: therapistId,
          status: {
            in: ['Agendado', 'Realizado'],
          },
          OR: [
            {
              AND: [
                { start_time: { lte: newStartTime } },
                { end_time: { gt: newStartTime } },
              ],
            },
            {
              AND: [
                { start_time: { lt: newEndTime } },
                { end_time: { gte: newEndTime } },
              ],
            },
            {
              AND: [
                { start_time: { gte: newStartTime } },
                { end_time: { lte: newEndTime } },
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
    }

    // Update appointment
    const updatedAppointment = await prisma.appointments.update({
      where: { id: params.id },
      data: validatedData,
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
        ...updatedAppointment,
        value: updatedAppointment.value ? Number(updatedAppointment.value) : null,
        duration: Math.round((updatedAppointment.end_time.getTime() - updatedAppointment.start_time.getTime()) / (1000 * 60)),
      },
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar agendamento' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Cancel appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if appointment exists
    const existingAppointment = await prisma.appointments.findUnique({
      where: { id: params.id },
      include: {
        patients: {
          select: {
            name: true,
          },
        },
        soap_notes: {
          select: {
            id: true,
          },
        },
        assessment_results: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    // Check if appointment has documentation
    if (existingAppointment.soap_notes.length > 0 || existingAppointment.assessment_results.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível cancelar agendamento com documentação',
          details: 'Este agendamento possui notas SOAP ou avaliações associadas. Altere o status para "Cancelado" ao invés de excluir.'
        },
        { status: 409 }
      );
    }

    // Soft delete - change status to Cancelado instead of hard delete
    const cancelledAppointment = await prisma.appointments.update({
      where: { id: params.id },
      data: {
        status: 'Cancelado',
      },
      include: {
        patients: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Agendamento cancelado com sucesso',
      data: cancelledAppointment,
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao cancelar agendamento' },
      { status: 500 }
    );
  }
}