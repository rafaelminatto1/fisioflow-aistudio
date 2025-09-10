import {
  Patient,
  Appointment,
  SoapNote,
  AppointmentStatus,
  TreatmentPlan,
  ExercisePrescription,
  AuditLogEntry,
  Therapist,
  AppointmentType,
  RecurrenceRule,
  KnowledgeBaseEntry,
  User,
  Role,
  Exercise,
  Group,
  VoucherPlan,
  Voucher,
  Document,
  Task,
  TaskStatus,
  TaskPriority,
  Notification,
  PatientAttachment,
  Achievement,
  MedicalReport,
  FinancialTransaction,
  TransactionType,
  ExpenseCategory,
  Intern,
  InternStatus,
  EducationalCase,
  Project,
  ProjectStatus,
  Partner,
  InventoryCategory,
  Supplier,
  InventoryItem,
  ItemStatus,
  StockMovement,
  MovementType,
  Event,
  EventType,
  EventStatus,
  EventRegistration,
  EventRegistrationStatus,
  EventProvider,
  EventProviderStatus,
} from '../types';
import {
  CalendarCheck,
  Flame,
  Medal,
  Shield,
  Star,
  Trophy,
} from 'lucide-react';

export const mockUsers: User[] = [
  {
    id: 'user_1',
    name: 'Dr. Roberto',
    email: 'roberto@fisioflow.com',
    role: Role.Therapist,
    avatarUrl: 'https://i.pravatar.cc/150?u=user_1',
  },
  {
    id: 'user_admin',
    name: 'Admin',
    email: 'admin@fisioflow.com',
    role: Role.Admin,
    avatarUrl: 'https://i.pravatar.cc/150?u=user_admin',
  },
  {
    id: 'user_patient_1',
    name: 'Ana Beatriz Costa',
    email: 'ana.costa@example.com',
    role: Role.Patient,
    avatarUrl: 'https://picsum.photos/id/1027/200/200',
    patientId: '1',
  },
  {
    id: 'user_educator_1',
    name: 'Dra. Juliana',
    email: 'juliana@fisioflow.com',
    role: Role.EducadorFisico,
    avatarUrl: 'https://i.pravatar.cc/150?u=user_educator_1',
  },
  {
    id: 'user_patient_5',
    name: 'Fernando Oliveira',
    email: 'fernando.oliveira@example.com',
    role: Role.Patient,
    avatarUrl: 'https://picsum.photos/id/1015/200/200',
    patientId: '5',
  },
  {
    id: 'user_patient_6',
    name: 'Lúcia Martins',
    email: 'lucia.martins@example.com',
    role: Role.Patient,
    avatarUrl: 'https://picsum.photos/id/1016/200/200',
    patientId: '6',
  },
  {
    id: 'user_patient_7',
    name: 'Mário Santos',
    email: 'mario.santos@example.com',
    role: Role.Patient,
    avatarUrl: 'https://picsum.photos/id/1018/200/200',
    patientId: '7',
  },
  {
    id: 'user_patient_8',
    name: 'Júlia Pereira',
    email: 'julia.pereira@example.com',
    role: Role.Patient,
    avatarUrl: 'https://picsum.photos/id/1025/200/200',
    patientId: '8',
  },
];

export const mockTherapists: Therapist[] = [
  {
    id: 'therapist_1',
    name: 'Dr. Roberto',
    color: 'teal',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_1',
  },
  {
    id: 'therapist_2',
    name: 'Dra. Camila',
    color: 'sky',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_2',
  },
  {
    id: 'therapist_3',
    name: 'Dr. Fernando',
    color: 'indigo',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_3',
  },
];

export const mockPartners: Partner[] = [
  {
    id: 'partner_1',
    userId: 'user_educator_1',
    name: 'Dra. Juliana',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_educator_1',
    type: 'Educador Físico',
    professionalId: 'CREF 012345-G/SP',
    commissionRate: 85,
    bankDetails: {
      bank: 'Banco Digital S.A.',
      agency: '0001',
      account: '123456-7',
      pixKey: 'juliana@fisioflow.com',
    },
  },
];

export const mockClinicInfo = {
  name: 'FisioFlow Clínica de Fisioterapia',
  address: 'Rua das Flores, 123 - São Paulo/SP',
  phone: '(11) 99999-9999',
  email: 'contato@fisioflow.com.br',
  cnpj: '00.000.000/0001-00',
  logoUrl: 'https://i.imgur.com/your-logo.png', // Replace with a real logo URL if available
};

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Ana Beatriz Costa',
    cpf: '123.456.789-01',
    birthDate: '1988-05-15',
    phone: '(11) 98765-4321',
    email: 'ana.costa@example.com',
    emergencyContact: { name: 'Carlos Costa', phone: '(11) 91234-5678' },
    address: {
      street: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zip: '01234-567',
    },
    status: 'Active',
    lastVisit: '03/07/2024',
    registrationDate: '2024-06-15',
    avatarUrl: 'https://picsum.photos/id/1027/200/200',
    consentGiven: true,
    whatsappConsent: 'opt-in',
    allergies: 'Alergia a Dipirona.',
    medicalAlerts:
      'Paciente com histórico de hipertensão. Monitorar pressão arterial antes e após as sessões.',
    surgeries: [
      { name: 'Artroplastia de Joelho Direito', date: '2024-05-10' },
      { name: 'Reparo de Manguito Rotador Esquerdo', date: '2022-11-20' },
    ],
    conditions: [
      { name: 'Gonalgia D por condropatia patelar', date: '2024-06-15' },
    ],
    attachments: [
      { name: 'ressonancia_joelho.pdf', url: '#', type: 'pdf', size: 1200000 },
      { name: 'raio_x_ombro.jpg', url: '#', type: 'jpg', size: 850000 },
    ],
    trackedMetrics: [
      {
        id: 'metric1',
        name: 'ADM de Flexão de Joelho D',
        unit: 'graus',
        isActive: true,
      },
      {
        id: 'metric2',
        name: 'Perimetria Coxa D (15cm)',
        unit: 'cm',
        isActive: true,
      },
      {
        id: 'metric3',
        name: 'Força Quadríceps D (0-5)',
        unit: '',
        isActive: false,
      },
    ],
    painPoints: [
      {
        id: 'pp1',
        x: 58.5,
        y: 68,
        intensity: 7,
        type: 'aguda',
        description: 'Dor ao subir escadas, bem na frente do joelho.',
        date: '2024-07-28T10:00:00Z',
        bodyPart: 'front',
      },
      {
        id: 'pp2',
        x: 35,
        y: 35,
        intensity: 4,
        type: 'cansaço',
        description: 'Cansaço no ombro esquerdo no final do dia.',
        date: '2024-07-25T18:00:00Z',
        bodyPart: 'back',
      },
    ],
  },
  {
    id: '2',
    name: 'Bruno Gomes',
    cpf: '234.567.890-12',
    birthDate: '1995-11-22',
    phone: '(21) 99876-5432',
    email: 'bruno.gomes@example.com',
    emergencyContact: { name: 'Fernanda Lima', phone: '(21) 98765-4321' },
    address: {
      street: 'Avenida Copacabana, 456',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zip: '22345-678',
    },
    status: 'Active',
    lastVisit: '01/07/2024',
    registrationDate: '2024-05-20',
    avatarUrl: 'https://picsum.photos/id/1005/200/200',
    consentGiven: true,
    whatsappConsent: 'opt-in',
    allergies: 'Nenhuma conhecida.',
  },
  {
    id: '3',
    name: 'Carla Dias',
    cpf: '345.678.901-23',
    birthDate: '1979-01-30',
    phone: '(31) 98765-1234',
    email: 'carla.dias@example.com',
    emergencyContact: { name: 'João Dias', phone: '(31) 91234-8765' },
    address: {
      street: 'Rua da Bahia, 789',
      city: 'Belo Horizonte',
      state: 'MG',
      zip: '30123-456',
    },
    status: 'Inactive',
    lastVisit: '15/05/2024',
    registrationDate: '2024-03-10',
    avatarUrl: 'https://picsum.photos/id/1011/200/200',
    consentGiven: true,
    whatsappConsent: 'opt-out',
  },
  {
    id: '4',
    name: 'Daniel Almeida',
    cpf: '456.789.012-34',
    birthDate: '2001-09-10',
    phone: '(51) 99123-4567',
    email: 'daniel.almeida@example.com',
    emergencyContact: { name: 'Maria Almeida', phone: '(51) 98765-1234' },
    address: {
      street: 'Avenida Ipiranga, 1011',
      city: 'Porto Alegre',
      state: 'RS',
      zip: '90123-456',
    },
    status: 'Discharged',
    lastVisit: '20/06/2024',
    registrationDate: '2024-02-01',
    avatarUrl: 'https://picsum.photos/id/1012/200/200',
    consentGiven: false,
    whatsappConsent: 'opt-out',
    medicalAlerts: 'Uso de marca-passo. Evitar uso de TENS na região torácica.',
  },
  {
    id: '5',
    name: 'Fernando Oliveira',
    cpf: '567.890.123-45',
    birthDate: '1992-03-12',
    phone: '(48) 98877-6655',
    email: 'fernando.oliveira@example.com',
    emergencyContact: { name: 'Mariana Oliveira', phone: '(48) 98877-1122' },
    address: {
      street: 'Rua dos Corredores, 500',
      city: 'Florianópolis',
      state: 'SC',
      zip: '88010-000',
    },
    status: 'Active',
    lastVisit: '04/07/2024',
    registrationDate: '2024-06-20',
    avatarUrl: 'https://picsum.photos/id/1015/200/200',
    consentGiven: true,
    whatsappConsent: 'opt-in',
    conditions: [{ name: 'Fascite Plantar Crônica', date: '2024-06-20' }],
  },
  {
    id: '6',
    name: 'Lúcia Martins',
    cpf: '678.901.234-56',
    birthDate: '1985-07-08',
    phone: '(61) 97766-5544',
    email: 'lucia.martins@example.com',
    emergencyContact: { name: 'Pedro Martins', phone: '(61) 97766-1122' },
    address: {
      street: 'Setor Comercial Sul, Quadra 2',
      city: 'Brasília',
      state: 'DF',
      zip: '70302-000',
    },
    status: 'Active',
    lastVisit: '02/07/2024',
    registrationDate: '2024-06-18',
    avatarUrl: 'https://picsum.photos/id/1016/200/200',
    consentGiven: true,
    whatsappConsent: 'opt-in',
    conditions: [
      { name: 'Cervicalgia por tensão postural', date: '2024-06-18' },
    ],
    medicalAlerts: 'Trabalha em escritório, muitas horas sentada.',
  },
  {
    id: '7',
    name: 'Mário Santos',
    cpf: '789.012.345-67',
    birthDate: '1960-12-25',
    phone: '(71) 96655-4433',
    email: 'mario.santos@example.com',
    emergencyContact: { name: 'Ana Santos', phone: '(71) 96655-1122' },
    address: {
      street: 'Avenida Sete de Setembro, 1800',
      city: 'Salvador',
      state: 'BA',
      zip: '40060-001',
    },
    status: 'Active',
    lastVisit: '03/07/2024',
    registrationDate: '2024-05-15',
    avatarUrl: 'https://picsum.photos/id/1018/200/200',
    consentGiven: true,
    whatsappConsent: 'opt-out',
    surgeries: [
      { name: 'Artroplastia Total de Quadril Esquerdo', date: '2024-04-30' },
    ],
    conditions: [{ name: 'Pós-operatório de ATQ E', date: '2024-05-15' }],
  },
  {
    id: '8',
    name: 'Júlia Pereira',
    cpf: '890.123.456-78',
    birthDate: '2002-08-19',
    phone: '(41) 95544-3322',
    email: 'julia.pereira@example.com',
    emergencyContact: { name: 'Ricardo Pereira', phone: '(41) 95544-1122' },
    address: {
      street: 'Rua das Araucárias, 150',
      city: 'Curitiba',
      state: 'PR',
      zip: '80010-010',
    },
    status: 'Active',
    lastVisit: '05/07/2024',
    registrationDate: '2024-03-10',
    avatarUrl: 'https://picsum.photos/id/1025/200/200',
    consentGiven: true,
    whatsappConsent: 'opt-in',
    surgeries: [
      {
        name: 'Reconstrução de Ligamento Cruzado Anterior (LCA) D',
        date: '2024-02-15',
      },
    ],
    conditions: [
      {
        name: 'Pós-operatório de LCA D - Retorno ao esporte',
        date: '2024-03-10',
      },
    ],
  },
];

