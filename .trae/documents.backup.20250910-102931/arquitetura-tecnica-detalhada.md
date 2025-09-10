# Arquitetura Técnica Detalhada - FisioFlow

## 1. Visão Geral da Arquitetura

### 1.1 Arquitetura Atual vs. Proposta

```mermaid
graph TD
    A[Cliente Web] --> B[Next.js Frontend]
    B --> C[Next.js API Routes]
    C --> D[Prisma ORM]
    D --> E[PostgreSQL - Neon]
    C --> F[MCP Service]
    F --> G[Gemini API]
    F --> H[Claude API]
    F --> I[OpenAI API]
    C --> J[Redis Cache]
    C --> K[File Storage]

    subgraph "Frontend Layer"
        B
    end

    subgraph "API Layer"
        C
        F
    end

    subgraph "Data Layer"
        D
        E
        J
    end

    subgraph "External Services"
        G
        H
        I
        K
    end
```

### 1.2 Tecnologias e Versões

| Tecnologia   | Versão | Propósito                   |
| ------------ | ------ | --------------------------- |
| Next.js      | 14.x   | Framework React com SSR/SSG |
| React        | 18.x   | Biblioteca de UI            |
| TypeScript   | 5.x    | Tipagem estática            |
| Prisma       | 5.x    | ORM e migrations            |
| PostgreSQL   | 15.x   | Banco de dados principal    |
| Redis        | 7.x    | Cache e sessões             |
| Tailwind CSS | 3.x    | Framework CSS               |
| NextAuth.js  | 4.x    | Autenticação                |
| Zod          | 3.x    | Validação de schemas        |

## 2. Arquitetura de Dados

### 2.1 Schema Completo do Banco de Dados

