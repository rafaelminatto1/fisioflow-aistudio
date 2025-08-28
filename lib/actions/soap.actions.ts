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
    await prisma.client.soapNote.create({
      data: {
        patientId,
        therapistName: user.name || 'Fisioterapeuta',
        date: new Date().toLocaleDateString('pt-BR'), // Simple date for now
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
