# FisioFlow - Guia Completo de Deploy no Railway

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração Inicial](#configuração-inicial)
3. [Deploy Step-by-Step](#deploy-step-by-step)
4. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
5. [Monitoramento em Produção](#monitoramento-em-produção)
6. [Troubleshooting](#troubleshooting)
7. [Procedimentos de Rollback](#procedimentos-de-rollback)
8. [Manutenção e Atualizações](#manutenção-e-atualizações)
9. [Comandos Úteis](#comandos-úteis)
10. [Referências](#referências)

---

## 🚀 Pré-requisitos

### Contas e Serviços

- [ ] Conta no [Railway](https://railway.app)
- [ ] Conta no [Neon](https://neon.tech) (PostgreSQL)
- [ ] Repositório GitHub configurado
- [ ] Node.js 22+ instalado localmente
- [ ] Railway CLI instalado

### Instalação do Railway CLI

```bash
# Via npm
npm install -g @railway/cli

# Via curl (Linux/macOS)
curl -fsSL https://railway.app/install.sh | sh

# Via PowerShell (Windows)
iwr https://railway.app/install.ps1 | iex
```

### Verificação da Instalação

```bash
railway --version
railway login
```

---

## ⚙️ Configuração Inicial

### 1. Configurar Neon Database

1. **Criar projeto no Neon:**
   - Acesse [Neon Console](https://console.neon.tech)
   - Crie um novo projeto
   - Anote as credenciais de conexão

2. **Configurar Connection Pooling:**

   ```sql
   -- No Neon Console, vá em Settings > Connection Pooling
   -- Habilite connection pooling
   -- Configure pool size: 20-30 conexões
   ```

3. **Configurar Backup Automático:**
   ```sql
   -- No Neon Console, vá em Settings > Backup
   -- Configure backup diário
   -- Retenção: 7 dias
   ```

### 2. Preparar Repositório

```bash
# Clone o repositório
git clone <seu-repositorio>
cd fisioflow-aistudio

# Instalar dependências
npm install

# Verificar configurações
npm run check
```

---

## 🚢 Deploy Step-by-Step

### Método 1: Deploy via Railway CLI (Recomendado)

#### Passo 1: Inicializar Projeto

```bash
# Login no Railway
railway login

# Criar novo projeto
railway new
# Ou conectar a projeto existente
railway link [project-id]

# Verificar conexão
railway status
```

#### Passo 2: Configurar Variáveis de Ambiente

```bash
# Configurar variáveis essenciais
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="postgresql://..."
railway variables set NEXTAUTH_SECRET="seu-secret-aqui"
railway variables set NEXTAUTH_URL="https://seu-dominio.railway.app"

# Verificar variáveis
railway variables
```

#### Passo 3: Deploy

```bash
# Deploy manual
railway up

# Ou usar script automatizado
npm run deploy:railway

# Acompanhar logs
railway logs
```

### Método 2: Deploy via GitHub Actions

#### Passo 1: Configurar Secrets no GitHub

Vá em `Settings > Secrets and variables > Actions` e adicione:

```
RAILWAY_TOKEN=seu-token-aqui
RAILWAY_PROJECT_ID=seu-project-id
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=seu-secret
NEXTAUTH_URL=https://seu-dominio.railway.app
```

#### Passo 2: Push para Main

```bash
git add .
git commit -m "feat: deploy to railway"
git push origin main
```

O workflow `.github/workflows/railway-deploy.yml` será executado automaticamente.

---

## 🔧 Configuração de Variáveis de Ambiente

### Variáveis Essenciais

```bash
# Aplicação
NODE_ENV=production
PORT=3000
NEXTAUTH_URL=https://seu-dominio.railway.app
NEXTAUTH_SECRET=seu-secret-super-seguro

# Database (Neon)
DATABASE_URL=postgresql://user:pass@host:5432/db
NEON_DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
NEON_POOLED_CONNECTION=true
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000

# Railway Específico
RAILWAY_ENVIRONMENT=production
RAILWAY_SERVICE_NAME=fisioflow
RAILWAY_STRUCTURED_LOGGING=true
RAILWAY_METRICS_ENABLED=true

# Performance
GRACEFUL_SHUTDOWN_TIMEOUT=30000
HEALTH_CHECK_ENABLED=true
RATE_LIMIT_ENABLED=true
CORS_ENABLED=true

# Logging
LOG_LEVEL=info
STRUCTURED_LOGGING=true
METRICS_ENABLED=true
TRACE_ENABLED=true
```

### Configurar via Railway CLI

```bash
# Configurar todas de uma vez
railway variables set -f .env.production

# Ou individualmente
railway variables set NODE_ENV production
railway variables set DATABASE_URL "postgresql://..."
```

### Configurar via Railway Dashboard

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Selecione seu projeto
3. Vá em `Variables`
4. Adicione as variáveis necessárias
5. Clique em `Deploy`

---

## 📊 Monitoramento em Produção

### 1. Health Checks

```bash
# Verificar saúde da aplicação
curl https://seu-dominio.railway.app/health

# Resposta esperada:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600000,
  "environment": "production",
  "service": "fisioflow",
  "metrics": {
    "requestCount": 1250,
    "errorCount": 5,
    "errorRate": 0.4
  }
}
```

### 2. Logs Estruturados

```bash
# Visualizar logs em tempo real
railway logs --follow

# Filtrar logs por nível
railway logs --filter "level=error"

# Logs das últimas 24h
railway logs --since 24h
```

### 3. Métricas no Railway Dashboard

- **CPU Usage**: Deve ficar abaixo de 80%
- **Memory Usage**: Monitorar vazamentos
- **Response Time**: < 500ms para 95% das requests
- **Error Rate**: < 1%
- **Uptime**: > 99.9%

### 4. Alertas Automáticos

Configurar webhooks no Railway para notificações:

```bash
# Configurar webhook para Slack
railway variables set SLACK_WEBHOOK_URL "https://hooks.slack.com/..."
railway variables set ALERT_EMAIL "admin@fisioflow.com"
```

---

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. Build Falha

**Sintomas:**

- Deploy falha durante build
- Erro "Module not found"

**Soluções:**

```bash
# Verificar dependências
npm audit
npm install

# Limpar cache
npm run clean
rm -rf node_modules package-lock.json
npm install

# Verificar Dockerfile
docker build -t fisioflow .
```

#### 2. Database Connection Error

**Sintomas:**

- Erro "connection refused"
- Timeout de conexão

**Soluções:**

```bash
# Verificar URL do banco
railway variables get DATABASE_URL

# Testar conexão
npx prisma db pull

# Verificar pool de conexões
railway logs --filter "database"
```

#### 3. Memory Leaks

**Sintomas:**

- Uso de memória crescente
- Aplicação reiniciando

**Soluções:**

```bash
# Analisar uso de memória
railway logs --filter "memory"

# Verificar métricas
curl https://seu-dominio.railway.app/health

# Ajustar limites
railway variables set RAILWAY_MAX_MEMORY 1024
```

#### 4. Slow Response Times

**Sintomas:**

- Requests > 2s
- Timeouts frequentes

**Soluções:**

```bash
# Verificar logs de performance
railway logs --filter "performance"

# Otimizar queries
npx prisma studio

# Aumentar recursos
railway variables set RAILWAY_CPU_LIMIT 2
```

### Comandos de Diagnóstico

```bash
# Status geral
railway status

# Informações do projeto
railway info

# Logs detalhados
railway logs --tail 100

# Variáveis de ambiente
railway variables

# Deployments recentes
railway deployments

# Métricas de uso
railway usage
```

---

## ⏪ Procedimentos de Rollback

### Rollback Automático

O sistema possui rollback automático configurado no GitHub Actions:

```yaml
# .github/workflows/railway-deploy.yml
- name: Rollback on Failure
  if: failure() && github.ref == 'refs/heads/main'
  run: |
    railway rollback
```

### Rollback Manual

#### Via Railway CLI

```bash
# Listar deployments
railway deployments

# Rollback para deployment anterior
railway rollback

# Rollback para deployment específico
railway rollback [deployment-id]

# Verificar status
railway status
```

#### Via Railway Dashboard

1. Acesse Railway Dashboard
2. Vá em `Deployments`
3. Selecione deployment estável
4. Clique em `Redeploy`
5. Confirme a ação

### Rollback de Database

```bash
# Backup antes de mudanças
npx prisma db pull --schema backup.prisma

# Reverter migrações
npx prisma migrate reset
npx prisma db push --schema backup.prisma

# Ou usar backup do Neon
# No Neon Console: Restore from backup
```

### Procedimento de Emergência

```bash
#!/bin/bash
# scripts/emergency-rollback.sh

echo "🚨 INICIANDO ROLLBACK DE EMERGÊNCIA"

# 1. Rollback da aplicação
railway rollback

# 2. Verificar health
sleep 30
curl -f https://seu-dominio.railway.app/health || exit 1

# 3. Notificar equipe
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-type: application/json' \
  --data '{"text":"🚨 Rollback de emergência executado com sucesso"}'

echo "✅ ROLLBACK CONCLUÍDO"
```

---

## 🔄 Manutenção e Atualizações

### Atualizações de Segurança

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente
npm audit fix

# Atualizar dependências
npm update

# Deploy com atualizações
npm run deploy:railway
```

### Backup Regular

```bash
# Script de backup automático
#!/bin/bash
# scripts/backup.sh

# Backup do banco
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Upload para S3 (se configurado)
aws s3 cp backup-$(date +%Y%m%d).sql s3://fisioflow-backups/

# Limpar backups antigos (> 30 dias)
find . -name "backup-*.sql" -mtime +30 -delete
```

### Monitoramento de Performance

```bash
# Script de monitoramento
#!/bin/bash
# scripts/monitor.sh

# Verificar health
HEALTH=$(curl -s https://seu-dominio.railway.app/health)
STATUS=$(echo $HEALTH | jq -r '.status')

if [ "$STATUS" != "healthy" ]; then
  echo "🚨 Aplicação não está saudável: $STATUS"
  # Enviar alerta
fi

# Verificar métricas
ERROR_RATE=$(echo $HEALTH | jq -r '.metrics.errorRate')
if (( $(echo "$ERROR_RATE > 5" | bc -l) )); then
  echo "⚠️ Taxa de erro alta: $ERROR_RATE%"
fi
```

---

## 🛠️ Comandos Úteis

### Railway CLI

```bash
# Gestão de projeto
railway new                    # Criar novo projeto
railway link                   # Conectar a projeto existente
railway unlink                 # Desconectar projeto
railway delete                 # Deletar projeto

# Deploy e logs
railway up                     # Deploy
railway logs                   # Ver logs
railway logs -f                # Logs em tempo real
railway logs --tail 50         # Últimas 50 linhas

# Variáveis de ambiente
railway variables              # Listar variáveis
railway variables set KEY=value # Definir variável
railway variables delete KEY   # Deletar variável

# Informações
railway status                 # Status do projeto
railway info                   # Informações detalhadas
railway usage                  # Uso de recursos
railway deployments            # Histórico de deploys

# Domínios
railway domain                 # Gerenciar domínios
railway domain add example.com # Adicionar domínio customizado

# Banco de dados
railway add postgresql         # Adicionar PostgreSQL
railway add redis             # Adicionar Redis
railway connect               # Conectar ao banco
```

### Scripts NPM

```bash
# Desenvolvimento
npm run dev                    # Servidor de desenvolvimento
npm run build                  # Build para produção
npm run start                  # Iniciar produção
npm run check                  # Verificar código

# Deploy
npm run deploy:railway         # Deploy automatizado
npm run deploy:staging         # Deploy para staging
npm run deploy:production      # Deploy para produção

# Manutenção
npm run backup                 # Backup do banco
npm run migrate                # Executar migrações
npm run seed                   # Popular banco com dados

# Monitoramento
npm run health-check           # Verificar saúde
npm run monitor                # Monitoramento contínuo
npm run logs                   # Ver logs estruturados
```

### Docker

```bash
# Build local
docker build -t fisioflow .
docker run -p 3000:3000 fisioflow

# Debug
docker run -it fisioflow sh
docker logs container-id

# Limpeza
docker system prune
docker image prune
```

---

## 📚 Referências

### Documentação Oficial

- [Railway Docs](https://docs.railway.app)
- [Neon Docs](https://neon.tech/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Railway Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-railway)

### Recursos Úteis

- [Railway Templates](https://railway.app/templates)
- [Railway Discord](https://discord.gg/railway)
- [Neon Community](https://community.neon.tech)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)

### Monitoramento e Alertas

- [Railway Metrics](https://railway.app/dashboard)
- [Neon Monitoring](https://console.neon.tech)
- [Uptime Robot](https://uptimerobot.com)
- [Better Uptime](https://betteruptime.com)

### Ferramentas de Desenvolvimento

- [Railway CLI](https://docs.railway.app/develop/cli)
- [Prisma Studio](https://www.prisma.io/studio)
- [pgAdmin](https://www.pgadmin.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

## 📞 Suporte

Em caso de problemas:

1. **Verificar logs**: `railway logs`
2. **Consultar health check**: `/health`
3. **Verificar status**: `railway status`
4. **Documentação**: Links acima
5. **Comunidade**: Discord do Railway
6. **Suporte**: support@railway.app

---

**Última atualização**: Janeiro 2024 **Versão**: 1.0.0 **Autor**: Equipe FisioFlow
