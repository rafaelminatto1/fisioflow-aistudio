# Configuração de Ambiente - FisioFlow

## Pré-requisitos

### Ferramentas Necessárias
- Node.js 18+ 
- npm ou pnpm
- Git
- Digital Ocean CLI (doctl)
- Docker (opcional, para desenvolvimento local)

### Contas e Acessos
- Conta Digital Ocean
- Acesso ao repositório Git
- Chaves de API configuradas

## Configuração Local

### 1. Clone do Repositório

```bash
git clone <repository-url>
cd fisioflow-aistudio-1
```

### 2. Instalação de Dependências

```bash
# Usando npm
npm install

# Ou usando pnpm (recomendado)
pnpm install
```

### 3. Configuração do Digital Ocean CLI

```bash
# Instalar doctl
brew install doctl  # macOS
# ou
snap install doctl  # Linux

# Autenticar
doctl auth init

# Verificar autenticação
doctl account get
```

### 4. Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```bash
# Copiar template
cp .env.example .env.local
```

#### Configurações de Desenvolvimento

```bash
# Database (local ou desenvolvimento)
DATABASE_URL="postgresql://postgres:password@localhost:5432/fisioflow_dev"

# Redis (local ou desenvolvimento)
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Digital Ocean (desenvolvimento)
DO_API_TOKEN="your-do-api-token"
DO_SPACES_KEY="your-spaces-key"
DO_SPACES_SECRET="your-spaces-secret"
DO_SPACES_ENDPOINT="https://nyc3.digitaloceanspaces.com"
DO_SPACES_BUCKET="fisioflow-dev"

# Outros
NODE_ENV="development"
```

#### Configurações de Produção

```bash
# Database (Digital Ocean Managed)
DATABASE_URL="postgresql://user:pass@db-cluster.db.ondigitalocean.com:25060/fisioflow"

# Redis (Digital Ocean Managed)
REDIS_URL="rediss://user:pass@redis-cluster.db.ondigitalocean.com:25061"

# NextAuth
NEXTAUTH_URL="https://fisioflow.com"
NEXTAUTH_SECRET="production-secret-key"

# Digital Ocean (produção)
DO_API_TOKEN="production-api-token"
DO_SPACES_KEY="production-spaces-key"
DO_SPACES_SECRET="production-spaces-secret"
DO_SPACES_ENDPOINT="https://nyc3.digitaloceanspaces.com"
DO_SPACES_BUCKET="fisioflow-prod"

# Outros
NODE_ENV="production"
```

## Configuração do Banco de Dados

### Desenvolvimento Local

```bash
# Usando Docker
docker run --name postgres-dev \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=fisioflow_dev \
  -p 5432:5432 \
  -d postgres:15

# Executar migrações
npx prisma migrate dev

# Gerar cliente Prisma
npx prisma generate

# Seed inicial (opcional)
npx prisma db seed
```

### Digital Ocean Managed Database

```bash
# Criar cluster PostgreSQL
doctl databases create fisioflow-db \
  --engine postgres \
  --version 15 \
  --size db-s-1vcpu-1gb \
  --region nyc3

# Obter string de conexão
doctl databases connection fisioflow-db

# Executar migrações em produção
npx prisma migrate deploy
```

## Configuração do Redis

### Desenvolvimento Local

```bash
# Usando Docker
docker run --name redis-dev \
  -p 6379:6379 \
  -d redis:7-alpine
```

### Digital Ocean Managed Redis

```bash
# Criar cluster Redis
doctl databases create fisioflow-redis \
  --engine redis \
  --version 7 \
  --size db-s-1vcpu-1gb \
  --region nyc3

# Obter string de conexão
doctl databases connection fisioflow-redis
```

## Configuração do Digital Ocean Spaces

```bash
# Criar Space
doctl spaces create fisioflow-storage \
  --region nyc3

# Configurar CORS (se necessário)
doctl spaces put-cors fisioflow-storage \
  --cors-rules file://cors-config.json

# Gerar chaves de acesso
doctl spaces keys create fisioflow-app-key
```

## Scripts de Desenvolvimento

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "do:deploy": "doctl apps create --spec .do/app.yaml",
    "do:update": "doctl apps update $DO_APP_ID --spec .do/app.yaml"
  }
}
```

## Configuração de Deploy

### App Platform Spec (.do/app.yaml)

```yaml
name: fisioflow
services:
- name: web
  source_dir: /
  github:
    repo: your-org/fisioflow
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${fisioflow-db.DATABASE_URL}
  - key: REDIS_URL
    value: ${fisioflow-redis.REDIS_URL}
databases:
- name: fisioflow-db
  engine: PG
  version: "15"
  size: db-s-1vcpu-1gb
- name: fisioflow-redis
  engine: REDIS
  version: "7"
  size: db-s-1vcpu-1gb
```

## Verificação da Configuração

### Checklist de Ambiente

- [ ] Node.js instalado e funcionando
- [ ] Dependências instaladas
- [ ] Arquivo .env.local configurado
- [ ] Banco de dados conectado
- [ ] Redis conectado
- [ ] Digital Ocean CLI autenticado
- [ ] Spaces configurado
- [ ] Migrações executadas
- [ ] Aplicação rodando localmente

### Comandos de Teste

```bash
# Testar conexão com banco
npx prisma db pull

# Testar build
npm run build

# Testar aplicação
npm run dev

# Testar deploy (staging)
doctl apps create --spec .do/app-staging.yaml
```

## Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**
   - Verificar string de conexão
   - Verificar firewall/VPC
   - Verificar credenciais

2. **Erro de build**
   - Verificar versão do Node.js
   - Limpar cache: `npm run clean`
   - Reinstalar dependências

3. **Erro de deploy**
   - Verificar spec do App Platform
   - Verificar variáveis de ambiente
   - Verificar logs: `doctl apps logs $APP_ID`

### Logs e Debugging

```bash
# Logs da aplicação
doctl apps logs fisioflow --follow

# Logs do banco
doctl databases logs fisioflow-db

# Status dos serviços
doctl apps get fisioflow
doctl databases get fisioflow-db
```

## Próximos Passos

1. Configurar CI/CD pipeline
2. Implementar testes automatizados
3. Configurar monitoramento
4. Documentar procedimentos operacionais
5. Treinar equipe nos novos processos