const today = new Date();
const getFutureDate = (days: number, hours: number, minutes: number = 0) => {
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  futureDate.setHours(hours, minutes, 0, 0);
  return futureDate;
};

export const mockAppointments: Appointment[] = [
  {
    id: 'app1',
    patientId: '1',
    patientName: 'Ana Beatriz Costa',
    patientAvatarUrl: mockPatients[0].avatarUrl,
    therapistId: 'therapist_1',
    startTime: getFutureDate(0, 9),
    endTime: getFutureDate(0, 10),
    title: 'Avaliação de joelho',
    type: AppointmentType.Evaluation,
    status: AppointmentStatus.Scheduled,
    value: 150,
    paymentStatus: 'pending',
    sessionNumber: 1,
    totalSessions: 10,
  },
  {
    id: 'app2',
    patientId: '2',
    patientName: 'Bruno Gomes',
    patientAvatarUrl: mockPatients[1].avatarUrl,
    therapistId: 'therapist_2',
    startTime: getFutureDate(0, 10),
    endTime: getFutureDate(0, 11),
    title: 'Tratamento de lombar',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    value: 120,
    paymentStatus: 'pending',
    sessionNumber: 3,
    totalSessions: 8,
  },
  {
    id: 'app3',
    patientId: '1',
    patientName: 'Ana Beatriz Costa',
    patientAvatarUrl: mockPatients[0].avatarUrl,
    therapistId: 'therapist_1',
    startTime: getFutureDate(1, 14),
    endTime: getFutureDate(1, 15),
    title: 'Sessão de fortalecimento',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    value: 120,
    paymentStatus: 'pending',
    sessionNumber: 2,
    totalSessions: 10,
  },
  {
    id: 'app4',
    patientId: '3',
    patientName: 'Carla Dias',
    patientAvatarUrl: mockPatients[2].avatarUrl,
    therapistId: 'therapist_3',
    startTime: getFutureDate(2, 11),
    endTime: getFutureDate(2, 12),
    title: 'Consulta de retorno',
    type: AppointmentType.Return,
    status: AppointmentStatus.Scheduled,
    value: 100,
    paymentStatus: 'paid',
  },
  {
    id: 'app5',
    patientId: '2',
    patientName: 'Bruno Gomes',
    patientAvatarUrl: mockPatients[1].avatarUrl,
    therapistId: 'therapist_2',
    startTime: getFutureDate(4, 9),
    endTime: getFutureDate(4, 10),
    title: 'Sessão de acompanhamento',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    value: 120,
    paymentStatus: 'pending',
    sessionNumber: 4,
    totalSessions: 8,
  },
  {
    id: 'app6',
    patientId: '4',
    patientName: 'Daniel Almeida',
    patientAvatarUrl: mockPatients[3].avatarUrl,
    therapistId: 'therapist_1',
    startTime: getFutureDate(-1, 11),
    endTime: getFutureDate(-1, 11, 30),
    title: 'Pós-alta',
    type: AppointmentType.Return,
    status: AppointmentStatus.Completed,
    value: 80,
    paymentStatus: 'paid',
  },
  {
    id: 'app7',
    patientId: '1',
    patientName: 'Ana Beatriz Costa',
    patientAvatarUrl: mockPatients[0].avatarUrl,
    therapistId: 'therapist_1',
    startTime: getFutureDate(-2, 9),
    endTime: getFutureDate(-2, 10),
    title: 'Avaliação de joelho',
    type: AppointmentType.Evaluation,
    status: AppointmentStatus.Completed,
    value: 150,
    paymentStatus: 'paid',
  },
  {
    id: 'app8',
    patientId: '2',
    patientName: 'Bruno Gomes',
    patientAvatarUrl: mockPatients[1].avatarUrl,
    therapistId: 'therapist_2',
    startTime: getFutureDate(-3, 10),
    endTime: getFutureDate(-3, 11),
    title: 'Tratamento de lombar',
    type: AppointmentType.Session,
    status: AppointmentStatus.Completed,
    value: 120,
    paymentStatus: 'paid',
  },
  {
    id: 'app9',
    patientId: '3',
    patientName: 'Carla Dias',
    patientAvatarUrl: mockPatients[2].avatarUrl,
    therapistId: 'therapist_2',
    startTime: getFutureDate(-4, 14),
    endTime: getFutureDate(-4, 15),
    title: 'Sessão',
    type: AppointmentType.Session,
    status: AppointmentStatus.Completed,
    value: 120,
    paymentStatus: 'paid',
  },
  {
    id: 'app10',
    patientId: '5',
    patientName: 'Fernando Oliveira',
    patientAvatarUrl: mockPatients[4].avatarUrl,
    therapistId: 'therapist_2',
    startTime: getFutureDate(0, 11),
    endTime: getFutureDate(0, 12),
    title: 'Fascite Plantar',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    value: 120,
    paymentStatus: 'paid',
  },
  {
    id: 'app11',
    patientId: '6',
    patientName: 'Lúcia Martins',
    patientAvatarUrl: mockPatients[5].avatarUrl,
    therapistId: 'therapist_3',
    startTime: getFutureDate(1, 10),
    endTime: getFutureDate(1, 11),
    title: 'Cervicalgia',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    value: 120,
    paymentStatus: 'pending',
  },
  {
    id: 'app12',
    patientId: '7',
    patientName: 'Mário Santos',
    patientAvatarUrl: mockPatients[6].avatarUrl,
    therapistId: 'therapist_1',
    startTime: getFutureDate(1, 16),
    endTime: getFutureDate(1, 17),
    title: 'Pós-op Quadril',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    value: 120,
    paymentStatus: 'paid',
  },
  {
    id: 'app13',
    patientId: '8',
    patientName: 'Júlia Pereira',
    patientAvatarUrl: mockPatients[7].avatarUrl,
    therapistId: 'therapist_1',
    startTime: getFutureDate(2, 15),
    endTime: getFutureDate(2, 16),
    title: 'Pós-op LCA',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    value: 120,
    paymentStatus: 'pending',
  },
  {
    id: 'app14',
    patientId: '5',
    patientName: 'Fernando Oliveira',
    patientAvatarUrl: mockPatients[4].avatarUrl,
    therapistId: 'therapist_2',
    startTime: getFutureDate(-3, 11),
    endTime: getFutureDate(-3, 12),
    title: 'Fascite Plantar',
    type: AppointmentType.Session,
    status: AppointmentStatus.Completed,
    value: 120,
    paymentStatus: 'paid',
  },

  // Additional appointments to populate the schedule
  {
    id: 'app_new_1',
    patientId: '6',
    patientName: 'Lúcia Martins',
    patientAvatarUrl: mockPatients[5].avatarUrl,
    therapistId: 'therapist_1',
    startTime: getFutureDate(0, 10),
    endTime: getFutureDate(0, 11),
    title: 'Sessão Cervicalgia',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    value: 120,
    paymentStatus: 'paid',
  },
  {
    id: 'app_new_2',
    patientId: '7',
    patientName: 'Mário Santos',
    patientAvatarUrl: mockPatients[6].avatarUrl,
    therapistId: 'therapist_2',
    startTime: getFutureDate(0, 14),
    endTime: getFutureDate(0, 15),
    title: 'Pós-op Quadril',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    value: 120,
    paymentStatus: 'pending',
  },
  {
    id: 'app_new_3',
    patientId: '8',
    patientName: 'Júlia Pereira',
    patientAvatarUrl: mockPatients[7].avatarUrl,
    therapistId: 'therapist_3',
    startTime: getFutureDate(0, 9),
    endTime: getFutureDate(0, 10),
    title: 'Retorno ao esporte',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    value: 120,
    paymentStatus: 'paid',
  },
  {
    id: 'app_new_4',
    patientId: '2',
    patientName: 'Bruno Gomes',
    patientAvatarUrl: mockPatients[1].avatarUrl,
    therapistId: 'therapist_1',
    startTime: getFutureDate(0, 13),
    endTime: getFutureDate(0, 14),
    title: 'Terapia Manual Lombar',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    value: 120,
    paymentStatus: 'paid',
  },
  {
    id: 'app_new_5',
    patientId: '6',
    patientName: 'Lúcia Martins',
    patientAvatarUrl: mockPatients[5].avatarUrl,
    therapistId: 'therapist_2',
    startTime: getFutureDate(1, 11),
    endTime: getFutureDate(1, 12),
    title: 'Sessão Cervicalgia',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    value: 120,
    paymentStatus: 'pending',
  },
  {
    id: 'app_new_6',
    patientId: '7',
    patientName: 'Mário Santos',
    patientAvatarUrl: mockPatients[6].avatarUrl,
    therapistId: 'therapist_3',
    startTime: getFutureDate(2, 15),
    endTime: getFutureDate(2, 16),
    title: 'Pós-op Quadril',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    value: 120,
    paymentStatus: 'paid',
  },
  {
    id: 'app_new_7',
    patientId: '3',
    patientName: 'Carla Dias',
    patientAvatarUrl: mockPatients[2].avatarUrl,
    therapistId: 'therapist_1',
    startTime: getFutureDate(3, 10),
    endTime: getFutureDate(3, 11),
    title: 'Reavaliação',
    type: AppointmentType.Evaluation,
    status: AppointmentStatus.Scheduled,
    value: 150,
    paymentStatus: 'pending',
  },
  {
    id: 'app_new_8',
    patientId: '4',
    patientName: 'Daniel Almeida',
    patientAvatarUrl: mockPatients[3].avatarUrl,
    therapistId: 'therapist_3',
    startTime: getFutureDate(-7, 14),
    endTime: getFutureDate(-7, 15),
    title: 'Sessão de manutenção',
    type: AppointmentType.Session,
    status: AppointmentStatus.Completed,
    value: 100,
    paymentStatus: 'paid',
  },
  {
    id: 'app_new_9',
    patientId: '5',
    patientName: 'Fernando Oliveira',
    patientAvatarUrl: mockPatients[4].avatarUrl,
    therapistId: 'therapist_1',
    startTime: getFutureDate(-14, 16),
    endTime: getFutureDate(-14, 17),
    title: 'Fortalecimento',
    type: AppointmentType.Session,
    status: AppointmentStatus.Completed,
    value: 120,
    paymentStatus: 'paid',
  },
  {
    id: 'app_new_10',
    patientId: '6',
    patientName: 'Lúcia Martins',
    patientAvatarUrl: mockPatients[5].avatarUrl,
    therapistId: 'therapist_2',
    startTime: getFutureDate(-21, 9),
    endTime: getFutureDate(-21, 10),
    title: 'Pilates Clínico',
    type: AppointmentType.Session,
    status: AppointmentStatus.Completed,
    value: 130,
    paymentStatus: 'paid',
  },
  {
    id: 'app_new_11',
    patientId: '1',
    patientName: 'Ana Beatriz Costa',
    patientAvatarUrl: mockPatients[0].avatarUrl,
    therapistId: 'therapist_2',
    startTime: getFutureDate(0, 15),
    endTime: getFutureDate(0, 16),
    title: 'Terapia Manual Ombro',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    value: 120,
    paymentStatus: 'pending',
  },
];

