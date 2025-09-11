// lib/actions/patient.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { patientFormSchema, PatientFormData } from '../validations/patient';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { patientCache, CachePatterns } from '@/lib/cache';

/**
 * Verifica se o usuário atual tem uma das funções permitidas.
 * Lança um erro se o usuário não estiver autenticado ou não tiver a permissão necessária.
 *
 * @param {Role[]} allowedRoles - Um array de funções que têm permissão para executar a ação.
 * @throws {Error} Se o usuário não estiver autenticado ou não tiver a permissão necessária.
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
 * Executa verificação de permissão, validação de dados, criação no banco de dados e invalidação de cache.
 *
 * @param {PatientFormData} data - Os dados do formulário do paciente a ser criado.
 * @throws {Error} Se o usuário não tiver permissão, os dados forem inválidos ou ocorrer um erro no banco de dados.
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
 * Executa verificação de permissão, validação de dados, atualização no banco de dados e invalidação de cache.
 *
 * @param {string} id - O ID do paciente a ser atualizado.
 * @param {PatientFormData} data - Os dados do formulário do paciente a serem atualizados.
 * @throws {Error} Se o usuário não tiver permissão, os dados forem inválidos ou ocorrer um erro no banco de dados.
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
