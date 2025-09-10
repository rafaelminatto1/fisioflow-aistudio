<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css)
![AI Integration](https://img.shields.io/badge/AI-OpenAI%20%7C%20Claude%20%7C%20Gemini-green?style=for-the-badge)
![Deploy](https://img.shields.io/badge/Deploy-Digital%20Ocean-0080FF?style=for-the-badge&logo=digitalocean)
![Status](https://img.shields.io/badge/Status-Produção-success?style=for-the-badge)

</div>

# FisioFlow - Sistema de Gestão para Fisioterapia

Sistema completo de gestão para clínicas de fisioterapia com **Inteligência Artificial integrada**, monitoramento avançado e automação completa.

🔗 **View your app in AI Studio**: https://ai.studio/apps/drive/125p-5m7NUy7ahRRmYC8H6aKd6uZ_ryb3

## ⭐ Destaques da Versão Atual

- ✅ **IA Integrada**: Assistente de diagnóstico, gerador de relatórios, predição de faltas
- ✅ **Multi-Provider**: OpenAI, Anthropic (Claude), Google (Gemini)
- ✅ **MCP Integration**: Sistema avançado de gerenciamento de IA
- ✅ **Cache Inteligente**: Performance otimizada com cache distribuído
- ✅ **Deploy Automático**: Configurado para Digital Ocean
- ✅ **Monitoramento**: Health checks e alertas em tempo real

## 🚀 Funcionalidades Principais

- **Gestão de Pacientes**: Cadastro completo, histórico médico, evolução
- **Agendamentos**: Sistema inteligente com notificações automáticas
- **Tratamentos**: Protocolos personalizados, acompanhamento de progresso
- **Financeiro**: Controle de pagamentos, relatórios financeiros
- **Dashboard**: Métricas em tempo real, analytics avançados
- **Inteligência Artificial**: Assistente de diagnóstico, gerador de relatórios, predição de faltas
- **Backup Automático**: Sistema robusto de backup
- **Monitoramento**: Sistema de monitoramento avançado com alertas proativos

## 📋 Pré-requisitos

- Node.js 18+
- Banco de dados PostgreSQL
- Chaves de API para provedores de IA (OpenAI, Anthropic, Google Gemini)
- Digital Ocean Account (para deploy em produção)

## ⚙️ Configuração Inicial

### 1. Instalação de Dependências

```bash
npm install
```

### 2. Configuração do Banco de Dados

1. Configure seu banco PostgreSQL
2. Obtenha as credenciais do banco de dados
3. Configure as variáveis de ambiente:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/fisioflow?sslmode=require"
DIRECT_URL="postgresql://username:password@localhost:5432/fisioflow?sslmode=require"

# AI Provider API Keys (Obrigatório para funcionalidades de IA)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here

# MCP Configuration
MCP_ENABLED=true
MCP_CONFIG_PATH=./mcp.config.json

# Digital Ocean Configuration (para deploy)
DIGITAL_OCEAN_TOKEN=your_digital_ocean_token
CONTEXT7_API_KEY=your_context7_api_key

# Monitoring & Alerts (opcional)
SLACK_WEBHOOK_URL=your_slack_webhook
WEBHOOK_URL=your_notification_webhook
```

### 3. Migração do Banco de Dados

```bash
# Gerar e aplicar migrações
npx prisma migrate dev --name init

# Gerar cliente Prisma
npx prisma generate

# Popular dados iniciais (opcional)
npx prisma db seed
```

### 4. Executar a Aplicação

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 🤖 Integração de Inteligência Artificial

### Funcionalidades de IA Disponíveis

#### 1. Assistente de Diagnóstico
- **Endpoint**: `/api/ai/query`
- **Funcionalidade**: Análise de sintomas e sugestões de diagnóstico
- **Método**: POST
- **Parâmetros**: `{ query: string, context?: string }`

#### 2. Gerador de Relatórios
- **Endpoint**: `/api/ai/query`
- **Funcionalidade**: Geração automática de relatórios médicos
- **Método**: POST
- **Parâmetros**: `{ query: string, type: 'report' }`

#### 3. Predição de Faltas (No-Show)
- **Endpoint**: `/api/ai/predict-noshow`
- **Funcionalidade**: Predição de probabilidade de falta do paciente
- **Método**: POST
- **Parâmetros**: `{ patientId: string, appointmentData: object }`

#### 4. Sugestões de Protocolo
- **Endpoint**: `/api/ai/protocol-suggestions`
- **Funcionalidade**: Sugestões de protocolos de tratamento
- **Método**: POST
- **Parâmetros**: `{ pathology: string, patientProfile: object }`

### Configuração dos Provedores de IA

#### OpenAI (ChatGPT)
```bash
# Obter chave em: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-key-here
```

#### Anthropic (Claude)
```bash
# Obter chave em: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

#### Google (Gemini)
```bash
# Obter chave em: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here
```

### Sistema de Cache e Múltiplos Provedores

- **Cache Inteligente**: Respostas são cacheadas para melhor performance
- **Fallback Automático**: Se um provedor falhar, outro é usado automaticamente
- **Load Balancing**: Distribuição inteligente de requisições
- **Monitoramento**: Tracking de uso e performance de cada provedor

### Testando a Integração de IA

```bash
# Testar endpoint de query
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Paciente com dor lombar há 3 semanas"}'

# Testar predição de no-show
curl -X POST http://localhost:3000/api/ai/predict-noshow \
  -H "Content-Type: application/json" \
  -d '{"patientId": "123", "appointmentData": {"time": "09:00", "type": "consulta"}}'
```

## 🔧 Ferramentas de Administração

### Scripts de Administração

```bash
# Verificar saúde do sistema
npm run health-check

# Executar testes
npm test

# Verificar tipos TypeScript
npm run type-check
```

## 🚀 Deploy em Produção (Digital Ocean)

### Pré-requisitos para Deploy

1. **Conta Digital Ocean**: Crie uma conta em https://digitalocean.com
2. **Token de API**: Gere um token de API no painel da Digital Ocean
3. **Domínio**: Configure um domínio para sua aplicação (opcional)

### Configuração do Deploy

#### 1. Configurar Variáveis de Ambiente

```bash
# Digital Ocean
DIGITAL_OCEAN_TOKEN=your_digital_ocean_token_here
CONTEXT7_API_KEY=your_context7_api_key_here

# Database (Production)
DATABASE_URL="postgresql://username:password@db-host:5432/fisioflow_prod?sslmode=require"
DIRECT_URL="postgresql://username:password@db-host:5432/fisioflow_prod?sslmode=require"

# AI Providers (Production)
GEMINI_API_KEY=your_production_gemini_key
OPENAI_API_KEY=your_production_openai_key
ANTHROPIC_API_KEY=your_production_anthropic_key

# Security
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.com
```

#### 2. Build para Produção

```bash
# Instalar dependências
npm ci

# Gerar cliente Prisma
npx prisma generate

# Build da aplicação
npm run build

# Testar build localmente
npm start
```

#### 3. Deploy Automático

```bash
# Deploy usando GitHub Actions (recomendado)
git push origin main

# Ou deploy manual
npm run deploy:production
```

### Configuração do Banco de Dados em Produção

#### 1. Managed Database (Recomendado)

```bash
# Criar database cluster na Digital Ocean
doctl databases create fisioflow-prod --engine postgres --size db-s-1vcpu-1gb --region nyc3

# Obter string de conexão
doctl databases connection fisioflow-prod
```

#### 2. Executar Migrações

```bash
# Aplicar migrações em produção
DATABASE_URL="your_production_db_url" npx prisma migrate deploy

# Popular dados iniciais (se necessário)
DATABASE_URL="your_production_db_url" npx prisma db seed
```

### Monitoramento em Produção

- **Health Checks**: Configurados automaticamente
- **Logs**: Centralizados no painel da Digital Ocean
- **Alertas**: Notificações via Slack/Email
- **Backup**: Backup automático do banco de dados

### SSL/HTTPS

```bash
# Certificado SSL automático via Let's Encrypt
# Configurado automaticamente no deploy
```

## 📊 Monitoramento e Métricas

### Dashboard de Monitoramento

Acesse: `http://localhost:3000/admin/monitoring`

**Métricas Disponíveis:**

- Performance do banco de dados
- Uso de CPU e memória
- Conexões ativas
- Tempo de resposta das queries
- Alertas de anomalias

### Health Checks

```bash
# Verificar saúde do sistema
curl http://localhost:3000/api/health

# Status da aplicação
curl http://localhost:3000/api/status
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco de Dados

```bash
# Testar conexão
npx prisma db pull

# Verificar status do banco
npx prisma db execute --stdin <<< "SELECT 1;"
```

**Soluções:**
- Verificar se as credenciais estão corretas no `.env`
- Confirmar se o banco PostgreSQL está rodando
- Verificar conectividade de rede e firewall
- Testar conexão direta: `psql $DATABASE_URL`

#### 2. Falha nas Migrações

```bash
# Verificar status das migrações
npx prisma migrate status

# Aplicar migrações pendentes
npx prisma migrate deploy

# Reset do banco (CUIDADO: apaga dados)
npx prisma migrate reset
```

#### 3. Problemas com IA/Provedores

```bash
# Testar configuração de IA
node -e "console.log(process.env.OPENAI_API_KEY ? 'OpenAI OK' : 'OpenAI Missing')"
node -e "console.log(process.env.GEMINI_API_KEY ? 'Gemini OK' : 'Gemini Missing')"

# Testar endpoint de IA
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "teste"}'
```

**Soluções:**
- Verificar se as chaves de API estão corretas
- Confirmar se os provedores estão ativos
- Verificar logs de erro: `npm run logs`
- Testar MCP: `node test-mcp-integration.js`

#### 4. Performance Lenta

```bash
# Verificar índices do banco
npx prisma db pull

# Analisar queries lentas
npm run prisma:studio

# Verificar cache de IA
curl http://localhost:3000/api/health
```

#### 5. Problemas de Deploy

```bash
# Verificar build
npm run build

# Testar em produção localmente
NODE_ENV=production npm start

# Verificar logs do servidor
tail -f /var/log/fisioflow/app.log
```

### Verificação de Saúde do Sistema

```bash
# Health check completo
curl http://localhost:3000/api/health

# Status da aplicação
curl http://localhost:3000/api/status

# Verificar IA
curl http://localhost:3000/api/ai/health

# Verificar banco de dados
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM _prisma_migrations;"
```

## 🔐 Segurança

### Row Level Security (RLS)

O sistema implementa RLS para:

- Isolamento de dados por usuário
- Controle de acesso granular
- Auditoria de operações

### Criptografia

- Backups criptografados com AES-256
- Conexões SSL/TLS obrigatórias
- Chaves de API protegidas

## 📈 CI/CD Pipeline

O projeto inclui pipeline automatizado:

- **Testes**: Validação de código e banco
- **Deploy**: Automático para produção
- **Rollback**: Automático em caso de falha
- **Monitoramento**: Alertas pós-deploy

```bash
# Executar pipeline localmente
npm run ci:test
npm run ci:deploy
```

## 🔧 MCP (Model Context Protocol) Integration

### Configuração Avançada de IA

O FisioFlow utiliza MCP para gerenciamento avançado de provedores de IA:

- **Provedores Suportados**: OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini)
- **Recursos**: Seleção automática de provedor, balanceamento de carga, tracking de uso
- **Configuração**: Arquivo `mcp.config.json` para configurações detalhadas
- **Fallback Inteligente**: Troca automática entre provedores em caso de falha
- **Cache Distribuído**: Sistema de cache para otimizar performance

### Arquivo de Configuração MCP

```json
{
  "providers": {
    "openai": {
      "enabled": true,
      "priority": 1,
      "maxTokens": 4000,
      "temperature": 0.7
    },
    "anthropic": {
      "enabled": true,
      "priority": 2,
      "maxTokens": 8000,
      "temperature": 0.7
    },
    "gemini": {
      "enabled": true,
      "priority": 3,
      "maxTokens": 2000,
      "temperature": 0.7
    }
  },
  "cache": {
    "enabled": true,
    "ttl": 3600,
    "maxSize": 1000
  },
  "fallback": {
    "enabled": true,
    "retries": 3,
    "timeout": 30000
  }
}
```

### Testando Configuração MCP

```bash
# Testar configuração MCP
node test-mcp-integration.js

# Verificar status dos provedores
curl http://localhost:3000/api/ai/providers/status

# Testar fallback
curl -X POST http://localhost:3000/api/ai/test-fallback
```

## 📞 Suporte

Para suporte técnico:

- 📧 Email: suporte@fisioflow.com
- 📱 WhatsApp: +55 11 99999-9999
- 🌐 Documentação: https://docs.fisioflow.com

---

**Desenvolvido com ❤️ para profissionais de fisioterapia**