// Add a recurring appointment series for Ana Beatriz
const recurrenceRule: RecurrenceRule = {
  frequency: 'weekly',
  days: [new Date().getDay()], // Every week on today's day
  until: new Date(new Date().setMonth(new Date().getMonth() + 2))
    .toISOString()
    .split('T')[0],
};

const recurringSeriesId = `series_${Date.now()}`;
let recurrenceDate = getFutureDate(7, 15); // Start next week
while (recurrenceDate.getTime() <= new Date(recurrenceRule.until).getTime()) {
  mockAppointments.push({
    id: `app_recurr_${recurrenceDate.getTime()}`,
    patientId: '1',
    patientName: 'Ana Beatriz Costa',
    patientAvatarUrl: mockPatients[0].avatarUrl,
    therapistId: 'therapist_3',
    startTime: new Date(recurrenceDate),
    endTime: new Date(recurrenceDate.getTime() + 60 * 60 * 1000), // 1 hour
    title: 'Pilates Clínico',
    type: AppointmentType.Session,
    status: AppointmentStatus.Scheduled,
    seriesId: recurringSeriesId,
    recurrenceRule: recurrenceRule,
    value: 130,
    paymentStatus: 'pending',
  });
  recurrenceDate.setDate(recurrenceDate.getDate() + 7);
}

export const mockSoapNotes: SoapNote[] = [
  {
    id: 'note1',
    patientId: '1',
    date: '03/07/2024',
    therapist: 'Dr. Roberto',
    sessionNumber: 2,
    subjective:
      'Paciente relata dor no joelho direito ao subir escadas, mas com melhora na intensidade.',
    objective:
      'ADM do joelho direito: 0-110 graus. Teste de gaveta anterior negativo. Leve edema periarticular.',
    assessment:
      'Evolução positiva no quadro de condromalácia patelar. Apresenta melhora na força de quadríceps.',
    plan: 'Manter cinesioterapia para fortalecimento do VMO e alongamento de isquiotibiais. Progredir para exercícios em cadeia cinética fechada.',
    bodyParts: ['Joelho Direito'],
    painScale: 4,
    metricResults: [
      { metricId: 'metric1', value: 110 },
      { metricId: 'metric2', value: 43 },
    ],
  },
  {
    id: 'note2',
    patientId: '1',
    date: '27/06/2024',
    therapist: 'Dr. Roberto',
    sessionNumber: 1,
    subjective:
      'Paciente comparece para primeira avaliação, queixando-se de dor no joelho que iniciou há 2 meses.',
    objective:
      'Deambulação claudicante em membro inferior direito. Força muscular grau 4 para quadríceps. ADM de flexão 95 graus.',
    assessment: 'Gonalgia a ser investigada. Sinais inflamatórios presentes.',
    plan: 'Solicitar exames de imagem (Ressonância Magnética) para melhor diagnóstico. Iniciar com analgesia e TENS.',
    painScale: 7,
    metricResults: [
      { metricId: 'metric1', value: 95 },
      { metricId: 'metric2', value: 42.5 },
    ],
  },
  {
    id: 'note3',
    patientId: '2',
    date: '01/07/2024',
    therapist: 'Dr. Roberto',
    sessionNumber: 3,
    subjective:
      'Paciente refere dor lombar baixa após carregar peso. A dor irradia para a perna esquerda.',
    objective:
      'Teste de Lasègue positivo a 45 graus à esquerda. Parestesia em dermátomo de L5.',
    assessment: 'Lombociatalgia aguda, provável hérnia de disco em L4-L5.',
    plan: 'Terapia manual para alívio dos espasmos musculares. Exercícios de McKenzie. Orientações posturais. Reavaliar em 1 semana.',
    bodyParts: ['Coluna Lombar', 'Perna Esquerda'],
    painScale: 8,
  },
  {
    id: 'note4',
    patientId: '5',
    date: '04/07/2024',
    therapist: 'Dra. Camila',
    sessionNumber: 4,
    subjective:
      'Relata dor matinal no calcâneo E, nota 3/10. Conseguiu correr 5km com desconforto mínimo.',
    objective:
      'Teste de Windlass negativo. Boa flexibilidade de gastrocnêmio e sóleo. Palpação da fáscia plantar indolor.',
    assessment:
      'Evolução excelente do quadro de fascite plantar. Sinais inflamatórios ausentes.',
    plan: 'Focar em fortalecimento excêntrico e pliometria. Liberado para aumentar volume de corrida gradualmente.',
    bodyParts: ['Pé Esquerdo'],
    painScale: 2,
  },
  {
    id: 'note5',
    patientId: '7',
    date: '03/07/2024',
    therapist: 'Dr. Roberto',
    sessionNumber: 8,
    subjective:
      'Sente-se mais seguro para andar, subiu escadas sem auxílio pela primeira vez.',
    objective:
      'ADM de flexão do quadril E: 110°. Força de glúteo médio grau 4+. Marcha com boa simetria.',
    assessment:
      'Ótima progressão em pós-operatório de ATQ. Atingindo metas funcionais.',
    plan: 'Introduzir exercícios de equilíbrio unipodal e agachamentos com amplitude controlada.',
    bodyParts: ['Quadril Esquerdo'],
    painScale: 1,
  },
  {
    id: 'note6',
    patientId: '8',
    date: '05/07/2024',
    therapist: 'Dr. Roberto',
    sessionNumber: 20,
    subjective:
      'Ansiosa para voltar a jogar vôlei. Realizou saltos durante o treino sem dor.',
    objective:
      'Testes funcionais (hop tests) com 90% de simetria em relação ao membro não operado. Sem edema ou instabilidade.',
    assessment:
      'Paciente em fase final de reabilitação de LCA, com bom controle neuromuscular.',
    plan: 'Iniciar gestos esportivos específicos. Foco em treino de mudança de direção e aterrissagem. Programar testes isocinéticos.',
    bodyParts: ['Joelho Direito'],
    painScale: 0,
  },
];

export const mockTreatmentPlans: TreatmentPlan[] = [
  {
    id: 'plan1',
    patientId: '1',
    coffitoDiagnosisCodes: 'S83.2 - Lesão do menisco',
    treatmentGoals:
      'Reduzir a dor, aumentar ADM de flexão do joelho para 120 graus, e fortalecer quadríceps e isquiotibiais para retorno às atividades diárias sem dor em 8 semanas.',
    frequencyPerWeek: 2,
    durationWeeks: 8,
    modalities: ['Cinesioterapia', 'Crioterapia', 'TENS'],
    outcomeMeasures: [
      'Escala Visual Analógica (EVA)',
      'Goniometria',
      'Teste de Força Muscular',
    ],
    createdByCrefito: '12345-F',
    exercises: [
      {
        id: 'ex1',
        treatmentPlanId: 'plan1',
        exerciseName: 'Elevação da perna estendida',
        sets: 3,
        repetitions: '15',
        resistanceLevel: 'Sem peso',
        progressionCriteria: 'Progredir para caneleira de 1kg.',
      },
      {
        id: 'ex2',
        treatmentPlanId: 'plan1',
        exerciseName: 'Agachamento isométrico na parede',
        sets: 4,
        repetitions: '30s',
        resistanceLevel: 'Peso corporal',
        progressionCriteria: 'Aumentar duração para 45s.',
      },
      {
        id: 'ex3',
        treatmentPlanId: 'plan1',
        exerciseName: 'Alongamento de Isquiotibiais',
        sets: 3,
        repetitions: '30s',
        resistanceLevel: 'Leve',
        progressionCriteria: 'Aumentar amplitude.',
      },
    ],
  },
];

export const mockExercisePrescriptions: ExercisePrescription[] = [
  {
    id: 'ex1',
    treatmentPlanId: 'plan1',
    exerciseName: 'Elevação da perna estendida',
    sets: 3,
    repetitions: '15',
    resistanceLevel: 'Sem peso',
    progressionCriteria:
      'Progredir para caneleira de 1kg quando 3x15 for realizado sem dor.',
    demonstrationVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Example link
  },
  {
    id: 'ex2',
    treatmentPlanId: 'plan1',
    exerciseName: 'Agachamento isométrico na parede',
    sets: 4,
    repetitions: '30s',
    resistanceLevel: 'Peso corporal',
    progressionCriteria: 'Aumentar a duração para 45 segundos.',
  },
  {
    id: 'ex3',
    treatmentPlanId: 'plan1',
    exerciseName: 'Alongamento de Isquiotibiais',
    sets: 3,
    repetitions: '30s',
    resistanceLevel: 'Leve',
    progressionCriteria: 'Aumentar a amplitude do alongamento gradualmente.',
  },
];

export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'log1',
    user: 'Dr. Roberto',
    action: 'LOGIN_SUCCESS',
    details: 'Login bem-sucedido.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    ipAddress: '201.45.67.89',
  },
  {
    id: 'log2',
    user: 'Dr. Roberto',
    action: 'VIEW_PATIENT_RECORD',
    details: 'Visualizou o prontuário de Ana Beatriz Costa (ID: 1)',
    timestamp: new Date(Date.now() - 95 * 60 * 1000),
    ipAddress: '201.45.67.89',
  },
  {
    id: 'log3',
    user: 'Dr. Roberto',
    action: 'CREATE_SOAP_NOTE',
    details: 'Criou nova nota SOAP para Ana Beatriz Costa (ID: 1)',
    timestamp: new Date(Date.now() - 90 * 60 * 1000),
    ipAddress: '201.45.67.89',
  },
  {
    id: 'log4',
    user: 'Dra. Camila',
    action: 'VIEW_PATIENT_RECORD',
    details: 'Visualizou o prontuário de Bruno Gomes (ID: 2)',
    timestamp: new Date(Date.now() - 62 * 60 * 1000),
    ipAddress: '201.45.67.89',
  },
  {
    id: 'log5',
    user: 'System',
    action: 'AUTO_LOGOUT',
    details: 'Sessão do Dr. Roberto expirou por inatividade.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    ipAddress: 'N/A',
  },
  {
    id: 'log6',
    user: 'Dr. Fernando',
    action: 'LOGIN_ATTEMPT_FAILED',
    details: 'Tentativa de login falhou (senha incorreta).',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    ipAddress: '189.12.34.56',
  },
  {
    id: 'log7',
    user: 'Dr. Fernando',
    action: 'LOGIN_SUCCESS',
    details: 'Login bem-sucedido.',
    timestamp: new Date(Date.now() - 4 * 60 * 1000),
    ipAddress: '189.12.34.56',
  },
  {
    id: 'log8',
    user: 'Dra. Camila',
    action: 'UPDATE_PATIENT_INFO',
    details: 'Atualizou informações de contato para Carla Dias (ID: 3)',
    timestamp: new Date(),
    ipAddress: '189.12.34.56',
  },
  {
    id: 'log9',
    user: 'AI_ASSISTANT',
    action: 'AI_QUERY',
    details: 'Consulta: "protocolo para LCA"',
    timestamp: new Date(Date.now() - 3 * 60 * 1000),
    ipAddress: 'N/A',
  },
  {
    id: 'log10',
    user: 'Dr. Roberto',
    action: 'CREATE_PATIENT',
    details: 'Criou novo paciente: Carlos Dias (ID: 3)',
    timestamp: new Date(Date.now() - 120 * 60 * 1000),
    ipAddress: '201.45.67.89',
  },
  {
    id: 'log11',
    user: 'Dra. Camila',
    action: 'DELETE_APPOINTMENT',
    details: 'Excluiu agendamento de Carla Dias (ID: app9)',
    timestamp: new Date(Date.now() - 110 * 60 * 1000),
    ipAddress: '189.12.34.56',
  },
  {
    id: 'log12',
    user: 'Dr. Fernando',
    action: 'ASSIGN_TASK',
    details: 'Atribuiu tarefa "Ligar para Carla Dias" para si mesmo.',
    timestamp: new Date(Date.now() - 100 * 60 * 1000),
    ipAddress: '189.12.34.56',
  },
  {
    id: 'log13',
    user: 'Dr. Roberto',
    action: 'SECURITY_PASSWORD_CHANGE',
    details: 'Senha alterada com sucesso.',
    timestamp: new Date(Date.now() - 80 * 60 * 1000),
    ipAddress: '201.45.67.89',
  },
];

