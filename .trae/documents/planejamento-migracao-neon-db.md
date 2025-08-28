# Planejamento de Migração para Neon DB - FisioFlow

## 1. Arquitetura Detalhada

### 1.1 Diagrama de Componentes

```mermaid
graph TD
    A[Frontend Next.js] --> B[API Routes]
    B --> C[Prisma ORM]
    C --> D[Connection Pool]
    D --> E[Neon DB Proxy]
    E --> F[Neon Compute]
    F --> G[PostgreSQL Engine]

    H[Redis Cache] --> B
    I[File Storage] --> B

    subgraph "Neon Infrastructure"
        E
        F
        G
        J[Neon Storage]
        K[Neon Branching]
        L[Auto-scaling]
    end

    subgraph "Application Layer"
        A
        B
        C
        H
        I
    end

    F --> J
    K --> F
    L --> F
```

### 1.2 Modelagem de Dados Otimizada

#### Estratégia de Particionamento

**Particionamento por Data (Time-based)**

```sql
-- Tabela de consultas particionada por mês
CREATE TABLE consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL,
    data_consulta TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (data_consulta);

-- Partições mensais
CREATE TABLE consultas_2024_01 PARTITION OF consultas
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE consultas_2024_02 PARTITION OF consultas
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

**Particionamento por Hash (Distribuição)**

```sql
-- Tabela de pacientes particionada por hash
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    telefone VARCHAR(20),
    data_nascimento DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY HASH (id);

-- 4 partições para distribuição
CREATE TABLE pacientes_0 PARTITION OF pacientes
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE pacientes_1 PARTITION OF pacientes
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);
```

#### Índices Otimizados para Neon

```sql
-- Índices compostos para queries frequentes
CREATE INDEX CONCURRENTLY idx_consultas_paciente_data
    ON consultas (paciente_id, data_consulta DESC);

-- Índices parciais para dados ativos
CREATE INDEX CONCURRENTLY idx_pacientes_ativos
    ON pacientes (created_at)
    WHERE status = 'ativo';

-- Índices GIN para busca textual
CREATE INDEX CONCURRENTLY idx_pacientes_busca
    ON pacientes USING GIN (to_tsvector('portuguese', nome || ' ' || COALESCE(email, '')));
