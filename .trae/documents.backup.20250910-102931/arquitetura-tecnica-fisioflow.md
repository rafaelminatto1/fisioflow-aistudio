# Arquitetura Técnica FisioFlow
## Especificações Técnicas para Implementação do Plano Executivo

## 1. Arquitetura Geral do Sistema

```mermaid
graph TD
    A[Cliente Browser] --> B[Cloudflare CDN]
    B --> C[Vercel Edge Network]
    C --> D[Next.js 14 Application]
    D --> E[NextAuth.js]
    D --> F[Neon DB Client]
    F --> G[Neon DB]
    F --> H[NextAuth.js]
    D --> I[Upstash Redis]
    D --> J[Cloudinary API]

    subgraph "Frontend Layer"
        D
        E
    end

    subgraph "Backend Services"
        F
        G
        H
        I
    end

    subgraph "External Services"
        J
    end
```

## 2. Descrição Tecnológica

- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Autenticação**: NextAuth.js 5.0 + Neon DB
- **Database**: Neon DB (PostgreSQL)
- **Cache**: Upstash Redis
- **Storage**: Cloudinary
- **Deploy**: Vercel
- **Monitoramento**: Vercel Analytics + Sentry

## 3. Definições de Rotas

| Rota                      | Propósito                                           |
| ------------------------- | --------------------------------------------------- |
| `/`                       | Página inicial com redirecionamento baseado em auth |
| `/login`                  | Página de autenticação otimizada                    |
| `/dashboard`              | Dashboard principal para terapeutas                 |
| `/pacientes`              | Listagem e gestão de pacientes                      |
| `/pacientes/[id]`         | Detalhes específicos do paciente                    |
| `/agenda`                 | Sistema de agendamento                              |
| `/teleconsulta`           | Interface de teleconsulta                           |
| `/portal`                 | Portal do paciente                                  |
| `/partner`                | Portal do educador físico                           |
| `/api/auth/[...nextauth]` | Endpoints de autenticação                           |
| `/api/pacientes`          | API REST para pacientes                             |
| `/api/appointments`       | API REST para agendamentos                          |

## 4. Definições de API

### 4.1 Autenticação

**POST /api/auth/signin**

Request: | Param | Type | Required | Description | |-------|------|----------|-------------| | email
| string | true | Email do usuário | | password | string | true | Senha do usuário | | csrfToken |
string | true | Token CSRF |

Response: | Param | Type | Description | |-------|------|-------------| | user | User | Dados do
usuário autenticado | | expires | string | Data de expiração da sessão |

Example:

```json
{
  "user": {
    "id": "uuid",
    "name": "Dr. Roberto",
    "email": "roberto@fisioflow.com",
    "role": "Fisioterapeuta"
  },
  "expires": "2024-12-31T23:59:59.999Z"
}
```

### 4.2 Gestão de Pacientes

**GET /api/pacientes**

Query Parameters: | Param | Type | Required | Description |
|-------|------|----------|-------------| | page | number | false | Número da página (default: 1) |
| limit | number | false | Itens por página (default: 10) | | search | string | false | Termo de
busca | | status | string | false | Filtro por status |

Response:

```json
{
  "patients": [
    {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com",
      "status": "Active",
      "lastVisit": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

**POST /api/pacientes**

Request:

```json
{
  "name": "Maria Santos",
  "email": "maria@email.com",
  "phone": "+5511999999999",
  "cpf": "123.456.789-00",
  "birthDate": "1985-03-15",
  "address": {
    "street": "Rua das Flores, 123",
    "city": "São Paulo",
    "state": "SP",
    "zip": "01234-567"
  }
}
```

### 4.3 Sistema de Agendamentos

**GET /api/appointments**

Query Parameters: | Param | Type | Required | Description |
|-------|------|----------|-------------| | startDate | string | true | Data inicial (ISO) | |
endDate | string | true | Data final (ISO) | | therapistId | string | false | ID do terapeuta | |
patientId | string | false | ID do paciente |

**POST /api/appointments**

Request:

```json
{
  "patientId": "uuid",
  "therapistId": "uuid",
  "startTime": "2024-01-20T14:00:00Z",
  "endTime": "2024-01-20T15:00:00Z",
  "type": "Sessão",
  "observations": "Primeira sessão pós-cirurgia"
}
```

## 5. Arquitetura do Servidor

```mermaid
graph TD
    A[Next.js App Router] --> B[Middleware Layer]
    B --> C[API Routes]
    C --> D[Service Layer]
    D --> E[Repository Layer]
    E --> F[(Neon DB)]

    B --> G[Auth Middleware]
    B --> H[Rate Limiting]
    B --> I[CORS Handler]

    D --> J[Cache Service]
    J --> K[(Redis Cache)]

    subgraph "Application Layer"
        A
        B
        C
        I[PWA Service Worker]
        J[React Native App]
    end
    
    subgraph "Business Logic"
        D
        K[Authentication Service]
        L[Patient Service]
        M[Appointment Service]
        N[AI Service]
        O[Analytics Service]
    end

    subgraph "Data Layer"
        F
        G
        H
        P[Backup Storage]
    end
    
    subgraph "External Services"
        Q[Google Gemini AI]
        R[WhatsApp API]
        S[Payment Gateway]
        T[TISS Integration]
    end