export const mockKnowledgeBase: KnowledgeBaseEntry[] = [
  {
    id: 'kb1',
    type: 'protocol',
    title: 'Protocolo de Reabilitação Pós-operatório de LCA',
    content:
      'Fase 1 (0-2 semanas): Foco em controle de dor e edema, ganho de ADM completo em extensão. Exercícios isométricos para quadríceps.\nFase 2 (2-6 semanas): Iniciar ganho de flexão, exercícios de cadeia cinética fechada (mini-agachamentos).\nFase 3 (6-12 semanas): Fortalecimento progressivo, início de treino de propriocepção.\nFase 4 (3-6 meses): Introdução de corrida e atividades de baixo impacto. Pliometria leve.\nFase 5 (6-9 meses): Retorno gradual ao esporte, com foco em movimentos específicos da modalidade.',
    tags: ['lca', 'joelho', 'pós-operatório', 'protocolo'],
  },
  {
    id: 'kb2',
    type: 'technique',
    title: 'Técnica de Liberação Miofascial para Piriforme',
    content:
      'Paciente em decúbito dorsal. Realizar flexão, adução e rotação interna do quadril para alongar o piriforme. Aplicar pressão sustentada no ponto de maior tensão com o polegar ou cotovelo por 60-90 segundos até sentir a liberação do tecido.',
    tags: ['liberação miofascial', 'piriforme', 'lombalgia', 'técnica'],
  },
  {
    id: 'kb3',
    type: 'exercise',
    title: 'Exercício de Fortalecimento do Manguito Rotador',
    content:
      'Rotação externa com faixa elástica. Cotovelo a 90 graus, fixado na lateral do corpo. Realizar 3 séries de 15 repetições, com foco na contração lenta e controlada dos músculos infraespinhal e redondo menor.',
    tags: ['manguito rotador', 'ombro', 'fortalecimento', 'exercício'],
  },
];