```sql
-- Extensões PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE equipment_status AS ENUM ('available', 'in_use', 'maintenance', 'out_of_order');
CREATE TYPE user_role AS ENUM ('admin', 'therapist', 'receptionist', 'patient');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');

-- Tabelas principais
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'patient',
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cpf VARCHAR(14) UNIQUE,
    birth_date DATE,
    gender VARCHAR(10),
    address JSONB,
    emergency_contact JSONB,
    insurance_info JSONB,
    medical_history TEXT,
    allergies TEXT[],
    medications TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE therapists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crefito VARCHAR(20) UNIQUE NOT NULL,
    specialties TEXT[],
    working_hours JSONB, -- {"monday": {"start": "08:00", "end": "18:00"}}
    consultation_duration INTEGER DEFAULT 60, -- minutos
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    capacity INTEGER DEFAULT 1,
    equipment_ids UUID[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'ultrassom', 'tens', 'esteira', etc.
    model VARCHAR(100),
    serial_number VARCHAR(100),
    status equipment_status DEFAULT 'available',
    room_id UUID REFERENCES rooms(id),
    maintenance_schedule JSONB,
    last_maintenance DATE,
    next_maintenance DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    therapist_id UUID NOT NULL REFERENCES therapists(id),
    room_id UUID REFERENCES rooms(id),
    equipment_ids UUID[],
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status appointment_status DEFAULT 'scheduled',
    type VARCHAR(50) NOT NULL, -- 'consultation', 'session', 'evaluation'
    notes TEXT,
    price DECIMAL(10,2),
    insurance_covered BOOLEAN DEFAULT false,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE waiting_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    therapist_id UUID REFERENCES therapists(id),
    preferred_date DATE,
    preferred_time_start TIME,
    preferred_time_end TIME,
    priority INTEGER DEFAULT 1, -- 1=baixa, 5=alta
    notes TEXT,
    position INTEGER,
    estimated_wait_time INTEGER, -- minutos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notified_at TIMESTAMP WITH TIME ZONE
);

-- Prontuário e Avaliações
CREATE TABLE physio_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    therapist_id UUID NOT NULL REFERENCES therapists(id),
    appointment_id UUID REFERENCES appointments(id),
    chief_complaint TEXT NOT NULL,
    pain_scale INTEGER CHECK (pain_scale >= 0 AND pain_scale <= 10),
    pain_location JSONB, -- mapa corporal
    postural_images TEXT[], -- URLs das imagens
    range_of_motion JSONB, -- dados de amplitude
    muscle_strength JSONB, -- força muscular por grupo
    functional_tests JSONB, -- testes funcionais
    special_tests JSONB, -- testes especiais
    diagnosis TEXT,
    icd_codes TEXT[],
    treatment_goals TEXT[],
    treatment_plan JSONB,
    prognosis TEXT,
    ai_analysis JSONB, -- análise da IA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE treatment_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES physio_assessments(id),
    appointment_id UUID NOT NULL REFERENCES appointments(id),
    session_number INTEGER NOT NULL,
    techniques_used TEXT[],
    exercises_performed JSONB,
    equipment_used UUID[],
    pain_before INTEGER CHECK (pain_before >= 0 AND pain_before <= 10),
    pain_after INTEGER CHECK (pain_after >= 0 AND pain_after <= 10),
    patient_response TEXT,
    therapist_notes TEXT,
    homework_exercises JSONB,
    next_session_plan TEXT,
    session_duration INTEGER, -- minutos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE exercise_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'strengthening', 'stretching', 'mobility'
    body_part VARCHAR(100), -- 'shoulder', 'knee', 'spine'
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    instructions TEXT,
    video_url TEXT,
    image_urls TEXT[],
    contraindications TEXT[],
    equipment_needed TEXT[],
    repetitions_default INTEGER,
    sets_default INTEGER,
    hold_time_default INTEGER, -- segundos
    created_by UUID REFERENCES therapists(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sistema Financeiro
CREATE TABLE financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'checking', 'savings', 'credit_card'
    balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES financial_accounts(id),
    patient_id UUID REFERENCES patients(id),
    appointment_id UUID REFERENCES appointments(id),
    type VARCHAR(50) NOT NULL, -- 'income', 'expense'
    category VARCHAR(100), -- 'consultation', 'equipment', 'salary'
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    payment_method VARCHAR(50), -- 'cash', 'card', 'pix', 'insurance'
    status payment_status DEFAULT 'pending',
    due_date DATE,
    paid_date DATE,
    invoice_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE insurance_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    provider VARCHAR(200),
    code VARCHAR(50),
    coverage_percentage DECIMAL(5,2), -- 0-100
    session_limit INTEGER,
    annual_limit DECIMAL(10,2),
    copay_amount DECIMAL(10,2),
    requires_authorization BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Estoque
CREATE TABLE inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES inventory_categories(id)
);

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE,
    category_id UUID REFERENCES inventory_categories(id),
    description TEXT,
    unit_of_measure VARCHAR(20), -- 'unit', 'ml', 'g'
    cost_price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    current_stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER,
    expiration_date DATE,
    supplier_info JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment'
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reason VARCHAR(100), -- 'purchase', 'usage', 'waste', 'adjustment'
    reference_id UUID, -- appointment_id ou purchase_order_id
    notes TEXT,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auditoria e Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_therapist_id ON appointments(therapist_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_patients_cpf ON patients(cpf);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(created_at);
CREATE INDEX idx_inventory_items_code ON inventory_items(code);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapists_updated_at BEFORE UPDATE ON therapists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 Schema Prisma Atualizado

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  THERAPIST
  RECEPTIONIST
  PATIENT
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum EquipmentStatus {
  AVAILABLE
  IN_USE
  MAINTENANCE
  OUT_OF_ORDER
}

enum PaymentStatus {
  PENDING
  PAID
  OVERDUE
  CANCELLED
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String?
  name          String
  role          UserRole @default(PATIENT)
  phone         String?
  avatarUrl     String?
  isActive      Boolean  @default(true)
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relacionamentos
  patient   Patient?
  therapist Therapist?
  auditLogs AuditLog[]

  @@map("users")
}

model Patient {
  id              String   @id @default(cuid())
  userId          String   @unique
  cpf             String?  @unique
  birthDate       DateTime?
  gender          String?
  address         Json?
  emergencyContact Json?
  insuranceInfo   Json?
  medicalHistory  String?
  allergies       String[]
  medications     String[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relacionamentos
  user                User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  appointments        Appointment[]
  physioAssessments   PhysioAssessment[]
  waitingQueue        WaitingQueue[]
  financialTransactions FinancialTransaction[]

  @@map("patients")
}

model Therapist {
  id                   String   @id @default(cuid())
  userId               String   @unique
  crefito              String   @unique
  specialties          String[]
  workingHours         Json?
  consultationDuration Int      @default(60)
  isAvailable          Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  // Relacionamentos
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  appointments      Appointment[]
  physioAssessments PhysioAssessment[]
  waitingQueue      WaitingQueue[]
  exercisesCreated  Exercise[]

  @@map("therapists")
}

model Room {
  id          String   @id @default(cuid())
  name        String
  capacity    Int      @default(1)
  equipmentIds String[]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  // Relacionamentos
  appointments Appointment[]
  equipment    Equipment[]

  @@map("rooms")
}

model Equipment {
  id                  String          @id @default(cuid())
  name                String
  type                String
  model               String?
  serialNumber        String?
  status              EquipmentStatus @default(AVAILABLE)
  roomId              String?
  maintenanceSchedule Json?
  lastMaintenance     DateTime?
  nextMaintenance     DateTime?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  // Relacionamentos
  room Room? @relation(fields: [roomId], references: [id])

  @@map("equipment")
}

model Appointment {
  id                String            @id @default(cuid())
  patientId         String
  therapistId       String
  roomId            String?
  equipmentIds      String[]
  startTime         DateTime
  endTime           DateTime
  status            AppointmentStatus @default(SCHEDULED)
  type              String
  notes             String?
  price             Decimal?
  insuranceCovered  Boolean           @default(false)
  checkInTime       DateTime?
  checkOutTime      DateTime?
  confirmationSentAt DateTime?
  reminderSentAt    DateTime?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  // Relacionamentos
  patient           Patient            @relation(fields: [patientId], references: [id])
  therapist         Therapist          @relation(fields: [therapistId], references: [id])
  room              Room?              @relation(fields: [roomId], references: [id])
  physioAssessment  PhysioAssessment?
  treatmentSessions TreatmentSession[]
  financialTransactions FinancialTransaction[]

  @@map("appointments")
}

model WaitingQueue {
  id                  String    @id @default(cuid())
  patientId           String
  therapistId         String?
  preferredDate       DateTime?
  preferredTimeStart  String?
  preferredTimeEnd    String?
  priority            Int       @default(1)
  notes               String?
  position            Int?
  estimatedWaitTime   Int?
  createdAt           DateTime  @default(now())
  notifiedAt          DateTime?

  // Relacionamentos
  patient   Patient    @relation(fields: [patientId], references: [id])
  therapist Therapist? @relation(fields: [therapistId], references: [id])

  @@map("waiting_queue")
}

model PhysioAssessment {
  id              String   @id @default(cuid())
  patientId       String
  therapistId     String
  appointmentId   String?  @unique
  chiefComplaint  String
  painScale       Int?
  painLocation    Json?
  posturalImages  String[]
  rangeOfMotion   Json?
  muscleStrength  Json?
  functionalTests Json?
  specialTests    Json?
  diagnosis       String?
  icdCodes        String[]
  treatmentGoals  String[]
  treatmentPlan   Json?
  prognosis       String?
  aiAnalysis      Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relacionamentos
  patient           Patient            @relation(fields: [patientId], references: [id])
  therapist         Therapist          @relation(fields: [therapistId], references: [id])
  appointment       Appointment?       @relation(fields: [appointmentId], references: [id])
  treatmentSessions TreatmentSession[]

  @@map("physio_assessments")
}

model TreatmentSession {
  id                  String   @id @default(cuid())
  assessmentId        String
  appointmentId       String
  sessionNumber       Int
  techniquesUsed      String[]
  exercisesPerformed  Json?
  equipmentUsed       String[]
  painBefore          Int?
  painAfter           Int?
  patientResponse     String?
  therapistNotes      String?
  homeworkExercises   Json?
  nextSessionPlan     String?
  sessionDuration     Int?
  createdAt           DateTime @default(now())

  // Relacionamentos
  assessment  PhysioAssessment @relation(fields: [assessmentId], references: [id])
  appointment Appointment      @relation(fields: [appointmentId], references: [id])

  @@map("treatment_sessions")
}

model Exercise {
  id                  String   @id @default(cuid())
  name                String
  description         String?
  category            String?
  bodyPart            String?
  difficultyLevel     Int?
  instructions        String?
  videoUrl            String?
  imageUrls           String[]
  contraindications   String[]
  equipmentNeeded     String[]
  repetitionsDefault  Int?
  setsDefault         Int?
  holdTimeDefault     Int?
  createdBy           String?
  isPublic            Boolean  @default(false)
  createdAt           DateTime @default(now())

  // Relacionamentos
  creator Therapist? @relation(fields: [createdBy], references: [id])

  @@map("exercise_library")
}

model FinancialAccount {
  id        String   @id @default(cuid())
  name      String
  type      String
  balance   Decimal  @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  // Relacionamentos
  transactions FinancialTransaction[]

  @@map("financial_accounts")
}

model FinancialTransaction {
  id            String        @id @default(cuid())
  accountId     String
  patientId     String?
  appointmentId String?
  type          String
  category      String?
  amount        Decimal
  description   String?
  paymentMethod String?
  status        PaymentStatus @default(PENDING)
  dueDate       DateTime?
  paidDate      DateTime?
  invoiceNumber String?
  notes         String?
  createdAt     DateTime      @default(now())

  // Relacionamentos
  account     FinancialAccount @relation(fields: [accountId], references: [id])
  patient     Patient?         @relation(fields: [patientId], references: [id])
  appointment Appointment?     @relation(fields: [appointmentId], references: [id])

  @@map("financial_transactions")
}

model InventoryCategory {
  id          String @id @default(cuid())
  name        String
  description String?
  parentId    String?

  // Relacionamentos
  parent   InventoryCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children InventoryCategory[] @relation("CategoryHierarchy")
  items    InventoryItem[]

  @@map("inventory_categories")
}

model InventoryItem {
  id             String    @id @default(cuid())
  name           String
  code           String?   @unique
  categoryId     String?
  description    String?
  unitOfMeasure  String?
  costPrice      Decimal?
  salePrice      Decimal?
  currentStock   Int       @default(0)
  minStock       Int       @default(0)
  maxStock       Int?
  expirationDate DateTime?
  supplierInfo   Json?
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // Relacionamentos
  category  InventoryCategory?  @relation(fields: [categoryId], references: [id])
  movements InventoryMovement[]

  @@map("inventory_items")
}

model InventoryMovement {
  id          String   @id @default(cuid())
  itemId      String
  type        String
  quantity    Int
  unitCost    Decimal?
  totalCost   Decimal?
  reason      String?
  referenceId String?
  notes       String?
  performedBy String?
  createdAt   DateTime @default(now())

  // Relacionamentos
  item InventoryItem @relation(fields: [itemId], references: [id])
  user User?         @relation(fields: [performedBy], references: [id])

  @@map("inventory_movements")
}

model AuditLog {
  id           String   @id @default(cuid())
  userId       String?
  action       String
  resourceType String?
  resourceId   String?
  oldValues    Json?
  newValues    Json?
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())

  // Relacionamentos
  user User? @relation(fields: [userId], references: [id])

  @@map("audit_logs")
}
```

