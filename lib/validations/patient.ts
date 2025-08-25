// lib/validations/patient.ts
import { z } from 'zod';

/**
 * Valida um número de CPF brasileiro.
 * @param cpf - O CPF como string (pode conter pontuação).
 * @returns {boolean} - True se o CPF for válido, false caso contrário.
 */
const validateCPF = (cpf: string): boolean => {
  const cpfClean = cpf.replace(/[^\d]/g, ''); // Remove caracteres não numéricos

  if (cpfClean.length !== 11 || /^(\d)\1+$/.test(cpfClean)) {
    return false; // CPF deve ter 11 dígitos e não pode ter todos os dígitos iguais
  }

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpfClean.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }

  if (remainder !== parseInt(cpfClean.substring(9, 10))) {
    return false;
  }

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpfClean.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }

  if (remainder !== parseInt(cpfClean.substring(10, 11))) {
    return false;
  }

  return true;
};

// Schema Zod para o formulário de Paciente
export const patientFormSchema = z.object({
  // Etapa 1: Dados Pessoais
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  cpf: z.string().refine(validateCPF, { message: "CPF inválido." }),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
  
  // Etapa 1: Endereço
  addressZip: z.string().optional(),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  
  // Etapa 2: Dados Médicos
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  allergies: z.string().optional(),
  medicalAlerts: z.string().optional(),
  
  // Etapa 3: Consentimento
  consentGiven: z.boolean().refine(val => val === true, {
    message: "O consentimento LGPD é obrigatório."
  }),
  whatsappConsent: z.enum(['opt_in', 'opt_out']),
});

export type PatientFormData = z.infer<typeof patientFormSchema>;
