# 🚀 FISIOFLOW - SETUP COMPLETO RAILWAY + NEON DB

> Guia completo para configurar o FisioFlow para deploy em produção no Railway com banco Neon DB

## 📋 **VISÃO GERAL**

Este guia configura completamente o projeto FisioFlow para:

- ✅ **Railway**: Deploy e hospedagem em produção
- ✅ **Neon DB**: Banco de dados PostgreSQL serverless
- ✅ **MCP**: Model Context Protocol para IA
- ✅ **CLI Tools**: Todas as ferramentas de linha de comando
- ✅ **CI/CD**: GitHub Actions automatizados
- ✅ **Monitoramento**: Health checks e métricas

---

## 🚀 **FASE 1: SETUP RÁPIDO (5 minutos)**

### 1.1 Executar Setup Automático

```bash
# 1. Setup completo CLI
npm run cli:setup

# 2. Setup Railway
npm run railway:setup

# 3. Setup Neon DB
npm run neon:setup

# 4. Setup MCP
npm run mcp:setup
```

### 1.2 Verificar Instalação

```bash
# Testar todas as ferramentas
npm run cli:test

# Verificar status Railway
npm run railway:status

# Verificar conexão Neon
npm run neon:status

# Validar configuração MCP
npm run mcp:validate
```

---

## 🔧 **FASE 2: CONFIGURAÇÃO MANUAL**

### 2.1 Configurar Variáveis de Ambiente

```bash
# 1. Copiar arquivo de exemplo
cp .env.example .env.local

# 2. Editar com suas credenciais
code .env.local
```

**Variáveis obrigatórias:**

```bash
# Railway
RAILWAY_API_KEY=seu_token_aqui
RAILWAY_PROJECT_ID=seu_project_id

# Neon DB
NEON_API_KEY=sua_api_key_aqui
NEON_PROJECT_ID=seu_project_id
NEON_DB_HOST=seu_host_aqui
NEON_DB_NAME=seu_database
NEON_DB_USER=seu_usuario
NEON_DB_PASSWORD=sua_senha

# Aplicação
NEXTAUTH_SECRET=seu_secret_super_seguro
NEXTAUTH_URL=https://seu-dominio.railway.app
```

### 2.2 Configurar Railway

```bash
# 1. Login no Railway
railway login

# 2. Criar projeto (se não existir)
railway init fisioflow

# 3. Linkar projeto existente
railway link

# 4. Configurar variáveis
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="sua_url_neon"
```

### 2.3 Configurar Neon DB

```bash
# 1. Acessar console Neon
# https://console.neon.tech

# 2. Criar projeto
# 3. Copiar connection string
# 4. Configurar pooling
```

---

## 🛠️ **FASE 3: FERRAMENTAS CLI**

### 3.1 Ferramentas Instaladas

| Ferramenta      | Comando                 | Descrição              |
| --------------- | ----------------------- | ---------------------- |
| **Railway CLI** | `railway`               | Deploy e gerenciamento |
| **Neon CLI**    | `npx @neondatabase/cli` | Gerenciamento do banco |
| **Prisma CLI**  | `npx prisma`            | ORM e migrações        |
| **Vercel CLI**  | `vercel`                | Deploy alternativo     |
| **Docker**      | `docker`                | Containerização        |

### 3.2 Aliases Disponíveis

**PowerShell (Windows):**

```powershell
# Carregar aliases
. .\scripts\cli-aliases.ps1

# Usar aliases
rw-deploy          # railway up
rw-logs            # railway logs --follow
ff-dev             # npm run dev
ff-deploy          # npm run railway:deploy
```

**Bash (Linux/macOS):**

```bash
# Carregar aliases
source scripts/cli-aliases.sh

# Usar aliases
rw-deploy          # railway up
rw-logs            # railway logs --follow
ff-dev             # npm run dev
ff-deploy          # npm run railway:deploy
```

### 3.3 Scripts NPM Personalizados

