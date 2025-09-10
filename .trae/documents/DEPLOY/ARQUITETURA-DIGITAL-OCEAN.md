# Arquitetura Digital Ocean - FisioFlow

## Visão Geral

Este documento descreve a arquitetura completa do FisioFlow na plataforma Digital Ocean, incluindo todos os serviços, configurações e melhores práticas para deploy e operação.

## Componentes da Arquitetura

### 1. Digital Ocean App Platform
- **Função**: Hospedagem da aplicação Next.js
- **Configuração**: Auto-scaling baseado em CPU/memória
- **Domínio**: Configuração de domínio customizado
- **SSL**: Certificados automáticos Let's Encrypt

### 2. Digital Ocean Managed PostgreSQL
- **Função**: Banco de dados principal
- **Configuração**: Cluster com backup automático
- **Versão**: PostgreSQL 15+
- **Backup**: Backup diário automático com retenção de 7 dias

### 3. Digital Ocean Managed Redis
- **Função**: Cache e sessões
- **Configuração**: Cluster Redis com alta disponibilidade
- **Uso**: Cache de queries, sessões de usuário, rate limiting

### 4. Digital Ocean Spaces
- **Função**: Armazenamento de arquivos
- **Configuração**: CDN integrado
- **Uso**: Upload de imagens, documentos, relatórios

### 5. Digital Ocean Load Balancer
- **Função**: Distribuição de tráfego
- **Configuração**: Health checks automáticos
- **SSL Termination**: Certificados gerenciados

## Diagrama de Arquitetura

```mermaid
graph TB
    subgraph "Digital Ocean Infrastructure"
        LB[Load Balancer]
        APP[App Platform]
        DB[(Managed PostgreSQL)]
        REDIS[(Managed Redis)]
        SPACES[Spaces + CDN]
        MON[Monitoring]
        ALERT[Alerting]
    end
    
    subgraph "External Services"
        USER[Users]
        DOMAIN[Custom Domain]
    end
    
    USER --> DOMAIN
    DOMAIN --> LB
    LB --> APP
    APP --> DB
    APP --> REDIS
    APP --> SPACES
    MON --> APP
    MON --> DB
    MON --> REDIS
    ALERT --> MON
```

## Configurações de Ambiente

### Variáveis de Ambiente Principais

```bash
# Database
DATABASE_URL=postgresql://user:pass@db-cluster.db.ondigitalocean.com:25060/fisioflow

# Redis
REDIS_URL=rediss://user:pass@redis-cluster.db.ondigitalocean.com:25061

# Digital Ocean Spaces
DO_SPACES_KEY=your_spaces_key
DO_SPACES_SECRET=your_spaces_secret
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=fisioflow-storage

# App Platform
DO_API_TOKEN=your_api_token
```

## Segurança

### 1. Rede
- VPC privada para comunicação entre serviços
- Firewall rules restritivas
- SSL/TLS em todas as conexões

### 2. Banco de Dados
- Conexões criptografadas
- Backup automático criptografado
- Acesso restrito por IP

### 3. Aplicação
- HTTPS obrigatório
- Rate limiting via Redis
- Validação de entrada rigorosa

## Monitoramento e Alertas

### Métricas Principais
- CPU e memória da aplicação
- Latência de resposta
- Conexões de banco de dados
- Uso de cache Redis
- Espaço em disco

### Alertas Configurados
- CPU > 80% por 5 minutos
- Memória > 85% por 5 minutos
- Latência > 2s por 3 minutos
- Erro rate > 5% por 2 minutos

## Backup e Recuperação

### Estratégia de Backup
1. **Banco de Dados**: Backup automático diário
2. **Código**: Git repository com CI/CD
3. **Arquivos**: Replicação automática no Spaces
4. **Configurações**: Infrastructure as Code

### Plano de Recuperação
1. **RTO**: 15 minutos para aplicação
2. **RPO**: 24 horas para dados
3. **Procedimentos**: Documentados e testados mensalmente

## Custos Estimados

| Serviço | Configuração | Custo Mensal (USD) |
|---------|--------------|--------------------|
| App Platform | Basic | $12 |
| PostgreSQL | 1GB RAM | $15 |
| Redis | 1GB RAM | $15 |
| Spaces | 250GB + CDN | $5 |
| Load Balancer | 1 instância | $12 |
| **Total** | | **$59** |

## Próximos Passos

1. Configurar VPC e networking
2. Provisionar serviços gerenciados
3. Configurar CI/CD pipeline
4. Implementar monitoramento
5. Testes de carga e performance
6. Documentar procedimentos operacionais
