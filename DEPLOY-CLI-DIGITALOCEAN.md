# 🚀 Deploy Automatizado - DigitalOcean CLI

**FisioFlow AI Studio - Sistema Completo de Deploy Automatizado**

## 📋 Visão Geral

Este sistema oferece deploy completamente automatizado para o DigitalOcean App Platform usando CLI (doctl) e scripts Node.js. Inclui instalação automática, configuração de variáveis de ambiente, monitoramento em tempo real e health checks.

## 🎯 Funcionalidades

- ✅ **Instalação automática** do DigitalOcean CLI (doctl)
- ✅ **Autenticação automática** com DigitalOcean
- ✅ **Deploy automatizado** usando arquivo `.do/app.yaml`
- ✅ **Configuração automática** de variáveis de ambiente
- ✅ **Monitoramento em tempo real** do processo de deploy
- ✅ **Health checks automatizados** pós-deploy
- ✅ **Relatórios detalhados** de status e performance
- ✅ **Logs automáticos** em caso de erro

## 📁 Estrutura dos Scripts

```
scripts/
├── setup-doctl.js                    # Instalação e configuração do CLI
├── deploy-digitalocean-cli.js         # Script principal de deploy
├── setup-env-digitalocean.js          # Configuração de variáveis de ambiente
└── monitor-deploy-digitalocean.js     # Monitoramento e health checks

.do/
└── app.yaml                          # Configuração da aplicação DigitalOcean

digitalocean-env-config.json          # Configuração de variáveis (gerado)
.env.local                            # Variáveis locais (gerado)
```

## 🚀 Guia de Uso Rápido

### 1. Instalação e Configuração Inicial

```bash
# Instalar dependências
npm install

# Configurar DigitalOcean CLI
node scripts/setup-doctl.js
```

### 2. Configurar Variáveis de Ambiente

```bash
# Configuração interativa de todas as variáveis
node scripts/setup-env-digitalocean.js
```

### 3. Deploy Completo

```bash
# Deploy automatizado completo
node scripts/deploy-digitalocean-cli.js
```

### 4. Monitoramento (Opcional)

```bash
# Monitoramento completo
node scripts/monitor-deploy-digitalocean.js

# Monitoramento contínuo por 10 minutos
node scripts/monitor-deploy-digitalocean.js continuous 600000

# Health check único
node scripts/monitor-deploy-digitalocean.js health
```

## 📖 Guia Detalhado

### Passo 1: Configuração do DigitalOcean CLI

#### Execução Automática
```bash
node scripts/setup-doctl.js
```

#### O que o script faz:
- ✅ Verifica se o `doctl` já está instalado
- ✅ Instala automaticamente para Windows/macOS/Linux
- ✅ Configura autenticação com DigitalOcean
- ✅ Verifica conectividade e permissões
- ✅ Testa comandos básicos

#### Instalação Manual (se necessário):

**Windows (PowerShell):**
```powershell
# Via Chocolatey
choco install doctl

# Via Scoop
scoop install doctl

# Download direto
Invoke-WebRequest -Uri "https://github.com/digitalocean/doctl/releases/latest/download/doctl-1.104.0-windows-amd64.zip" -OutFile "doctl.zip"
Expand-Archive doctl.zip
Move-Item doctl\doctl.exe C:\Windows\System32\
```

**macOS:**
```bash
# Via Homebrew
brew install doctl

# Via MacPorts
sudo port install doctl
```

**Linux:**
```bash
# Via Snap
sudo snap install doctl

# Via APT (Ubuntu/Debian)
wget https://github.com/digitalocean/doctl/releases/latest/download/doctl-1.104.0-linux-amd64.tar.gz
tar xf doctl-1.104.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin
```

#### Autenticação Manual:
```bash
# Obter token em: https://cloud.digitalocean.com/account/api/tokens
doctl auth init

# Verificar autenticação
doctl account get
```

### Passo 2: Configuração de Variáveis de Ambiente

#### Execução Interativa
```bash
node scripts/setup-env-digitalocean.js
```

#### Variáveis Configuradas:

**🔴 Obrigatórias:**
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`
- `PORT=3000`
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Gerado automaticamente (32 chars)
- `NEXTAUTH_URL` - URL da aplicação

**🤖 APIs de IA (Opcionais):**
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Claude API key
- `GOOGLE_API_KEY` - Gemini API key

**💳 Pagamentos (Opcionais):**
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

**🏗️ Infraestrutura (Opcionais):**
- `REDIS_URL` - Redis connection string
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email config
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` - AWS config

**🔐 Geradas Automaticamente:**
- `JWT_SECRET` - JWT signing key
- `ENCRYPTION_KEY` - Data encryption key
- `SESSION_SECRET` - Session signing key
- `API_SECRET` - API authentication key

#### Arquivos Gerados:
- `digitalocean-env-config.json` - Configuração completa
- `.env.local` - Variáveis para desenvolvimento local

