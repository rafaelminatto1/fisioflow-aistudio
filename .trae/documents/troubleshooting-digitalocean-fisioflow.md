# Troubleshooting - FisioFlow no DigitalOcean

## 🚨 Problemas Comuns e Soluções

### 1. Build Failures

#### Problema: Build falha com "Out of Memory"

```
Error: JavaScript heap out of memory
```

**Solução:**

```bash
# Aumentar limite de memória no package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

#### Problema: Dependências não encontradas

```
Error: Cannot resolve module 'xyz'
```

**Solução:**

```bash
# Verificar package.json
npm install
npm audit fix

# Limpar cache se necessário
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Problema: Build timeout

```
Build exceeded maximum time limit
```

**Solução:**

* Otimizar imports dinâmicos

* Reduzir tamanho do bundle

* Usar Professional plan (mais recursos)

### 2. Database Connection Issues

#### Problema: "Connection refused"

```
Error: connect ECONNREFUSED
```

**Diagnóstico:**

```bash
# Verificar variáveis de ambiente
echo $DATABASE_URL

# Testar conexão
psql $DATABASE_URL -c "SELECT 1;"
```

**Soluções:**

1. Verificar DATABASE\_URL no App Platform
2. Confirmar que database está na mesma região
3. Verificar firewall rules
4. Verificar se database está online

#### Problema: "Too many connections"

```
Error: remaining connection slots are reserved
```

**Solução:**

```javascript
// Configurar connection pooling no Prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Configurar pool de conexões
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=5&pool_timeout=20'
    }
  }
});
```

#### Problema: Slow queries

```
Query timeout after 30000ms
```

**Diagnóstico:**

```sql
-- Verificar queries lentas
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Verificar índices
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;
```

**Soluções:**

1. Adicionar índices necessários
2. Otimizar queries N+1
3. Implementar cache
4. Usar database com mais recursos

### 3. Application Runtime Errors

#### Problema: 500 Internal Server Error

```
Application error occurred
```

**Diagnóstico:**

```bash
# Verificar logs da aplicação
doctl apps logs <app-id>

# Ou via interface web
# DigitalOcean Console > Apps > FisioFlow > Runtime Logs
```

**Soluções Comuns:**

1. Verificar variáveis de ambiente
2. Verificar conexão com database
3. Verificar permissões de arquivos
4. Verificar imports/exports

#### Problema: NextAuth.js não funciona

```
Error: NEXTAUTH_URL is not defined
```

**Solução:**

```bash
# Configurar variáveis no App Platform
NEXTAUTH_URL=https://your-app.ondigitalocean.app
NEXTAUTH_SECRET=your-secret-key

# Verificar providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Problema: CORS errors

```
Access to fetch blocked by CORS policy
```

**Solução:**

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

### 4. Performance Issues

#### Problema: Slow page loads

```
Page load time > 3 seconds
```

**Diagnóstico:**

```javascript
// Adicionar performance monitoring
// pages/_app.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  console.log(metric);
  // Enviar para serviço de analytics
}

export function reportWebVitals(metric) {
  sendToAnalytics(metric);
}
```

**Soluções:**

1. Otimizar imagens (Next.js Image)
2. Implementar lazy loading
3. Reduzir bundle size
4. Usar CDN para assets
5. Implementar cache

#### Problema: High memory usage

```
Memory usage > 90%
```

**Diagnóstico:**

```javascript
// Monitorar uso de memória
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB'
  });
}, 30000);
```

**Soluções:**

1. Verificar memory leaks
2. Otimizar cache em memória
3. Implementar garbage collection
4. Upgrade para plano com mais memória

### 5. SSL/HTTPS Issues

#### Problema: SSL certificate errors

```
SSL_ERROR_BAD_CERT_DOMAIN
```

**Soluções:**

1. Verificar configuração de domínio
2. Aguardar propagação DNS (até 48h)
3. Verificar CNAME records
4. Renovar certificado se necessário

#### Problema: Mixed content warnings

```
Mixed Content: The page was loaded over HTTPS, but requested an insecure resource
```

**Solução:**

```javascript
// Forçar HTTPS em todas as URLs
const apiUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.ondigitalocean.app/api'
  : 'http://localhost:3000/api';