## 3. Arquitetura de Serviços

### 3.1 Estrutura de Serviços

```typescript
// services/base/BaseService.ts
export abstract class BaseService {
  protected prisma: PrismaClient;
  protected redis: Redis;
  protected logger: Logger;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL!);
    this.logger = new Logger(this.constructor.name);
  }

  protected async withTransaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(fn);
  }

  protected async cache<T>(key: string, fn: () => Promise<T>, ttl: number = 3600): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await fn();
    await this.redis.setex(key, ttl, JSON.stringify(result));
    return result;
  }
}

// services/scheduling/SchedulingService.ts
export class SchedulingService extends BaseService {
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    return await this.withTransaction(async tx => {
      // Verificar disponibilidade
      const conflicts = await this.checkConflicts(data, tx);
      if (conflicts.length > 0) {
        throw new ConflictError('Horário não disponível');
      }

      // Criar agendamento
      const appointment = await tx.appointment.create({
        data: {
          ...data,
          status: 'SCHEDULED',
        },
        include: {
          patient: true,
          therapist: true,
          room: true,
        },
      });

      // Enviar confirmação
      await this.sendConfirmation(appointment);

      // Invalidar cache
      await this.invalidateScheduleCache(data.therapistId, data.startTime);

      return appointment;
    });
  }

  async getOptimalSlots(criteria: SlotCriteria): Promise<TimeSlot[]> {
    const cacheKey = `optimal-slots:${JSON.stringify(criteria)}`;

    return await this.cache(
      cacheKey,
      async () => {
        const algorithm = new SchedulingAlgorithm();
        return await algorithm.findOptimalSlots(criteria);
      },
      1800
    ); // 30 minutos
  }

  private async checkConflicts(
    data: CreateAppointmentData,
    tx: PrismaClient
  ): Promise<Appointment[]> {
    return await tx.appointment.findMany({
      where: {
        AND: [
          {
            OR: [
              { therapistId: data.therapistId },
              { roomId: data.roomId },
              { equipmentIds: { hasSome: data.equipmentIds } },
            ],
          },
          {
            OR: [
              {
                AND: [{ startTime: { lte: data.startTime } }, { endTime: { gt: data.startTime } }],
              },
              {
                AND: [{ startTime: { lt: data.endTime } }, { endTime: { gte: data.endTime } }],
              },
            ],
          },
          { status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        ],
      },
    });
  }
}

// services/medical/MedicalRecordService.ts
export class MedicalRecordService extends BaseService {
  async createAssessment(data: CreateAssessmentData): Promise<PhysioAssessment> {
    return await this.withTransaction(async tx => {
      const assessment = await tx.physioAssessment.create({
        data,
        include: {
          patient: true,
          therapist: true,
        },
      });

      // Análise com IA
      if (data.posturalImages?.length > 0) {
        const aiAnalysis = await this.analyzePosturalImages(data.posturalImages);
        await tx.physioAssessment.update({
          where: { id: assessment.id },
          data: { aiAnalysis },
        });
      }

      // Auditoria
      await this.logAudit({
        action: 'CREATE_ASSESSMENT',
        resourceId: assessment.id,
        newValues: assessment,
      });

      return assessment;
    });
  }

  private async analyzePosturalImages(imageUrls: string[]): Promise<any> {
    const aiService = new PhysioAIService();
    const analyses = await Promise.all(imageUrls.map(url => aiService.analyzePosturalImage(url)));

    return {
      individualAnalyses: analyses,
      overallAssessment: await aiService.generateOverallAssessment(analyses),
      recommendations: await aiService.generateRecommendations(analyses),
    };
  }
}

// services/ai/PhysioAIService.ts
export class PhysioAIService {
  private mcpService: MCPService;

  constructor() {
    this.mcpService = new MCPService();
  }

  async analyzePosturalImage(imageUrl: string): Promise<PosturalAnalysis> {
    const prompt = `
      Analise esta imagem postural de um paciente de fisioterapia.
      Identifique:
      1. Desvios posturais visíveis
      2. Assimetrias
      3. Pontos de atenção
      4. Possíveis compensações
      5. Recomendações para avaliação
      
      Responda em formato JSON estruturado.
    `;

    const response = await this.mcpService.analyzeImage('gemini', imageUrl, prompt);
    return JSON.parse(response);
  }

  async generateTreatmentPlan(assessment: PhysioAssessment): Promise<TreatmentPlan> {
    const prompt = `
      Baseado na seguinte avaliação fisioterapêutica, gere um plano de tratamento detalhado:
      
      Queixa Principal: ${assessment.chiefComplaint}
      Escala de Dor: ${assessment.painScale}/10
      Diagnóstico: ${assessment.diagnosis}
      Testes Funcionais: ${JSON.stringify(assessment.functionalTests)}
      
      O plano deve incluir:
      1. Objetivos específicos
      2. Técnicas recomendadas
      3. Exercícios terapêuticos
      4. Frequência e duração
      5. Critérios de progressão
      6. Prognóstico
    `;

    const response = await this.mcpService.generateContent('claude', prompt);
    return JSON.parse(response);
  }

  async suggestExercises(condition: string, limitations: string[]): Promise<Exercise[]> {
    const prompt = `
      Sugira exercícios terapêuticos específicos para:
      Condição: ${condition}
      Limitações: ${limitations.join(', ')}
      
      Para cada exercício, inclua:
      1. Nome e descrição
      2. Instruções detalhadas
      3. Repetições e séries
      4. Progressão
      5. Contraindicações
      6. Equipamentos necessários
    `;

    const response = await this.mcpService.generateContent('openai', prompt);
    return JSON.parse(response);
  }
}
```

