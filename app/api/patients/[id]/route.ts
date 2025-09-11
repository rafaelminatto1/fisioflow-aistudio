import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating patient
const updatePatientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').optional(),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable().transform(val => val ? new Date(val) : undefined),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional().nullable(),
  emergency_contact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional().nullable(),
  status: z.enum(['Active', 'Inactive', 'Discharged']).optional(),
  allergies: z.string().optional().nullable(),
  medical_alerts: z.string().optional().nullable(),
  consent_given: z.boolean().optional(),
  whatsapp_consent: z.enum(['opt_in', 'opt_out']).optional(),
});

// GET /api/patients/[id] - Get patient by ID with detailed information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patient = await prisma.patients.findUnique({
      where: { id: params.id },
      include: {
        appointments: {
          orderBy: { start_time: 'desc' },
          include: {
            payments: {
              select: {
                id: true,
                amount: true,
                method: true,
                status: true,
                created_at: true,
              },
            },
          },
        },
        payments: {
          orderBy: { created_at: 'desc' },
          include: {
            appointments: {
              select: {
                id: true,
                start_time: true,
                type: true,
              },
            },
          },
        },
        financial_transactions: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        communication_logs: {
          orderBy: { created_at: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            appointments: true,
            payments: true,
            communication_logs: true,
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Calculate additional metrics
    const totalPaid = patient.payments
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingPayments = patient.payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const nextAppointment = patient.appointments
      .filter(apt => new Date(apt.start_time) > new Date())
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

    const lastAppointment = patient.appointments
      .filter(apt => new Date(apt.start_time) <= new Date())
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0];

    // Transform response
    const transformedPatient = {
      id: patient.id,
      name: patient.name,
      cpf: patient.cpf,
      email: patient.email,
      phone: patient.phone,
      birth_date: patient.birth_date,
      address: patient.address,
      emergency_contact: patient.emergency_contact,
      status: patient.status,
      last_visit: patient.last_visit,
      allergies: patient.allergies,
      medical_alerts: patient.medical_alerts,
      consent_given: patient.consent_given,
      whatsapp_consent: patient.whatsapp_consent,
      created_at: patient.created_at,
      updated_at: patient.updated_at,
      age: patient.birth_date ? 
        new Date().getFullYear() - patient.birth_date.getFullYear() : null,
      appointments: patient.appointments,
      payments: patient.payments,
      financial_transactions: patient.financial_transactions,
      communication_logs: patient.communication_logs,
      statistics: {
        totalAppointments: patient._count.appointments,
        totalPayments: patient._count.payments,
        totalCommunications: patient._count.communication_logs,
        totalPaid,
        pendingPayments,
        nextAppointment,
        lastAppointment,
      },
    };

    return NextResponse.json({
      success: true,
      data: transformedPatient,
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar paciente' },
      { status: 500 }
    );
  }
}

// PUT /api/patients/[id] - Update patient
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updatePatientSchema.parse(body);

    // Check if patient exists
    const existingPatient = await prisma.patients.findUnique({
      where: { id: params.id },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { success: false, error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // If updating CPF, check for conflicts
    if (validatedData.cpf && validatedData.cpf !== existingPatient.cpf) {
      const cpfConflict = await prisma.patients.findUnique({
        where: { cpf: validatedData.cpf },
      });

      if (cpfConflict) {
        return NextResponse.json(
          { success: false, error: 'CPF já cadastrado para outro paciente' },
          { status: 409 }
        );
      }
    }

    // Update patient
    const updatedPatient = await prisma.patients.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updated_at: new Date(),
      },
      include: {
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedPatient,
        totalAppointments: updatedPatient._count.appointments,
        age: updatedPatient.birth_date ? 
          new Date().getFullYear() - updatedPatient.birth_date.getFullYear() : null,
      },
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar paciente' },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/[id] - Delete patient (soft delete by changing status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if patient exists
    const existingPatient = await prisma.patients.findUnique({
      where: { id: params.id },
      include: {
        appointments: {
          where: {
            start_time: { gte: new Date() }, // Future appointments
          },
        },
      },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { success: false, error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Check for future appointments
    if (existingPatient.appointments.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível excluir paciente com consultas futuras agendadas',
          details: `${existingPatient.appointments.length} consultas futuras encontradas`
        },
        { status: 409 }
      );
    }

    // Soft delete - change status to Discharged
    const deletedPatient = await prisma.patients.update({
      where: { id: params.id },
      data: {
        status: 'Discharged',
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Paciente removido com sucesso',
      data: deletedPatient,
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao remover paciente' },
      { status: 500 }
    );
  }
}