```bash
# Setup e configuração
npm run cli:setup          # Setup completo CLI
npm run cli:test           # Testar ferramentas
npm run cli:update         # Atualizar ferramentas

# Railway
npm run railway:quick      # Deploy rápido
npm run railway:logs-follow # Logs em tempo real
npm run railway:status-detailed # Status detalhado

# Neon DB
npm run neon:quick-status  # Status rápido do banco

# Prisma
npm run prisma:quick-studio # Abrir Prisma Studio

# Docker
npm run docker:quick-build # Build rápido
npm run docker:quick-run   # Executar container
```

---

## 🌐 **FASE 4: CONFIGURAÇÃO MCP**

### 4.1 Estrutura MCP

O arquivo `mcp.config.json` configura:

- **Railway**: Deploy, monitoramento, variáveis
- **Neon DB**: Operações, backup, monitoramento
- **IA Providers**: OpenAI, Claude, Gemini
- **GitHub**: Integração com repositório
- **Monitoramento**: Health checks, alertas

### 4.2 Comandos MCP

```bash
# Validação
npm run mcp:validate       # Validar configuração
npm run mcp:setup          # Setup completo
npm run mcp:health-check   # Health check geral

# Testes específicos
npm run mcp:test-railway   # Testar Railway
npm run mcp:test-neon      # Testar Neon DB

# Status
npm run mcp:health-check   # Status geral
```

---

## 🚂 **FASE 5: DEPLOY RAILWAY**

### 5.1 Deploy Manual

```bash
# 1. Build da aplicação
npm run build

# 2. Deploy para Railway
railway up

# 3. Verificar status
railway status

# 4. Ver logs
railway logs --follow
```

### 5.2 Deploy Automatizado

```bash
# Deploy completo automatizado
npm run railway:deploy

# Deploy para ambiente específico
npm run railway:deploy-production
npm run railway:deploy-staging

# Deploy com validação
npm run railway:full-deploy
```

### 5.3 Monitoramento

```bash
# Health check
curl https://seu-app.railway.app/api/health

# Logs em tempo real
railway logs --follow

# Métricas
railway metrics

# Status detalhado
railway status --json
```

---

## 🌿 **FASE 6: CONFIGURAÇÃO NEON DB**

### 6.1 Configuração do Banco

```bash
# 1. Gerar cliente Prisma
npx prisma generate

# 2. Validar schema
npx prisma validate

# 3. Aplicar migrações
npx prisma migrate deploy

# 4. Abrir Prisma Studio
npx prisma studio
```

### 6.2 Pooling e Otimizações

```bash
# Configurações de pool
NEON_POOLED_CONNECTION=true
NEON_MAX_CONNECTIONS=20
NEON_MIN_CONNECTIONS=2
NEON_CONNECTION_TIMEOUT=30000
NEON_IDLE_TIMEOUT=600000
```

### 6.3 Backup e Monitoramento

```bash
# Backup automático (diário às 2h)
# Monitoramento de performance
# Health checks automáticos
# Alertas de conexão
```

---

## 🔄 **FASE 7: CI/CD AUTOMATIZADO**

### 7.1 GitHub Actions

O projeto inclui workflows para:

- **Testes automáticos** em PR
- **Deploy automático** para staging
- **Deploy manual** para produção
- **Backup automático** do banco
- **Monitoramento** de saúde

### 7.2 Triggers

```yaml
# Deploy automático
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch: # Deploy manual
```

---

## 📊 **FASE 8: MONITORAMENTO**

### 8.1 Health Checks

```bash
# Endpoint de saúde
GET /api/health

# Verificar status
npm run monitor:health

# Diagnóstico completo
npm run monitor:diagnostic

# Auto-fix de problemas
npm run monitor:autofix-system
```

### 8.2 Métricas

- **CPU**: Limite 80%
- **Memória**: Limite 85%
- **Response Time**: Limite 2s
- **Error Rate**: Limite 5%
- **Conexões DB**: Limite 18

