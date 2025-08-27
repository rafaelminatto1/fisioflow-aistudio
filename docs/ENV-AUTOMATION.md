# Automação do .env.local

Este documento descreve como usar os scripts de automação para configurar automaticamente o arquivo `.env.local` usando as CLIs do Railway e Neon DB.

## 📋 Visão Geral

Os scripts de automação permitem:
- ✅ Obter credenciais reais do Railway e Neon DB via CLI
- ✅ Atualizar automaticamente o arquivo `.env.local`
- ✅ Validar configurações e testar conexões
- ✅ Verificar status das CLIs e serviços

## 🚀 Início Rápido

### 1. Configuração Automática Completa
```bash
# Configura Railway e Neon DB automaticamente
npm run env:auto-setup
```

### 2. Configuração Individual
```bash
# Apenas Railway
npm run env:setup-railway

# Apenas Neon DB
npm run env:setup-neon
```

### 3. Validação das Configurações
```bash
# Valida todas as configurações e testa conexões
npm run env:validate-config
```

## 📚 Comandos Disponíveis

### Configuração Principal

| Comando | Descrição |
|---------|----------|
| `npm run env:update-from-cli` | Script principal de automação |
| `npm run env:auto-setup` | Configura Railway + Neon DB automaticamente |
| `npm run env:setup-railway` | Configura apenas Railway |
| `npm run env:setup-neon` | Configura apenas Neon DB |

### Verificação e Status

| Comando | Descrição |
|---------|----------|
| `npm run env:verify-cli` | Verifica se as CLIs estão instaladas |
| `npm run env:status` | Mostra status das configurações |
| `npm run env:validate-config` | Valida configurações e testa conexões |
| `npm run env:test-connections` | Testa conexões com Railway e Neon DB |

### Comandos Existentes (Mantidos)

| Comando | Descrição |
|---------|----------|
| `npm run env:setup` | Configuração manual do ambiente |
| `npm run env:export` | Exporta variáveis de ambiente |
| `npm run env:validate` | Validação básica do ambiente |

## 🛠️ Pré-requisitos

### CLIs Necessárias

1. **Railway CLI**
   ```bash
   # Windows (PowerShell)
   iwr https://railway.app/install.ps1 | iex
   
   # macOS/Linux
   curl -fsSL https://railway.app/install.sh | sh
   ```

2. **Neon CLI**
   ```bash
   npm install -g neonctl
   ```

### Login nas CLIs

1. **Railway**
   ```bash
   railway login
   ```

2. **Neon**
   ```bash
   neon auth
   ```

## 📖 Guia Detalhado

### 1. Configuração do Railway

O script `setup-railway.js` automatiza:

- ✅ Verificação da CLI do Railway
- ✅ Login automático (se necessário)
- ✅ Listagem de projetos disponíveis
- ✅ Seleção do projeto
- ✅ Obtenção de credenciais:
  - `RAILWAY_API_KEY`
  - `RAILWAY_PROJECT_ID`
  - `RAILWAY_PRODUCTION_DOMAIN`
  - `RAILWAY_STAGING_DOMAIN`

**Uso:**
```bash
npm run env:setup-railway
```

### 2. Configuração do Neon DB

O script `setup-neon.js` automatiza:

- ✅ Verificação da CLI do Neon
- ✅ Login automático (se necessário)
- ✅ Listagem de projetos disponíveis
- ✅ Seleção do projeto e branch
- ✅ Obtenção de credenciais:
  - `NEON_API_KEY`
  - `NEON_PROJECT_ID`
  - `NEON_DATABASE_URL`
  - `NEON_DATABASE_URL_STAGING`

**Uso:**
```bash
npm run env:setup-neon
```

### 3. Script Principal de Automação

O script `update-env-from-cli.js` combina ambos:

- ✅ Verifica instalação das CLIs
- ✅ Executa configuração do Railway
- ✅ Executa configuração do Neon DB
- ✅ Atualiza o `.env.local`
- ✅ Valida configurações

**Uso:**
```bash
npm run env:update-from-cli
```

### 4. Validação e Testes

O script `validate-env-config.js` verifica:

- ✅ Presença de variáveis obrigatórias
- ✅ Conexão com Railway API
- ✅ Conexão com Neon DB
- ✅ Status das CLIs
- ✅ Relatório detalhado

**Uso:**
```bash
npm run env:validate-config
```

## 🔧 Estrutura dos Scripts

```
scripts/
├── update-env-from-cli.js    # Script principal
├── setup-railway.js          # Configuração Railway
├── setup-neon.js            # Configuração Neon DB
├── env-updater.js           # Utilitário para atualizar .env
└── validate-env-config.js   # Validação e testes
```

## 📝 Variáveis Configuradas

### Railway
```env
RAILWAY_API_KEY=rwy_xxx...
RAILWAY_PROJECT_ID=xxx-xxx-xxx
RAILWAY_PRODUCTION_DOMAIN=myapp.railway.app
RAILWAY_STAGING_DOMAIN=myapp-staging.railway.app
```

### Neon DB
```env
NEON_API_KEY=neon_xxx...
NEON_PROJECT_ID=xxx-xxx-xxx
NEON_DATABASE_URL=postgresql://user:pass@host/db
NEON_DATABASE_URL_STAGING=postgresql://user:pass@host-staging/db
```

## 🚨 Solução de Problemas

### CLI não encontrada
```bash
# Verifica se as CLIs estão instaladas
npm run env:verify-cli
```

### Erro de autenticação
```bash
# Re-autentica no Railway
railway login

# Re-autentica no Neon
neon auth
```

### Validação falha
```bash
# Executa validação detalhada
npm run env:validate-config

# Verifica status atual
npm run env:status
```

### Projeto não encontrado
1. Verifique se você tem acesso ao projeto
2. Execute `railway projects` ou `neon projects list`
3. Confirme o nome/ID do projeto

## 🔄 Fluxo de Trabalho Recomendado

1. **Primeira configuração:**
   ```bash
   npm run env:auto-setup
   npm run env:validate-config
   ```

2. **Atualização de credenciais:**
   ```bash
   npm run env:update-from-cli
   npm run env:test-connections
   ```

3. **Verificação periódica:**
   ```bash
   npm run env:status
   npm run env:validate-config
   ```

## 📊 Relatórios de Validação

O script de validação gera relatórios detalhados:

```
🔍 INICIANDO VALIDAÇÃO DAS CONFIGURAÇÕES DO .env.local
============================================================

🛠️  Verificando instalação das CLIs...
   ✅ Railway CLI: railway 3.x.x
   ✅ Neon CLI: neonctl 1.x.x

🔍 Validando configurações gerais...
   ✅ 3 variáveis configuradas

🚂 Validando configurações do Railway...
   ✅ 4 variáveis configuradas
   🔗 API Test: success - Conectado como User (user@email.com)

🐘 Validando configurações do Neon DB...
   ✅ 4 variáveis configuradas
   🔗 DB Test: success - Conectado ao mydb como user

📊 RELATÓRIO DE VALIDAÇÃO
==================================================

🎯 Status Geral: SUCCESS

📋 Resumo por Categoria:
   🔧 Geral: SUCCESS
   🚂 Railway: SUCCESS
   🐘 Neon DB: SUCCESS

🚀 Próximos Passos:
   • ✅ Configuração completa! Você pode executar: npm run dev
```

## 🔐 Segurança

- ✅ Credenciais são obtidas diretamente das CLIs oficiais
- ✅ Backup automático do `.env.local` antes de modificações
- ✅ Validação de formato das credenciais
- ✅ Não exposição de credenciais em logs

## 🤝 Integração com MCP

Estes scripts complementam a configuração MCP existente:

- ✅ Compatível com `mcp:validate`
- ✅ Integra com `mcp:setup`
- ✅ Suporta `mcp:test-railway` e `mcp:test-neon`

## 📞 Suporte

Se encontrar problemas:

1. Execute `npm run env:validate-config` para diagnóstico
2. Verifique os logs detalhados
3. Confirme que as CLIs estão atualizadas
4. Verifique permissões de acesso aos projetos

---

**Nota:** Esta automação foi criada para simplificar a configuração do ambiente de desenvolvimento. Para produção, sempre revise as credenciais e configurações antes do deploy.