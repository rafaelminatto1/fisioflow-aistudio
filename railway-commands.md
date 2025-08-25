# 🚂 Railway CLI - Guia Completo de Comandos

> Referência completa dos comandos Railway CLI com exemplos práticos

## 📋 Índice

- [Instalação e Autenticação](#instalação-e-autenticação)
- [Gerenciamento de Projetos](#gerenciamento-de-projetos)
- [Deploy e Build](#deploy-e-build)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Logs e Monitoramento](#logs-e-monitoramento)
- [Domínios e URLs](#domínios-e-urls)
- [Banco de Dados](#banco-de-dados)
- [Rollback e Recuperação](#rollback-e-recuperação)
- [Desenvolvimento](#desenvolvimento)
- [Configuração Avançada](#configuração-avançada)

---

## 🔐 Instalação e Autenticação

### Instalação
```bash
# Via npm (recomendado)
npm install -g @railway/cli

# Via yarn
yarn global add @railway/cli

# Via homebrew (macOS)
brew install railway

# Verificar instalação
railway --version
railway help
```

### Autenticação
```bash
# Login (abre browser)
railway login

# Login com token
railway login --token <seu-token>

# Verificar usuário logado
railway whoami

# Logout
railway logout

# Verificar status de autenticação
railway auth
```

---

## 🏗️ Gerenciamento de Projetos

### Criação e Configuração
```bash
# Criar novo projeto
railway init
railway init meu-projeto
railway init --template nextjs

# Listar projetos
railway projects
railway projects --json

# Linkar projeto existente
railway link
railway link meu-projeto
railway link --project-id <project-id>

# Informações do projeto
railway info
railway status

# Deslinkar projeto
railway unlink
```

### Configuração de Ambiente
```bash
# Listar ambientes
railway environments

# Criar ambiente
railway environment create staging

# Mudar ambiente
railway environment use production
railway environment use staging

# Deletar ambiente
railway environment delete staging
```

---

## 🚀 Deploy e Build

### Deploy Básico
```bash
# Deploy simples
railway up

# Deploy com logs
railway up --detach

# Deploy de branch específica
railway up --branch main
railway up --branch develop

# Deploy com Dockerfile customizado
railway up --dockerfile Dockerfile.prod

# Deploy com build args
railway up --build-arg NODE_ENV=production
```

### Gerenciamento de Deployments
```bash
# Listar deployments
railway deployments
railway deployments --json
railway deployments --limit 10

# Detalhes de deployment específico
railway deployment <deployment-id>

# Cancelar deployment
railway deployment cancel <deployment-id>

# Restart serviço
railway restart
```

---

## 🔧 Variáveis de Ambiente

### Gerenciamento Básico
```bash
# Listar variáveis
railway variables
railway variables --json
railway variables --environment production

# Definir variável
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="postgresql://..."

# Definir múltiplas variáveis
railway variables set NODE_ENV=production PORT=3000

# Importar de arquivo
railway variables set --from-file .env
railway variables set --from-file .env.production

# Deletar variável
railway variables delete NODE_ENV
railway variables delete DATABASE_URL PORT
```

### Operações Avançadas
```bash
# Exportar variáveis
railway variables --json > variables.json
railway variables > .env.railway

# Copiar variáveis entre ambientes
railway variables copy --from production --to staging

# Backup de variáveis
railway variables backup

# Restaurar variáveis
railway variables restore backup.json
```

---

## 📊 Logs e Monitoramento

### Visualização de Logs
```bash
# Logs em tempo real
railway logs
railway logs --follow
railway logs -f

# Logs com filtro
railway logs --filter "error"
railway logs --filter "database"
railway logs --filter "POST /api"

# Logs por deployment
railway logs --deployment <deployment-id>

# Logs por serviço
railway logs --service web

# Logs com timestamp
railway logs --timestamps

# Limitar número de linhas
railway logs --tail 100
```

### Monitoramento
```bash
# Métricas de uso
railway usage
railway usage --json

# Métricas detalhadas
railway metrics
railway metrics --service web

# Status do serviço
railway status
railway ping

# Health check
railway health
```

---

## 🌐 Domínios e URLs

### Gerenciamento de Domínios
```bash
# Ver domínio atual
railway domain
railway url

# Adicionar domínio customizado
railway domain add meusite.com
railway domain add api.meusite.com

# Listar domínios
railway domains

# Remover domínio
railway domain remove meusite.com

# Configurar subdomínio
railway domain add --subdomain api
```

### URLs e Certificados
```bash
# Gerar URL temporária
railway url --generate

# Verificar certificado SSL
railway ssl check meusite.com

# Renovar certificado
railway ssl renew meusite.com
```

---

## 🗄️ Banco de Dados

### Conexão e Gerenciamento
```bash
# Conectar ao banco
railway connect postgres
railway connect mysql
railway connect redis

# Executar query
railway db query "SELECT * FROM users LIMIT 10;"

# Dump do banco
railway db dump > backup.sql

# Restaurar banco
railway db restore backup.sql

# Migração
railway run "npx prisma migrate deploy"
railway run "npm run migrate"
```

### Backup e Restore
```bash
# Backup automático
railway db backup
railway db backup --schedule daily

# Listar backups
railway db backups

# Restaurar backup
railway db restore --backup <backup-id>
```

---

## ⏪ Rollback e Recuperação

### Rollback
```bash
# Rollback para deployment anterior
railway rollback

# Rollback para deployment específico
railway rollback <deployment-id>

# Listar deployments para rollback
railway deployments --rollback

# Rollback com confirmação
railway rollback --confirm
```

### Recuperação
```bash
# Restart serviço
railway restart
railway restart --force

# Rebuild
railway rebuild

# Redeploy
railway redeploy
railway redeploy <deployment-id>
```

---

## 💻 Desenvolvimento

### Execução Local
```bash
# Executar comando no container
railway run "npm start"
railway run "npm run migrate"
railway run "node scripts/seed.js"

# Shell no container
railway shell
railway shell --service web

# Executar localmente com variáveis Railway
railway run --local "npm run dev"
```

### Sincronização
```bash
# Conectar com GitHub
railway connect github
railway connect github --repo meu-usuario/meu-repo

# Desconectar GitHub
railway disconnect github

# Sincronizar código
railway sync
```

---

## ⚙️ Configuração Avançada

### Configuração Global
```bash
# Ver configuração
railway config
railway config --json

# Definir configuração
railway config set editor=code
railway config set region=us-west1

# Resetar configuração
railway config reset
```

### Debug e Troubleshooting
```bash
# Modo debug
RAILWAY_DEBUG=1 railway up
RAILWAY_DEBUG=1 railway logs

# Verificar conectividade
railway ping
railway doctor

# Limpar cache
railway cache clear

# Atualizar CLI
npm update -g @railway/cli
railway update
```

### Plugins e Extensões
```bash
# Listar plugins
railway plugins

# Instalar plugin
railway plugin install postgres
railway plugin install redis
railway plugin install mongodb

# Remover plugin
railway plugin remove postgres
```

---

## 🔍 Comandos de Ajuda

```bash
# Ajuda geral
railway help
railway --help

# Ajuda de comando específico
railway help deploy
railway deploy --help

# Versão
railway --version
railway version

# Documentação
railway docs
railway docs deploy
```

---

## 📝 Exemplos Práticos

### Deploy Completo
```bash
# 1. Setup inicial
railway login
railway init fisioflow

# 2. Configurar variáveis
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="postgresql://..."

# 3. Deploy
railway up --detach

# 4. Monitorar
railway logs --follow
```

### Troubleshooting
```bash
# Verificar status
railway status
railway ping

# Ver logs de erro
railway logs --filter "error" --tail 50

# Restart se necessário
railway restart

# Rollback se crítico
railway rollback
```

### Manutenção
```bash
# Backup antes de mudanças
railway db backup
railway variables backup

# Deploy com validação
railway up --detach
railway logs --follow
curl $(railway url)/health

# Monitorar métricas
railway usage
railway metrics
```

---

## 🚨 Comandos de Emergência

```bash
# Parar serviço imediatamente
railway stop

# Rollback rápido
railway rollback --confirm

# Restart forçado
railway restart --force

# Logs de erro crítico
railway logs --filter "FATAL|ERROR|CRITICAL" --tail 100

# Status de todos os serviços
railway status --all
```

---

**📚 Documentação Oficial**: [docs.railway.app](https://docs.railway.app)
**🆘 Suporte**: [help.railway.app](https://help.railway.app)
**💬 Comunidade**: [Discord Railway](https://discord.gg/railway)