
import React from 'react';

// --- User & Auth Types ---

export enum Role {
  Admin = 'Admin',
  Therapist = 'Fisioterapeuta',
  Patient = 'Paciente',
  EducadorFisico = 'EducadorFisico',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
  patientId?: string;
}

export interface Therapist {
  id:string;
  name: string;
  color: string; // e.g., 'teal', 'sky', 'indigo'
  avatarUrl: string;
}

// --- Patient Related Types ---

export interface Surgery {
  name: string;
  date: string; // YYYY-MM-DD
}

export interface Condition {
  name: string;
  date: string; // YYYY-MM-DD
}

export interface TrackedMetric {
  id: string;
  name: string;
  unit: string;
  isActive: boolean;
}

export interface MetricResult {
  metricId: string;
  value: number;
}

export interface PatientAttachment {
    name: string;
    url: string;
    type: string;
    size: number;
}

export interface CommunicationLog {
  id: string;
  date: string; // ISO String
  type: 'WhatsApp' | 'Ligação' | 'Email' | 'Outro';
  notes: string;
  actor: string; // who made the contact, e.g., 'Dr. Roberto'
}

export interface PainPoint {
  id: string;
  x: number; // percentage
  y: number; // percentage
  intensity: number; // 0-10
  type: 'latejante' | 'aguda' | 'queimação' | 'formigamento' | 'cansaço';
  description: string;
  date: string; // ISO String
  bodyPart: 'front' | 'back';
}

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  emergencyContact: {
    name: string;
    phone:string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  status: 'Active' | 'Inactive' | 'Discharged';
  lastVisit: string;
  registrationDate: string;
  avatarUrl: string;
  consentGiven: boolean;
  whatsappConsent: 'opt-in' | 'opt-out';
  allergies?: string;
  medicalAlerts?: string;
  surgeries?: Surgery[];
  conditions?: Condition[];
  attachments?: PatientAttachment[];
  trackedMetrics?: TrackedMetric[];
  communicationLogs?: CommunicationLog[];
  painPoints?: PainPoint[];
}

export type AlertType = 'abandonment' | 'highRisk' | 'attention';

export interface AlertPatient extends Patient {
    alertReason: string;
    alertType: AlertType;
}

export interface PatientSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Discharged';
  lastVisit: string;
  avatarUrl: string;
  medicalAlerts?: string;
  cpf?: string;
}

// --- Appointment & Scheduling Types ---

export enum AppointmentStatus {
  Scheduled = 'Agendado',
  Completed = 'Realizado',
  Canceled = 'Cancelado',
  NoShow = 'Faltou'
}

export enum AppointmentType {
    Evaluation = 'Avaliação',
    Session = 'Sessão',
    Return = 'Retorno',
    Pilates = 'Pilates',
    Urgent = 'Urgente',
    Teleconsulta = 'Teleconsulta',
}

export const AppointmentTypeColors: Record<string, string> = {
    [AppointmentType.Evaluation]: 'purple',
    [AppointmentType.Session]: 'emerald',
    [AppointmentType.Return]: 'blue',
    [AppointmentType.Pilates]: 'amber',
    [AppointmentType.Urgent]: 'red',
    [AppointmentType.Teleconsulta]: 'cyan',
};


export interface RecurrenceRule {
    frequency: 'weekly';
    days: number[]; // 0=Sun, 1=Mon, ...
    until: string; // YYYY-MM-DD
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatarUrl: string; // Added for easier access
  therapistId: string;
  startTime: Date;
  endTime: Date;
  title: string;
  type: AppointmentType;
  status: AppointmentStatus;
  value: number;
  paymentStatus: 'paid' | 'pending';
  observations?: string;
  seriesId?: string;
  recurrenceRule?: RecurrenceRule;
  sessionNumber?: number;
  totalSessions?: number;
}

export interface EnrichedAppointment extends Appointment {
    therapistColor: string;
    typeColor: string;
    patientPhone: string;
    patientMedicalAlerts?: string;
}

export interface AvailabilityBlock {
  id: string;
  therapistId: string;
  startTime: Date;
  endTime: Date;
  title: string; // e.g., 'Almoço', 'Férias'
}

