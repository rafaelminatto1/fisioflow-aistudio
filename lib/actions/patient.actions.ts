// lib/actions/patient.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { patientFormSchema, PatientFormData } from '../validations/patient';

/**
 * Cria um novo paciente no banco de dados.
 * Esta é uma Server Action, executada no servidor.
 * @param data - Os dados do formulário do paciente.
 */
export async function createPatient(data: PatientFormData) {
  // 1. Validação do lado do servidor
  const validationResult = patientFormSchema.safeParse(data);
  if (!validationResult.success) {
    // Em um app real, retornaríamos os erros de forma estruturada
    throw new Error('Dados inválidos: ' + validationResult.error.flatten().fieldErrors);
  }

  const { ...patientData } = validationResult.data;

  // 2. Lógica de negócio (criação no DB)
  try {
    await prisma.patient.create({
      data: {
        ...patientData,
        birthDate: patientData.birthDate ? new Date(patientData.birthDate) : null,
      },
    });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('cpf')) {
      throw new Error('Este CPF já está cadastrado.');
    }
    // Outros erros de banco de dados
    throw new Error('Falha ao criar o paciente no banco de dados.');
  }

  // 3. Revalidação do cache
  // Invalida o cache da página de pacientes para que a nova lista seja buscada
  revalidatePath('/pacientes');
}


/**
 * Atualiza um paciente existente no banco de dados.
 * @param id - O ID do paciente a ser atualizado.
 * @param data - Os dados do formulário do paciente.
 */
export async function updatePatient(id: string, data: PatientFormData) {
  const validationResult = patientFormSchema.safeParse(data);
  if (!validationResult.success) {
    throw new Error('Dados inválidos.');
  }

  const { ...patientData } = validationResult.data;
  
  try {
    await prisma.patient.update({
      where: { id },
      data: {
        ...patientData,
        birthDate: patientData.birthDate ? new Date(patientData.birthDate) : null,
      },
    });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('cpf')) {
      throw new Error('Este CPF já está cadastrado.');
    }
    throw new Error('Falha ao atualizar o paciente.');
  }

  // Revalida a página de detalhes e a página de lista
  revalidatePath('/pacientes');
  revalidatePath(`/pacientes/${id}`);
}