### Passo 3: Deploy Automatizado

#### Execução Completa
```bash
node scripts/deploy-digitalocean-cli.js
```

#### Processo de Deploy:

1. **🔍 Verificações Iniciais**
   - Autenticação DigitalOcean
   - Arquivo `.do/app.yaml` existe
   - Configuração de variáveis carregada

2. **📋 Configuração da Aplicação**
   - Carrega configuração do `.do/app.yaml`
   - Valida configurações obrigatórias
   - Prepara especificação da aplicação

3. **🚀 Deploy da Aplicação**
   - Cria aplicação (se não existir)
   - Atualiza aplicação existente
   - Configura todas as variáveis de ambiente
   - Inicia processo de deploy

4. **📊 Monitoramento**
   - Acompanha progresso em tempo real
   - Mostra logs de deploy
   - Detecta erros automaticamente

5. **🏥 Health Checks**
   - Testa conectividade básica
   - Executa health checks da API
   - Valida funcionamento completo

6. **📈 Relatório Final**
   - Resumo do deployment
   - URLs de acesso
   - Estatísticas de performance
   - Próximos passos

#### Exemplo de Saída:
```
🔧 DEPLOY AUTOMATIZADO DIGITALOCEAN
FisioFlow AI Studio - Deploy Completo

[14:30:15] ℹ️ 🔍 Verificando autenticação DigitalOcean...
[14:30:16] ✅ Autenticação DigitalOcean OK
[14:30:16] ℹ️ 📋 Carregando configuração do app.yaml...
[14:30:16] ✅ Configuração carregada: fisioflow-aistudio
[14:30:17] ℹ️ 🔍 Procurando aplicação existente...
[14:30:18] ✅ Aplicação encontrada: fisioflow-aistudio (abc123)
[14:30:18] ℹ️ 🚀 Iniciando deploy da aplicação...
[14:30:20] 🚀 Deploy PENDING_DEPLOY - Progresso: N/A
[14:30:30] 🚀 Deploy DEPLOYING - Progresso: 25%
[14:30:40] 🚀 Deploy DEPLOYING - Progresso: 50%
[14:30:50] 🚀 Deploy DEPLOYING - Progresso: 75%
[14:31:00] 🚀 Deploy ACTIVE - Progresso: 100%
[14:31:00] ✅ 🎉 Deploy concluído com sucesso!
[14:31:05] 🏥 Health check OK (245ms) - Status: 200
[14:31:10] 🏥 Health check OK (198ms) - Status: 200
[14:31:15] 🏥 Health check OK (203ms) - Status: 200

============================================================
📊 RESUMO DO DEPLOYMENT
============================================================
⏱️  Duração total: 0m 45s
🚀 Estágios do deployment: 4
🏥 Health checks realizados: 3
✅ Sucessos: 3
❌ Falhas: 0
📈 Taxa de sucesso: 100.0%

🌐 URL da aplicação: https://fisioflow-aistudio.ondigitalocean.app
🔗 Health check: https://fisioflow-aistudio.ondigitalocean.app/api/health
============================================================
```

### Passo 4: Monitoramento Avançado

#### Monitoramento Completo
```bash
node scripts/monitor-deploy-digitalocean.js
```

#### Monitoramento Contínuo
```bash
# 5 minutos (padrão)
node scripts/monitor-deploy-digitalocean.js continuous

# 10 minutos
node scripts/monitor-deploy-digitalocean.js continuous 600000

# 1 hora
node scripts/monitor-deploy-digitalocean.js continuous 3600000
```

#### Health Check Único
```bash
node scripts/monitor-deploy-digitalocean.js health
```

#### Visualizar Logs
```bash
# Últimos 50 logs (padrão)
node scripts/monitor-deploy-digitalocean.js logs

# Últimos 100 logs
node scripts/monitor-deploy-digitalocean.js logs 100
```

## 🔧 Configuração Avançada

### Personalizar app.yaml

O arquivo `.do/app.yaml` pode ser personalizado:

```yaml
name: fisioflow-aistudio
services:
- name: web
  source_dir: /
  github:
    repo: seu-usuario/fisioflow-aistudio
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
  health_check:
    http_path: /api/health
    initial_delay_seconds: 60
    period_seconds: 10
    timeout_seconds: 5
    success_threshold: 1
    failure_threshold: 3
  envs:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "3000"
```

### Scripts NPM Personalizados

Adicione ao `package.json`:

```json
{
  "scripts": {
    "deploy:setup": "node scripts/setup-doctl.js",
    "deploy:env": "node scripts/setup-env-digitalocean.js",
    "deploy:full": "node scripts/deploy-digitalocean-cli.js",
    "deploy:monitor": "node scripts/monitor-deploy-digitalocean.js",
    "deploy:health": "node scripts/monitor-deploy-digitalocean.js health",
    "deploy:logs": "node scripts/monitor-deploy-digitalocean.js logs",
    "deploy:all": "npm run deploy:setup && npm run deploy:env && npm run deploy:full"
  }
}
```