```

### 1.3 Estratégia de Distribuição de Dados

#### Branching Strategy

```yaml
Branches:
  main:
    purpose: 'Produção'
    compute_units: '2-4 CU'
    auto_suspend: '5 minutes'

  staging:
    purpose: 'Homologação'
    compute_units: '1-2 CU'
    auto_suspend: '1 minute'
    parent: 'main'

  development:
    purpose: 'Desenvolvimento'
    compute_units: '0.25-1 CU'
    auto_suspend: '30 seconds'
    parent: 'staging'

  feature/*:
    purpose: 'Features em desenvolvimento'
    compute_units: '0.25 CU'
    auto_suspend: '30 seconds'
    parent: 'development'
```

## 2. Configuração Técnica Completa

### 2.1 Parâmetros de Configuração Neon DB

#### Variáveis de Ambiente

```env
# Neon DB Configuration
NEON_DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/fisioflow?sslmode=require"
NEON_DIRECT_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/fisioflow?sslmode=require&pgbouncer=true&connect_timeout=15"
NEON_PROJECT_ID="ep-xxx"
NEON_BRANCH_ID="br-xxx"
NEON_API_KEY="neon_api_xxx"

# Connection Pool Settings
DATABASE_POOL_SIZE=20
DATABASE_POOL_TIMEOUT=30000
DATABASE_POOL_IDLE_TIMEOUT=600000
DATABASE_STATEMENT_TIMEOUT=60000
DATABASE_QUERY_TIMEOUT=30000

# Neon Specific Settings
NEON_COMPUTE_SIZE="shared"
NEON_AUTO_SUSPEND_DELAY=300
NEON_MAX_CONNECTIONS=100
```

#### Configuração do Prisma para Neon

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "views", "multiSchema"]
}

datasource db {
  provider = "postgresql"
  url = env("NEON_DATABASE_URL")
  directUrl = env("NEON_DIRECT_URL")
  extensions = [uuid_ossp, pg_trgm, btree_gin]
  schemas = ["public", "analytics", "audit"]
}
```

### 2.2 Políticas de Conexão e Pooling

#### Configuração de Connection Pool

```typescript
// lib/neon-client.ts
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.NEON_DATABASE_URL!;

// Pool configuration optimized for Neon
const pool = new Pool({
  connectionString,
  max: 20, // Maximum connections
  idleTimeoutMillis: 600000, // 10 minutes
  connectionTimeoutMillis: 30000, // 30 seconds
  allowExitOnIdle: true,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaNeon(pool);

export const prisma = new PrismaClient({
  adapter,
  log: ['query', 'error', 'warn'],
  errorFormat: 'pretty',
});

// Connection health check
export async function checkNeonConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date() };
  }
}
```

#### Estratégia de Retry e Circuit Breaker

```typescript
// lib/neon-resilience.ts
import { retry } from 'async';

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === config.maxAttempts) {
        throw lastError;
      }

      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

### 2.3 Configurações de Segurança e Autenticação

#### Row Level Security (RLS)

```sql
-- Habilitar RLS nas tabelas principais
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE prontuarios ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso por usuário
CREATE POLICY "Fisioterapeutas podem ver seus pacientes" ON pacientes
    FOR SELECT USING (fisioterapeuta_id = auth.uid());

CREATE POLICY "Pacientes podem ver seus próprios dados" ON pacientes
    FOR SELECT USING (id = auth.uid());

-- Política de auditoria
CREATE POLICY "Logs de auditoria são read-only" ON audit_logs
    FOR SELECT USING (true);
```

#### Configuração de SSL e Certificados

```typescript
// lib/neon-security.ts
import { readFileSync } from 'fs';

const sslConfig = {
  rejectUnauthorized: true,
  ca: process.env.NEON_CA_CERT || readFileSync('./certs/neon-ca.crt'),
  cert: process.env.NEON_CLIENT_CERT,
  key: process.env.NEON_CLIENT_KEY,
};

export const secureConnectionString = `${process.env.NEON_DATABASE_URL}?sslmode=require&sslcert=${sslConfig.cert}&sslkey=${sslConfig.key}`;
```

## 3. Fluxos de Integração

### 3.1 Processo de Migração de Dados

#### Fase 1: Preparação

```bash
#!/bin/bash
# scripts/migration/01-prepare.sh

echo "Iniciando preparação para migração..."

# 1. Backup do banco atual
npx prisma db pull --schema=./prisma/backup-schema.prisma
pg_dump $CURRENT_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Criar branch de migração no Neon
curl -X POST "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches" \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "migration-'$(date +%Y%m%d)'"，
    "parent_id": "'$NEON_MAIN_BRANCH_ID'"
  }'

# 3. Aplicar schema no Neon
npx prisma migrate deploy --schema=./prisma/neon-schema.prisma

echo "Preparação concluída!"
```

#### Fase 2: Migração Incremental

```typescript
// scripts/migration/incremental-sync.ts
import { PrismaClient as CurrentPrisma } from '@prisma/client';
import { PrismaClient as NeonPrisma } from './generated/neon-client';

const currentDb = new CurrentPrisma();
const neonDb = new NeonPrisma();

interface MigrationState {
  lastSyncTimestamp: Date;
  tablesCompleted: string[];
  totalRecords: number;
  migratedRecords: number;
}

async function incrementalMigration() {
  const state = await loadMigrationState();

  const tables = ['pacientes', 'consultas', 'prontuarios', 'exercicios'];

  for (const table of tables) {
    if (state.tablesCompleted.includes(table)) continue;

    console.log(`Migrando tabela: ${table}`);

    const records = await currentDb[table].findMany({
      where: {
        updated_at: {
          gte: state.lastSyncTimestamp,
        },
      },
      orderBy: { created_at: 'asc' },
      take: 1000, // Batch size
    });

    if (records.length === 0) {
      state.tablesCompleted.push(table);
      continue;
    }

    // Upsert em lotes
    await neonDb.$transaction(async tx => {
      for (const record of records) {
        await tx[table].upsert({
          where: { id: record.id },
          update: record,
          create: record,
        });
      }
    });

    state.migratedRecords += records.length;
    state.lastSyncTimestamp = new Date();

    await saveMigrationState(state);

    console.log(`Migrados ${records.length} registros de ${table}`);
  }
}
```

### 3.2 Sincronização em Tempo Real

#### Change Data Capture (CDC)

```typescript
// lib/cdc/neon-sync.ts
import { EventEmitter } from 'events';

class NeonCDC extends EventEmitter {
  private replicationSlot: string;
  private lastLSN: string;

  constructor() {
    super();
    this.replicationSlot = 'fisioflow_replication';
  }

  async startReplication() {
    // Criar slot de replicação
    await prisma.$executeRaw`
      SELECT pg_create_logical_replication_slot(
        ${this.replicationSlot}, 
        'pgoutput'
      )
    `;

    // Iniciar streaming de mudanças
    this.streamChanges();
  }

  private async streamChanges() {
    const changes = await prisma.$queryRaw`
      SELECT * FROM pg_logical_slot_get_changes(
        ${this.replicationSlot}, 
        ${this.lastLSN}, 
        NULL
      )
    `;

    for (const change of changes) {
      this.processChange(change);
    }

    // Continuar streaming
    setTimeout(() => this.streamChanges(), 1000);
  }

  private processChange(change: any) {
    const { operation, table, data } = this.parseChange(change);

    this.emit('change', {
      operation,
      table,
      data,
      timestamp: new Date(),
    });
  }
}
```

### 3.3 APIs Específicas para Neon DB

#### Endpoint de Branching

```typescript
// app/api/neon/branches/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, parentBranchId, purpose } = await request.json();

    const response = await fetch(
      `https://console.neon.tech/api/v2/projects/${process.env.NEON_PROJECT_ID}/branches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEON_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          parent_id: parentBranchId,
          compute_units: purpose === 'production' ? 2 : 0.25,
        }),
      }
    );

    const branch = await response.json();

    return NextResponse.json({
      success: true,
      branch: {
        id: branch.id,
        name: branch.name,
        connectionString: branch.connection_string,
        createdAt: branch.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

#### Endpoint de Métricas

```typescript
// app/api/neon/metrics/route.ts
export async function GET() {
  try {
    const metrics = await Promise.all([
      getNeonComputeMetrics(),
      getDatabaseMetrics(),
      getConnectionMetrics(),
    ]);

    return NextResponse.json({
      compute: metrics[0],
      database: metrics[1],
      connections: metrics[2],
      timestamp: new Date(),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getNeonComputeMetrics() {
  const result = await prisma.$queryRaw`
    SELECT 
      pg_database_size(current_database()) as database_size,
      (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
      (SELECT count(*) FROM pg_stat_activity) as total_connections
  `;

  return result[0];
}
```

## 4. Operações e Manutenção

### 4.1 Backup e Recuperação

#### Estratégia de Backup Automatizado

```typescript
// scripts/backup/neon-backup.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface BackupConfig {
  frequency: 'hourly' | 'daily' | 'weekly';
  retention: number; // days
  compression: boolean;
  encryption: boolean;
}

class NeonBackupManager {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
  }

  async createBackup(branchId: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `fisioflow-backup-${timestamp}`;

    // Criar branch de backup no Neon
    const backupBranch = await this.createBackupBranch(branchId, backupName);

    // Exportar dados
    const dumpFile = `./backups/${backupName}.sql`;
    await execAsync(`pg_dump ${backupBranch.connectionString} > ${dumpFile}`);

    if (this.config.compression) {
      await execAsync(`gzip ${dumpFile}`);
    }

    if (this.config.encryption) {
      await this.encryptBackup(`${dumpFile}.gz`);
    }

    return backupName;
  }

  async restoreBackup(backupName: string, targetBranchId: string): Promise<void> {
    const backupFile = `./backups/${backupName}.sql.gz`;

    // Descriptografar se necessário
    if (this.config.encryption) {
      await this.decryptBackup(backupFile);
    }

    // Descomprimir
    await execAsync(`gunzip ${backupFile}`);

    // Restaurar
    const targetBranch = await this.getBranchInfo(targetBranchId);
    await execAsync(`psql ${targetBranch.connectionString} < ${backupFile.replace('.gz', '')}`);
  }

  private async createBackupBranch(sourceBranchId: string, name: string) {
    const response = await fetch(
      `https://console.neon.tech/api/v2/projects/${process.env.NEON_PROJECT_ID}/branches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEON_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          parent_id: sourceBranchId,
        }),
      }
    );

    return await response.json();
  }
}
```

### 4.2 Monitoramento de Performance

#### Dashboard de Métricas Neon

```typescript
// lib/monitoring/neon-metrics.ts
interface NeonMetrics {
  computeUnits: number;
  activeConnections: number;
  queryLatency: number;
  throughput: number;
  storageUsed: number;
  cacheHitRatio: number;
}

class NeonMonitoring {
  async getMetrics(): Promise<NeonMetrics> {
    const [compute, connections, performance, storage] = await Promise.all([
      this.getComputeMetrics(),
      this.getConnectionMetrics(),
      this.getPerformanceMetrics(),
      this.getStorageMetrics(),
    ]);

    return {
      computeUnits: compute.units,
      activeConnections: connections.active,
      queryLatency: performance.avgLatency,
      throughput: performance.qps,
      storageUsed: storage.used,
      cacheHitRatio: performance.cacheHitRatio,
    };
  }

  async getSlowQueries(limit: number = 10) {
    return await prisma.$queryRaw`
      SELECT 
        query,
        mean_exec_time,
        calls,
        total_exec_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
      FROM pg_stat_statements 
      ORDER BY mean_exec_time DESC 
      LIMIT ${limit}
    `;
  }

  async getConnectionStats() {
    return await prisma.$queryRaw`
      SELECT 
        state,
        count(*) as count,
        avg(extract(epoch from (now() - state_change))) as avg_duration
      FROM pg_stat_activity 
      WHERE pid <> pg_backend_pid()
      GROUP BY state
    `;
  }
}
```

#### Alertas Automatizados

```typescript
// lib/monitoring/alerts.ts
interface AlertRule {
  metric: string;
  threshold: number;
  operator: '>' | '<' | '=' | '>=' | '<=';
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // minutes
}

class NeonAlertManager {
  private rules: AlertRule[] = [
    {
      metric: 'activeConnections',
      threshold: 80,
      operator: '>',
      severity: 'high',
      cooldown: 5,
    },
    {
      metric: 'queryLatency',
      threshold: 1000,
      operator: '>',
      severity: 'medium',
      cooldown: 10,
    },
    {
      metric: 'cacheHitRatio',
      threshold: 0.9,
      operator: '<',
      severity: 'medium',
      cooldown: 15,
    },
  ];

  async checkAlerts() {
    const metrics = await new NeonMonitoring().getMetrics();

    for (const rule of this.rules) {
      const value = metrics[rule.metric];
      const triggered = this.evaluateRule(value, rule);

      if (triggered) {
        await this.sendAlert(rule, value);
      }
    }
  }

  private evaluateRule(value: number, rule: AlertRule): boolean {
    switch (rule.operator) {
      case '>':
        return value > rule.threshold;
      case '<':
        return value < rule.threshold;
      case '>=':
        return value >= rule.threshold;
      case '<=':
        return value <= rule.threshold;
      case '=':
        return value === rule.threshold;
      default:
        return false;
    }
  }
}
```

### 4.3 Estratégias de Escalabilidade

#### Auto-scaling de Compute Units

```typescript
// lib/scaling/neon-autoscaler.ts
interface ScalingPolicy {
  minComputeUnits: number;
  maxComputeUnits: number;
  targetCpuUtilization: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownPeriod: number;
}

class NeonAutoScaler {
  private policy: ScalingPolicy;
  private lastScaleAction: Date;

  constructor(policy: ScalingPolicy) {
    this.policy = policy;
    this.lastScaleAction = new Date(0);
  }

  async evaluateScaling(): Promise<void> {
    const now = new Date();
    const timeSinceLastAction = now.getTime() - this.lastScaleAction.getTime();

    if (timeSinceLastAction < this.policy.cooldownPeriod * 60 * 1000) {
      return; // Still in cooldown period
    }

    const metrics = await this.getCurrentMetrics();
    const currentCU = await this.getCurrentComputeUnits();

    if (metrics.cpuUtilization > this.policy.scaleUpThreshold) {
      const newCU = Math.min(currentCU * 2, this.policy.maxComputeUnits);
      await this.scaleCompute(newCU);
      this.lastScaleAction = now;
    } else if (metrics.cpuUtilization < this.policy.scaleDownThreshold) {
      const newCU = Math.max(currentCU / 2, this.policy.minComputeUnits);
      await this.scaleCompute(newCU);
      this.lastScaleAction = now;
    }
  }

  private async scaleCompute(computeUnits: number): Promise<void> {
    await fetch(
      `https://console.neon.tech/api/v2/projects/${process.env.NEON_PROJECT_ID}/endpoints/${process.env.NEON_ENDPOINT_ID}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.NEON_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compute_units: computeUnits,
        }),
      }
    );
  }
}
```

#### Read Replicas para Distribuição de Carga

```typescript
// lib/scaling/read-replicas.ts
class NeonReadReplicaManager {
  private readReplicas: string[] = [];
  private currentReplicaIndex = 0;

  async createReadReplica(name: string): Promise<string> {
    const response = await fetch(
      `https://console.neon.tech/api/v2/projects/${process.env.NEON_PROJECT_ID}/branches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEON_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${name}-read-replica`,
          parent_id: process.env.NEON_MAIN_BRANCH_ID,
          compute_units: 1,
          read_only: true,
        }),
      }
    );

    const replica = await response.json();
    this.readReplicas.push(replica.connection_string);

    return replica.id;
  }

  getReadConnection(): string {
    if (this.readReplicas.length === 0) {
      return process.env.NEON_DATABASE_URL!;
    }

    const connection = this.readReplicas[this.currentReplicaIndex];
    this.currentReplicaIndex = (this.currentReplicaIndex + 1) % this.readReplicas.length;

    return connection;
  }
}
```

## 5. Cronograma de Implementação

### Fase 1: Preparação (Semana 1-2)

- [ ] Configuração inicial do projeto Neon
- [ ] Criação de branches de desenvolvimento
- [ ] Configuração de variáveis de ambiente
- [ ] Implementação de connection pooling

### Fase 2: Migração de Schema (Semana 3)

- [ ] Adaptação do schema Prisma para Neon
- [ ] Implementação de particionamento
- [ ] Criação de índices otimizados
- [ ] Configuração de RLS

### Fase 3: Migração de Dados (Semana 4-5)

- [ ] Backup completo do sistema atual
- [ ] Migração incremental de dados
- [ ] Implementação de CDC
- [ ] Testes de integridade

### Fase 4: Integração e Testes (Semana 6)

- [ ] Atualização de APIs
- [ ] Implementação de monitoramento
- [ ] Testes de performance
- [ ] Testes de failover

### Fase 5: Deploy e Monitoramento (Semana 7-8)

- [ ] Deploy em ambiente de staging
- [ ] Testes de carga
- [ ] Deploy em produção
- [ ] Monitoramento pós-deploy

## 6. Considerações de Performance

### Otimizações Específicas do Neon

1. **Connection Pooling**: Uso do PgBouncer integrado
2. **Query Optimization**: Aproveitamento do query planner otimizado
3. **Caching**: Implementação de cache de queries frequentes
4. **Branching**: Uso de branches para ambientes isolados
5. **Auto-suspend**: Configuração otimizada para reduzir custos

### Métricas de Sucesso

- **Latência**: < 100ms para 95% das queries
- **Throughput**: > 1000 QPS
- **Disponibilidade**: 99.9% uptime
- **Escalabilidade**: Auto-scaling responsivo
- **Custo**: Redução de 30% nos custos de infraestrutura

Este planejamento garante uma migração completa e otimizada para o Neon DB, aproveitando todas as
suas capacidades serverless e de branching para criar uma arquitetura robusta e escalável para o
FisioFlow.