const expandedExercises: Exercise[] = [
  // Mobilização Neural
  {
    id: 'ex_mn_1',
    name: 'Deslizamento do Nervo Mediano',
    description:
      'Técnica de mobilização neural para aliviar sintomas de compressão do nervo mediano.',
    category: 'Mobilização Neural',
    bodyParts: ['Punho', 'Braço', 'Mão'],
    difficulty: 2,
    equipment: [],
    instructions: [
      'Sente-se com a postura ereta.',
      'Estenda o braço afetado para o lado, com a palma da mão para cima.',
      'Flexione o punho para baixo e incline a cabeça para o lado oposto.',
      'Retorne a cabeça à posição neutra enquanto estende o punho para cima.',
    ],
    media: {
      thumbnailUrl:
        'https://images.pexels.com/photos/7592458/pexels-photo-7592458.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      videoUrl:
        'https://videos.pexels.com/video-files/7592458/7592458-hd_1920_1080_25fps.mp4',
      duration: 33,
    },
    indications: ['Síndrome do Túnel do Carpo', 'Irritação do nervo mediano'],
    contraindications: ['Dor aguda ou queimação durante o exercício.'],
  },
  {
    id: 'ex_mn_2',
    name: 'Mobilização do Nervo Ulnar',
    description:
      'Exercício para melhorar a mobilidade do nervo ulnar, comum em casos de dor no cotovelo e formigamento nos dedos.',
    category: 'Mobilização Neural',
    bodyParts: ['Cotovelo', 'Punho', 'Mão'],
    difficulty: 2,
    equipment: [],
    instructions: [
      'Forme um "OK" com o polegar e o indicador.',
      'Vire a mão de cabeça para baixo e leve-a em direção ao seu rosto, formando "óculos".',
      'Mova o punho para frente e para trás suavemente.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Mobilização+Nervo+Ulnar',
    },
    indications: ['Síndrome do túnel cubital', 'Parestesia nos 4º e 5º dedos.'],
    contraindications: ['Dor aguda no cotovelo.'],
  },
  {
    id: 'ex_mn_3',
    name: 'Tensão Neural Ciático (Slump Test)',
    description:
      'Teste e mobilização para o nervo ciático, avaliando a sensibilidade neural.',
    category: 'Mobilização Neural',
    bodyParts: ['Coluna Lombar', 'Perna (Posterior)'],
    difficulty: 3,
    equipment: ['Cadeira'],
    instructions: [
      'Sente-se em uma cadeira com a coluna "desleixada" (curvada).',
      'Flexione o pescoço para baixo.',
      'Estenda uma perna à sua frente.',
      'Dorsiflexione o tornozelo (puxe os dedos do pé para cima).',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Tensão+Neural+Ciático',
    },
    indications: ['Lombociatalgia', 'Suspeita de hérnia de disco.'],
    contraindications: ['Instabilidade lombar severa.'],
  },
  {
    id: 'ex_mn_4',
    name: 'Deslizamento Femoral',
    description:
      'Mobilização para o nervo femoral, útil em casos de dor na parte anterior da coxa.',
    category: 'Mobilização Neural',
    bodyParts: ['Quadril', 'Coxa (Anterior)'],
    difficulty: 2,
    equipment: ['Mat'],
    instructions: [
      'Deite-se de bruços.',
      'Flexione o joelho do lado afetado.',
      'Estenda o quadril, levantando ligeiramente o joelho do chão.',
      'Mantenha por alguns segundos e retorne.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Deslizamento+Femoral',
    },
    indications: ['Meralgia parestésica', 'Dor anterior da coxa.'],
    contraindications: ['Lesão aguda no quadril ou joelho.'],
  },
  {
    id: 'ex_mn_5',
    name: 'Mobilização do Nervo Radial',
    description:
      'Técnica para melhorar a mobilidade do nervo radial, aliviando sintomas no antebraço e dorso da mão.',
    category: 'Mobilização Neural',
    bodyParts: ['Braço', 'Antebraço', 'Punho'],
    difficulty: 2,
    equipment: [],
    instructions: [
      'Estenda o braço à frente com o ombro para baixo.',
      'Flexione o punho e os dedos.',
      'Rotacione o braço internamente (polegar para baixo).',
      'Incline a cabeça para o lado oposto para aumentar a tensão.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Mobilização+Nervo+Radial',
    },
    indications: [
      'Síndrome do túnel radial',
      'Epicondilite lateral refratária',
    ],
    contraindications: ['Dor aguda e irradiada intensa.'],
  },
  {
    id: 'ex_mn_6',
    name: 'Mobilização do Plexo Braquial',
    description:
      'Movimento global para avaliar e mobilizar todo o plexo braquial.',
    category: 'Mobilização Neural',
    bodyParts: ['Pescoço', 'Ombro', 'Braço'],
    difficulty: 3,
    equipment: [],
    instructions: [
      'Em pé, deprima o ombro do lado afetado.',
      'Estenda o braço para trás e rode-o externamente.',
      'Flexione o punho e incline a cabeça para o lado oposto.',
      'Mantenha uma tensão suave e controlada.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Mobilização+Plexo+Braquial',
    },
    indications: ['Síndrome do desfiladeiro torácico', 'Cervicobraquialgia.'],
    contraindications: ['Instabilidade cervical ou do ombro.'],
  },

  // Cervical
  {
    id: 'ex_cerv_1',
    name: 'Retração Cervical (Chin Tuck)',
    description:
      'Fortalece os músculos profundos do pescoço e melhora a postura da cabeça.',
    category: 'Cervical',
    bodyParts: ['Pescoço', 'Coluna Cervical'],
    difficulty: 1,
    equipment: [],
    instructions: [
      'Sente-se ou deite-se com a coluna reta.',
      'Suavemente, puxe o queixo para trás, como se estivesse fazendo uma "papada".',
      'Mantenha por 5 segundos e relaxe.',
    ],
    media: {
      thumbnailUrl:
        'https://images.pexels.com/photos/7592461/pexels-photo-7592461.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      videoUrl:
        'https://videos.pexels.com/video-files/7592461/7592461-hd_1920_1080_25fps.mp4',
      duration: 35,
    },
    indications: ['Cefaleia tensional', 'Protrusão de cabeça.'],
    contraindications: ['Dor aguda ao realizar o movimento.'],
  },
  {
    id: 'ex_cerv_2',
    name: 'Flexão Lateral Cervical',
    description: 'Alongamento para os músculos laterais do pescoço.',
    category: 'Cervical',
    bodyParts: ['Pescoço'],
    difficulty: 1,
    equipment: [],
    instructions: [
      'Sente-se com a coluna ereta.',
      'Incline a cabeça para um lado, como se quisesse tocar a orelha no ombro.',
      'Para intensificar, segure a cabeça com a mão do mesmo lado e puxe suavemente.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Flexão+Lateral+Cervical',
    },
    indications: ['Torcicolo', 'Tensão no pescoço.'],
    contraindications: ['Instabilidade cervical.'],
  },
  {
    id: 'ex_cerv_3',
    name: 'Alongamento Trapézio Superior',
    description:
      'Alivia a tensão nos músculos do trapézio superior, comuns em quem trabalha sentado.',
    category: 'Cervical',
    bodyParts: ['Pescoço', 'Ombros'],
    difficulty: 1,
    equipment: [],
    instructions: [
      'Sente-se e segure a lateral da cadeira com uma mão.',
      'Incline a cabeça para o lado oposto e ligeiramente para frente.',
      'Use a outra mão para aplicar uma leve pressão na cabeça.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Alongamento+Trapézio',
    },
    indications: ['Cervicalgia', 'Dor de cabeça tensional.'],
    contraindications: ['Síndrome do desfiladeiro torácico.'],
  },
  {
    id: 'ex_cerv_4',
    name: 'Estabilização Cervical Isométrica',
    description:
      'Fortalece os músculos do pescoço sem movimento, melhorando a estabilidade.',
    category: 'Cervical',
    bodyParts: ['Pescoço'],
    difficulty: 2,
    equipment: [],
    instructions: [
      'Sente-se ereto.',
      'Coloque a mão na testa e empurre a cabeça para frente contra a mão, sem mover a cabeça.',
      'Repita para os lados e para trás.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Isometria+Cervical',
    },
    indications: ['Fraqueza muscular cervical', 'Pós-whiplash (fase tardia).'],
    contraindications: ['Fase aguda de lesão cervical.'],
  },
  {
    id: 'ex_cerv_5',
    name: 'Mobilização C1-C2 (Rotação com Chin Tuck)',
    description: 'Melhora a rotação na parte superior da coluna cervical.',
    category: 'Cervical',
    bodyParts: ['Pescoço', 'Coluna Cervical'],
    difficulty: 3,
    equipment: [],
    instructions: [
      'Realize uma leve retração cervical (chin tuck).',
      'Mantendo a retração, rode a cabeça lentamente para um lado e depois para o outro.',
      'Concentre o movimento na base do crânio.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Mobilização+C1-C2',
    },
    indications: [
      'Cefaleia cervicogênica',
      'Restrição de rotação cervical alta.',
    ],
    contraindications: ['Instabilidade atlanto-axial (ex: AR).'],
  },
  {
    id: 'ex_cerv_6',
    name: 'Fortalecimento de Flexores Profundos',
    description: 'Ativação dos músculos estabilizadores profundos do pescoço.',
    category: 'Cervical',
    bodyParts: ['Pescoço'],
    difficulty: 2,
    equipment: ['Toalha'],
    instructions: [
      'Deite-se de costas com uma toalha enrolada sob o pescoço.',
      'Realize um movimento sutil de "sim" com a cabeça, pressionando suavemente a toalha.',
      'Mantenha a contração por 10 segundos sem usar os músculos superficiais.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Flexores+Profundos',
    },
    indications: ['Cervicalgia crônica', 'Instabilidade postural.'],
    contraindications: ['Dor aguda ao flexionar o pescoço.'],
  },

  // Membros Superiores
  {
    id: 'ex_ms_1',
    name: 'Rotação Externa de Ombro com Faixa',
    description:
      'Fortalece os músculos do manguito rotador para estabilidade do ombro.',
    category: 'Membros Superiores',
    subcategory: 'Ombro',
    bodyParts: ['Ombro'],
    difficulty: 2,
    equipment: ['Faixa elástica'],
    instructions: [
      'Prenda uma faixa elástica em um ponto fixo.',
      'Mantenha o cotovelo dobrado a 90 graus e junto ao corpo.',
      'Puxe a faixa para fora, rodando o ombro, sem afastar o cotovelo.',
    ],
    media: {
      thumbnailUrl:
        'https://images.pexels.com/photos/7592490/pexels-photo-7592490.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      videoUrl:
        'https://videos.pexels.com/video-files/7592490/7592490-hd_1920_1080_25fps.mp4',
      duration: 42,
    },
    indications: ['Síndrome do impacto', 'Instabilidade do ombro.'],
    contraindications: ['Fase aguda de lesão do manguito rotador.'],
  },
  {
    id: 'ex_ms_2',
    name: 'Exercício Codman (Pendular)',
    description:
      'Movimento passivo para alívio da dor e ganho de mobilidade no ombro.',
    category: 'Membros Superiores',
    subcategory: 'Ombro',
    bodyParts: ['Ombro'],
    difficulty: 1,
    equipment: [],
    instructions: [
      'Incline-se para frente, apoiando a mão boa em uma mesa.',
      'Deixe o braço afetado pendurado e relaxado.',
      'Faça pequenos movimentos circulares, para frente/trás e para os lados com o corpo, permitindo que o braço se mova como um pêndulo.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Exercício+Codman',
    },
    indications: [
      'Capsulite adesiva (ombro congelado)',
      'Pós-operatório imediato de ombro.',
    ],
    contraindications: ['Instabilidade glenoumeral severa.'],
  },
  {
    id: 'ex_ms_3',
    name: 'Estabilização Escapular na Parede',
    description: 'Ativa os músculos que estabilizam a escápula (omoplata).',
    category: 'Membros Superiores',
    subcategory: 'Ombro',
    bodyParts: ['Escápula', 'Ombro'],
    difficulty: 2,
    equipment: [],
    instructions: [
      'Fique de frente para uma parede com os cotovelos dobrados a 90 graus.',
      'Pressione os antebraços contra a parede.',
      'Deslize os braços para cima e para baixo, mantendo a pressão e o controle da escápula.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Estabilização+Escapular',
    },
    indications: ['Discinesia escapular', 'Dor no ombro.'],
    contraindications: ['Dor aguda ao elevar os braços.'],
  },
  {
    id: 'ex_ms_4',
    name: 'Fortalecimento de Bíceps com Halter',
    description: 'Exercício clássico para fortalecimento do bíceps braquial.',
    category: 'Membros Superiores',
    subcategory: 'Braço',
    bodyParts: ['Braço'],
    difficulty: 2,
    equipment: ['Halter'],
    instructions: [
      'Sente-se ou fique em pé com um halter em cada mão, palmas para frente.',
      'Mantenha os cotovelos próximos ao corpo.',
      'Flexione os cotovelos, levando os halteres em direção aos ombros.',
      'Desça de forma controlada.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Fortalecimento+Bíceps',
    },
    indications: ['Fraqueza de bíceps', 'Reabilitação de cotovelo.'],
    contraindications: ['Epicondilite medial aguda.'],
  },
  {
    id: 'ex_ms_5',
    name: 'Fortalecimento de Punho com Halter',
    description:
      'Exercício para fortalecer os músculos flexores e extensores do punho.',
    category: 'Membros Superiores',
    subcategory: 'Punho',
    bodyParts: ['Punho', 'Antebraço'],
    difficulty: 1,
    equipment: ['Halter'],
    instructions: [
      'Sente-se e apoie o antebraço na coxa, com a mão para fora.',
      'Com a palma para cima, flexione o punho para cima e para baixo.',
      'Vire a palma para baixo e repita o movimento.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Fortalecimento+Punho',
    },
    indications: ['Epicondilite', 'Prevenção de LER/DORT.'],
    contraindications: ['Dor aguda no punho.'],
  },

  // Tronco
  {
    id: 'ex_tronco_1',
    name: 'Ponte Glútea',
    description:
      'Fortalece os glúteos e a cadeia posterior, importantes para a estabilidade da pelve e lombar.',
    category: 'Tronco',
    bodyParts: ['Glúteos', 'Coluna Lombar', 'Core'],
    difficulty: 1,
    equipment: ['Mat'],
    instructions: [
      'Deite-se de costas com os joelhos dobrados e os pés no chão.',
      'Contraia os glúteos e levante o quadril do chão até que o corpo forme uma linha reta dos ombros aos joelhos.',
      'Mantenha por um segundo no topo e desça lentamente.',
    ],
    media: {
      thumbnailUrl:
        'https://images.pexels.com/photos/5842186/pexels-photo-5842186.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      videoUrl:
        'https://videos.pexels.com/video-files/5842186/5842186-hd_1920_1080_25fps.mp4',
      duration: 45,
    },
    indications: ['Lombalgia', 'Fraqueza de glúteos.'],
    contraindications: ['Fase aguda de hérnia de disco.'],
  },
  {
    id: 'ex_tronco_2',
    name: 'Prancha Lateral',
    description:
      'Fortalece os músculos oblíquos e estabilizadores laterais do tronco.',
    category: 'Tronco',
    bodyParts: ['Core', 'Oblíquos'],
    difficulty: 3,
    equipment: ['Mat'],
    instructions: [
      'Deite-se de lado, apoiado no antebraço e no pé.',
      'Levante o quadril, mantendo o corpo em linha reta.',
      'Sustente a posição pelo tempo determinado.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Prancha+Lateral',
    },
    indications: ['Instabilidade do core', 'Escoliose funcional.'],
    contraindications: ['Dor no ombro de apoio.'],
  },
  {
    id: 'ex_tronco_3',
    name: 'Bird Dog',
    description:
      'Exercício de estabilização do core que desafia o equilíbrio e a coordenação.',
    category: 'Tronco',
    bodyParts: ['Core', 'Coluna Lombar', 'Glúteos'],
    difficulty: 2,
    equipment: ['Mat'],
    instructions: [
      'Comece na posição de quatro apoios.',
      'Estenda simultaneamente o braço direito à frente e a perna esquerda para trás, mantendo o tronco estável.',
      'Retorne à posição inicial e alterne os lados.',
    ],
    media: {
      thumbnailUrl:
        'https://images.pexels.com/photos/8070381/pexels-photo-8070381.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      videoUrl:
        'https://videos.pexels.com/video-files/8070381/8070381-hd_1920_1080_25fps.mp4',
      duration: 38,
    },
    indications: ['Lombalgia crônica', 'Melhora da propriocepção.'],
    contraindications: ['Dor lombar aguda com irradiação.'],
  },
  {
    id: 'ex_tronco_4',
    name: 'Exercício Cat-Camel',
    description:
      'Melhora a mobilidade e a flexibilidade da coluna torácica e lombar.',
    category: 'Tronco',
    bodyParts: ['Coluna Torácica', 'Coluna Lombar'],
    difficulty: 1,
    equipment: ['Mat'],
    instructions: [
      'Comece na posição de quatro apoios, com as mãos sob os ombros e os joelhos sob os quadris.',
      'Inspire enquanto arqueia as costas para baixo, levantando a cabeça e o cóccix (posição "Vaca").',
      'Expire enquanto arredonda as costas para cima, empurrando o chão e trazendo o queixo ao peito (posição "Gato").',
      'Alterne os movimentos de forma lenta e controlada, sincronizando com a respiração.',
    ],
    media: {
      thumbnailUrl:
        'https://images.pexels.com/photos/7592470/pexels-photo-7592470.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      videoUrl:
        'https://videos.pexels.com/video-files/7592470/7592470-hd_1920_1080_25fps.mp4',
      duration: 40,
    },
    indications: ['Lombalgia mecânica', 'Rigidez da coluna'],
    contraindications: [
      'Instabilidade vertebral severa',
      'Fase aguda de hérnia de disco.',
    ],
  },
  {
    id: 'ex_tronco_5',
    name: 'Dead Bug',
    description:
      'Exercício de estabilização do core com foco na dissociação de membros.',
    category: 'Tronco',
    bodyParts: ['Core', 'Abdômen'],
    difficulty: 2,
    equipment: ['Mat'],
    instructions: [
      'Deite-se de costas com os joelhos e quadris a 90 graus e braços estendidos para o teto.',
      'Lentamente, abaixe o braço direito e a perna esquerda em direção ao chão, mantendo a lombar estável.',
      'Retorne à posição inicial e alterne os lados.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Dead+Bug',
    },
    indications: ['Fortalecimento do core', 'Controle motor da pelve.'],
    contraindications: ['Incapacidade de manter a pelve neutra.'],
  },

  // Membros Inferiores
  {
    id: 'ex_mi_1',
    name: 'Fortalecimento de Quadríceps (Cadeira extensora)',
    description: 'Exercício focado no fortalecimento do músculo quadríceps.',
    category: 'Membros Inferiores',
    subcategory: 'Joelho',
    bodyParts: ['Joelho', 'Coxa (Anterior)'],
    difficulty: 2,
    equipment: ['Cadeira', 'Caneleira'],
    instructions: [
      'Sente-se em uma cadeira com as costas retas.',
      'Estenda um joelho até a perna ficar reta.',
      'Segure por 2-3 segundos e retorne lentamente.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Fortalecimento+Quadríceps',
    },
    indications: ['Condromalácia patelar', 'Pós-operatório de joelho.'],
    contraindications: ['Dor femoropatelar significativa.'],
  },
  {
    id: 'ex_mi_2',
    name: 'Alongamento de Isquiotibiais',
    description: 'Alongamento dos músculos posteriores da coxa.',
    category: 'Membros Inferiores',
    subcategory: 'Coxa',
    bodyParts: ['Coxa (Posterior)'],
    difficulty: 1,
    equipment: ['Mat'],
    instructions: [
      'Sente-se no chão com uma perna estendida e a outra flexionada.',
      'Incline o tronco para frente sobre a perna estendida até sentir um alongamento suave.',
      'Mantenha a posição por 30 segundos.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Alongamento+Isquiotibiais',
    },
    indications: ['Encurtamento muscular', 'Lombalgia.'],
    contraindications: ['Lesão aguda dos isquiotibiais.'],
  },
  {
    id: 'ex_mi_3',
    name: 'Fortalecimento Glúteo Médio (Ostra)',
    description:
      'Ativação do glúteo médio, crucial para a estabilidade do quadril.',
    category: 'Membros Inferiores',
    subcategory: 'Quadril',
    bodyParts: ['Quadril', 'Glúteos'],
    difficulty: 1,
    equipment: ['Faixa elástica', 'Mat'],
    instructions: [
      'Deite-se de lado com os joelhos dobrados e uma faixa elástica ao redor deles.',
      'Mantenha os pés juntos e levante o joelho de cima, abrindo as pernas como uma ostra.',
      'Controle o movimento de retorno.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Exercício+Ostra',
    },
    indications: ['Síndrome da dor femoropatelar', 'Tendinopatia glútea.'],
    contraindications: ['Bursite trocantérica aguda.'],
  },
  {
    id: 'ex_mi_4',
    name: 'Exercícios de Equilíbrio Unipodal',
    description:
      'Melhora a propriocepção e a estabilidade do tornozelo, joelho e quadril.',
    category: 'Membros Inferiores',
    bodyParts: ['Tornozelo', 'Joelho', 'Quadril'],
    difficulty: 2,
    equipment: [],
    instructions: [
      'Fique em pé sobre uma perna só.',
      'Tente manter o equilíbrio por 30 segundos.',
      'Para aumentar a dificuldade, feche os olhos ou fique em uma superfície instável.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Equilíbrio+Unipodal',
    },
    indications: ['Entorses de tornozelo recorrentes', 'Prevenção de quedas.'],
    contraindications: ['Incapacidade de suportar peso no membro.'],
  },
  {
    id: 'ex_mi_5',
    name: 'Fortalecimento de Panturrilha (Elevação de calcanhar)',
    description: 'Fortalece os músculos gastrocnêmio e sóleo.',
    category: 'Membros Inferiores',
    subcategory: 'Tornozelo e Pé',
    bodyParts: ['Panturrilha', 'Tornozelo'],
    difficulty: 1,
    equipment: [],
    instructions: [
      'Fique em pé, com os pés apoiados no chão.',
      'Eleve os calcanhares o mais alto que puder, contraindo a panturrilha.',
      'Desça lentamente até a posição inicial.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Fortalecimento+Panturrilha',
    },
    indications: ['Fascite plantar', 'Tendinopatia de Aquiles.'],
    contraindications: ['Fratura por estresse na tíbia.'],
  },
  {
    id: 'ex_mi_6',
    name: 'Marcha Lateral com Faixa Elástica',
    description:
      'Fortalece os abdutores do quadril, melhorando a estabilidade pélvica.',
    category: 'Membros Inferiores',
    subcategory: 'Quadril',
    bodyParts: ['Quadril', 'Glúteos'],
    difficulty: 2,
    equipment: ['Faixa elástica'],
    instructions: [
      'Coloque uma faixa elástica ao redor dos tornozelos ou joelhos.',
      'Em uma posição de semi-agachamento, dê passos para o lado sem deixar os joelhos se juntarem.',
      'Mantenha a tensão na faixa durante todo o movimento.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Marcha+Lateral',
    },
    indications: ['Síndrome do trato iliotibial', 'Valgo dinâmico.'],
    contraindications: ['Dor aguda no quadril.'],
  },

  // Mobilidade Geral
  {
    id: 'ex_mg_1',
    name: 'Rotação Torácica (Quadrupede)',
    description: 'Melhora a mobilidade rotacional da coluna torácica.',
    category: 'Mobilidade Geral',
    bodyParts: ['Coluna Torácica'],
    difficulty: 2,
    equipment: ['Mat'],
    instructions: [
      'Comece na posição de quatro apoios.',
      'Coloque uma mão na nuca.',
      'Gire o tronco, levando o cotovelo em direção ao teto.',
      'Retorne e tente tocar o cotovelo no braço de apoio.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Rotação+Torácica',
    },
    indications: ['Rigidez torácica', 'Dor no ombro relacionada à mobilidade.'],
    contraindications: ['Dor lombar aguda com rotação.'],
  },
  {
    id: 'ex_mg_2',
    name: 'Alongamento do Piriforme (Deitado)',
    description:
      'Alivia a tensão no músculo piriforme, que pode causar dor ciática.',
    category: 'Mobilidade Geral',
    bodyParts: ['Quadril', 'Glúteos'],
    difficulty: 1,
    equipment: ['Mat'],
    instructions: [
      'Deite-se de costas com os joelhos dobrados.',
      'Cruze o tornozelo de um lado sobre o joelho oposto.',
      'Puxe a coxa da perna de apoio em direção ao peito até sentir o alongamento no glúteo.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Alongamento+Piriforme',
    },
    indications: ['Síndrome do piriforme', 'Lombociatalgia.'],
    contraindications: ['Lesão aguda no quadril.'],
  },
  {
    id: 'ex_mg_3',
    name: 'Mobilidade de Tornozelo na Parede',
    description:
      'Aumenta a dorsiflexão, importante para agachamentos e marcha.',
    category: 'Mobilidade Geral',
    bodyParts: ['Tornozelo'],
    difficulty: 1,
    equipment: [],
    instructions: [
      'Fique de frente para uma parede em posição de afundo.',
      'Mantendo o calcanhar da perna da frente no chão, incline-se para frente até o joelho tocar a parede.',
      'Afaste-se gradualmente da parede para aumentar o desafio.',
    ],
    media: {
      thumbnailUrl:
        'https://via.placeholder.com/480x360.png/E2E8F0/64748B?text=Mobilidade+Tornozelo',
    },
    indications: [
      'Limitação de dorsiflexão',
      'Prevenção de lesões no agachamento.',
    ],
    contraindications: ['Dor anterior no tornozelo (impacto).'],
  },
];

