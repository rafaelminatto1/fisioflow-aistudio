# 🚂 FisioFlow - Railway Deployment

> Guia rápido para deploy em produção no Railway

## 🚀 Deploy Rápido

```bash
# 1. Login no Railway
railway login

# 2. Conectar ao projeto
railway link

# 3. Configurar variáveis essenciais
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="sua-url-neon-aqui"
railway variables set NEXTAUTH_SECRET="seu-secret-super-seguro"
railway variables set NEXTAUTH_URL="https://seu-dominio.railway.app"

# 4. Deploy
railway up

# 5. Verificar
railway logs
curl https://seu-dominio.railway.app/health
```

## 📋 Checklist Pré-Deploy

- [ ] Conta Railway criada
- [ ] Banco Neon configurado
- [ ] Variáveis de ambiente definidas
- [ ] GitHub Actions configurado
- [ ] Testes passando (`npm run check`)
- [ ] Build funcionando (`npm run build`)

## 🛠️ Railway CLI - Deploy Automatizado

### 📦 Instalação e Setup

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Verificar instalação
railway --version

# Login (abre browser)
railway login

# Verificar login
railway whoami
```

### 🚀 Deploy com Script Automatizado

```bash
# Deploy completo automatizado
node scripts/railway-cli-deploy.js

# Ou usando npm
npm run deploy:railway-cli
```

**O script automatizado faz:**
- ✅ Verifica instalação do Railway CLI
- ✅ Valida login automático
- ✅ Cria/linka projeto
- ✅ Configura variáveis de ambiente
- ✅ Executa validações pré-deploy
- ✅ Realiza deploy
- ✅ Executa health checks

### 📋 Comandos Step-by-Step

#### 1. **Setup Inicial**
```bash
# Criar novo projeto
railway init fisioflow

# Ou linkar projeto existente
railway link fisioflow

# Verificar status
railway status
```

#### 2. **Configurar Variáveis**
```bash
# Definir variáveis uma por vez
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="postgresql://..."
railway variables set NEXTAUTH_SECRET="seu-secret"

# Ou importar de arquivo
railway variables set --from-file .env.production

# Listar variáveis
railway variables

# Deletar variável
railway variables delete VARIABLE_NAME
```

#### 3. **Deploy e Monitoramento**
```bash
# Deploy simples
railway up

# Deploy com logs
railway up --detach
railway logs --follow

# Deploy de branch específica
railway up --branch main

# Deploy com build customizado
railway up --dockerfile Dockerfile.prod
```

#### 4. **Gerenciamento**
```bash
# Ver logs em tempo real
railway logs --follow

# Logs com filtro
railway logs --filter "error"
railway logs --filter "database"

# Status detalhado
railway status

# Informações do projeto
railway info

# Listar deployments
railway deployments
```

#### 5. **Domínio e URLs**
```bash
# Ver domínio atual
railway domain

# Configurar domínio customizado
railway domain add meudominio.com

# Remover domínio
railway domain remove meudominio.com

# Gerar URL temporária
railway url
```

#### 6. **Rollback e Recuperação**
```bash
# Listar deployments
railway deployments

# Rollback para deployment anterior
railway rollback

# Rollback para deployment específico
railway rollback <deployment-id>

# Restart serviço
railway restart
```

### 🔧 Comandos Úteis para Desenvolvimento

```bash
# Conectar ao banco via Railway
railway connect postgres

# Executar comando no container
railway run "npm run migrate"

# Shell no container
railway shell

# Baixar variáveis para .env local
railway variables --json > .env.railway

# Sincronizar com GitHub
railway connect github

# Desconectar projeto
railway unlink
```

### 🚨 Troubleshooting CLI

```bash
# Verificar conectividade
railway ping

# Limpar cache
railway logout
railway login

# Debug mode
RAILWAY_DEBUG=1 railway up

# Verificar configuração
railway config

# Atualizar CLI
npm update -g @railway/cli
```

### 📊 Monitoramento via CLI

```bash
# Métricas de uso
railway usage

# Health check manual
curl $(railway url)/api/health

# Verificar build logs
railway logs --deployment <deployment-id>

# Monitorar recursos
railway metrics
```

## 🔧 Variáveis Essenciais

```bash
# Aplicação
NODE_ENV=production
NEXTAUTH_URL=https://seu-dominio.railway.app
NEXTAUTH_SECRET=seu-secret-aqui

# Database (Neon)
DATABASE_URL=postgresql://user:pass@host:5432/db
NEON_POOLED_CONNECTION=true
DATABASE_POOL_SIZE=20

# Railway
RAILWAY_STRUCTURED_LOGGING=true
RAILWAY_METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true
```

## 📊 Monitoramento

```bash
# Health Check
curl https://seu-dominio.railway.app/health

# Logs em tempo real
railway logs --follow

# Status do projeto
railway status

# Métricas de uso
railway usage
```

## 🔄 Deploy Automático (GitHub Actions)

1. **Configurar Secrets no GitHub:**
   ```
   RAILWAY_TOKEN=seu-token
   RAILWAY_PROJECT_ID=seu-project-id
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=seu-secret
   ```

2. **Push para main:**
   ```bash
   git add .
   git commit -m "deploy: railway production"
   git push origin main
   ```

## 🚨 Troubleshooting Rápido

### Build Falha
```bash
npm run clean
npm install
npm run build
```

### Database Error
```bash
railway variables get DATABASE_URL
npx prisma db pull
```

### Memory Issues
```bash
railway logs --filter "memory"
railway variables set RAILWAY_MAX_MEMORY 1024
```

### Rollback
```bash
railway rollback
railway status
```

## 📁 Arquivos de Configuração

- `railway.json` - Configuração principal
- `railway.toml` - Configurações avançadas
- `Dockerfile` - Container otimizado
- `.github/workflows/railway-deploy.yml` - CI/CD
- `scripts/deploy-railway.js` - Deploy automatizado

## 🔗 Links Úteis

- [Railway Dashboard](https://railway.app/dashboard)
- [Neon Console](https://console.neon.tech)
- [Documentação Completa](./docs/railway-deployment-guide.md)
- [Railway CLI Docs](https://docs.railway.app/develop/cli)

## 📞 Suporte

- **Logs**: `railway logs`
- **Status**: `railway status`
- **Health**: `/health`
- **Docs**: [Guia Completo](./docs/railway-deployment-guide.md)

---

**🎯 Objetivo**: Deploy em produção otimizado e monitorado
**⚡ Performance**: < 500ms response time, 99.9% uptime
**🔒 Segurança**: HTTPS, CORS, Rate limiting, Logs estruturados