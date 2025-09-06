// src/lib/actions/appointment.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Appointment, AppointmentStatus, AppointmentType } from '@/types';

// Map TypeScript enum to Prisma enum
const mapAppointmentType = (type: AppointmentType) => {
  const typeMap = {
    [AppointmentType.Evaluation]: 'Avaliacao',
    [AppointmentType.Session]: 'Sessao',
    [AppointmentType.Return]: 'Retorno',
    [AppointmentType.Pilates]: 'Pilates',
    [AppointmentType.Urgent]: 'Urgente',
    [AppointmentType.Teleconsulta]: 'Teleconsulta',
  } as const;
  
  return typeMap[type] || 'Sessao';
};

// In a real app, you would use a Zod schema for validation
// import { appointmentSchema } from '@/lib/validations/appointment';

export async function saveAppointmentAction(appointmentData: Appointment) {
  // const validationResult = appointmentSchema.safeParse(appointmentData);
  // if (!validationResult.success) {
  //   return { success: false, message: 'Dados inválidos.' };
  // }

  const { id, patientId, therapistId, startTime, endTime, ...rest } =
    appointmentData;

  // Remove fields that are derived from relations
  const { patientName, patientAvatarUrl, type, ...dataToSave } = rest;

  const basePayload = {
    ...dataToSave,
    type: mapAppointmentType(type),
    startTime: new Date(startTime),
    endTime: new Date(endTime),
  };

  try {
    if (id && !id.startsWith('app_recurr_') && !id.startsWith('app_series_')) {
      await prisma.appointment.update({
        where: { id },
        data: {
          ...basePayload,
          patient: { connect: { id: patientId } },
          therapist: { connect: { id: therapistId } },
        },
      });
    } else {
      await prisma.appointment.create({
        data: {
          ...basePayload,
          patientId,
          therapistId,
          id: id.startsWith('app_') ? undefined : id, // Let prisma generate ID for new ones
        },
      });
    }

    revalidatePath('/dashboard/agenda');
    return { success: true };
  } catch (error) {
    console.error('[APPOINTMENT_ACTION_ERROR]', error);
    return { success: false, message: 'Falha ao salvar agendamento.' };
  }
}

export async function deleteAppointmentAction(id: string) {
  try {
    await prisma.appointment.delete({
      where: { id },
    });
    revalidatePath('/dashboard/agenda');
    return { success: true };
  } catch (error) {
    console.error('[APPOINTMENT_DELETE_ERROR]', error);
    return { success: false, message: 'Falha ao excluir agendamento.' };
  }
}

export async function deleteAppointmentSeriesAction(
  seriesId: string,
  fromDate: Date
) {
  try {
    await prisma.appointment.deleteMany({
      where: {
        seriesId,
        startTime: { gte: fromDate },
      },
    });
    revalidatePath('/dashboard/agenda');
    return { success: true };
  } catch (error) {
    console.error('[APPOINTMENT_DELETE_SERIES_ERROR]', error);
    return {
      success: false,
      message: 'Falha ao excluir série de agendamentos.',
    };
  }
}
