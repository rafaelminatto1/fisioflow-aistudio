import { z } from 'zod';

// Schema para formulário de paciente
export const patientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  cpf: z.string().min(11, 'CPF inválido').optional().or(z.literal('')),
  gender: z.enum(['masculino', 'feminino', 'outro']).optional(),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional()
  }).optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional()
  }).optional(),
  medicalHistory: z.string().optional(),
  currentMedications: z.string().optional(),
  allergies: z.string().optional(),
  observations: z.string().optional(),
  status: z.enum(['ativo', 'inativo', 'suspenso']).default('ativo'),
  lgpdConsent: z.boolean().refine(val => val === true, {
    message: 'É necessário aceitar os termos de privacidade'
  })
});

export type PatientFormData = z.infer<typeof patientSchema>;

// Schema para formulário de agendamento
export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Selecione um paciente'),
  therapistId: z.string().min(1, 'Selecione um fisioterapeuta'),
  date: z.string().min(1, 'Selecione uma data'),
  time: z.string().min(1, 'Selecione um horário'),
  duration: z.number().min(15, 'Duração mínima de 15 minutos').max(240, 'Duração máxima de 4 horas'),
  type: z.string().min(1, 'Selecione o tipo de atendimento'),
  observations: z.string().optional(),
  value: z.number().min(0, 'Valor deve ser positivo').optional()
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

// Schema para formulário de login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  rememberMe: z.boolean().optional()
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Schema para formulário de cadastro
export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  profession: z.string().min(1, 'Selecione sua profissão'),
  crefito: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'É necessário aceitar os termos de uso'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Schema para configurações de perfil
export const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
  specialties: z.array(z.string()).optional(),
  workingHours: z.object({
    monday: z.object({ start: z.string(), end: z.string() }).optional(),
    tuesday: z.object({ start: z.string(), end: z.string() }).optional(),
    wednesday: z.object({ start: z.string(), end: z.string() }).optional(),
    thursday: z.object({ start: z.string(), end: z.string() }).optional(),
    friday: z.object({ start: z.string(), end: z.string() }).optional(),
    saturday: z.object({ start: z.string(), end: z.string() }).optional(),
    sunday: z.object({ start: z.string(), end: z.string() }).optional()
  }).optional()
});

export type ProfileFormData = z.infer<typeof profileSchema>;