export interface AppointmentHeatmapData {
    day: string;
    '8h': number; '9h': number; '10h': number; '11h': number;
    '12h': number; '13h': number; '14h': number; '15h': number;
    '16h': number; '17h': number; '18h': number; '19h': number;
}

// --- Scheduling Settings Types ---

export interface TimeSlotLimit {
  id: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  limit: number;
}

export interface DayLimits {
  weekday: TimeSlotLimit[];
  saturday: TimeSlotLimit[];
}

export interface SchedulingSettings {
  limits: DayLimits;
  maxEvaluationsPerSlot: number;
  teleconsultaEnabled: boolean;
}


// --- Clinical & Documentation Types ---

export interface SoapNote {
  id: string;
  patientId: string;
  date: string;
  therapist: string;
  sessionNumber?: number;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  bodyParts?: string[];
  painScale?: number;
  attachments?: { name: string; url: string; }[];
  metricResults?: MetricResult[];
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  coffitoDiagnosisCodes: string;
  treatmentGoals: string;
  frequencyPerWeek: number;
  durationWeeks: number;
  modalities: string[];
  outcomeMeasures: string[];
  createdByCrefito: string;
  exercises?: ExercisePrescription[];
}

export interface ExercisePrescription {
    id: string;
    treatmentPlanId: string;
    exerciseName: string;
    sets: number;
    repetitions: string; // Can be "15" or "30s"
    resistanceLevel: string;
    progressionCriteria: string;
    demonstrationVideoUrl?: string;
}

export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: Date;
  ipAddress: string;
}

export interface Protocol {
  id: string;
  name: string;
  description: string;
}

export interface ProtocolRecommendation {
  id: string;
  patientId: string;
  protocolId: string;
  reason: string; // e.g., "Based on diagnosis: Gonalgia D"
  status: 'suggested' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface LibraryExercise {
  id: string;
  name: string;
  duration: string;
  videoUrl: string;
}

export interface ExerciseCategory {
  id: string;
  name: string;
  exercises: LibraryExercise[];
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  bodyParts: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  equipment: string[];
  instructions: string[];
  media: {
    videoUrl?: string;
    thumbnailUrl: string;
    duration?: number; // duration in seconds
  };
  indications?: string[];
  contraindications?: string[];
  modifications?: {
    easier?: string;
    harder?: string;
  };
  status?: 'approved' | 'pending_approval';
  authorId?: string;
}

export interface ClinicalMaterialData {
  nome_material: string;
  tipo_material: 'Escala de Avaliação' | 'Protocolo Clínico' | 'Material de Orientação';
}

export interface MedicalReport {
  id: number;
  patientId: string;
  therapistId: string;
  title: string;
  content: string;
  aiGeneratedContent: string;
  status: 'draft' | 'finalized' | 'sent';
  recipientDoctor?: string;
  recipientCrm?: string;
  generatedAt: Date;
  finalizedAt?: Date;
}


// --- Group & Gamification Types ---

export interface GroupMember {
  patientId: string;
  patientName: string;
  joinDate: string;
  status: 'active' | 'paused';
  level: 'beginner' | 'intermediate' | 'advanced';
  points?: number;
  avatarUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  therapistId: string;
  capacity: {
    max: number;
    current: number;
  };
  members: GroupMember[];
  schedule: {
    days: string[]; // e.g., ["monday", "wednesday", "friday"]
    time: string; // e.g., "08:00"
    duration: number; // in minutes
  };
  exercises: {
    exerciseId: string;
    order: number;
  }[];
  status: 'active' | 'paused' | 'completed';
  gamification?: {
    totalPoints: number;
    level: number;
    badges: string[];
    challenges: {
      id: string;
      title: string;
      description: string;
      progress: number; // 0-100
    }[];
  };
  metrics?: {
    averageAdherence: number;
    averageSatisfaction: number;
    cohesionScore: number;
    progressRate: number;
  };
}

// --- Task & Project Management Types ---

export enum ProjectStatus {
  Active = 'Ativo',
  Concluded = 'Concluído',
  Paused = 'Pausado',
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  patientId?: string; // Optional link to a patient for clinical projects
  type: 'Clinical' | 'Research' | 'Operational';
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export enum TaskStatus {
  ToDo = 'A Fazer',
  InProgress = 'Em Andamento',
  Done = 'Concluído',
}

export enum TaskPriority {
  High = 'Alta',
  Medium = 'Média',
  Low = 'Baixa',
}

export interface Task {
  id: string;
  projectId: string; // Link to a project
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  assignedUserId: string;
  actorUserId: string; // Who created/assigned it
}

// --- Patient Portal Types ---

export interface Document {
  id: string;
  patientId: string;
  name: string;
  type: 'Atestado' | 'Recibo' | 'Exame';
  issueDate: string;
  url: string;
}

export interface ExerciseEvaluation {
  id: string;
  patientId: string;
  exerciseId: string;
  exerciseName: string;
  date: Date;
  rating: 'easy' | 'medium' | 'hard';
  painLevel: number;
  comments?: string;
}

export type Achievement = {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: React.ElementType;
};

export interface GamificationProgress {
    points: number;
    level: number;
    xpForNextLevel: number;
    streak: number;
    achievements: Achievement[];
}

// --- UI & General Types ---

export interface StatCardData {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  type: 'task_assigned' | 'announcement' | 'appointment_reminder' | 'exercise_reminder';
}

export interface RecentActivity {
  id: string;
  type: 'pain_point' | 'exercise_feedback' | 'new_message';
  patientId: string;
  patientName: string;
  patientAvatarUrl: string;
  summary: string;
  timestamp: Date;
}

// --- Clinical Library Types ---

export interface Material {
  id: string;
  name: string;
}

export interface MaterialCategory {
  id: string;
  name: string;
  materials: Material[];
}

// --- Specialty Assessment Types ---

export interface Specialty {
  id: string;
  name: string;
  imageUrl: string;
}

// --- Financial & Partnership Types ---

export enum TransactionType {
  Receita = 'Receita',
  Despesa = 'Despesa',
}

export enum ExpenseCategory {
  Aluguel = 'Aluguel',
  Salarios = 'Salários',
  Marketing = 'Marketing',
  Suprimentos = 'Suprimentos',
  Equipamentos = 'Equipamentos',
  Impostos = 'Impostos',
  Outros = 'Outros',
}

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  date: Date;
  description: string;
  amount: number;
  category: ExpenseCategory | AppointmentType;
  patientName?: string;
  appointmentId?: string;
}

export interface VoucherPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  credits: number; // e.g., number of sessions
  features: string[];
  popular?: boolean;
}

