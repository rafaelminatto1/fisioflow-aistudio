# Deploy do FisioFlow no DigitalOcean

## 🚀 Guia Completo de Deploy

### Pré-requisitos

- ✅ Conta no DigitalOcean
- ✅ Node.js 18+
- ✅ npm ou yarn
- ✅ Git configurado
- ✅ doctl CLI (opcional, mas recomendado)

### 1. Configuração Inicial

```bash
# Execute o script de setup
./scripts/setup-digitalocean.sh

# Ou com nome personalizado
./scripts/setup-digitalocean.sh meu-app-name
```

### 2. Configurar Managed Database

1. Acesse o [DigitalOcean Console](https://cloud.digitalocean.com/databases)
2. Clique em "Create Database"
3. Escolha:
   - **Engine**: PostgreSQL 15
   - **Plan**: Basic ($15/mês)
   - **Region**: NYC1 (mesmo da aplicação)
   - **Name**: fisioflow-db

4. Após criação, copie a connection string
5. Atualize no arquivo `.env.digitalocean`:

```env
DATABASE_URL="postgresql://username:password@host:25060/database?sslmode=require&pool_timeout=30"
DIRECT_URL="postgresql://username:password@host:25060/database?sslmode=require"
```

### 3. Deploy da Aplicação

#### Opção A: Deploy Automático (Recomendado)

```bash
# Deploy completo com verificações
./scripts/deploy-digitalocean.sh

# Verificar status
./scripts/deploy-digitalocean.sh --status
```

#### Opção B: Deploy Manual

1. Acesse [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Clique em "Create App"
3. Conecte seu repositório GitHub
4. Configure:
   - **Branch**: main
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **HTTP Port**: 3000

### 4. Configurar Variáveis de Ambiente

No App Platform, vá em **Settings → Environment Variables** e adicione:

```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0

# URLs (substitua pela sua URL)
NEXTAUTH_URL=https://seu-app.ondigitalocean.app
CORS_ORIGINS=https://seu-app.ondigitalocean.app

# Banco de dados
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Secrets (use os gerados pelo script)
NEXTAUTH_SECRET=seu_secret_aqui
STATUS_CHECK_TOKEN=seu_token_aqui
ENCRYPTION_KEY=sua_chave_aqui

# Performance
DB_POOL_SIZE=10
DB_CONNECTION_TIMEOUT=30000
ROUTE_CACHE_ENABLED=true
COMPRESSION_ENABLED=true
```

### 5. Executar Migrações

Após o primeiro deploy:

```bash
# Via doctl
doctl apps logs fisioflow

# Execute migrações manualmente ou configure no build
```

## 🔧 Configurações Otimizadas

### Dockerfile
- ✅ Multi-stage build otimizado
- ✅ Cache layers para builds mais rápidos
- ✅ Health check configurado
- ✅ Security best practices

### Database
- ✅ Connection pooling otimizado
- ✅ SSL/TLS habilitado
- ✅ Timeouts configurados
- ✅ Binary targets para DigitalOcean

### Performance
- ✅ Standalone output do Next.js
- ✅ Cache de build otimizado
- ✅ Compressão habilitada
- ✅ Static assets com TTL longo

## 📊 Custos Estimados

| Serviço | Plano | Custo/mês |
|---------|-------|-----------|
| App Platform | Professional XS | $25 |
| Managed Database | Basic | $15 |
| **Total** | | **$40** |

### Planos Recomendados

**Para produção pequena/média:**
- App Platform Professional XS (2 vCPUs, 4GB RAM)
- Database Basic (1 vCPU, 1GB RAM, 10GB SSD)

**Para produção alta demanda:**
- App Platform Professional S (4 vCPUs, 8GB RAM)
- Database Professional (2 vCPUs, 4GB RAM, 50GB SSD)

## 🚨 Troubleshooting

### Build Falha

```bash
# Testar build local
npm run build

# Verificar logs
doctl apps logs fisioflow --type build

# Problemas comuns:
# - Variáveis de ambiente não configuradas
# - Dependências em devDependencies
# - Erros de TypeScript
```

### Banco Não Conecta

```bash
# Testar conexão
psql "postgresql://user:pass@host:25060/db?sslmode=require"

# Verificar:
# - Credenciais corretas
# - SSL habilitado
# - Região do banco = região do app
```

### App Não Inicia

```bash
# Verificar logs
doctl apps logs fisioflow --type run

# Verificar:
# - Health check endpoint (/api/health)
# - PORT=3000 e HOSTNAME=0.0.0.0
# - Migrações executadas
```

### Performance Issues

```bash
# Verificar métricas
doctl monitoring alert-policy list

# Otimizações:
# - Habilitar cache Redis
# - Configurar CDN
# - Otimizar queries do banco
```

## 🔍 Monitoramento

### Logs em Tempo Real
```bash
doctl apps logs fisioflow --follow
```

### Métricas
- CPU e Memory usage no console
- Database connections
- Response times
- Error rates

### Alertas Recomendados
- CPU > 80%
- Memory > 80%
- Error rate > 5%
- Response time > 2s

## 🔄 CI/CD

### GitHub Actions (Recomendado)

```yaml
# .github/workflows/deploy.yml
name: Deploy to DigitalOcean
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
    - run: npm ci
    - run: npm run build
    - uses: digitalocean/app_action@v1
      with:
        app_name: fisioflow
        token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
```

## 📚 Links Úteis

- [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
- [Documentação doctl](https://docs.digitalocean.com/reference/doctl/)
- [Next.js Production](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

## 🆘 Suporte

Em caso de problemas:

1. Verifique logs: `doctl apps logs fisioflow`
2. Consulte DEPLOY.md
3. Verifique configurações no console
4. Execute health check: `curl -f https://seu-app.ondigitalocean.app/api/health`

---

**💡 Dica**: Sempre teste o build local antes de fazer deploy em produção!