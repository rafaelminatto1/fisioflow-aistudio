# Plano de Migração FisioFlow - Railway + Neon DB

## 1. Análise da Arquitetura Atual

### 1.1 Stack Tecnológica Identificada

- **Frontend**: Next.js 14.2.5 com App Router

- **Autenticação**: NextAuth.js v5.0.0-beta.19

- **Banco de Dados**: PostgreSQL com Prisma ORM v5.17.0

- **Cache**: Redis v4.7.0

- **UI**: Tailwind CSS + Lucide React

- **Validação**: Zod + React Hook Form

- **Estado**: SWR para cache de dados

### 1.2 Estrutura do Projeto

```
fisioflow-aistudio/
├── app/                    # Next.js App Router
├── components/             # Componentes React
├── lib/                    # Utilitários e configurações
├── prisma/                 # Schema e migrations
├── services/               # Lógica de negócio
├── hooks/                  # Custom hooks
└── types/                  # Definições TypeScript
```

### 1.3 Dependências Críticas

- **Prisma**: ORM principal para PostgreSQL

- **NextAuth**: Sistema de autenticação

- **Redis**: Cache e sessões

- **bcryptjs**: Hash de senhas

- **SWR**: Cache de dados no frontend

## 2. Configuração Técnica

### 2.1 Implementação via CLI para Automação

#### Scripts de Automação Railway

```bash
#!/bin/bash
# deploy-railway.sh

echo "🚀 Iniciando deploy no Railway..."

# Instalar Railway CLI
npm install -g @railway/cli

# Login no Railway
railway login

# Criar novo projeto
railway new fisioflow-production

# Configurar variáveis de ambiente
railway variables set DATABASE_URL="$NEON_DATABASE_URL"
railway variables set NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
railway variables set NEXTAUTH_URL="$PRODUCTION_URL"
railway variables set UPSTASH_REDIS_REST_URL="$REDIS_URL"
railway variables set UPSTASH_REDIS_REST_TOKEN="$REDIS_TOKEN"

# Deploy da aplicação
railway up

echo "✅ Deploy concluído!"
```

#### Script de Setup do Banco

```bash
#!/bin/bash
# setup-database.sh

echo "🗄️ Configurando Neon DB..."

# Executar migrations
npx prisma migrate deploy

# Gerar cliente Prisma
npx prisma generate

# Executar seed (opcional)
npx prisma db seed

echo "✅ Banco configurado!"
```

### 2.2 Uso do MCP (Minimum Complete Product)

#### Priorização de Funcionalidades

1. **Core (P0)**: Autenticação, CRUD Pacientes, Agendamentos
2. **Essencial (P1)**: Dashboard, Relatórios básicos
3. **Importante (P2)**: Analytics, Notificações
4. **Desejável (P3)**: IA, Integrações avançadas

#### Configuração de Feature Flags

```typescript
// lib/feature-flags.ts
export const FEATURE_FLAGS = {
  AI_ASSISTANT: process.env.ENABLE_AI === 'true',
  ADVANCED_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  WHATSAPP_INTEGRATION: process.env.ENABLE_WHATSAPP === 'true',
  PAYMENT_GATEWAY: process.env.ENABLE_PAYMENTS === 'true',
} as const;
```

### 2.3 Integração do ShadCN/UI

#### Instalação e Configuração

```bash
# Instalar ShadCN/UI
npx shadcn-ui@latest init

# Adicionar componentes essenciais
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
npx shadcn-ui@latest add form
npx shadcn-ui@latest add toast
```

#### Configuração Tailwind

```javascript
// tailwind.config.ts
module.exports = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          600: '#475569',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
```

## 3. Configuração do Railway

### 3.1 Adaptação dos Scripts de Deploy

#### railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Dockerfile Otimizado

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 3.2 Variáveis de Ambiente

#### Configuração Completa

```bash
# Produção
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://fisioflow.railway.app

# Database (Neon)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/fisioflow?sslmode=require
DIRECT_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/fisioflow?sslmode=require

# NextAuth
NEXTAUTH_URL=https://fisioflow.railway.app
NEXTAUTH_SECRET=your-super-secret-key-32-chars-min

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Email (Resend)
RESEND_API_KEY=re_your-api-key
FROM_EMAIL=noreply@fisioflow.com

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=https://your-public-sentry-dsn

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_REQUESTS_PER_HOUR=2000
```

### 3.3 Alocação de Recursos

#### Configuração de Recursos Railway

```yaml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[resources]
cpu = 1000  # 1 vCPU
memory = 1024  # 1GB RAM

[scaling]
minReplicas = 1
maxReplicas = 3
targetCPU = 70
```

## 4. Integração com Neon DB

### 4.1 Configuração da Conexão

#### Prisma Schema Otimizado

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["jsonProtocol"]
}

datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

#### Connection Pooling

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Connection pooling configuration
export const prismaEdge = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});
```

### 4.2 Otimização de Queries

#### Índices Estratégicos

```sql
-- Índices para performance
CREATE INDEX CONCURRENTLY idx_appointments_patient_date
ON appointments(patient_id, start_time DESC);

