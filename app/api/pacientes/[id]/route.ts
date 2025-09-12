// app/api/pacientes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import redisPromise from '@/lib/redis';
import { patientFormSchema } from '@/lib/validations/patient';
import { z } from 'zod';

const CACHE_KEY_PREFIX = 'patients_list:';

/**
 * GET: Buscar um paciente específico por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        conditions: true,
        surgeries: true,
        communication_logs: true,
        trackedMetrics: true,
        attachments: true,
      },
    });

    if (!patient) {
      return new NextResponse('Paciente não encontrado', { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('[API_PACIENTES_GET_BY_ID]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * PUT: Atualizar um paciente existente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Validação parcial dos dados
    const validatedData = patientFormSchema.partial().parse(body);

    // Verificar se o paciente existe
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return new NextResponse('Paciente não encontrado', { status: 404 });
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.cpf !== undefined) updateData.cpf = validatedData.cpf;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    if (validatedData.birthDate !== undefined) {
      updateData.birthDate = validatedData.birthDate ? new Date(validatedData.birthDate) : null;
    }
    if (validatedData.allergies !== undefined) updateData.allergies = validatedData.allergies;
    if (validatedData.medicalAlerts !== undefined) updateData.medicalAlerts = validatedData.medicalAlerts;
    if (validatedData.consentGiven !== undefined) updateData.consentGiven = validatedData.consentGiven;
    if (validatedData.whatsappConsent !== undefined) updateData.whatsappConsent = validatedData.whatsappConsent;
    
    // Atualizar endereço se fornecido
    if (validatedData.addressZip !== undefined ||
        validatedData.addressStreet !== undefined ||
        validatedData.addressNumber !== undefined ||
        validatedData.addressCity !== undefined ||
        validatedData.addressState !== undefined) {
      updateData.address = {
        zip: validatedData.addressZip || null,
        street: validatedData.addressStreet || null,
        number: validatedData.addressNumber || null,
        city: validatedData.addressCity || null,
        state: validatedData.addressState || null,
      };
    }
    
    // Atualizar contato de emergência se fornecido
    if (validatedData.emergencyContactName !== undefined ||
        validatedData.emergencyContactPhone !== undefined) {
      updateData.emergencyContact = {
        name: validatedData.emergencyContactName || null,
        phone: validatedData.emergencyContactPhone || null,
      };
    }

    // Atualizar status se fornecido
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: updateData,
      include: {
        conditions: true,
        surgeries: true,
        communication_logs: true,
        trackedMetrics: true,
        attachments: true,
      },
    });

    // Invalidar cache
    await invalidateCache();

    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error('[API_PACIENTES_PUT]', error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * DELETE: Excluir um paciente
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar se o paciente existe
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return new NextResponse('Paciente não encontrado', { status: 404 });
    }

    // Verificar se há agendamentos futuros
    const futureAppointments = await prisma.appointment.findMany({
      where: {
        patientId: id,
        startTime: {
          gte: new Date(),
        },
      },
    });

    if (futureAppointments.length > 0) {
      return new NextResponse(
        'Não é possível excluir paciente com agendamentos futuros',
        { status: 400 }
      );
    }

    // Excluir paciente (soft delete - marcar como inativo)
    await prisma.patient.update({
      where: { id },
      data: {
        status: 'Discharged',
        deletedAt: new Date(),
      },
    });

    // Invalidar cache
    await invalidateCache();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[API_PACIENTES_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * Função auxiliar para invalidar cache
 */
async function invalidateCache() {
  try {
    const redis = await redisPromise;
    const keys = await redis.keys(`${CACHE_KEY_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Erro ao invalidar cache:', error);
    // Não falhar a operação por causa do cache
  }
}