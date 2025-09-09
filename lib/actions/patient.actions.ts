// lib/actions/patient.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { patientFormSchema, PatientFormData } from '../validations/patient';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { patientCache, CachePatterns } from '@/lib/cache';

/**
 * Helper function to check for authorized roles.
 * @param allowedRoles - An array of roles that are allowed to perform the action.
 */
async function authorize(allowedRoles: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Usuário não autenticado.');
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Acesso negado. Você não tem permissão para executar esta ação.');
  }
}


/**
 * Cria um novo paciente no banco de dados.
 * Esta é uma Server Action, executada no servidor.
 * @param data - Os dados do formulário do paciente.
 */
export async function createPatient(data: PatientFormData) {
  // 0. Verificação de permissão
  await authorize([Role.Admin, Role.Fisioterapeuta]);

  // 1. Validação do lado do servidor
  const validationResult = patientFormSchema.safeParse(data);
  if (!validationResult.success) {
    // Em um app real, retornaríamos os erros de forma estruturada
    throw new Error(
      'Dados inválidos: ' + validationResult.error.flatten().fieldErrors
    );
  }

  const { ...patientData } = validationResult.data;

  // 2. Lógica de negócio (criação no DB)
  let newPatient;
  try {
    newPatient = await prisma.patient.create({
      data: {
        ...patientData,
        birthDate: patientData.birthDate
          ? new Date(patientData.birthDate)
          : null,
      },
    });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('cpf')) {
      throw new Error('Este CPF já está cadastrado.');
    }
    // Outros erros de banco de dados
    throw new Error('Falha ao criar o paciente no banco de dados.');
  }

  // 3. Invalidação de Cache
  // Invalida o cache da lista de pacientes para refletir a adição.
  await patientCache.del('all-patients');

  // Também invalida o cache do Next.js para a página de listagem.
  revalidatePath('/pacientes');
}

/**
 * Atualiza um paciente existente no banco de dados.
 * @param id - O ID do paciente a ser atualizado.
 * @param data - Os dados do formulário do paciente.
 */
export async function updatePatient(id: string, data: PatientFormData) {
  // 0. Verificação de permissão
  await authorize([Role.Admin, Role.Fisioterapeuta]);

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
        birthDate: patientData.birthDate
          ? new Date(patientData.birthDate)
          : null,
      },
    });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('cpf')) {
      throw new Error('Este CPF já está cadastrado.');
    }
    throw new Error('Falha ao atualizar o paciente.');
  }

  // 3. Invalidação de Cache
  // Invalida o cache do paciente específico e da lista de pacientes.
  const patientCacheKey = CachePatterns.patient(id).key;
  await Promise.all([
      patientCache.del(patientCacheKey),
      patientCache.del('all-patients')
  ]);

  // Também invalida o cache do Next.js para a página de listagem e de detalhes.
  revalidatePath('/pacientes');
  revalidatePath(`/pacientes/${id}`);
}