### 3.2 Algoritmos de Otimização

```typescript
// services/scheduling/SchedulingAlgorithm.ts
export class SchedulingAlgorithm {
  async findOptimalSlots(criteria: SlotCriteria): Promise<TimeSlot[]> {
    const { therapistId, date, duration, equipmentNeeded, patientPreferences } = criteria;

    // Buscar disponibilidade do terapeuta
    const therapistAvailability = await this.getTherapistAvailability(therapistId, date);

    // Buscar disponibilidade de equipamentos
    const equipmentAvailability = equipmentNeeded
      ? await this.getEquipmentAvailability(equipmentNeeded, date)
      : null;

    // Buscar agendamentos existentes
    const existingAppointments = await this.getExistingAppointments(therapistId, date);

    // Calcular slots disponíveis
    const availableSlots = this.calculateAvailableSlots(
      therapistAvailability,
      equipmentAvailability,
      existingAppointments,
      duration
    );

    // Aplicar algoritmo de otimização
    return this.optimizeSlots(availableSlots, patientPreferences);
  }

  private optimizeSlots(slots: TimeSlot[], preferences: PatientPreferences): TimeSlot[] {
    return slots
      .map(slot => ({
        ...slot,
        score: this.calculateSlotScore(slot, preferences),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 melhores opções
  }

  private calculateSlotScore(slot: TimeSlot, preferences: PatientPreferences): number {
    let score = 100;

    // Preferência de horário
    if (preferences.preferredTimes) {
      const timeMatch = preferences.preferredTimes.some(time =>
        this.isTimeInRange(slot.startTime, time.start, time.end)
      );
      score += timeMatch ? 20 : -10;
    }

    // Evitar horários de pico
    if (this.isPeakHour(slot.startTime)) {
      score -= 5;
    }

    // Otimizar intervalos entre consultas
    score += this.calculateIntervalOptimization(slot);

    return score;
  }
}
```

## 4. Componentes React Avançados

### 4.1 Sistema de Agenda