```

## 2. Stack Tecnológico Detalhado

### 2.1 Frontend
- **Framework**: Next.js 14 com App Router
- **UI Library**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts + D3.js
- **Mobile**: React Native + Expo
- **PWA**: Workbox + Service Workers

### 2.2 Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Next.js API Routes + Express.js
- **Database ORM**: Prisma ORM
- **Authentication**: NextAuth.js + JWT
- **Validation**: Zod schemas
- **File Upload**: Uploadthing
- **Background Jobs**: Bull Queue + Redis
- **WebSockets**: Socket.io

### 2.3 Database & Storage
- **Primary DB**: Neon PostgreSQL (Serverless)
- **Cache**: Redis (Upstash)
- **File Storage**: AWS S3 / Cloudflare R2
- **Search**: PostgreSQL Full-Text Search
- **Analytics**: ClickHouse (opcional)

### 2.4 DevOps & Infrastructure
- **Hosting**: Vercel (Frontend) + Railway (Backend)
- **CDN**: Cloudflare
- **Monitoring**: Sentry + Vercel Analytics
- **CI/CD**: GitHub Actions
- **Container**: Docker
- **Secrets**: Vercel Environment Variables

## 3. Definições de Rotas

### 3.1 Rotas Frontend
| Rota | Propósito | Componente Principal |
|------|-----------|---------------------|
| `/` | Landing page pública | HomePage |
| `/login` | Autenticação de usuários | LoginPage |
| `/dashboard` | Dashboard principal | DashboardPage |
| `/pacientes` | Gestão de pacientes | PatientsPage |
| `/pacientes/[id]` | Detalhes do paciente | PatientDetailPage |
| `/agenda` | Calendário de consultas | AgendaPage |
| `/teleconsulta` | Videochamadas | TeleconsultaPage |
| `/relatorios` | Relatórios e analytics | ReportsPage |
| `/configuracoes` | Configurações do sistema | SettingsPage |
| `/ia-assistente` | Assistente de IA | AIAssistantPage |
| `/financeiro` | Gestão financeira | FinancialPage |

### 3.2 Rotas Mobile (React Native)
| Rota | Propósito | Screen |
|------|-----------|--------|
| `/` | Splash screen | SplashScreen |
| `/auth` | Login/Register | AuthScreen |
| `/home` | Dashboard mobile | HomeScreen |
| `/patients` | Lista de pacientes | PatientsScreen |
| `/appointments` | Agenda mobile | AppointmentsScreen |
| `/profile` | Perfil do usuário | ProfileScreen |

## 4. APIs e Endpoints

### 4.1 Authentication API
```typescript
// Autenticação e autorização
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET /api/auth/me
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### 4.2 Patients API
```typescript
// Gestão de pacientes
GET /api/patients
POST /api/patients
GET /api/patients/[id]
PUT /api/patients/[id]
DELETE /api/patients/[id]
GET /api/patients/[id]/history
POST /api/patients/[id]/notes
GET /api/patients/search
```

### 4.3 Appointments API
```typescript
// Gestão de consultas
GET /api/appointments
POST /api/appointments
GET /api/appointments/[id]
PUT /api/appointments/[id]
DELETE /api/appointments/[id]
POST /api/appointments/[id]/reschedule
GET /api/appointments/calendar
POST /api/appointments/bulk-create
```

### 4.4 AI Assistant API
```typescript
// Assistente de IA
POST /api/ai/chat
POST /api/ai/diagnosis-assist
POST /api/ai/treatment-plan
POST /api/ai/exercise-recommendation
GET /api/ai/conversation/[id]
POST /api/ai/analyze-movement
```

### 4.5 Analytics API
```typescript
// Analytics e relatórios
GET /api/analytics/dashboard
GET /api/analytics/patients
GET /api/analytics/appointments
GET /api/analytics/financial
GET /api/analytics/performance
POST /api/analytics/custom-report
```

## 5. Arquitetura de Microserviços

