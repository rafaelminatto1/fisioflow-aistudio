<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FisioFlow - Sistema de Gestão para Fisioterapia

Sistema completo de gestão para clínicas de fisioterapia com integração Neon DB, monitoramento
avançado e automação completa.

View your app in AI Studio: https://ai.studio/apps/drive/125p-5m7NUy7ahRRmYC8H6aKd6uZ_ryb3

## 🚀 Funcionalidades Principais

- **Gestão de Pacientes**: Cadastro completo, histórico médico, evolução
- **Agendamentos**: Sistema inteligente com notificações automáticas
- **Tratamentos**: Protocolos personalizados, acompanhamento de progresso
- **Financeiro**: Controle de pagamentos, relatórios financeiros
- **Dashboard**: Métricas em tempo real, analytics avançados
- **Backup Automático**: Sistema robusto com Neon DB snapshots
- **Auto-scaling**: Ajuste automático de recursos com ML
- **Monitoramento**: Alertas proativos e health checks

## 📋 Pré-requisitos

- Node.js 18+
- Conta Neon DB
- Chaves de API para provedores de IA (opcional)

## ⚙️ Configuração Inicial

### 1. Instalação de Dependências

```bash
npm install
```

### 2. Configuração do Neon DB

1. Crie um projeto no [Neon Console](https://console.neon.tech)
2. Obtenha as credenciais do banco de dados
3. Configure as variáveis de ambiente:

```env
# Neon Database Configuration
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
NEON_PROJECT_ID="your-project-id"
NEON_API_KEY="your-api-key"
NEON_BRANCH_ID="main"

# AI Provider API Keys (Opcional)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here

# MCP Configuration
MCP_ENABLED=true
MCP_CONFIG_PATH=./mcp.config.json

# Backup Configuration
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=fisioflow-backups
BACKUP_ENCRYPTION_KEY=your_32_char_encryption_key

# Monitoring & Alerts
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

## 🏛️ Estrutura do Projeto

O projeto segue a estrutura padrão do Next.js App Router, com algumas adições para organização.

-   **`/app`**: Contém todas as rotas da aplicação, incluindo páginas e APIs.
    -   **`/app/api`**: Rotas de API do backend.
    -   **`/app/(auth)`**: Grupo de rotas para autenticação.
    -   **`/app/(dashboard)`**: Grupo de rotas para o painel principal.
-   **`/components`**: Componentes React reutilizáveis.
    -   **`/components/ui`**: Componentes de UI genéricos (botões, inputs, etc.), baseados no `shadcn/ui`.
    -   **`/components/auth`**: Componentes específicos para autenticação.
-   **`/lib`**: Funções utilitárias, configurações e lógica principal.
    -   **`/lib/actions`**: Server Actions do Next.js.
    -   **`/lib/validations`**: Schemas de validação com Zod.
-   **`/contexts`**: Contextos React para gerenciamento de estado global.
-   **`/services`**: Lógica de negócio e comunicação com APIs externas.
-   **`/prisma`**: Schema e migrações do banco de dados.
-   **`/scripts`**: Scripts de manutenção e automação.

Para mais detalhes sobre como contribuir, padrões de código e convenções, consulte nosso [Guia de Contribuição](CONTRIBUTING.md).

## 🔧 Ferramentas de Administração

### Scripts de Backup

```bash
# Backup completo
node scripts/backup.js full

# Backup incremental (usando Neon snapshots)
node scripts/backup.js incremental

# Validar integridade do backup
node scripts/backup.js validate

# Listar snapshots disponíveis
node scripts/backup.js snapshots
```

### Auto-scaling com ML

```bash
# Iniciar monitoramento e auto-scaling
node scripts/neon-autoscaling.js

# Verificar status do scaling
curl http://localhost:3000/api/neon/metrics
```

### Recuperação de Dados

```bash
# Listar backups disponíveis
node scripts/recovery.js list

# Recuperar do backup mais recente
node scripts/recovery.js auto

# Recuperar de snapshot específico
node scripts/recovery.js snapshot <snapshot-id>

# Point-in-time recovery
node scripts/recovery.js point-in-time "2024-01-15T10:30:00Z"
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

# Métricas detalhadas do Neon
curl http://localhost:3000/api/neon/metrics

# Status do auto-scaling
curl http://localhost:3000/api/neon/scaling-status
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Neon DB

```bash
# Verificar conectividade
node scripts/validate-db.js

# Testar conexão direta
npx prisma db pull
```

**Soluções:**

- Verificar se as credenciais estão corretas
- Confirmar se o IP está na whitelist do Neon
- Verificar se o endpoint está ativo

#### 2. Falha nas Migrações

```bash
# Reset do banco (CUIDADO: apaga dados)
npx prisma migrate reset

# Aplicar migrações manualmente
npx prisma db push
```

#### 3. Performance Lenta

```bash
# Analisar queries lentas
node scripts/neon-autoscaling.js --analyze-only

# Verificar índices
npx prisma db pull
```

#### 4. Problemas de Backup

```bash
# Verificar configuração AWS
aws s3 ls s3://fisioflow-backups/

# Testar backup local
node scripts/backup.js full --local-only
```

### Logs e Debugging

```bash
# Logs da aplicação
tail -f logs/app.log

# Logs do auto-scaling
tail -f logs/autoscaling.log

# Logs de backup
tail -f logs/backup.log
```

### Comandos de Emergência

```bash
# Parar auto-scaling
pkill -f "neon-autoscaling"

# Backup de emergência
node scripts/backup.js full --priority=high

# Recuperação rápida
node scripts/recovery.js auto --fast
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
- **Deploy**: Automático para Neon DB
- **Rollback**: Automático em caso de falha
- **Monitoramento**: Alertas pós-deploy

```bash
# Executar pipeline localmente
npm run ci:test
npm run ci:deploy
```

## MCP (Model Context Protocol) Integration

This application supports MCP for enhanced AI provider management:

- **Supported Providers**: OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini)
- **Features**: Automatic provider selection, load balancing, usage tracking
- **Configuration**: See `mcp.config.json` for detailed settings

### Testing MCP Configuration

Run the configuration test:

```bash
node test-mcp-integration.js
```

## 📞 Suporte

Para suporte técnico:

- 📧 Email: suporte@fisioflow.com
- 📱 WhatsApp: +55 11 99999-9999
- 🌐 Documentação: https://docs.fisioflow.com

---

**Desenvolvido com ❤️ para profissionais de fisioterapia**