```

### 6. Environment Variables

#### Problema: Variáveis não carregam

```
process.env.VARIABLE_NAME is undefined
```

**Diagnóstico:**

```javascript
// pages/api/debug-env.js (REMOVER EM PRODUÇÃO)
export default function handler(req, res) {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    hasDatabase: !!process.env.DATABASE_URL,
    hasNextAuth: !!process.env.NEXTAUTH_SECRET,
    // NÃO expor valores reais
  });
}
```

**Soluções:**

1. Verificar se variável está configurada no App Platform
2. Verificar se app foi redployado após adicionar variável
3. Verificar se variável é acessível no runtime
4. Verificar sintaxe (sem espaços extras)

### 7. File Upload Issues

#### Problema: Upload falha

```
Error: File upload failed
```

**Soluções:**

1. Verificar limites de tamanho
2. Configurar DigitalOcean Spaces
3. Verificar permissões de API
4. Implementar retry logic

```javascript
// Configuração robusta de upload
const uploadToSpaces = async (file, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await s3.upload({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: `uploads/${Date.now()}-${file.name}`,
        Body: file.buffer,
        ACL: 'public-read'
      }).promise();
      
      return result.Location;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## 🔧 Ferramentas de Diagnóstico

### 1. Health Check Endpoint

```javascript
// pages/api/health.js
export default async function handler(req, res) {
  const checks = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'unknown',
    redis: 'unknown'
  };

  try {
    // Test database
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch (error) {
    checks.database = 'error';
    checks.databaseError = error.message;
  }

  try {
    // Test Redis if configured
    if (process.env.REDIS_URL) {
      await redis.ping();
      checks.redis = 'connected';
    } else {
      checks.redis = 'not_configured';
    }
  } catch (error) {
    checks.redis = 'error';
    checks.redisError = error.message;
  }

  const isHealthy = checks.database === 'connected';
  res.status(isHealthy ? 200 : 500).json(checks);
}
```

### 2. Debug Script

```javascript
// scripts/debug-digitalocean.js
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

class DigitalOceanDebugger {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async checkDatabase() {
    try {
      const result = await this.prisma.$queryRaw`SELECT version()`;
      console.log('✅ Database connected:', result[0].version);
      
      const tables = await this.prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      console.log('📋 Tables:', tables.map(t => t.table_name));
      
    } catch (error) {
      console.error('❌ Database error:', error.message);
    }
  }

  async checkApp() {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const response = await axios.get(`${baseUrl}/api/health`);
      console.log('✅ App health:', response.data);
    } catch (error) {
      console.error('❌ App error:', error.message);
    }
  }

  async checkEnvironment() {
    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    console.log('🔍 Environment Variables:');
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      console.log(`${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
    });
  }

  async runAll() {
    console.log('🚀 Starting DigitalOcean Debug...');
    await this.checkEnvironment();
    await this.checkDatabase();
    await this.checkApp();
    console.log('✅ Debug completed');
  }
}

if (require.main === module) {
  const debugger = new DigitalOceanDebugger();
  debugger.runAll().catch(console.error);
}

module.exports = DigitalOceanDebugger;
```

### 3. Log Analysis

```bash
# Filtrar logs por tipo
doctl apps logs <app-id> --type build
doctl apps logs <app-id> --type deploy
doctl apps logs <app-id> --type run

# Logs em tempo real
doctl apps logs <app-id> --follow

# Filtrar por timestamp
doctl apps logs <app-id> --since 1h
```

## 📋 Checklist de Troubleshooting

### Quando algo não funciona:

1. **Verificar Status**

   * [ ] App está online no DigitalOcean?

   * [ ] Database está online?

   * [ ] Último deploy foi bem-sucedido?

2. **Verificar Logs**

   * [ ] Logs de build

   * [ ] Logs de runtime

   * [ ] Logs de database

3. **Verificar Configuração**

   * [ ] Variáveis de ambiente

   * [ ] Configuração de domínio

   * [ ] Configuração de database

4. **Testar Conectividade**

   * [ ] Health check endpoint

   * [ ] Database connection

   * [ ] External APIs

5. **Verificar Recursos**

   * [ ] CPU usage

   * [ ] Memory usage

   * [ ] Storage usage

   * [ ] Network usage

## 🆘 Contatos de Emergência

### DigitalOcean Support

* **Professional Plan**: Ticket support (24/7)

* **Business Plan**: Priority support + phone

* **Documentation**: <https://docs.digitalocean.com/>

* **Community**: <https://www.digitalocean.com/community/>

### Escalation Process

1. **Nível 1**: Verificar documentação e logs
2. **Nível 2**: Executar scripts de debug
3. **Nível 3**: Abrir ticket no DigitalOcean
4. **Nível 4**: Contatar desenvolvedor principal

## 📚 Recursos Úteis

### Comandos Úteis

```bash
# DigitalOcean CLI
doctl apps list
doctl apps get <app-id>
doctl apps logs <app-id>
doctl databases list
doctl databases connection <db-id>

# Database
psql $DATABASE_URL -c "\dt"  # Listar tabelas
psql $DATABASE_URL -c "\du"  # Listar usuários
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"  # Conexões ativas

# Node.js
node -e "console.log(process.env)"  # Verificar env vars
node -e "console.log(process.memoryUsage())"  # Uso de memória
```

### Links Importantes

* [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)

* \[Next.js Deployment