### 8.3 Alertas

- **Slack**: Notificações de deploy
- **Email**: Alertas críticos
- **Discord**: Status de infraestrutura

---

## 🚨 **FASE 9: TROUBLESHOOTING**

### 9.1 Problemas Comuns

#### Build Falha

```bash
# Limpar cache
npm run clean

# Reinstalar dependências
npm run clean:all

# Verificar Node.js
node --version  # Deve ser 18+
```

#### Database Error

```bash
# Verificar conexão
npm run neon:status

# Verificar variáveis
railway variables get DATABASE_URL

# Testar conexão
npx prisma db execute --stdin --url "$DATABASE_URL" <<< "SELECT 1"
```

#### Railway Deploy Falha

```bash
# Verificar logs
railway logs --tail 100

# Verificar status
railway status

# Rollback
railway rollback

# Restart
railway restart
```

### 9.2 Comandos de Debug

```bash
# Diagnóstico completo
npm run monitor:full-check

# Auto-fix de emergência
npm run monitor:emergency-fix

# Verificar configuração
npm run env:validate-config

# Testar conexões
npm run env:test-connections
```

---

## 📚 **FASE 10: RECURSOS ADICIONAIS**

### 10.1 Documentação

- [README-RAILWAY.md](./README-RAILWAY.md) - Guia Railway
- [README-MCP.md](./README-MCP.md) - Configuração MCP
- [QUICK_START_RAILWAY.md](./QUICK_START_RAILWAY.md) - Início rápido
- [MCP-SETUP-COMPLETE.md](./MCP-SETUP-COMPLETE.md) - Setup MCP

### 10.2 Scripts Úteis

```bash
# Backup do banco
npm run backup

# Otimização de queries
npm run query:analyze

# Setup de ambiente
npm run env:setup

# Validação completa
npm run check
```

### 10.3 Links Úteis

- **Railway**: [Dashboard](https://railway.app/dashboard)
- **Neon**: [Console](https://console.neon.tech)
- **GitHub**: [Actions](https://github.com/features/actions)
- **Prisma**: [Docs](https://www.prisma.io/docs)

---

## 🎯 **CHECKLIST FINAL**

### ✅ **Infraestrutura**

- [ ] Railway CLI instalado e configurado
- [ ] Projeto Railway criado e linkado
- [ ] Variáveis de ambiente configuradas
- [ ] Domínios configurados

### ✅ **Banco de Dados**

- [ ] Neon DB configurado
- [ ] Prisma schema validado
- [ ] Migrações aplicadas
- [ ] Pooling configurado

### ✅ **MCP e IA**

- [ ] Configuração MCP validada
- [ ] Provedores de IA configurados
- [ ] Health checks funcionando
- [ ] Cache configurado

### ✅ **CLI e Ferramentas**

- [ ] Todas as ferramentas CLI instaladas
- [ ] Aliases configurados
- [ ] Scripts npm funcionando
- [ ] Testes passando

### ✅ **Deploy e Monitoramento**

- [ ] Build funcionando
- [ ] Deploy automático configurado
- [ ] Health checks ativos
- [ ] Métricas coletando

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Teste em staging** antes de produção
2. **Configure alertas** para monitoramento
3. **Implemente backup** automático
4. **Configure domínio** customizado
5. **Otimize performance** com métricas

---

## 📞 **SUPORTE**

- **Logs**: `railway logs --follow`
- **Status**: `railway status`
- **Health**: `/api/health`
- **Issues**: [GitHub Issues](https://github.com/seu-repo/issues)

---

**🎯 Objetivo**: Sistema 100% compatível com Railway e Neon DB  
**⚡ Performance**: < 500ms response time, 99.9% uptime  
**🔒 Segurança**: HTTPS, CORS, Rate limiting, Logs estruturados  
**📊 Monitoramento**: Health checks, métricas, alertas automáticos\*\*