export interface Voucher {
  id: string;
  code: string;
  patientId: string;
  plan: VoucherPlan;
  status: 'activated' | 'expired' | 'cancelled';
  purchaseDate: Date;
  activationDate: Date;
  expiryDate: Date;
  remainingCredits: number;
}

export interface PartnershipClient {
    patient: Patient;
    voucher: Voucher;
}

export interface Partner {
  id: string;
  userId: string; // Links to a User with role=EducadorFisico, etc.
  name: string;
  avatarUrl: string;
  type: 'Educador Físico' | 'Nutricionista';
  professionalId: string; // CREF, CRN, etc.
  commissionRate: number; // Percentage, e.g., 70 for 70%
  bankDetails: {
    bank: string;
    agency: string;
    account: string;
    pixKey: string;
  };
}

export interface FinancialSummary {
  grossRevenue: number;
  platformFee: number;
  taxAmount: number;
  netRevenue: number;
  period: string;
}

export interface CommissionBreakdown {
    grossAmount: number;
    platformFee: number;
    taxAmount: number;
    netAmount: number;
}

export interface Transaction {
  id: string;
  type: 'voucher_purchase';
  patientName: string;
  planName: string;
  status: 'completed';
  breakdown: CommissionBreakdown;
  createdAt: Date;
}

// --- AI System Types ---

export enum AIProvider {
    CACHE = 'Cache',
    INTERNAL_KB = 'Base de Conhecimento',
    GEMINI = 'Google Gemini Pro',
    CHATGPT = 'ChatGPT Plus',
    CLAUDE = 'Claude Pro',
    PERPLEXITY = 'Perplexity Pro',
    MARS = 'Mars AI Pro',
}

export interface AIResponse {
  content: string;
  source: AIProvider;
}

export interface AIQueryLog {
    id: number;
    prompt: string;
    content: string;
    source: AIProvider;
    timestamp: Date;
}


