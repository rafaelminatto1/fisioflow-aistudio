# MCP Configuration for FisioFlow

## Visão Geral

Este documento descreve como configurar e usar o Model Context Protocol (MCP) para integração com
Railway e Neon DB no projeto FisioFlow.

## 🚀 Configuração Rápida

### 1. Copiar Variáveis de Ambiente

```bash
cp .env.mcp.example .env.local
```

### 2. Preencher as Variáveis

Edite o arquivo `.env.local` com suas credenciais reais:

```bash
# Railway
RAILWAY_API_KEY=your_actual_railway_api_key
RAILWAY_PROJECT_ID=your_actual_project_id

# Neon DB
NEON_API_KEY=your_actual_neon_api_key
DATABASE_URL=your_actual_database_url
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Validar Configuração

```bash
npm run mcp:validate
```

## 📋 Comandos Disponíveis

### Validação e Setup

```bash
# Validar toda a configuração MCP
npm run mcp:validate

# Setup completo (validação + env)
npm run mcp:setup

# Testar apenas Railway
npm run mcp:test-railway

# Testar apenas Neon DB
npm run mcp:test-neon

# Health check geral
npm run mcp:health-check
```

### Neon DB Específicos

```bash
# Status da conexão
npm run neon:status

# Backup manual
npm run neon:backup

# Manutenção do banco
npm run neon:maintenance
```

### Railway Específicos

```bash
# Deploy para produção
npm run railway:deploy-production

# Deploy para staging
npm run railway:deploy-staging

# Ver logs
npm run railway:logs

# Status dos serviços
npm run railway:status
```

## 🔧 Configuração Detalhada

### Railway API Key

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Vá em **Account Settings** → **Tokens**
3. Clique em **Create New Token**
4. Copie o token (formato: `railway_xxxxx`)

### Neon DB API Key

1. Acesse [Neon Console](https://console.neon.tech/)
2. Vá em **Account Settings** → **API Keys**
3. Clique em **Create API Key**
4. Copie a chave gerada

### Database URL

1. No Neon Console, vá para seu projeto
2. Clique em **Connection Details**
3. Copie a **Connection String**
4. Certifique-se que inclui `?sslmode=require`

## 📊 Estrutura do MCP Config

O arquivo `mcp.config.json` contém:

```json
{
  "providers": {
    "railway": {
      "name": "Railway Platform",
      "type": "infrastructure",
      "enabled": true,
      "services": {
        "deploy": { ... },
        "monitoring": { ... },
        "environment": { ... }
      }
    },
    "neondb": {
      "name": "Neon Database",
      "type": "database",
      "enabled": true,
      "operations": {
        "backup": { ... },
        "monitoring": { ... },
        "maintenance": { ... }
      }
    }
  }
}
```

## 🔍 Tipos de Query Suportados

### Infrastructure Queries

- `deploy_management`: Gerenciamento de deploys
- `infrastructure_monitoring`: Monitoramento de infraestrutura
- `environment_config`: Configuração de ambiente

### Database Queries

- `database_operations`: Operações de banco de dados
- `database_monitoring`: Monitoramento de banco
- `backup_restore`: Backup e restore

## ⚡ Cache e Performance

### TTL por Tipo de Query

| Tipo                      | TTL (segundos) | Descrição              |
| ------------------------- | -------------- | ---------------------- |
| deploy_management         | 300            | Status de deploy       |
| infrastructure_monitoring | 60             | Métricas em tempo real |
| database_operations       | 600            | Operações de banco     |
| database_monitoring       | 120            | Monitoramento DB       |
| backup_restore            | 1800           | Status de backup       |
| environment_config        | 3600           | Configurações          |

### Rate Limits

- **Railway**: 100 requests/min, 10 deploys/hora
- **Neon DB**: 1000 requests/min, 50 conexões/min

## 🛡️ Segurança

### Autenticação

- **Railway**: Bearer Token com refresh automático
- **Neon DB**: API Key com SSL obrigatório

### Validações

- ✅ Validação automática de API keys
- ✅ Rate limiting por usuário
- ✅ SSL obrigatório para conexões DB
- ✅ Timeout e retry configuráveis

## 🔄 Health Checks

### Endpoints Monitorados

- **Railway**: `https://backboard.railway.app/health`
- **Neon DB**: `${NEON_DB_HOST}:5432`

### Configuração

- Intervalo: 5 minutos
- Timeout: 10 segundos
- Retries: 3 tentativas

## 📈 Monitoramento

### Métricas Coletadas

- Latência de requests
- Taxa de erro
- Uso de recursos
- Status de conexões

### Alertas Configurados

- CPU > 80%
- Memória > 85%
- Taxa de erro > 5%
- Conexões DB > 18
- Queries lentas > 5000ms
- Storage > 80%

## 🐛 Troubleshooting

### Problemas Comuns

#### ❌ "Railway API connection failed"

```bash
# Verificar API key
echo $RAILWAY_API_KEY

# Testar conexão
npm run mcp:test-railway
```

#### ❌ "Neon DB connection failed"

```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Testar conexão
npm run mcp:test-neon
```

#### ❌ "Rate limit exceeded"

```bash
# Aguardar reset do limite
# Verificar configuração de cache
npm run mcp:validate
```

### Logs

Os logs são salvos em:

- **Console**: Tempo real
- **Arquivo**: `logs/mcp-infrastructure.log`
- **Rotação**: Automática a cada 100MB

### Comandos de Debug

```bash
# Verificar status geral
npm run mcp:health-check

# Logs detalhados do Railway
npm run railway:logs

# Status detalhado
npm run railway:status-detailed

# Verificar variáveis
npm run railway:vars
```

## 📚 Documentação Adicional

- [MCP Infrastructure Guide](./docs/MCP-INFRASTRUCTURE.md)
- [Railway CLI Commands](./railway-commands.md)
- [Railway Setup Guide](./README-RAILWAY.md)

## 🤝 Suporte

Para problemas ou dúvidas:

1. Execute `npm run mcp:validate` para diagnóstico
2. Verifique os logs em `logs/mcp-infrastructure.log`
3. Consulte a documentação específica
4. Abra uma issue no repositório

---

**Nota**: Mantenha suas API keys seguras e nunca as commite no repositório. Use sempre o arquivo
`.env.local` para credenciais reais.