export const mockExercises: Exercise[] = [
  {
    id: 'ex1',
    name: 'Prancha Abdominal',
    description: 'Exercício isométrico para fortalecimento do core.',
    category: 'Tronco',
    bodyParts: ['Core', 'Abdômen', 'Coluna Lombar'],
    difficulty: 3,
    equipment: ['Mat'],
    instructions: [
      'Deite-se de bruços no chão.',
      'Apoie-se nos antebraços e pontas dos pés.',
      'Mantenha o corpo alinhado.',
      'Contraia o abdômen durante todo o exercício.',
    ],
    media: {
      thumbnailUrl:
        'https://images.pexels.com/photos/8437530/pexels-photo-8437530.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      videoUrl:
        'https://videos.pexels.com/video-files/8437530/8437530-hd_1920_1080_30fps.mp4',
      duration: 28,
    },
    modifications: {
      easier: 'Apoiar os joelhos no chão.',
      harder: 'Levantar uma perna alternadamente.',
    },
    contraindications: ['Hérnia discal aguda', 'Lesão no punho'],
  },
  {
    id: 'ex2',
    name: 'Agachamento com Peso Corporal',
    description:
      'Exercício fundamental para fortalecimento de membros inferiores.',
    category: 'Membros Inferiores',
    bodyParts: ['Quadríceps', 'Glúteos', 'Isquiotibiais'],
    difficulty: 2,
    equipment: [],
    instructions: [
      'Fique em pé com os pés na largura dos ombros.',
      'Mantenha as costas retas e o peito aberto.',
      'Agache como se fosse sentar em uma cadeira, até que as coxas fiquem paralelas ao chão.',
      'Retorne à posição inicial, contraindo os glúteos.',
    ],
    media: {
      thumbnailUrl:
        'https://images.pexels.com/photos/6456272/pexels-photo-6456272.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      videoUrl:
        'https://videos.pexels.com/video-files/6456272/6456272-hd_1920_1080_25fps.mp4',
      duration: 25,
    },
    modifications: {
      easier: 'Agachar até uma altura menor ou usar um apoio.',
      harder:
        'Adicionar um salto no final do movimento (agachamento com salto).',
    },
  },
  {
    id: 'ex3',
    name: 'Alongamento Gato-Camelo',
    description: 'Exercício de mobilidade para a coluna vertebral.',
    category: 'Mobilidade Geral',
    bodyParts: ['Coluna Torácica', 'Coluna Lombar'],
    difficulty: 1,
    equipment: ['Mat'],
    instructions: [
      'Fique na posição de quatro apoios (mãos e joelhos no chão).',
      'Inspire enquanto arqueia as costas para baixo, olhando para cima (posição da vaca).',
      'Expire enquanto arredonda as costas para cima, olhando para o umbigo (posição do gato).',
      'Alterne entre as duas posições de forma lenta e controlada.',
    ],
    media: {
      thumbnailUrl:
        'https://images.pexels.com/photos/7592470/pexels-photo-7592470.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
      videoUrl:
        'https://videos.pexels.com/video-files/7592470/7592470-hd_1920_1080_25fps.mp4',
      duration: 40,
    },
  },
  ...expandedExercises,
];

export const mockGroups: Group[] = [
  {
    id: 'group1',
    name: 'Pilates Clínico - Manhã',
    description:
      'Grupo focado em fortalecimento do core e melhora da postura para pacientes com lombalgia crônica.',
    therapistId: 'therapist_2', // Dra. Camila
    capacity: { max: 6, current: 4 },
    members: [
      {
        patientId: '1',
        patientName: 'Ana Beatriz Costa',
        joinDate: '2024-06-01',
        status: 'active',
        level: 'intermediate',
        avatarUrl: mockPatients[0].avatarUrl,
        points: 1250,
      },
      {
        patientId: '3',
        patientName: 'Carla Dias',
        joinDate: '2024-06-05',
        status: 'active',
        level: 'beginner',
        avatarUrl: mockPatients[2].avatarUrl,
        points: 980,
      },
      {
        patientId: '4',
        patientName: 'Daniel Almeida',
        joinDate: '2024-06-10',
        status: 'active',
        level: 'beginner',
        avatarUrl: mockPatients[3].avatarUrl,
        points: 1500,
      },
      {
        patientId: '2',
        patientName: 'Bruno Gomes',
        joinDate: '2024-06-01',
        status: 'active',
        level: 'intermediate',
        avatarUrl: mockPatients[1].avatarUrl,
        points: 1100,
      },
    ],
    schedule: {
      days: ['Terça', 'Quinta'],
      time: '08:00',
      duration: 50,
    },
    exercises: [
      { exerciseId: 'ex1', order: 1 },
      { exerciseId: 'ex3', order: 2 },
    ],
    status: 'active',
  },
  {
    id: 'group2',
    name: 'Reabilitação de Joelho - Tarde',
    description:
      'Grupo para pacientes em fase intermediária de reabilitação pós-lesão de joelho.',
    therapistId: 'therapist_1', // Dr. Roberto
    capacity: { max: 8, current: 5 },
    members: [],
    schedule: {
      days: ['Segunda', 'Quarta', 'Sexta'],
      time: '16:00',
      duration: 60,
    },
    exercises: [{ exerciseId: 'ex2', order: 1 }],
    status: 'active',
  },
];