```typescript
// components/scheduling/AdvancedScheduler.tsx
interface AdvancedSchedulerProps {
  viewType: 'day' | 'week' | 'month';
  therapistId?: string;
  roomId?: string;
  equipmentFilter?: string[];
}

export function AdvancedScheduler({
  viewType,
  therapistId,
  roomId,
  equipmentFilter
}: AdvancedSchedulerProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: scheduleData, mutate } = useSWR(
    ['schedule', viewType, therapistId, selectedDate],
    () => fetchScheduleData({ viewType, therapistId, date: selectedDate }),
    { refreshInterval: 30000 } // Atualizar a cada 30 segundos
  );

  const handleAppointmentDrop = useCallback(async (
    appointment: Appointment,
    newStartTime: Date
  ) => {
    setIsLoading(true);
    try {
      await updateAppointmentTime(appointment.id, newStartTime);
      mutate(); // Revalidar dados
      toast.success('Agendamento movido com sucesso');
    } catch (error) {
      toast.error('Erro ao mover agendamento');
    } finally {
      setIsLoading(false);
    }
  }, [mutate]);

  const handleSlotClick = useCallback((slot: TimeSlot) => {
    // Abrir modal de novo agendamento
    openAppointmentModal({
      startTime: slot.startTime,
      therapistId: slot.therapistId,
      roomId: slot.roomId
    });
  }, []);

  return (
    <div className="h-full flex flex-col">
      <SchedulerHeader
        viewType={viewType}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onViewTypeChange={setViewType}
      />

      <div className="flex-1 overflow-hidden">
        {viewType === 'day' && (
          <DayView
            appointments={scheduleData?.appointments || []}
            therapists={scheduleData?.therapists || []}
            rooms={scheduleData?.rooms || []}
            onAppointmentDrop={handleAppointmentDrop}
            onSlotClick={handleSlotClick}
            isLoading={isLoading}
          />
        )}

        {viewType === 'week' && (
          <WeekView
            appointments={scheduleData?.appointments || []}
            therapists={scheduleData?.therapists || []}
            onAppointmentDrop={handleAppointmentDrop}
            onSlotClick={handleSlotClick}
          />
        )}

        {viewType === 'month' && (
          <MonthView
            appointments={scheduleData?.appointments || []}
            onDateClick={(date) => {
              setSelectedDate(date);
              setViewType('day');
            }}
          />
        )}
      </div>

      <WaitingQueueSidebar />
    </div>
  );
}

// components/scheduling/DayView.tsx
interface DayViewProps {
  appointments: Appointment[];
  therapists: Therapist[];
  rooms: Room[];
  onAppointmentDrop: (appointment: Appointment, newTime: Date) => void;
  onSlotClick: (slot: TimeSlot) => void;
  isLoading: boolean;
}

export function DayView({
  appointments,
  therapists,
  rooms,
  onAppointmentDrop,
  onSlotClick,
  isLoading
}: DayViewProps) {
  const timeSlots = useMemo(() =>
    generateTimeSlots(8, 18, 30), // 8h às 18h, slots de 30min
    []
  );

  const appointmentsByTherapist = useMemo(() =>
    groupBy(appointments, 'therapistId'),
    [appointments]
  );

  return (
    <div className="grid grid-cols-[200px_1fr] h-full">
      {/* Coluna de horários */}
      <div className="border-r border-gray-200">
        <div className="h-16 border-b border-gray-200 flex items-center px-4">
          <span className="font-medium text-gray-900">Horários</span>
        </div>
        {timeSlots.map(time => (
          <div key={time} className="h-16 border-b border-gray-100 flex items-center px-4">
            <span className="text-sm text-gray-600">{time}</span>
          </div>
        ))}
      </div>

      {/* Grid de terapeutas */}
      <div className="overflow-x-auto">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${therapists.length}, 1fr)` }}>
          {/* Cabeçalho dos terapeutas */}
          {therapists.map(therapist => (
            <div key={therapist.id} className="h-16 border-b border-gray-200 flex items-center justify-center px-4">
              <div className="text-center">
                <div className="font-medium text-gray-900">{therapist.user.name}</div>
                <div className="text-xs text-gray-500">{therapist.specialties.join(', ')}</div>
              </div>
            </div>
          ))}

          {/* Grid de slots */}
          {timeSlots.map(time =>
            therapists.map(therapist => {
              const appointment = appointmentsByTherapist[therapist.id]?.find(
                apt => format(apt.startTime, 'HH:mm') === time
              );

              return (
                <TimeSlot
                  key={`${therapist.id}-${time}`}
                  time={time}
                  therapist={therapist}
                  appointment={appointment}
                  onDrop={onAppointmentDrop}
                  onClick={() => !appointment && onSlotClick({
                    startTime: parseTime(time),
                    therapistId: therapist.id
                  })}
                  isLoading={isLoading}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
```

### 4.2 Prontuário Inteligente

```typescript
// components/medical/IntelligentMedicalRecord.tsx
interface IntelligentMedicalRecordProps {
  patientId: string;
  appointmentId?: string;
}

export function IntelligentMedicalRecord({
  patientId,
  appointmentId
}: IntelligentMedicalRecordProps) {
  const [activeTab, setActiveTab] = useState<'assessment' | 'sessions' | 'exercises'>('assessment');
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

  const { data: patient } = useSWR(['patient', patientId], () => fetchPatient(patientId));
  const { data: assessments } = useSWR(
    ['assessments', patientId],
    () => fetchAssessments(patientId)
  );

  const handleImageUpload = useCallback(async (files: File[]) => {
    setIsAIAnalyzing(true);
    try {
      const uploadPromises = files.map(file => uploadImage(file));
      const imageUrls = await Promise.all(uploadPromises);

      // Análise com IA
      const analysisPromises = imageUrls.map(url =>
        analyzePosturalImage(url)
      );
      const analyses = await Promise.all(analysisPromises);

      // Gerar sugestões
      const suggestions = await generateAISuggestions(analyses);
      setAiSuggestions(suggestions);

    } catch (error) {
      toast.error('Erro na análise das imagens');
    } finally {
      setIsAIAnalyzing(false);
    }
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('assessment')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assessment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Avaliação
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Sessões
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'exercises'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Exercícios
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'assessment' && (
          <AssessmentTab
            patient={patient}
            assessments={assessments}
            onImageUpload={handleImageUpload}
            isAIAnalyzing={isAIAnalyzing}
            aiSuggestions={aiSuggestions}
          />
        )}

        {activeTab === 'sessions' && (
          <SessionsTab
            patientId={patientId}
            assessments={assessments}
          />
        )}

        {activeTab === 'exercises' && (
          <ExercisesTab
            patientId={patientId}
            aiSuggestions={aiSuggestions}
          />
        )}
      </div>
    </div>
  );
}

// components/medical/PosturalAnalysis.tsx
interface PosturalAnalysisProps {
  images: string[];
  analysis?: PosturalAnalysis;
  onImageUpload: (files: File[]) => void;
  isAnalyzing: boolean;
}

export function PosturalAnalysis({
  images,
  analysis,
  onImageUpload,
  isAnalyzing
}: PosturalAnalysisProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Análise Postural</h3>
        <ImageUploadButton onUpload={onImageUpload} />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Galeria de imagens */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Imagens</h4>
            <div className="grid grid-cols-2 gap-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="relative cursor-pointer group"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image}
                    alt={`Análise postural ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-500"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all" />
                </div>
              ))}
            </div>
          </div>

          {/* Análise da IA */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Análise da IA</h4>
            {isAnalyzing ? (
              <div className="flex items-center space-x-3">
                <Spinner className="w-5 h-5" />
                <span className="text-sm text-gray-600">Analisando imagens...</span>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Desvios Identificados</h5>
                  <ul className="space-y-1">
                    {analysis.deviations.map((deviation, index) => (
                      <li key={index} className="text-sm text-blue-800">
                        • {deviation}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-medium text-green-900 mb-2">Recomendações</h5>
                  <ul className="space-y-1">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-green-800">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h5 className="font-medium text-yellow-900 mb-2">Nível de Severidade</h5>
                  <div className="flex items-center space-x-2">
                    <SeverityIndicator level={analysis.severity} />
                    <span className="text-sm text-yellow-800">
                      {analysis.severity}/5
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Faça upload de imagens para análise automática</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de imagem ampliada */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          annotations={annotations}
          onClose={() => setSelectedImage(null)}
          onAnnotate={setAnnotations}
        />
      )}
    </div>
  );
}
```

## 5. Performance e Otimização

### 5.1 Estratégias de Cache

```typescript
// lib/cache/CacheManager.ts
export class CacheManager {
  private redis: Redis;
  private memoryCache: Map<string, { data: any; expires: number }>;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    this.memoryCache = new Map();
  }

  async get<T>(key: string): Promise<T | null> {
    // Tentar cache em memória primeiro
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult && memoryResult.expires > Date.now()) {
      return memoryResult.data;
    }

    // Tentar Redis
    const redisResult = await this.redis.get(key);
    if (redisResult) {
      const data = JSON.parse(redisResult);
      // Armazenar em memória para próximas consultas
      this.memoryCache.set(key, {
        data,
        expires: Date.now() + 60000, // 1 minuto
      });
      return data;
    }

    return null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    // Armazenar no Redis
    await this.redis.setex(key, ttl, JSON.stringify(value));

    // Armazenar em memória
    this.memoryCache.set(key, {
      data: value,
      expires: Date.now() + Math.min(ttl * 1000, 300000), // Max 5 minutos
    });
  }

  async invalidate(pattern: string): Promise<void> {
    // Invalidar Redis
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    // Invalidar memória
    for (const key of this.memoryCache.keys()) {
      if (key.match(pattern)) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// hooks/useOptimizedQuery.ts
export function useOptimizedQuery<T>(
  key: string | string[],
  fetcher: () => Promise<T>,
  options: {
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
  } = {}
) {
  const cacheKey = Array.isArray(key) ? key.join(':') : key;
  const cacheManager = useMemo(() => new CacheManager(), []);

  return useSWR(
    cacheKey,
    async () => {
      // Tentar cache primeiro
      const cached = await cacheManager.get<T>(cacheKey);
      if (cached) {
        return cached;
      }

      // Buscar dados
      const data = await fetcher();

      // Armazenar no cache
      await cacheManager.set(cacheKey, data, options.cacheTime || 3600);

      return data;
    },
    {
      revalidateOnFocus: options.refetchOnWindowFocus ?? false,
      dedupingInterval: options.staleTime || 60000,
    }
  );
}
```

### 5.2 Otimização de Banco de Dados

```sql
-- Índices compostos para consultas frequentes
CREATE INDEX idx_appointments_therapist_date ON appointments(therapist_id, start_time);
CREATE INDEX idx_appointments_patient_status ON appointments(patient_id, status);
CREATE INDEX idx_physio_assessments_patient_created ON physio_assessments(patient_id, created_at DESC);

-- Índices para busca textual
CREATE INDEX idx_patients_name_gin ON patients USING gin(to_tsvector('portuguese', name));
CREATE INDEX idx_exercise_library_search ON exercise_library USING gin(to_tsvector('portuguese', name || ' ' || description));

-- Particionamento por data para tabelas grandes
CREATE TABLE audit_logs_2024 PARTITION OF audit_logs
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Views materializadas para relatórios
CREATE MATERIALIZED VIEW therapist_performance AS
SELECT
    t.id,
    u.name,
    COUNT(a.id) as total_appointments,
    AVG(ts.pain_after - ts.pain_before) as avg_pain_improvement,
    AVG(EXTRACT(EPOCH FROM (a.end_time - a.start_time))/60) as avg_session_duration,
    COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN a.status = 'NO_SHOW' THEN 1 END) as no_shows
FROM therapists t
JOIN users u ON t.user_id = u.id
LEFT JOIN appointments a ON t.id = a.therapist_id
LEFT JOIN treatment_sessions ts ON a.id = ts.appointment_id
WHERE a.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY t.id, u.name;

CREATE UNIQUE INDEX ON therapist_performance (id);

-- Refresh automático das views materializadas
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY therapist_performance;
END;
$$ LANGUAGE plpgsql;

-- Agendar refresh diário
SELECT cron.schedule('refresh-views', '0 2 * * *', 'SELECT refresh_materialized_views();');
```

## 6. Segurança e Compliance

### 6.1 Autenticação e Autorização

```typescript
// lib/auth/rbac.ts
export enum Permission {
  // Pacientes
  VIEW_PATIENTS = 'view:patients',
  CREATE_PATIENTS = 'create:patients',
  UPDATE_PATIENTS = 'update:patients',
  DELETE_PATIENTS = 'delete:patients',

  // Agendamentos
  VIEW_APPOINTMENTS = 'view:appointments',
  CREATE_APPOINTMENTS = 'create:appointments',
  UPDATE_APPOINTMENTS = 'update:appointments',
  CANCEL_APPOINTMENTS = 'cancel:appointments',

  // Prontuários
  VIEW_MEDICAL_RECORDS = 'view:medical_records',
  CREATE_MEDICAL_RECORDS = 'create:medical_records',
  UPDATE_MEDICAL_RECORDS = 'update:medical_records',

  // Financeiro
  VIEW_FINANCIAL = 'view:financial',
  MANAGE_FINANCIAL = 'manage:financial',

  // Administração
  MANAGE_USERS = 'manage:users',
  VIEW_REPORTS = 'view:reports',
  SYSTEM_CONFIG = 'system:config',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: Object.values(Permission),
  THERAPIST: [
    Permission.VIEW_PATIENTS,
    Permission.UPDATE_PATIENTS,
    Permission.VIEW_APPOINTMENTS,
    Permission.CREATE_APPOINTMENTS,
    Permission.UPDATE_APPOINTMENTS,
    Permission.VIEW_MEDICAL_RECORDS,
    Permission.CREATE_MEDICAL_RECORDS,
    Permission.UPDATE_MEDICAL_RECORDS,
    Permission.VIEW_FINANCIAL,
  ],
  RECEPTIONIST: [
    Permission.VIEW_PATIENTS,
    Permission.CREATE_PATIENTS,
    Permission.UPDATE_PATIENTS,
    Permission.VIEW_APPOINTMENTS,
    Permission.CREATE_APPOINTMENTS,
    Permission.UPDATE_APPOINTMENTS,
    Permission.CANCEL_APPOINTMENTS,
    Permission.VIEW_FINANCIAL,
  ],
  PATIENT: [Permission.VIEW_APPOINTMENTS, Permission.VIEW_MEDICAL_RECORDS],
};

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

export function requirePermission(permission: Permission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const session = await getServerSession();
      if (!session?.user?.role || !hasPermission(session.user.role, permission)) {
        throw new UnauthorizedError('Permissão insuficiente');
      }
      return originalMethod.apply(this, args);
    };
  };
}
```

### 6.2 Criptografia e Proteção de Dados

```typescript
// lib/security/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export class DataEncryption {
  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, KEY);
    cipher.setAAD(Buffer.from('fisioflow', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(ALGORITHM, KEY);
    decipher.setAAD(Buffer.from('fisioflow', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  static hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

// Middleware para criptografia automática de campos sensíveis
export function encryptSensitiveFields(data: any, fields: string[]): any {
  const result = { ...data };

  fields.forEach(field => {
    if (result[field]) {
      result[field] = DataEncryption.encrypt(result[field]);
    }
  });

  return result;
}

export function decryptSensitiveFields(data: any, fields: string[]): any {
  const result = { ...data };

  fields.forEach(field => {
    if (result[field] && typeof result[field] === 'object') {
      result[field] = DataEncryption.decrypt(result[field]);
    }
  });

  return result;
}
```

## 7. Monitoramento e Observabilidade

```typescript
// lib/monitoring/logger.ts
import winston from 'winston';

export class Logger {
  private logger: winston.Logger;

  constructor(service: string) {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    });
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    this.logger.error(message, { error: error?.stack, ...meta });
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }
}

// lib/monitoring/metrics.ts
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, number> = new Map();

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  increment(metric: string, value: number = 1) {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }

  gauge(metric: string, value: number) {
    this.metrics.set(metric, value);
  }

  timing(metric: string, duration: number) {
    this.metrics.set(`${metric}_duration`, duration);
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}

// Middleware para métricas automáticas
export function withMetrics(handler: any) {
  return async (req: any, res: any) => {
    const start = Date.now();
    const metrics = MetricsCollector.getInstance();

    try {
      const result = await handler(req, res);
      metrics.increment('api_requests_total');
      metrics.increment(`api_requests_${req.method.toLowerCase()}`);
      return result;
    } catch (error) {
      metrics.increment('api_errors_total');
      throw error;
    } finally {
      const duration = Date.now() - start;
      metrics.timing('api_request_duration', duration);
    }
  };
}
```

## 8. Testes e Qualidade

```typescript
// tests/utils/testHelpers.ts
export class TestHelpers {
  static async createTestUser(role: UserRole = 'PATIENT'): Promise<User> {
    return await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        role,
        passwordHash: await DataEncryption.hashPassword('password123'),
      },
    });
  }

  static async createTestPatient(userId?: string): Promise<Patient> {
    const user = userId ? { id: userId } : await this.createTestUser('PATIENT');

    return await prisma.patient.create({
      data: {
        userId: user.id,
        cpf: `${Math.random().toString().substr(2, 11)}`,
        birthDate: new Date('1990-01-01'),
        gender: 'M',
      },
    });
  }

  static async createTestAppointment(overrides: Partial<Appointment> = {}): Promise<Appointment> {
    const patient = await this.createTestPatient();
    const therapist = await this.createTestTherapist();

    return await prisma.appointment.create({
      data: {
        patientId: patient.id,
        therapistId: therapist.id,
        startTime: new Date(Date.now() + 86400000), // Tomorrow
        endTime: new Date(Date.now() + 86400000 + 3600000), // Tomorrow + 1 hour
        type: 'consultation',
        status: 'SCHEDULED',
        ...overrides,
      },
    });
  }

  static async cleanupTestData(): Promise<void> {
    await prisma.appointment.deleteMany({
      where: {
        patient: {
          user: {
            email: {
              startsWith: 'test-',
            },
          },
        },
      },
    });

    await prisma.patient.deleteMany({
      where: {
        user: {
          email: {
            startsWith: 'test-',
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-',
        },
      },
    });
  }
}

// tests/services/SchedulingService.test.ts
describe('SchedulingService', () => {
  let schedulingService: SchedulingService;

  beforeEach(async () => {
    schedulingService = new SchedulingService();
    await TestHelpers.cleanupTestData();
  });

  afterEach(async () => {
    await TestHelpers.cleanupTestData();
  });

  describe('createAppointment', () => {
    it('should create appointment successfully', async () => {
      const patient = await TestHelpers.createTestPatient();
      const therapist = await TestHelpers.createTestTherapist();

      const appointmentData = {
        patientId: patient.id,
        therapistId: therapist.id,
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 86400000 + 3600000),
        type: 'consultation',
      };

      const appointment = await schedulingService.createAppointment(appointmentData);

      expect(appointment).toBeDefined();
      expect(appointment.status).toBe('SCHEDULED');
      expect(appointment.patientId).toBe(patient.id);
    });

    it('should throw error for conflicting appointments', async () => {
      const existingAppointment = await TestHelpers.createTestAppointment();

      const conflictingData = {
        patientId: existingAppointment.patientId,
        therapistId: existingAppointment.therapistId,
        startTime: existingAppointment.startTime,
        endTime: existingAppointment.endTime,
        type: 'consultation',
      };

      await expect(schedulingService.createAppointment(conflictingData)).rejects.toThrow(
        'Horário não disponível'
      );
    });
  });
});
```

## 9. Deploy e CI/CD

### 9.1 Pipeline de Deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: fisioflow_test
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type checking
        run: npm run type-check

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fisioflow_test

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fisioflow_test

      - name: Build application
        run: npm run build
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fisioflow_test
          NEXTAUTH_SECRET: test-secret
          NEXTAUTH_URL: http://localhost:3000

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Railway
        run: railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Run database migrations
        run: railway run npx prisma migrate deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Health check
        run: |
          sleep 30
          curl -f ${{ secrets.RAILWAY_URL }}/api/health || exit 1
```

### 9.2 Configuração do Railway

```toml
# railway.toml
[build]
builder = "nixpacks"
watchPatterns = ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]

[deploy]
startCommand = "npm start"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[environments.production]
variables = {
  NODE_ENV = "production",
  PORT = "3000"
}

[environments.staging]
variables = {
  NODE_ENV = "staging",
  PORT = "3000"
}
```

### 9.3 Scripts de Deploy

```json
// package.json (scripts section)
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:integration": "jest --config jest.integration.config.js",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "deploy:staging": "railway up --environment staging",
    "deploy:production": "railway up --environment production",
    "health-check": "tsx scripts/health-check.ts",
    "backup:db": "tsx scripts/backup-database.ts",
    "restore:db": "tsx scripts/restore-database.ts"
  }
}
```

### 9.4 Scripts de Manutenção

```typescript
// scripts/health-check.ts
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);

async function healthCheck() {
  const checks = {
    database: false,
    redis: false,
    api: false,
  };

  try {
    // Verificar conexão com banco
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
    console.log('✅ Database connection: OK');
  } catch (error) {
    console.error('❌ Database connection: FAILED', error);
  }

  try {
    // Verificar Redis
    await redis.ping();
    checks.redis = true;
    console.log('✅ Redis connection: OK');
  } catch (error) {
    console.error('❌ Redis connection: FAILED', error);
  }

  try {
    // Verificar API
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/health`);
    if (response.ok) {
      checks.api = true;
      console.log('✅ API health: OK');
    }
  } catch (error) {
    console.error('❌ API health: FAILED', error);
  }

  const allHealthy = Object.values(checks).every(Boolean);

  if (allHealthy) {
    console.log('🎉 All systems operational');
    process.exit(0);
  } else {
    console.error('💥 Some systems are down');
    process.exit(1);
  }
}

healthCheck();

// scripts/backup-database.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { format } from 'date-fns';

const execAsync = promisify(exec);

async function backupDatabase() {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
  const backupFile = `backup-${timestamp}.sql`;

  try {
    const command = `pg_dump ${process.env.DATABASE_URL} > backups/${backupFile}`;
    await execAsync(command);

    console.log(`✅ Database backup created: ${backupFile}`);

    // Upload para storage (opcional)
    if (process.env.BACKUP_STORAGE_URL) {
      await uploadToStorage(`backups/${backupFile}`);
      console.log(`✅ Backup uploaded to storage`);
    }
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

backupDatabase();
```

## 10. Monitoramento de Produção

### 10.1 Dashboard de Métricas

```typescript
// pages/api/admin/metrics.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { MetricsCollector } from '@/lib/monitoring/metrics';
import { requirePermission } from '@/lib/auth/rbac';

@requirePermission('VIEW_REPORTS')
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const metrics = MetricsCollector.getInstance();
    const systemMetrics = await getSystemMetrics();
    const businessMetrics = await getBusinessMetrics();

    res.json({
      system: systemMetrics,
      business: businessMetrics,
      application: metrics.getMetrics()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
}

async function getSystemMetrics() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    version: process.version
  };
}

async function getBusinessMetrics() {
  const prisma = new PrismaClient();

  const [totalPatients, totalAppointments, todayAppointments] = await Promise.all([
    prisma.patient.count(),
    prisma.appointment.count(),
    prisma.appointment.count({
      where: {
        startTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    })
  ]);

  return {
    totalPatients,
    totalAppointments,
    todayAppointments
  };
}
```

### 10.2 Alertas e Notificações

```typescript
// lib/monitoring/alerts.ts
export class AlertManager {
  private static instance: AlertManager;
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
  }

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  async sendAlert(level: 'info' | 'warning' | 'error', message: string, details?: any) {
    const alert = {
      level,
      message,
      details,
      timestamp: new Date().toISOString(),
      service: 'FisioFlow',
    };

    // Log local
    console.log(`[ALERT:${level.toUpperCase()}] ${message}`, details);

    // Enviar para Slack (se configurado)
    if (this.webhookUrl && level !== 'info') {
      await this.sendSlackNotification(alert);
    }

    // Salvar no banco para histórico
    await this.saveAlertToDatabase(alert);
  }

  private async sendSlackNotification(alert: any) {
    const color =
      {
        warning: '#ffcc00',
        error: '#ff0000',
      }[alert.level] || '#00ff00';

    const payload = {
      attachments: [
        {
          color,
          title: `🚨 ${alert.service} Alert`,
          text: alert.message,
          fields: [
            {
              title: 'Level',
              value: alert.level.toUpperCase(),
              short: true,
            },
            {
              title: 'Timestamp',
              value: alert.timestamp,
              short: true,
            },
          ],
        },
      ],
    };

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }
}
```

## 11. Conclusão

Esta arquitetura técnica detalhada fornece uma base sólida para o desenvolvimento e evolução do
FisioFlow, incorporando:

- **Escalabilidade**: Arquitetura modular que permite crescimento
- **Segurança**: Implementação de RBAC, criptografia e auditoria
- **Performance**: Estratégias de cache e otimização de queries
- **Qualidade**: Testes automatizados e CI/CD
- **Monitoramento**: Observabilidade completa do sistema
- **Manutenibilidade**: Código bem estruturado e documentado

### Próximos Passos

1. **Fase 1**: Implementar funcionalidades básicas (agenda, pacientes, prontuário)
2. **Fase 2**: Adicionar IA e análise de imagens
3. **Fase 3**: Implementar gestão financeira e estoque
4. **Fase 4**: Adicionar funcionalidades avançadas (telemedicina, relatórios)

### Considerações de Implementação

- Implementar funcionalidades de forma incremental
- Manter foco na experiência do usuário
- Realizar testes contínuos com usuários reais
- Monitorar performance e otimizar conforme necessário
- Manter documentação atualizada
