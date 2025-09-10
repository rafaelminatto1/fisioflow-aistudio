# Guia de Monitoramento e Backup - FisioFlow no DigitalOcean

## 📊 Dashboard de Monitoramento

### Métricas Principais

#### App Platform Metrics

* **CPU Usage**: Utilização de CPU por instância

* **Memory Usage**: Uso de memória RAM

* **Request Rate**: Requisições por minuto

* **Response Time**: Tempo médio de resposta

* **Error Rate**: Taxa de erros (4xx/5xx)

* **Build Time**: Tempo de build e deploy

* **Uptime**: Disponibilidade da aplicação

#### Database Metrics

* **Connection Count**: Conexões ativas/máximas

* **Query Performance**: Tempo médio de queries

* **Storage Usage**: Uso do disco (GB)

* **CPU/Memory**: Recursos do banco

* **Replication Lag**: Atraso de replicação (se HA)

## 🚨 Configuração de Alertas

### Alertas Críticos (Immediate Action)

```yaml
# CPU Usage > 85% por 5 minutos
Alert: High CPU Usage
Condition: cpu_usage > 85%
Duration: 5 minutes
Action: Scale up or investigate

# Memory Usage > 90% por 3 minutos
Alert: High Memory Usage
Condition: memory_usage > 90%
Duration: 3 minutes
Action: Scale up or restart

# Error Rate > 5% por 2 minutos
Alert: High Error Rate
Condition: error_rate > 5%
Duration: 2 minutes
Action: Check logs and fix

# Response Time > 3s por 5 minutos
Alert: Slow Response Time
Condition: response_time > 3000ms
Duration: 5 minutes
Action: Optimize queries/code
```

### Alertas de Warning

```yaml
# CPU Usage > 70% por 10 minutos
Alert: Moderate CPU Usage
Condition: cpu_usage > 70%
Duration: 10 minutes
Action: Monitor and plan scaling

# Database Connections > 80% do limite
Alert: High DB Connections
Condition: db_connections > 17 (80% of 22)
Duration: 5 minutes
Action: Optimize connection pooling

# Storage Usage > 80%
Alert: High Storage Usage
Condition: storage_usage > 8GB (80% of 10GB)
Duration: immediate
Action: Clean up or upgrade
```

## 📈 Configuração de Monitoramento

### 1. DigitalOcean Native Monitoring

```bash
# Acessar métricas via API
curl -X GET \
  -H "Authorization: Bearer $DO_API_TOKEN" \
  "https://api.digitalocean.com/v2/monitoring/metrics/droplet/cpu"
```

### 2. Application Performance Monitoring (APM)

#### Configurar Sentry (Recomendado)

```bash
# Instalar Sentry
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filtrar dados sensíveis
    if (event.request?.headers?.authorization) {
      delete event.request.headers.authorization;
    }
    return event;
  }
});
```

#### Configurar Uptime Monitoring

```javascript
// pages/api/health.js
export default async function handler(req, res) {
  try {
    // Verificar database
    await prisma.$queryRaw`SELECT 1`;
    
    // Verificar Redis (se configurado)
    if (process.env.REDIS_URL) {
      await redis.ping();
    }
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 3. Custom Monitoring Script

```javascript
// scripts/monitor-digitalocean.js
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

class DigitalOceanMonitor {
  constructor() {
    this.apiToken = process.env.DO_API_TOKEN;
    this.appId = process.env.DO_APP_ID;
    this.dbId = process.env.DO_DATABASE_ID;
    this.prisma = new PrismaClient();
  }