Uso:
```bash
npm run deploy:all      # Setup completo
npm run deploy:full     # Deploy apenas
npm run deploy:monitor  # Monitoramento
npm run deploy:health   # Health check
npm run deploy:logs     # Ver logs
```

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Erro de Autenticação
```
❌ Erro de autenticação. Execute: doctl auth init
```

**Solução:**
```bash
# Obter novo token em: https://cloud.digitalocean.com/account/api/tokens
doctl auth init

# Verificar
doctl account get
```

#### 2. Aplicação Não Encontrada
```
❌ Aplicação não encontrada
```

**Solução:**
```bash
# Listar aplicações
doctl apps list

# Criar nova aplicação
doctl apps create .do/app.yaml
```

#### 3. Deploy Falhou
```
❌ Deploy falhou: ERROR
```

**Solução:**
```bash
# Ver logs detalhados
node scripts/monitor-deploy-digitalocean.js logs 100

# Verificar configuração
cat .do/app.yaml

# Verificar variáveis
cat digitalocean-env-config.json
```

#### 4. Health Check Falhou
```
❌ Health check erro: ECONNREFUSED
```

**Solução:**
```bash
# Verificar se aplicação está rodando
doctl apps list

# Verificar logs da aplicação
doctl apps logs <app-id> --type run

# Testar URL manualmente
curl https://sua-app.ondigitalocean.app/api/health
```

#### 5. Variáveis de Ambiente
```
❌ Variável obrigatória ausente: DATABASE_URL
```

**Solução:**
```bash
# Reconfigurar variáveis
node scripts/setup-env-digitalocean.js

# Verificar arquivo gerado
cat digitalocean-env-config.json

# Aplicar manualmente
doctl apps update-env <app-id> "DATABASE_URL=postgresql://..."
```

### Logs e Debug

#### Habilitar Debug Detalhado
```bash
# Variável de ambiente para debug
export DEBUG=1
node scripts/deploy-digitalocean-cli.js
```

#### Verificar Status da Aplicação
```bash
# Status geral
doctl apps list

# Detalhes da aplicação
doctl apps get <app-id>

# Deployments
doctl apps list-deployments <app-id>

# Logs em tempo real
doctl apps logs <app-id> --type run --follow
```

#### Verificar Configuração
```bash
# Variáveis de ambiente
doctl apps get <app-id> --format Spec.Envs

# Configuração completa
doctl apps get <app-id> --format Spec
```

## 📚 Referências

### Documentação Oficial
- [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform/)
- [doctl CLI Reference](https://docs.digitalocean.com/reference/doctl/)
- [App Spec Reference](https://docs.digitalocean.com/products/app-platform/reference/app-spec/)

### Comandos Úteis

```bash
# Informações da conta
doctl account get

# Listar todas as aplicações
doctl apps list

# Criar aplicação
doctl apps create .do/app.yaml

# Atualizar aplicação
doctl apps update <app-id> .do/app.yaml

# Deletar aplicação
doctl apps delete <app-id>

# Ver logs
doctl apps logs <app-id> --type run

# Configurar variável
doctl apps update-env <app-id> "KEY=value"

# Listar deployments
doctl apps list-deployments <app-id>

# Cancelar deployment
doctl apps cancel-deployment <app-id> <deployment-id>
```

### URLs Importantes

- **DigitalOcean Console:** https://cloud.digitalocean.com/
- **API Tokens:** https://cloud.digitalocean.com/account/api/tokens
- **App Platform:** https://cloud.digitalocean.com/apps
- **Documentação:** https://docs.digitalocean.com/
- **Status Page:** https://status.digitalocean.com/

## 🎯 Próximos Passos

Após o deploy bem-sucedido:

1. **🔒 Configurar Domínio Personalizado**
   ```bash
   doctl apps update <app-id> --spec .do/app.yaml
   ```

2. **📊 Configurar Monitoramento**
   - Uptime monitoring
   - Error tracking
   - Performance monitoring

3. **🔐 Configurar SSL/HTTPS**
   - Certificados automáticos
   - Redirecionamento HTTPS

4. **📈 Scaling**
   - Auto-scaling rules
   - Load balancing
   - Database scaling

5. **🔄 CI/CD Pipeline**
   - GitHub Actions
   - Automated testing
   - Staged deployments

## 📞 Suporte

Em caso de problemas:

1. **Verificar logs:** `npm run deploy:logs`
2. **Health check:** `npm run deploy:health`
3. **Reconfigurar:** `npm run deploy:env`
4. **Deploy completo:** `npm run deploy:full`

---

**FisioFlow AI Studio** - Sistema de Deploy Automatizado v1.0

*Desenvolvido com ❤️ para simplificar deployments no DigitalOcean*