CREATE INDEX CONCURRENTLY idx_pain_points_patient_created
ON pain_points(patient_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_metric_results_patient_measured
ON metric_results(patient_id, measured_at DESC);

CREATE INDEX CONCURRENTLY idx_users_email_role
ON users(email, role);
```

#### Query Optimization

```typescript
// services/optimized-queries.ts
export class OptimizedQueries {
  // Busca pacientes com paginação otimizada
  static async getPatientsPaginated(page: number, limit: number) {
    return prisma.patient.findMany({
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        lastVisit: true,
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  // Dashboard stats com uma query
  static async getDashboardStats() {
    const [patients, appointments, revenue] = await Promise.all([
      prisma.patient.count({ where: { status: 'Active' } }),
      prisma.appointment.count({
        where: {
          startTime: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.appointment.aggregate({
        _sum: { value: true },
        where: {
          paymentStatus: 'paid',
          startTime: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ]);

    return { patients, appointments, revenue: revenue._sum.value || 0 };
  }
}
```

### 4.3 Connection Pooling Avançado

#### Configuração PgBouncer

```ini
# pgbouncer.ini
[databases]
fisioflow = host=ep-xxx.us-east-1.aws.neon.tech port=5432 dbname=fisioflow

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = md5
auth_file = userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
max_db_connections = 20
reserve_pool_size = 5
reserve_pool_timeout = 5
server_reset_query = DISCARD ALL
server_check_delay = 30
server_check_query = select 1
server_lifetime = 3600
server_idle_timeout = 600
```

## 5. Validação e Documentação

### 5.1 Testes em Ambiente de Staging

#### Configuração de Staging

```bash
# staging-deploy.sh
#!/bin/bash

echo "🧪 Deploy para Staging..."

# Criar ambiente de staging
railway environment create staging
railway environment use staging

# Configurar variáveis específicas do staging
railway variables set NODE_ENV=staging
railway variables set NEXT_PUBLIC_APP_URL=https://fisioflow-staging.railway.app
railway variables set DATABASE_URL="$NEON_STAGING_URL"

# Deploy
railway up

echo "✅ Staging pronto!"
```

#### Suite de Testes

```typescript
// tests/integration/auth.test.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@fisioflow.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should redirect unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});
```

### 5.2 Verificação de Compatibilidade

#### Checklist de Dependências

```json
{
  "compatibility_check": {
    "node_version": ">=18.0.0",
    "next_version": "14.2.5",
    "prisma_version": "5.17.0",
    "nextauth_version": "5.0.0-beta.19",
    "railway_compatible": true,
    "neon_compatible": true
  }
}
```

#### Script de Verificação

```bash
#!/bin/bash
# verify-compatibility.sh

echo "🔍 Verificando compatibilidade..."

# Verificar versão do Node
node_version=$(node -v)
echo "Node.js: $node_version"

# Verificar dependências críticas
npm list @prisma/client next next-auth

# Testar conexão com Neon
npx prisma db pull --preview-feature

# Testar build
npm run build

echo "✅ Verificação concluída!"
```

### 5.3 Documentação Técnica

#### API Health Check

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Verificar conexão com banco
    await prisma.$queryRaw`SELECT 1`;

    // Verificar Redis (se configurado)
    // await redis.ping()

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

## 6. Cronograma de Implementação

### Semana 1: Preparação

- [ ] Setup do Neon DB

- [ ] Configuração do Railway

- [ ] Migração do schema Prisma

- [ ] Configuração de variáveis de ambiente

### Semana 2: Deploy e Testes

- [ ] Deploy inicial no Railway

- [ ] Configuração de domínio

- [ ] Testes de integração

- [ ] Otimização de performance

### Semana 3: Validação

- [ ] Testes de carga

- [ ] Monitoramento

- [ ] Documentação final

- [ ] Go-live

## 7. Monitoramento e Alertas

### 7.1 Métricas Essenciais

- Response time < 200ms

- Uptime > 99.9%

- Error rate < 0.1%

- Database connections < 80% do pool

### 7.2 Configuração de Alertas

```typescript
// lib/monitoring.ts
export const alerts = {
  highErrorRate: {
    threshold: 0.05, // 5%
    window: '5m',
  },
  slowResponse: {
    threshold: 1000, // 1s
    window: '1m',
  },
  highMemoryUsage: {
    threshold: 0.85, // 85%
    window: '5m',
  },
};
```

## 8. Plano de Rollback

### 8.1 Estratégia de Rollback

1. **Imediato**: Reverter deploy via Railway CLI
2. **Banco**: Restore do backup mais recente
3. **DNS**: Apontar para infraestrutura anterior
4. **Comunicação**: Notificar stakeholders

### 8.2 Script de Rollback

```bash
#!/bin/bash
# rollback.sh

echo "🔄 Iniciando rollback..."

# Reverter deploy
railway rollback

# Verificar status
railway status

echo "✅ Rollback concluído!"
```

---

**Estimativa de Custos Mensais:**

- Railway Pro: $20/mês

- Neon DB Pro: $19/mês

- Upstash Redis: $10/mês

- **Total**: \~$49/mês

**Benefícios Esperados:**

- 🚀 Deploy automatizado

- 📈 Escalabilidade automática

- 🔒 Backup automático

- 📊 Monitoramento integrado

- 💰 Custo otimizado