  async getAppMetrics() {
    const response = await axios.get(
      `https://api.digitalocean.com/v2/apps/${this.appId}/metrics`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }

  async getDatabaseMetrics() {
    const response = await axios.get(
      `https://api.digitalocean.com/v2/databases/${this.dbId}/metrics`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }

  async checkHealth() {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Test app endpoint
      const healthCheck = await axios.get(`${process.env.NEXTAUTH_URL}/api/health`);
      
      return {
        status: 'healthy',
        database: 'connected',
        app: healthCheck.status === 200 ? 'running' : 'error'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = DigitalOceanMonitor;
```

## 💾 Estratégia de Backup

### 1. Database Backups

#### Backups Automáticos (Incluído no plano)

* **Frequência**: Diário

* **Retenção**: 7 dias

* **Horário**: 02:00 UTC (23:00 BRT)

* **Localização**: Mesma região do database

#### Backups Manuais

```bash
# Via DigitalOcean CLI
doctl databases backup create <database-id>

# Via pg_dump (conexão direta)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Script de Backup Personalizado

```javascript
// scripts/backup-digitalocean.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DatabaseBackup {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.maxBackups = 30; // Manter 30 backups locais
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `fisioflow_backup_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    // Criar diretório se não existir
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    try {
      // Fazer backup
      execSync(`pg_dump "${process.env.DATABASE_URL}" > "${filepath}"`);
      
      // Comprimir backup
      execSync(`gzip "${filepath}"`);
      
      console.log(`✅ Backup criado: ${filename}.gz`);
      
      // Limpar backups antigos
      await this.cleanOldBackups();
      
      return `${filename}.gz`;
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error.message);
      throw error;
    }
  }

  async cleanOldBackups() {
    const files = fs.readdirSync(this.backupDir)
      .filter(file => file.startsWith('fisioflow_backup_'))
      .map(file => ({
        name: file,
        path: path.join(this.backupDir, file),
        time: fs.statSync(path.join(this.backupDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);

    // Remover backups excedentes
    if (files.length > this.maxBackups) {
      const toDelete = files.slice(this.maxBackups);
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️ Backup removido: ${file.name}`);
      });
    }
  }

  async restoreBackup(backupFile) {
    const filepath = path.join(this.backupDir, backupFile);
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup não encontrado: ${backupFile}`);
    }

    try {
      // Descomprimir se necessário
      if (backupFile.endsWith('.gz')) {
        execSync(`gunzip -c "${filepath}" | psql "${process.env.DATABASE_URL}"`);
      } else {
        execSync(`psql "${process.env.DATABASE_URL}" < "${filepath}"`);
      }
      
      console.log(`✅ Backup restaurado: ${backupFile}`);
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error.message);
      throw error;
    }
  }
}

module.exports = DatabaseBackup;
```

### 2. Application Backups

#### Code Backup

* **Git Repository**: Backup automático via GitHub/GitLab

* **Branches**: Manter branches de release

* **Tags**: Versionar releases importantes

#### Assets Backup (DigitalOcean Spaces)

```javascript
// Configurar Spaces para assets
const AWS = require('aws-sdk');

const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET
});

// Upload de arquivo
const uploadFile = async (file, key) => {
  const params = {
    Bucket: 'fisioflow-assets',
    Key: key,
    Body: file,
    ACL: 'private'
  };
  
  return s3.upload(params).promise();
};
```

## 📋 Checklist de Monitoramento Diário

### ✅ Verificações Matinais (09:00)

* [ ] Verificar status da aplicação

* [ ] Revisar alertas da noite

* [ ] Verificar métricas de performance

* [ ] Confirmar backup automático

* [ ] Verificar logs de erro

### ✅ Verificações Vespertinas (18:00)

* [ ] Revisar métricas do dia

* [ ] Verificar uso de recursos

* [ ] Planejar scaling se necessário

* [ ] Verificar alertas pendentes

### ✅ Verificações Semanais (Segunda-feira)

* [ ] Revisar tendências de performance

* [ ] Verificar backups da semana

* [ ] Analisar logs de erro recorrentes

* [ ] Planejar otimizações

* [ ] Verificar atualizações de segurança

### ✅ Verificações Mensais

* [ ] Revisar custos e otimizar

* [ ] Testar proce