export interface KnowledgeBaseEntry {
  id: string;
  type: 'protocol' | 'technique' | 'exercise' | 'case';
  title: string;
  content: string;
  tags: string[];
}

// --- WhatsApp Integration Types ---

export interface WhatsappMessage {
    id: string;
    patientId: string;
    patientName: string;
    phone: string;
    type: 'confirmation' | 'reminder' | 'hep' | 'chat';
    content: string;
    status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    createdAt: Date;
}

// --- Mentorship & Teaching Module Types ---

export enum InternStatus {
  Active = 'Ativo',
  Inactive = 'Inativo',
}

export interface Intern {
  id: string;
  name: string;
  institution: string;
  startDate: string; // YYYY-MM-DD
  status: InternStatus;
  avatarUrl: string;
  averageGrade?: number;
}

export interface EducationalCase {
  id: string;
  title: string;
  description: string;
  area: 'Ortopedia' | 'Neurologia' | 'Esportiva' | 'Gerontologia';
  createdBy: string; // Therapist name
  createdAt: string; // YYYY-MM-DD
  content: string; // Markdown content
}

// --- Inventory & Supplies Types ---

export interface InventoryCategory {
  id: string;
  name: string;
  color: string;
  icon: string; // Icon name from lucide-react
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export enum ItemStatus {
  Active = 'Ativo',
  OutOfStock = 'Sem Estoque',
  Discontinued = 'Descontinuado',
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  supplierId?: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  unitCost?: number;
  status: ItemStatus;
  location?: string;
  expiryDate?: string; // YYYY-MM-DD
}

export enum MovementType {
  In = 'Entrada',
  Out = 'Saída',
}

export interface StockMovement {
  id: string;
  itemId: string;
  movementType: MovementType;
  quantity: number;
  userId: string;
  reason?: string;
  patientId?: string;
  createdAt: string; // ISO String
}

export enum InventoryAlertType {
    LowStock = 'Estoque Baixo',
    OutOfStock = 'Sem Estoque',
    Expiring = 'Vencimento Próximo',
    Expired = 'Vencido',
}

export interface InventoryAlert {
    id: string;
    type: InventoryAlertType;
    itemId: string;
    itemName: string;
    message: string;
    severity: 'high' | 'critical';
    createdAt: string; // ISO String
}

export interface InventoryMetrics {
    totalItems: number;
    lowStockItems: number;
    expiringSoon: number;
    totalValue: number;
    criticalAlerts: InventoryAlert[];
}

// --- Event Management Types ---

export enum EventType {
  Corrida = 'Corrida de Rua',
  Workshop = 'Workshop',
  Palestra = 'Palestra',
  Campanha = 'Campanha de Saúde',
  Atendimento = 'Atendimento Externo'
}

export enum EventStatus {
  Draft = 'Rascunho',
  Published = 'Publicado',
  Active = 'Ativo',
  Completed = 'Concluído',
  Cancelled = 'Cancelado'
}

export enum RegistrationStatus {
  Pending = 'Pendente',
  Confirmed = 'Confirmado',
  Attended = 'Compareceu',
  Cancelled = 'Cancelado'
}

export enum ProviderStatus {
  Applied = 'Inscrito',
  Confirmed = 'Confirmado',
  Paid = 'Pago',
  Cancelled = 'Cancelado'
}

export interface Event {
  id: string;
  name: string;
  description: string;
  eventType: EventType;
  startDate: Date;
  endDate: Date;
  location: string;
  address?: string;
  capacity?: number;
  isFree: boolean;
  price?: number;
  status: EventStatus;
  organizerId: string; // User ID
  requiresRegistration: boolean;
  allowsProviders: boolean;
  providerRate?: number;
  bannerUrl?: string;
  registrations: EventRegistration[];
  providers: EventProvider[];
}

export interface EventRegistration {
  id: string;
  eventId: string;
  fullName: string;
  email: string;
  phone: string;
  cpf?: string;
  status: RegistrationStatus;
  registrationDate: Date;
  qrCode: string;
  checkedInAt?: Date;
  checkedInBy?: string; // User ID
}

export interface EventProvider {
  id: string;
  eventId: string;
  name: string;
  phone: string;
  professionalId?: string; // CREFITO, etc.
  pixKey?: string;
  status: ProviderStatus;
  applicationDate: Date;
}
