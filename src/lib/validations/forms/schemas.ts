import { z } from 'zod';

// Validações comuns
export const commonValidations = {
  // CPF
  cpf: z.string()
    .min(1, 'CPF é obrigatório')
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato 000.000.000-00')
    .refine((cpf) => {
      // Remove pontos e traços
      const cleanCpf = cpf.replace(/[.-]/g, '');
      
      // Verifica se todos os dígitos são iguais
      if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
      
      // Validação do algoritmo do CPF
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
      }
      let remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cleanCpf.charAt(9))) return false;
      
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
      }
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cleanCpf.charAt(10))) return false;
      
      return true;
    }, 'CPF inválido'),

  // Telefone
  phone: z.string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (00) 00000-0000'),

  // Email
  email: z.string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(100, 'Email deve ter no máximo 100 caracteres'),

  // Nome
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),

  // Data
  date: z.string()
    .min(1, 'Data é obrigatória')
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data deve estar no formato DD/MM/AAAA')
    .refine((date) => {
      const [day, month, year] = date.split('/').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.getDate() === day && 
             dateObj.getMonth() === month - 1 && 
             dateObj.getFullYear() === year;
    }, 'Data inválida'),

  // Hora
  time: z.string()
    .min(1, 'Hora é obrigatória')
    .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, 'Hora deve estar no formato HH:MM'),

  // CEP
  cep: z.string()
    .min(1, 'CEP é obrigatório')
    .regex(/^\d{5}-\d{3}$/, 'CEP deve estar no formato 00000-000'),

  // Senha
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(50, 'Senha deve ter no máximo 50 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),

  // Texto obrigatório
  requiredText: (fieldName: string, minLength: number = 1, maxLength: number = 255) => 
    z.string()
      .min(minLength, `${fieldName} é obrigatório`)
      .max(maxLength, `${fieldName} deve ter no máximo ${maxLength} caracteres`),

  // Texto opcional
  optionalText: (maxLength: number = 255) => 
    z.string()
      .max(maxLength, `Texto deve ter no máximo ${maxLength} caracteres`)
      .optional(),

  // Número obrigatório
  requiredNumber: (fieldName: string, min?: number, max?: number) => {
    let schema = z.number({ required_error: `${fieldName} é obrigatório` });
    if (min !== undefined) schema = schema.min(min, `${fieldName} deve ser pelo menos ${min}`);
    if (max !== undefined) schema = schema.max(max, `${fieldName} deve ser no máximo ${max}`);
    return schema;
  },

  // Seleção obrigatória
  requiredSelect: (fieldName: string, options: string[]) => 
    z.string()
      .min(1, `${fieldName} é obrigatório`)
      .refine((value) => options.includes(value), `${fieldName} inválido`),
};

// Schema para paciente
export const patientSchema = z.object({
  name: commonValidations.name,
  email: commonValidations.email,
  phone: commonValidations.phone,
  cpf: commonValidations.cpf,
  birthDate: commonValidations.date,
  address: z.object({
    street: commonValidations.requiredText('Rua', 5, 100),
    number: commonValidations.requiredText('Número', 1, 10),
    complement: commonValidations.optionalText(50),
    neighborhood: commonValidations.requiredText('Bairro', 2, 50),
    city: commonValidations.requiredText('Cidade', 2, 50),
    state: commonValidations.requiredSelect('Estado', [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
      'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
      'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ]),
    zipCode: commonValidations.cep,
  }),
  emergencyContact: z.object({
    name: commonValidations.name,
    phone: commonValidations.phone,
    relationship: commonValidations.requiredText('Parentesco', 2, 30),
  }),
  medicalInfo: z.object({
    conditions: commonValidations.optionalText(500),
    medications: commonValidations.optionalText(500),
    allergies: commonValidations.optionalText(500),
    observations: commonValidations.optionalText(1000),
  }),
});

// Schema para agendamento
export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Paciente é obrigatório'),
  date: commonValidations.date,
  time: commonValidations.time,
  duration: commonValidations.requiredNumber('Duração', 15, 240),
  type: commonValidations.requiredSelect('Tipo de consulta', [
    'avaliacao',
    'sessao',
    'retorno',
    'reavaliacao'
  ]),
  description: commonValidations.optionalText(500),
  priority: commonValidations.requiredSelect('Prioridade', [
    'baixa',
    'normal',
    'alta',
    'urgente'
  ]),
  status: commonValidations.requiredSelect('Status', [
    'agendado',
    'confirmado',
    'em_andamento',
    'concluido',
    'cancelado',
    'faltou'
  ]),
});

// Schema para evolução/prontuário
export const evolutionSchema = z.object({
  patientId: z.string().min(1, 'Paciente é obrigatório'),
  appointmentId: z.string().min(1, 'Consulta é obrigatória'),
  date: commonValidations.date,
  subjective: commonValidations.optionalText(1000),
  objective: commonValidations.optionalText(1000),
  assessment: commonValidations.optionalText(1000),
  plan: commonValidations.optionalText(1000),
  exercises: z.array(z.object({
    name: commonValidations.requiredText('Nome do exercício', 2, 100),
    description: commonValidations.optionalText(500),
    sets: commonValidations.requiredNumber('Séries', 1, 10),
    reps: commonValidations.requiredNumber('Repetições', 1, 100),
    duration: commonValidations.requiredNumber('Duração (segundos)', 1, 3600),
    observations: commonValidations.optionalText(200),
  })).optional(),
  nextAppointment: z.object({
    date: commonValidations.date,
    time: commonValidations.time,
    observations: commonValidations.optionalText(200),
  }).optional(),
});

// Schema para login
export const loginSchema = z.object({
  email: commonValidations.email,
  password: z.string().min(1, 'Senha é obrigatória'),
  rememberMe: z.boolean().optional(),
});

// Schema para registro
export const registerSchema = z.object({
  name: commonValidations.name,
  email: commonValidations.email,
  password: commonValidations.password,
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  phone: commonValidations.phone,
  crefito: commonValidations.requiredText('CREFITO', 5, 20),
  acceptTerms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos de uso'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

// Schema para configurações do usuário
export const userSettingsSchema = z.object({
  name: commonValidations.name,
  email: commonValidations.email,
  phone: commonValidations.phone,
  crefito: commonValidations.requiredText('CREFITO', 5, 20),
  notifications: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
    appointments: z.boolean(),
    reminders: z.boolean(),
  }),
  preferences: z.object({
    theme: commonValidations.requiredSelect('Tema', ['light', 'dark', 'system']),
    language: commonValidations.requiredSelect('Idioma', ['pt-BR', 'en-US']),
    timezone: commonValidations.requiredText('Fuso horário', 3, 50),
    dateFormat: commonValidations.requiredSelect('Formato de data', ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
    timeFormat: commonValidations.requiredSelect('Formato de hora', ['12h', '24h']),
  }),
});

// Tipos TypeScript derivados dos schemas
export type PatientFormData = z.infer<typeof patientSchema>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type EvolutionFormData = z.infer<typeof evolutionSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type UserSettingsFormData = z.infer<typeof userSettingsSchema>;