export const mockDocuments: Document[] = [
  {
    id: 'doc1',
    patientId: '1',
    name: 'Atestado de Comparecimento',
    type: 'Atestado',
    issueDate: '2024-07-03',
    url: '#',
  },
  {
    id: 'doc2',
    patientId: '1',
    name: 'Recibo - Sessão Julho',
    type: 'Recibo',
    issueDate: '2024-07-03',
    url: '#',
  },
  {
    id: 'doc3',
    patientId: '1',
    name: 'Exame de RM Joelho Direito',
    type: 'Exame',
    issueDate: '2024-06-25',
    url: '#',
  },
];

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);

export const mockProjects: Project[] = [
  {
    id: 'proj_1',
    title: 'Reabilitação Complexa - Ana Costa',
    description:
      'Plano de reabilitação multifásico para P.O. de joelho e ombro.',
    status: ProjectStatus.Active,
    patientId: '1',
    type: 'Clinical',
    startDate: '2024-07-01',
  },
  {
    id: 'proj_2',
    title: 'Melhorias Internas Q3',
    description:
      'Projeto para implementar novo software de agendamento e treinar a equipe.',
    status: ProjectStatus.Active,
    type: 'Operational',
    startDate: '2024-07-15',
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task1',
    projectId: 'proj_1',
    title: 'Preparar laudo da Ana Costa',
    description: 'Revisar notas SOAP e exames de imagem para o laudo final.',
    status: TaskStatus.ToDo,
    priority: TaskPriority.High,
    dueDate: tomorrow.toISOString().split('T')[0],
    assignedUserId: 'therapist_1',
    actorUserId: 'therapist_2',
  },
  {
    id: 'task2',
    projectId: 'proj_2',
    title: 'Ligar para fornecedor do software',
    description: 'Verificar status da implantação e agendar treinamento.',
    status: TaskStatus.ToDo,
    priority: TaskPriority.Medium,
    dueDate: tomorrow.toISOString().split('T')[0],
    assignedUserId: 'therapist_3',
    actorUserId: 'therapist_1',
  },
  {
    id: 'task3',
    projectId: 'proj_1',
    title: 'Pesquisar novo protocolo para fascite plantar',
    description:
      'Buscar evidências recentes sobre terapia por ondas de choque.',
    status: TaskStatus.InProgress,
    priority: TaskPriority.Low,
    dueDate: nextWeek.toISOString().split('T')[0],
    assignedUserId: 'therapist_2',
    actorUserId: 'therapist_2',
  },
  {
    id: 'task4',
    projectId: 'proj_2',
    title: 'Finalizar relatório mensal',
    description: 'Compilar dados de faturamento e atendimentos do mês.',
    status: TaskStatus.InProgress,
    priority: TaskPriority.High,
    dueDate: tomorrow.toISOString().split('T')[0],
    assignedUserId: 'therapist_1',
    actorUserId: 'therapist_1',
  },
  {
    id: 'task5',
    projectId: 'proj_1',
    title: 'Revisar HEP de Bruno Gomes',
    description: 'Verificar progressão dos exercícios e ajustar cargas.',
    status: TaskStatus.Done,
    priority: TaskPriority.Medium,
    dueDate: new Date().toISOString().split('T')[0],
    assignedUserId: 'therapist_2',
    actorUserId: 'therapist_1',
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif1',
    userId: 'user_1',
    message:
      'Dra. Camila atribuiu a tarefa "Revisar HEP de Bruno Gomes" a você.',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    type: 'task_assigned',
  },
  {
    id: 'notif2',
    userId: 'user_1',
    message:
      'Comunicado: A reunião de equipe foi reagendada para sexta-feira às 10h.',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    type: 'announcement',
  },
  {
    id: 'notif3',
    userId: 'user_1',
    message: 'Lembrete: Consulta com Ana Beatriz Costa em 1 hora.',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    type: 'appointment_reminder',
  },
  {
    id: 'notif4',
    userId: 'therapist_2',
    message:
      'Você atribuiu a tarefa "Ligar para Carla Dias" para Dr. Fernando.',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    type: 'task_assigned',
  },
];

// --- Partnership System Mock Data ---
export const sampleVoucherPlans: VoucherPlan[] = [
  {
    id: 'plan_starter',
    name: 'Plano Foco',
    description: 'Ideal para iniciar um acompanhamento pontual e focado.',
    price: 250.0,
    durationDays: 30,
    credits: 4,
    features: ['4 treinos online/mês', 'Acesso ao App', 'Suporte via chat'],
  },
  {
    id: 'plan_performance',
    name: 'Plano Performance',
    description: 'Acompanhamento completo para quem busca máxima performance.',
    price: 450.0,
    durationDays: 30,
    credits: 8,
    features: [
      '8 treinos online/mês',
      'Acesso ao App',
      'Suporte prioritário via chat',
      '1 videochamada de 30min',
    ],
    popular: true,
  },
  {
    id: 'plan_premium',
    name: 'Plano Premium',
    description: 'Acompanhamento premium e totalmente personalizado.',
    price: 700.0,
    durationDays: 30,
    credits: 12,
    features: [
      '12 treinos online/mês',
      'Acesso ilimitado ao App',
      'Contato direto via WhatsApp',
      '2 videochamadas de 30min',
    ],
  },
];

export const mockPurchasedVouchers: Voucher[] = [
  {
    id: 'voucher_1',
    code: 'VF-ABC123',
    patientId: '5', // Fernando Oliveira
    plan: sampleVoucherPlans[1], // Performance
    status: 'activated',
    purchaseDate: new Date(new Date().setDate(new Date().getDate() - 5)), // 5 days ago in current month
    activationDate: new Date(new Date().setDate(new Date().getDate() - 5)),
    expiryDate: new Date(new Date().setDate(new Date().getDate() + 25)),
    remainingCredits: 7,
  },
  {
    id: 'voucher_2',
    code: 'VF-DEF456',
    patientId: '6', // Lúcia Martins
    plan: sampleVoucherPlans[0], // Foco
    status: 'activated',
    purchaseDate: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 days ago in current month
    activationDate: new Date(new Date().setDate(new Date().getDate() - 2)),
    expiryDate: new Date(new Date().setDate(new Date().getDate() + 28)),
    remainingCredits: 3,
  },
  {
    id: 'voucher_3',
    code: 'VF-GHI789',
    patientId: '8', // Júlia Pereira
    plan: sampleVoucherPlans[2], // Premium
    status: 'activated',
    purchaseDate: new Date(new Date().setMonth(new Date().getMonth() - 1)), // last month
    activationDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    expiryDate: new Date(),
    remainingCredits: 10,
  },
];

export const mockGamificationProgress = {
  patientId: '1',
  exerciseLogs: [
    new Date('2024-07-28T10:00:00Z'),
    new Date('2024-07-27T10:00:00Z'),
    new Date('2024-07-26T10:00:00Z'),
    new Date('2024-07-24T10:00:00Z'), // Streak broken here
  ],
  treatmentProgress: 0.6, // 60% of sessions completed
};

export const mockAchievements: Omit<Achievement, 'unlocked'>[] = [
  {
    id: 'streak_7',
    name: 'Em Chamas!',
    description: 'Mantenha uma sequência de 7 dias de atividades.',
    icon: Flame,
  },
  {
    id: 'sessions_10',
    name: 'Veterano de Sessões',
    description: 'Complete 10 sessões de fisioterapia.',
    icon: Medal,
  },
  {
    id: 'pain_log_1',
    name: 'Primeiro Passo',
    description: 'Faça seu primeiro registro no Diário de Dor.',
    icon: Star,
  },
  {
    id: 'first_week',
    name: 'Semana de Ouro',
    description: 'Complete todos os exercícios da primeira semana.',
    icon: CalendarCheck,
  },
  {
    id: 'level_5',
    name: 'Guerreiro da Fisio',
    description: 'Alcance o nível 5 de engajamento.',
    icon: Shield,
  },
  {
    id: 'perfect_month',
    name: 'Mês Perfeito',
    description: 'Mantenha uma sequência de 30 dias de atividades.',
    icon: Trophy,
  },
];

export const mockMedicalReports: MedicalReport[] = [
  {
    id: 1,
    patientId: '1',
    therapistId: 'user_1',
    title: 'Relatório de Progresso - Joelho D',
    content:
      'Paciente apresenta melhora significativa na ADM de flexão do joelho direito...',
    aiGeneratedContent: 'Paciente demonstra progresso notável...',
    status: 'finalized',
    recipientDoctor: 'Dr. Carlos Andrade',
    recipientCrm: 'CRM/SP 123456',
    generatedAt: new Date('2024-07-15T10:00:00Z'),
    finalizedAt: new Date('2024-07-15T11:30:00Z'),
  },
  {
    id: 2,
    patientId: '1',
    therapistId: 'user_1',
    title: 'Relatório para Ortopedista',
    content: 'Encaminho paciente para avaliação ortopédica...',
    aiGeneratedContent: 'Encaminho paciente para avaliação...',
    status: 'draft',
    recipientDoctor: 'Dra. Elisa Borges',
    recipientCrm: 'CRM/SP 654321',
    generatedAt: new Date('2024-08-01T14:00:00Z'),
  },
];

export const mockExpenses: FinancialTransaction[] = [
  {
    id: 'exp1',
    type: TransactionType.Despesa,
    date: new Date(new Date().setDate(1)),
    description: 'Aluguel do Consultório',
    amount: 3500,
    category: ExpenseCategory.Aluguel,
  },
  {
    id: 'exp2',
    type: TransactionType.Despesa,
    date: new Date(new Date().setDate(5)),
    description: 'Salários e Encargos',
    amount: 8500,
    category: ExpenseCategory.Salarios,
  },
  {
    id: 'exp3',
    type: TransactionType.Despesa,
    date: new Date(new Date().setDate(10)),
    description: 'Conta de Energia Elétrica',
    amount: 450.75,
    category: ExpenseCategory.Outros,
  },
  {
    id: 'exp4',
    type: TransactionType.Despesa,
    date: new Date(new Date().setDate(15)),
    description: 'Compra de Faixas Elásticas e Bolas',
    amount: 320.5,
    category: ExpenseCategory.Suprimentos,
  },
];

export const mockInterns: Intern[] = [
  {
    id: 'intern_1',
    name: 'Lucas Mendes',
    institution: 'Universidade Federal de SP',
    startDate: '2024-02-01',
    status: InternStatus.Active,
    avatarUrl: 'https://i.pravatar.cc/150?u=intern_1',
    averageGrade: 8.5,
  },
  {
    id: 'intern_2',
    name: 'Mariana Almeida',
    institution: 'USP',
    startDate: '2024-03-15',
    status: InternStatus.Active,
    avatarUrl: 'https://i.pravatar.cc/150?u=intern_2',
    averageGrade: 9.2,
  },
  {
    id: 'intern_3',
    name: 'Pedro Carvalho',
    institution: 'UNINOVE',
    startDate: '2023-11-01',
    status: InternStatus.Inactive,
    avatarUrl: 'https://i.pravatar.cc/150?u=intern_3',
    averageGrade: 7.8,
  },
];

