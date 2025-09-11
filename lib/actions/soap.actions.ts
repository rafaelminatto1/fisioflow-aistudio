// src/lib/actions/soap.actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

// Zod schema for server-side validation
const soapNoteSchema = z.object({
  subjective: z.string().min(1, 'O campo Subjetivo é obrigatório.'),
  objective: z.string().min(1, 'O campo Objetivo é obrigatório.'),
  assessment: z.string().min(1, 'O campo Avaliação é obrigatório.'),
  plan: z.string().min(1, 'O campo Plano é obrigatório.'),
  painScale: z.number().min(0).max(10).optional(),
});

/**
 * Salva uma nota SOAP para um paciente.
 * A nota é associada à consulta mais recente do paciente.
 * Executa verificação de autenticação, validação de dados e criação no banco de dados.
 *
 * @param {string} patientId - O ID do paciente para o qual a nota SOAP está sendo salva.
 * @param {FormData} formData - Os dados do formulário contendo as informações da nota SOAP.
 * @returns {Promise<{success: boolean, message: string, errors?: any}>} Um objeto indicando o sucesso ou falha da operação, com mensagens e erros de validação, se aplicável.
 */
export async function saveSoapNoteAction(
  patientId: string,
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user || !('role' in user)) {
    // Basic auth check
    return { success: false, message: 'Não autenticado.' };
  }

  const data = {
    subjective: formData.get('subjective'),
    objective: formData.get('objective'),
    assessment: formData.get('assessment'),
    plan: formData.get('plan'),
    painScale: formData.get('painScale')
      ? Number(formData.get('painScale'))
      : undefined,
  };

  const validation = soapNoteSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    // Find the most recent appointment for this patient
    const recentAppointment = await prisma.appointment.findFirst({
      where: { patientId },
      orderBy: { startTime: 'desc' },
    });

    if (!recentAppointment) {
      return {
        success: false,
        message: 'Nenhuma consulta encontrada para este paciente.',
      };
    }

    await prisma.soapNote.create({
      data: {
        appointmentId: recentAppointment.id,
        ...validation.data,
      },
    });

    revalidatePath(`/pacientes/${patientId}`);
    return { success: true, message: 'Nota SOAP salva com sucesso!' };
  } catch (error) {
    console.error('Error saving SOAP note:', error);
    return {
      success: false,
      message: 'Falha ao salvar a nota no banco de dados.',
    };
  }
}
