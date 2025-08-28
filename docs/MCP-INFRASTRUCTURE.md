# MCP Infrastructure Configuration

## Visão Geral

Este documento descreve a configuração do Model Context Protocol (MCP) para integração com Railway e
Neon DB no projeto FisioFlow.

## Configuração do Railway

### Variáveis de Ambiente Necessárias

```bash
# Railway API Configuration
RAILWAY_API_KEY=your_railway_api_key_here
RAILWAY_PROJECT_ID=your_project_id_here
RAILWAY_REFRESH_TOKEN=your_refresh_token_here
RAILWAY_PRODUCTION_DOMAIN=your_production_domain.railway.app
RAILWAY_STAGING_DOMAIN=your_staging_domain.railway.app
```

### Funcionalidades Disponíveis

#### Deploy Management

- Deploy automático via API
- Configuração de ambientes (production/staging)
- Gerenciamento de variáveis de ambiente
- Controle de builds e deploys

#### Monitoring

- Métricas de CPU, memória, rede e disco
- Alertas configuráveis
- Logs em tempo real
- Status de saúde dos serviços

#### Environment Configuration

- Gerenciamento de variáveis por ambiente
- Configuração de domínios
- SSL/TLS automático

### Rate Limits

- 100 requests por minuto
- 10 deploys por hora
- Timeout de 60 segundos
- 3 tentativas de retry

## Configuração do Neon DB

### Variáveis de Ambiente Necessárias

```bash
# Neon DB API Configuration
NEON_API_KEY=your_neon_api_key_here
NEON_PROJECT_ID=your_neon_project_id_here
NEON_DB_HOST=your_db_host.neon.tech
NEON_DB_NAME=your_database_name
NEON_DB_USER=your_db_user
NEON_DB_PASSWORD=your_db_password

# Database Connection
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
STAGING_DATABASE_URL=postgresql://user:password@staging_host:5432/staging_db?sslmode=require
```

### Funcionalidades Disponíveis

#### Database Operations

- Backup automático (diário às 2:00 AM)
- Restore de backups
- Manutenção automática (VACUUM, ANALYZE)
- Reindexação semanal

#### Monitoring

- Monitoramento de conexões
- Métricas de performance
- Alertas de uso de storage
- Detecção de queries lentas

#### Connection Pooling

- Máximo de 20 conexões
- Timeout de idle: 30 segundos
- SSL obrigatório

### Rate Limits

- 1000 requests por minuto
- 50 conexões por minuto
- Timeout de 30 segundos
- 3 tentativas de retry

## Tipos de Query Suportados

### Infrastructure Queries

- `deploy_management`: Gerenciamento de deploys
- `infrastructure_monitoring`: Monitoramento de infraestrutura
- `database_operations`: Operações de banco de dados
- `database_monitoring`: Monitoramento de banco
- `backup_restore`: Backup e restore
- `environment_config`: Configuração de ambiente

### Cache Configuration

| Tipo de Query             | TTL (segundos) |
| ------------------------- | -------------- |
| deploy_management         | 300            |
| infrastructure_monitoring | 60             |
| database_operations       | 600            |
| database_monitoring       | 120            |
| backup_restore            | 1800           |
| environment_config        | 3600           |

## Health Checks

### Railway

- Endpoint: `https://backboard.railway.app/health`
- Intervalo: 5 minutos
- Timeout: 10 segundos

### Neon DB

- Endpoint: `${NEON_DB_HOST}:5432`
- Intervalo: 5 minutos
- Timeout: 10 segundos

## Failover Strategy

### Circuit Breaker

- Taxa de erro: 50%
- Tempo de resposta: 5000ms
- Falhas consecutivas: 5

### Logging

- Nível: INFO
- Formato: JSON
- Destinos: Console e arquivo
- Rotação: 100MB, máximo 10 arquivos

## Comandos CLI Disponíveis

### Railway

```bash
# Deploy para produção
npm run railway:deploy:prod

# Deploy para staging
npm run railway:deploy:staging

# Verificar status
npm run railway:status

# Ver logs
npm run railway:logs
```

### Neon DB

```bash
# Backup manual
npm run neon:backup

# Verificar status da conexão
npm run neon:status

# Executar manutenção
npm run neon:maintenance
```

## Segurança

### Autenticação

- Railway: Bearer Token com refresh automático
- Neon DB: API Key com SSL obrigatório

### Validação

- Validação automática de API keys
- Rate limiting por usuário
- Criptografia de cache (opcional)

## Troubleshooting

### Problemas Comuns

1. **Erro de autenticação Railway**
   - Verificar se `RAILWAY_API_KEY` está correto
   - Verificar se o token não expirou

2. **Erro de conexão Neon DB**
   - Verificar `DATABASE_URL`
   - Confirmar se SSL está habilitado
   - Verificar limites de conexão

3. **Rate limit excedido**
   - Aguardar reset do limite
   - Verificar configuração de cache
   - Otimizar frequência de requests

### Logs

Os logs são salvos em:

- Console: Tempo real
- Arquivo: `logs/mcp-infrastructure.log`
- Rotação automática a cada 100MB

## Monitoramento

### Métricas Coletadas

- Latência de requests
- Taxa de erro
- Uso de recursos
- Status de conexões

### Alertas

- CPU > 80%
- Memória > 85%
- Taxa de erro > 5%
- Conexões DB > 18
- Queries lentas > 5000ms
- Uso de storage > 80%