export const mockEducationalCases: EducationalCase[] = [
  {
    id: 'case_1',
    title: 'P.O. de LCA em atleta de vôlei',
    description:
      'Paciente de 22 anos, atleta amador de vôlei, 3 meses de P.O. de reconstrução de LCA. Apresenta...',
    area: 'Esportiva',
    createdBy: 'Dr. Roberto',
    createdAt: '2024-06-10',
    content:
      '### Histórico\nPaciente J.P., 22 anos, masculino, atleta amador de vôlei, sofreu entorse de joelho direito durante partida. Exames de imagem confirmaram ruptura total do Ligamento Cruzado Anterior (LCA).\n\n### Avaliação Pós-operatória (3 meses)\n- ADM: 0-125° (Déficit de 5° de extensão)\n- Força de Quadríceps: Grau 4 (D/E)\n- Edema: Leve, peripatelar\n- Testes: Lachman positivo, Gaveta Anterior positivo.\n\n### Plano de Tratamento\n- Foco em ganho de ADM final\n- Fortalecimento em cadeia cinética fechada e aberta\n- Início de treino de propriocepção e pliometria leve.',
  },
  {
    id: 'case_2',
    title: 'Hérnia de disco lombar L4-L5',
    description:
      'Paciente de 45 anos, motorista, com dor ciática irradiada para membro inferior esquerdo.',
    area: 'Ortopedia',
    createdBy: 'Dra. Camila',
    createdAt: '2024-05-22',
    content:
      '### Histórico\nPaciente M.S., 45 anos, masculino, motorista, refere dor lombar que iniciou há 2 meses, com irradiação para a face posterior da coxa e perna esquerda. Piora ao ficar sentado por longos períodos.\n\n### Avaliação\n- Postura: Retificação da lordose lombar\n- Testes: Lasègue positivo a 40° à E, Teste de Slump positivo.\n- Sensibilidade: Hipoestesia em dermátomo de L5.\n\n### Plano de Tratamento\n- Exercícios de McKenzie para centralização da dor\n- Mobilização neural do ciático\n- Ativação do CORE (transverso do abdômen e multífidos)\n- Orientações de ergonomia para dirigir.',
  },
  {
    id: 'case_3',
    title: 'AVC Isquêmico com Hemiparesia à D',
    description:
      'Paciente de 68 anos, aposentada, 6 meses pós-AVC com sequelas motoras em hemicorpo direito.',
    area: 'Neurologia',
    createdBy: 'Dr. Fernando',
    createdAt: '2024-07-01',
    content:
      '### Histórico\nPaciente A.L., 68 anos, feminina, destra, aposentada, sofreu Acidente Vascular Cerebral Isquêmico em território de Artéria Cerebral Média E há 6 meses. Histórico de Hipertensão Arterial Sistêmica.\n\n### Avaliação Funcional\n- Marcha: Hemiperética, com uso de bengala de 1 ponto.\n- Tônus: Espasticidade grau 2 na escala de Ashworth Modificada para flexores de punho e dedos D.\n- Força Muscular: Força grau 3 para principais grupos musculares de MSD, e grau 4- para MI D.\n\n### Plano de Tratamento\n- Terapia de Contenção Induzida para MSD.\n- Treino de marcha em esteira com suporte parcial de peso.\n- FNP (Facilitação Neuromuscular Proprioceptiva) para melhora do controle motor.',
  },
];

// --- Inventory Mock Data ---

export const mockInventoryCategories: InventoryCategory[] = [
  {
    id: 'cat-fisio',
    name: 'Fisioterapia',
    color: '#3b82f6',
    icon: 'HeartPulse',
  },
  {
    id: 'cat-higiene',
    name: 'Higiene e Limpeza',
    color: '#10b981',
    icon: 'Sparkles',
  },
  {
    id: 'cat-escritorio',
    name: 'Escritório',
    color: '#6366f1',
    icon: 'FileText',
  },
];

export const mockSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'FisioSupply Brasil',
    contactPerson: 'Carlos Mendes',
    phone: '(11) 5555-1020',
  },
  {
    id: 'sup-2',
    name: 'Medical Express',
    contactPerson: 'Ana Pereira',
    email: 'vendas@medicalexpress.com',
  },
];

const getDateInFuture = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const mockInventoryItems: InventoryItem[] = [
  {
    id: 'item-1',
    name: 'Faixa Elástica (Média)',
    categoryId: 'cat-fisio',
    supplierId: 'sup-1',
    currentStock: 4,
    minStock: 5,
    maxStock: 20,
    unit: 'unidade',
    unitCost: 15.5,
    status: ItemStatus.Active,
    location: 'Armário A1',
  },
  {
    id: 'item-2',
    name: 'Eletrodos Autoadesivos (5x5cm)',
    categoryId: 'cat-fisio',
    supplierId: 'sup-2',
    currentStock: 12,
    minStock: 10,
    maxStock: 50,
    unit: 'pacote c/ 4',
    unitCost: 25.0,
    status: ItemStatus.Active,
    location: 'Sala TENS',
    expiryDate: getDateInFuture(25), // Expiring soon
  },
  {
    id: 'item-3',
    name: 'Gel de Contato (100ml)',
    categoryId: 'cat-fisio',
    supplierId: 'sup-2',
    currentStock: 8,
    minStock: 3,
    maxStock: 15,
    unit: 'frasco',
    unitCost: 8.75,
    status: ItemStatus.Active,
    location: 'Sala Ultrassom',
    expiryDate: getDateInFuture(-5), // Expired
  },
  {
    id: 'item-4',
    name: 'Papel Toalha',
    categoryId: 'cat-higiene',
    currentStock: 15,
    minStock: 5,
    maxStock: 30,
    unit: 'rolo',
    unitCost: 2.5,
    status: ItemStatus.Active,
    location: 'Depósito',
  },
  {
    id: 'item-5',
    name: 'Resma de Papel A4',
    categoryId: 'cat-escritorio',
    currentStock: 3,
    minStock: 2,
    maxStock: 10,
    unit: 'resma',
    unitCost: 22.0,
    status: ItemStatus.Active,
    location: 'Recepção',
  },
];

export const mockStockMovements: StockMovement[] = [
  {
    id: 'mov-1',
    itemId: 'item-1',
    movementType: MovementType.Out,
    quantity: 1,
    userId: 'user_1',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    reason: 'Uso com paciente',
    patientId: '1',
  },
  {
    id: 'mov-2',
    itemId: 'item-2',
    movementType: MovementType.Out,
    quantity: 1,
    userId: 'user_1',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    reason: 'Uso com paciente',
    patientId: '2',
  },
  {
    id: 'mov-3',
    itemId: 'item-4',
    movementType: MovementType.In,
    quantity: 10,
    userId: 'user_admin',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    reason: 'Recebimento de pedido',
  },
];

// --- Event Management Mock Data ---

export const mockEventProviders: EventProvider[] = [
  {
    id: 'prov1_ev1',
    eventId: 'event_1',
    name: 'Carlos Lima',
    phone: '(11) 98888-1111',
    professionalId: 'CREFITO 54321',
    status: EventProviderStatus.confirmed,
    applicationDate: new Date('2024-09-01'),
  },
  {
    id: 'prov2_ev1',
    eventId: 'event_1',
    name: 'Fernanda Souza',
    phone: '(11) 98888-2222',
    professionalId: 'CREFITO 67890',
    status: EventProviderStatus.paid,
    applicationDate: new Date('2024-09-02'),
  },
  {
    id: 'prov3_ev3',
    eventId: 'event_3',
    name: 'Dr. Roberto',
    phone: '(11) 91234-5678',
    professionalId: 'CREFITO 12345',
    status: EventProviderStatus.applied,
    applicationDate: new Date(),
  },
  {
    id: 'prov4_ev3',
    eventId: 'event_3',
    name: 'Dra. Camila',
    phone: '(11) 98765-4321',
    professionalId: 'CREFITO 24680',
    status: EventProviderStatus.applied,
    applicationDate: new Date(),
  },
];

export const mockEventRegistrations: EventRegistration[] = [
  {
    id: 'reg1_ev1',
    eventId: 'event_1',
    fullName: 'Ana Beatriz Costa',
    email: 'ana.costa@example.com',
    phone: '(11) 98765-4321',
    status: EventRegistrationStatus.attended,
    registrationDate: new Date('2024-09-05'),
    qrCode: 'qr_reg1_ev1',
    checkedInAt: new Date('2024-10-20T08:15:00Z'),
    checkedInBy: 'user_1',
  },
  {
    id: 'reg2_ev1',
    eventId: 'event_1',
    fullName: 'Bruno Gomes',
    email: 'bruno.gomes@example.com',
    phone: '(21) 99876-5432',
    status: EventRegistrationStatus.confirmed,
    registrationDate: new Date('2024-09-06'),
    qrCode: 'qr_reg2_ev1',
  },
  {
    id: 'reg3_ev1',
    eventId: 'event_1',
    fullName: 'Carla Dias',
    email: 'carla.dias@example.com',
    phone: '(31) 98765-1234',
    status: EventRegistrationStatus.attended,
    registrationDate: new Date('2024-09-07'),
    qrCode: 'qr_reg3_ev1',
    checkedInAt: new Date('2024-10-20T08:30:00Z'),
    checkedInBy: 'user_admin',
  },
  {
    id: 'reg1_ev2',
    eventId: 'event_2',
    fullName: 'Daniel Almeida',
    email: 'daniel.almeida@example.com',
    phone: '(51) 99123-4567',
    status: EventRegistrationStatus.confirmed,
    registrationDate: new Date('2024-10-01'),
    qrCode: 'qr_reg1_ev2',
  },
];

export const mockEvents: Event[] = [
  {
    id: 'event_1',
    name: 'Corrida FisioFlow 5K - Etapa Ibirapuera',
    description:
      'Participe da nossa corrida de rua com suporte fisioterapêutico completo, incluindo aquecimento, acompanhamento e recovery pós-prova.',
    eventType: EventType.Corrida,
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)), // Past event
    endDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    location: 'Parque Ibirapuera, São Paulo',
    address: 'Av. Pedro Álvares Cabral - Vila Mariana, São Paulo - SP',
    capacity: 200,
    isFree: false,
    price: 79.9,
    status: EventStatus.Completed,
    organizerId: 'user_admin',
    requiresRegistration: true,
    allowsProviders: true,
    providerRate: 150.0,
    bannerUrl:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1470',
    registrations: mockEventRegistrations.filter(r => r.eventId === 'event_1'),
    providers: mockEventProviders.filter(p => p.eventId === 'event_1'),
  },
  {
    id: 'event_2',
    name: 'Workshop: Prevenção de Lesões para Corredores',
    description:
      'Um workshop teórico e prático com nossos melhores especialistas sobre como prevenir as lesões mais comuns na corrida.',
    eventType: EventType.Workshop,
    startDate: new Date(new Date().setDate(new Date().getDate() + 15)), // Future event
    endDate: new Date(new Date().setDate(new Date().getDate() + 15)),
    location: 'Clínica FisioFlow - Unidade Central',
    capacity: 30,
    isFree: true,
    status: EventStatus.Published,
    organizerId: 'user_1',
    requiresRegistration: true,
    allowsProviders: false,
    bannerUrl:
      'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1469',
    registrations: mockEventRegistrations.filter(r => r.eventId === 'event_2'),
    providers: [],
  },
  {
    id: 'event_3',
    name: 'Campanha de Saúde Postural',
    description:
      'Avaliações posturais gratuitas e orientação para trabalhadores de escritório. Parceria com a Empresa XYZ.',
    eventType: EventType.Campanha,
    startDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Future event
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    location: 'Sede da Empresa XYZ',
    status: EventStatus.Active,
    organizerId: 'user_1',
    isFree: true,
    requiresRegistration: false,
    allowsProviders: true,
    providerRate: 500.0, // Daily rate
    bannerUrl:
      'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?q=80&w=1326',
    registrations: [],
    providers: mockEventProviders.filter(p => p.eventId === 'event_3'),
  },
];