```mermaid
graph TD
    A[API Gateway] --> B[Auth Service]
    A --> C[Patient Service]
    A --> D[Appointment Service]
    A --> E[AI Service]
    A --> F[Analytics Service]
    A --> G[Notification Service]
    A --> H[Payment Service]
    
    B --> I[(User DB)]
    C --> J[(Patient DB)]
    D --> K[(Appointment DB)]
    E --> L[Google Gemini]
    F --> M[(Analytics DB)]
    G --> N[WhatsApp API]
    H --> O[Payment Gateway]
    
    subgraph "Core Services"
        B
        C
        D
    end
    
    subgraph "AI & Analytics"
        E
        F
    end
    
    subgraph "External Integrations"
        G
        H
    end
```

## 6. Modelo de Dados Expandido

### 6.1 Diagrama ER Completo
```mermaid
erDiagram
    USER ||--o{ PATIENT : manages
    USER ||--o{ APPOINTMENT : schedules
    PATIENT ||--o{ APPOINTMENT : attends
    PATIENT ||--o{ PAIN_POINT : reports
    PATIENT ||--o{ METRIC_RESULT : tracks
    APPOINTMENT ||--o{ SOAP_NOTE : documents
    USER ||--o{ COMMUNICATION_LOG : creates
    PATIENT ||--o{ COMMUNICATION_LOG : receives


    USER {
        uuid id PK
        string email UK
        string name
        string role
        string specialty
        timestamp created_at
        timestamp updated_at
    }

    PATIENT {
        uuid id PK
        uuid user_id FK
        string name
        date birth_date
        string cpf UK
        string phone
        string address
        json medical_history
        timestamp created_at
        timestamp updated_at
    }

    APPOINTMENT {
        uuid id PK
        uuid patient_id FK
        uuid therapist_id FK
        datetime scheduled_at
        integer duration
        string type
        string status
        decimal price
        json metadata
        timestamp created_at
        timestamp updated_at
    }
    
    MEDICAL_RECORD {
        uuid id PK
        uuid patient_id FK
        string type
        text content
        json attachments
        timestamp created_at
    }
    
    PAIN_POINT {
        uuid id PK
        uuid patient_id FK
        string location
        integer intensity
        text description
        timestamp reported_at
    }
    
    METRIC_RESULT {
        uuid id PK
        uuid patient_id FK
        string metric_name
        float value
        string unit
        timestamp measured_at
    }

    SOAP_NOTE {
        uuid id PK
        uuid appointment_id FK
        text subjective
        text objective
        text assessment
        text plan
        timestamp created_at
    }
    
    COMMUNICATION_LOG {
        uuid id PK
        uuid patient_id FK
        string type
        text message
        string channel
        timestamp sent_at
    }
```

### 6.2 Schemas Prisma Expandidos

```prisma
// Modelo expandido para suporte às novas funcionalidades

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  role          Role      @default(THERAPIST)
  specialty     String?
  avatar        String?
  phone         String?
  crm           String?   @unique
  clinicId      String?
  
  // Relacionamentos
  clinic        Clinic?   @relation(fields: [clinicId], references: [id])
  patients      Patient[]
  appointments  Appointment[]
  aiChats       AiChat[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@map("users")
}

model Patient {
  id              String    @id @default(cuid())
  name            String
  email           String?   @unique
  phone           String
  cpf             String    @unique
  birthDate       DateTime
  gender          Gender
  address         Json?
  emergencyContact Json?
  medicalHistory  Json?
  allergies       String[]
  medications     String[]
  
  // Relacionamentos
  therapistId     String
  therapist       User      @relation(fields: [therapistId], references: [id])
  appointments    Appointment[]
  medicalRecords  MedicalRecord[]
  treatmentPlans  TreatmentPlan[]
  payments        Payment[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("patients")
}

model Appointment {
  id              String    @id @default(cuid())
  patientId       String
  therapistId     String
  scheduledAt     DateTime
  duration        Int       @default(60)
  type            AppointmentType
  status          AppointmentStatus
  price           Decimal?
  notes           String?
  metadata        Json?
  
  // Relacionamentos
  patient         Patient   @relation(fields: [patientId], references: [id])
  therapist       User      @relation(fields: [therapistId], references: [id])
  soapNotes       SoapNote[]
  teleconsulta    Teleconsulta?
  exerciseSessions ExerciseSession[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("appointments")
}

model MedicalRecord {
  id          String    @id @default(cuid())
  patientId   String
  type        RecordType
  title       String
  content     String
  attachments Json?
  
  // Relacionamentos
  patient     Patient   @relation(fields: [patientId], references: [id])
  
  createdAt   DateTime  @default(now())
  
  @@map("medical_records")
}

model TreatmentPlan {
  id              String    @id @default(cuid())
  patientId       String
  diagnosis       String
  objectives      String
  sessionsPlanned Int
  startDate       DateTime
  endDate         DateTime?
  status          PlanStatus
  
  // Relacionamentos
  patient         Patient   @relation(fields: [patientId], references: [id])
  exercises       PlanExercise[]
  goals           Goal[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("treatment_plans")
}

model Exercise {
  id          String    @id @default(cuid())
  name        String
  description String
  videoUrl    String?
  imageUrl    String?
  category    String
  difficulty  Int       @default(1)
  parameters  Json?
  
  // Relacionamentos
  planExercises PlanExercise[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@map("exercises")
}

model PlanExercise {
  id            String    @id @default(cuid())
  planId        String
  exerciseId    String
  sets          Int
  reps          Int
  duration      Int?
  notes         String?
  
  // Relacionamentos
  plan          TreatmentPlan @relation(fields: [planId], references: [id])
  exercise      Exercise  @relation(fields: [exerciseId], references: [id])
  
  @@unique([planId, exerciseId])
  @@map("plan_exercises")
}

model Teleconsulta {
  id            String    @id @default(cuid())
  appointmentId String    @unique
  roomId        String    @unique
  recordingUrl  String?
  participants  Json?
  startedAt     DateTime?
  endedAt       DateTime?
  
  // Relacionamentos
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  
  createdAt     DateTime  @default(now())
  
  @@map("teleconsultas")
}

-- Políticas de acesso
CREATE POLICY "Users can view their own data" ON patients
    FOR SELECT USING (auth.uid()::text = id::text OR
                     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Fisioterapeuta')));

model Payment {
  id            String    @id @default(cuid())
  patientId     String
  appointmentId String?
  amount        Decimal
  method        PaymentMethod
  status        PaymentStatus
  transactionId String?
  metadata      Json?
  
  // Relacionamentos
  patient       Patient   @relation(fields: [patientId], references: [id])
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@map("payments")
}

model Clinic {
  id          String    @id @default(cuid())
  name        String
  cnpj        String    @unique
  address     Json
  phone       String
  email       String
  settings    Json?
  
  // Relacionamentos
  users       User[]
  subscription Subscription?
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@map("clinics")
}

model Subscription {
  id        String    @id @default(cuid())
  clinicId  String    @unique
  plan      PlanType
  price     Decimal
  startDate DateTime
  endDate   DateTime
  status    SubscriptionStatus
  
  // Relacionamentos
  clinic    Clinic    @relation(fields: [clinicId], references: [id])
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  @@map("subscriptions")
}

// Enums
enum Role {
  ADMIN
  THERAPIST
  RECEPTIONIST
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum AppointmentType {
  CONSULTATION
  THERAPY
  EVALUATION
  TELECONSULTA
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum RecordType {
  ANAMNESIS
  EVOLUTION
  EXAM
  PRESCRIPTION
  DISCHARGE
}

enum PlanStatus {
  ACTIVE
  COMPLETED
  SUSPENDED
  CANCELLED
}

enum PaymentMethod {
  CASH
  CARD
  PIX
  BANK_TRANSFER
  INSURANCE
}

enum PaymentStatus {
  PENDING
  PAID
  CANCELLED
  REFUNDED
}

enum PlanType {
  BASIC
  PROFESSIONAL
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  SUSPENDED
}
```

## 7. Implementação de Funcionalidades Premium

### 7.1 Middleware de Segurança
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  function middleware(req: NextRequest) {
    // Rate limiting
    const ip = req.ip ?? '127.0.0.1';
    const rateLimitKey = `rate_limit:${ip}`;

    // CSRF protection
    if (req.method === 'POST') {
      const csrfToken = req.headers.get('x-csrf-token');
      if (!csrfToken) {
        return new NextResponse('CSRF token missing', { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Verificar se o usuário tem permissão para acessar a rota
        const { pathname } = req.nextUrl;

        if (pathname.startsWith('/admin')) {
          return token?.role === 'Admin';
        }

        if (pathname.startsWith('/portal')) {
          return token?.role === 'Paciente';
        }

        if (pathname.startsWith('/partner')) {
          return token?.role === 'EducadorFisico';
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pacientes/:path*',
    '/agenda/:path*',
    '/admin/:path*',
    '/portal/:path*',
    '/partner/:path*',
    '/api/pacientes/:path*',
    '/api/appointments/:path*',
  ],
};
```

### 7.2 Implementação de Autenticação
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [
          credentials.email,
        ]);
        const user = result.rows[0];

        if (!user || !user.password_hash) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatar_url,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role as string;
      session.user.avatarUrl = token.avatarUrl as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});

export { handler as GET, handler as POST };
```

Esta arquitetura técnica fornece uma base sólida e escalável para o sistema FisioFlow, com foco em
performance, segurança e manutenibilidade.
