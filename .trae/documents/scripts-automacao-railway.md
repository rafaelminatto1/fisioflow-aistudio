# Scripts de Automação - Railway + Neon DB

## 1. Scripts de Deploy Automatizado

### 1.1 Script Principal de Deploy

```bash
#!/bin/bash
# deploy-production.sh

set -e  # Exit on any error

echo "🚀 FisioFlow - Deploy para Produção"
echo "====================================="

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "📦 Instalando Railway CLI..."
    npm install -g @railway/cli
fi

# Verificar se está logado
if ! railway whoami &> /dev/null; then
    echo "🔐 Faça login no Railway:"
    railway login
fi

# Verificar variáveis de ambiente obrigatórias
required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Variável $var não definida"
        exit 1
    fi
done

echo "✅ Pré-requisitos verificados"

# Build local para verificar erros
echo "🔨 Executando build local..."
npm run build

echo "✅ Build local concluído"

# Deploy no Railway
echo "🚀 Fazendo deploy no Railway..."
railway up --detach

# Aguardar deploy
echo "⏳ Aguardando deploy..."
sleep 30

# Verificar saúde da aplicação
echo "🏥 Verificando saúde da aplicação..."
if curl -f "$NEXTAUTH_URL/api/health" > /dev/null 2>&1; then
    echo "✅ Deploy concluído com sucesso!"
    echo "🌐 Aplicação disponível em: $NEXTAUTH_URL"
else
    echo "❌ Falha no health check"
    echo "📋 Verificar logs: railway logs"
    exit 1
fi
```

### 1.2 Script de Setup Inicial

```bash
#!/bin/bash
# setup-initial.sh

echo "🏗️ Setup Inicial do FisioFlow"
echo "============================="

# Criar projeto no Railway
echo "📦 Criando projeto no Railway..."
railway new fisioflow-production

# Configurar variáveis de ambiente
echo "⚙️ Configurando variáveis de ambiente..."

# Solicitar informações do usuário
read -p "🔗 URL do Neon DB: " NEON_URL
read -p "🔑 NextAuth Secret (32+ chars): " NEXTAUTH_SECRET
read -p "🌐 URL de Produção: " PRODUCTION_URL
read -p "📧 Redis URL (Upstash): " REDIS_URL
read -p "🔐 Redis Token: " REDIS_TOKEN

# Configurar variáveis no Railway
railway variables set DATABASE_URL="$NEON_URL"
railway variables set NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
railway variables set NEXTAUTH_URL="$PRODUCTION_URL"
railway variables set UPSTASH_REDIS_REST_URL="$REDIS_URL"
railway variables set UPSTASH_REDIS_REST_TOKEN="$REDIS_TOKEN"
railway variables set NODE_ENV="production"
railway variables set NEXT_PUBLIC_APP_URL="$PRODUCTION_URL"

echo "✅ Variáveis configuradas!"

# Configurar domínio personalizado (opcional)
read -p "🌍 Domínio personalizado (opcional): " CUSTOM_DOMAIN
if [ ! -z "$CUSTOM_DOMAIN" ]; then
    railway domain add "$CUSTOM_DOMAIN"
    echo "✅ Domínio $CUSTOM_DOMAIN configurado!"
fi

echo "🎉 Setup inicial concluído!"
echo "📝 Próximos passos:"
echo "   1. Executar: ./migrate-database.sh"
echo "   2. Executar: ./deploy-production.sh"
```

### 1.3 Script de Migração de Banco

```bash
#!/bin/bash
# migrate-database.sh

echo "🗄️ Migração do Banco de Dados"
echo "============================="

# Verificar conexão com o banco
echo "🔍 Verificando conexão com Neon DB..."
if npx prisma db pull --preview-feature; then
    echo "✅ Conexão com banco estabelecida"
else
    echo "❌ Falha na conexão com banco"
    echo "🔧 Verifique a DATABASE_URL"
    exit 1
fi

# Executar migrations
echo "📋 Executando migrations..."
npx prisma migrate deploy

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Executar seed (opcional)
read -p "🌱 Executar seed do banco? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Executando seed..."
    npx prisma db seed
    echo "✅ Seed executado!"
fi

echo "✅ Migração concluída!"
```

## 2. Scripts de Monitoramento

### 2.1 Health Check Avançado

```bash
#!/bin/bash
# health-check.sh

APP_URL="${1:-https://fisioflow.railway.app}"
SLACK_WEBHOOK="$SLACK_WEBHOOK_URL"

echo "🏥 Health Check - $APP_URL"
echo "==========================="

# Função para enviar notificação Slack
send_slack_notification() {
    local message="$1"
    local color="$2"
    
    if [ ! -z "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"text\":\"$message\"}]}" \
            "$SLACK_WEBHOOK"
    fi
}

# Verificar API de saúde
echo "🔍 Verificando endpoint /api/health..."
health_response=$(curl -s -w "%{http_code}" "$APP_URL/api/health")
http_code="${health_response: -3}"
response_body="${health_response%???}"

if [ "$http_code" = "200" ]; then
    echo "✅ Health check passou"
    echo "📊 Resposta: $response_body"
else
    echo "❌ Health check falhou (HTTP $http_code)"
    send_slack_notification "🚨 FisioFlow health check falhou! HTTP $http_code" "danger"
    exit 1
fi

# Verificar tempo de resposta
echo "⏱️ Verificando tempo de resposta..."
response_time=$(curl -o /dev/null -s -w "%{time_total}" "$APP_URL")
response_time_ms=$(echo "$response_time * 1000" | bc)

echo "📈 Tempo de resposta: ${response_time_ms}ms"

if (( $(echo "$response_time > 2.0" | bc -l) )); then
    echo "⚠️ Tempo de resposta alto: ${response_time_ms}ms"
    send_slack_notification "⚠️ FisioFlow com tempo de resposta alto: ${response_time_ms}ms" "warning"
fi

# Verificar páginas críticas
critical_pages=("/login" "/dashboard" "/api/auth/session")

for page in "${critical_pages[@]}"; do
    echo "🔍 Verificando $page..."
    page_status=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL$page")
    
    if [ "$page_status" = "200" ] || [ "$page_status" = "302" ]; then
        echo "✅ $page OK ($page_status)"
    else
        echo "❌ $page falhou ($page_status)"
        send_slack_notification "🚨 Página crítica $page falhou! HTTP $page_status" "danger"
    fi
done

echo "✅ Health check completo!"
```

### 2.2 Script de Backup

```bash
#!/bin/bash
# backup-database.sh

echo "💾 Backup do Banco de Dados"
echo "==========================="

# Configurações
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="fisioflow_backup_$DATE.sql"
S3_BUCKET="fisioflow-backups"  # Opcional

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# Extrair informações da DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não definida"
    exit 1
fi

# Fazer backup usando pg_dump
echo "📦 Criando backup..."
if pg_dump "$DATABASE_URL" > "$BACKUP_DIR/$BACKUP_FILE"; then
    echo "✅ Backup criado: $BACKUP_DIR/$BACKUP_FILE"
else
    echo "❌ Falha ao criar backup"
    exit 1
fi

# Comprimir backup
echo "🗜️ Comprimindo backup..."
gzip "$BACKUP_DIR/$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

echo "✅ Backup comprimido: $BACKUP_DIR/$BACKUP_FILE"

# Upload para S3 (opcional)
if command -v aws &> /dev/null && [ ! -z "$S3_BUCKET" ]; then
    echo "☁️ Enviando para S3..."
    if aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$S3_BUCKET/"; then
        echo "✅ Backup enviado para S3"
    else
        echo "⚠️ Falha no upload para S3"
    fi
fi

# Limpar backups antigos (manter últimos 7 dias)
echo "🧹 Limpando backups antigos..."
find "$BACKUP_DIR" -name "fisioflow_backup_*.sql.gz" -mtime +7 -delete

echo "✅ Backup concluído!"
```

## 3. Scripts de Desenvolvimento

### 3.1 Setup de Desenvolvimento Local

```bash
#!/bin/bash
# setup-dev.sh

echo "💻 Setup de Desenvolvimento Local"
echo "=================================="

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado"
    echo "📦 Instale Node.js 18+ em: https://nodejs.org"
    exit 1
fi

node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    echo "❌ Node.js versão $node_version encontrada"
    echo "📦 Versão 18+ necessária"
    exit 1
fi

echo "✅ Node.js $(node -v) OK"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Configurar arquivo .env.local
if [ ! -f ".env.local" ]; then
    echo "⚙️ Configurando .env.local..."
    cp .env.example .env.local
    
    echo "📝 Configure as variáveis em .env.local:"
    echo "   - DATABASE_URL (Neon DB local ou Docker)"
    echo "   - NEXTAUTH_SECRET (gere com: openssl rand -base64 32)"
    echo "   - Outras variáveis conforme necessário"
    
    # Abrir arquivo para edição
    if command -v code &> /dev/null; then
        code .env.local
    elif command -v nano &> /dev/null; then
        nano .env.local
    fi
else
    echo "✅ .env.local já existe"
fi

# Setup do banco local (Docker)
read -p "🐳 Usar Docker para banco local? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo "🐳 Iniciando PostgreSQL com Docker..."
    
    # Criar docker-compose para desenvolvimento
    cat > docker-compose.dev.yml << EOF
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: fisioflow_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
EOF

    docker-compose -f docker-compose.dev.yml up -d
    
    # Aguardar banco inicializar
    echo "⏳ Aguardando banco inicializar..."
    sleep 10
    
    # Atualizar .env.local com URL local
    sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fisioflow_dev"|' .env.local
fi

# Executar migrations
echo "📋 Executando migrations..."
npx prisma migrate dev

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Executar seed
echo "🌱 Executando seed..."
npm run prisma:seed

echo "✅ Setup de desenvolvimento concluído!"
echo "🚀 Para iniciar: npm run dev"
echo "🗄️ Para acessar banco: npx prisma studio"
```

### 3.2 Script de Testes

```bash
#!/bin/bash
# run-tests.sh

echo "🧪 Executando Testes"
echo "==================="

# Verificar se ambiente de teste está configurado
if [ ! -f ".env.test" ]; then
    echo "⚙️ Configurando ambiente de teste..."
    cp .env.example .env.test
    
    # Configurar banco de teste
    sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fisioflow_test"|' .env.test
fi

# Configurar banco de teste
echo "🗄️ Configurando banco de teste..."
export NODE_ENV=test
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fisioflow_test"

# Criar banco de teste
psql "postgresql://postgres:postgres@localhost:5432/postgres" -c "DROP DATABASE IF EXISTS fisioflow_test;"
psql "postgresql://postgres:postgres@localhost:5432/postgres" -c "CREATE DATABASE fisioflow_test;"

# Executar migrations no banco de teste
npx prisma migrate deploy

# Executar testes unitários
echo "🔬 Executando testes unitários..."
npm run test:unit

# Executar testes de integração
echo "🔗 Executando testes de integração..."
npm run test:integration

# Executar testes E2E (se Playwright estiver configurado)
if [ -f "playwright.config.ts" ]; then
    echo "🎭 Executando testes E2E..."
    npx playwright test
fi

echo "✅ Testes concluídos!"
```

## 4. Scripts de Manutenção

### 4.1 Limpeza de Cache

```bash
#!/bin/bash
# clear-cache.sh

echo "🧹 Limpeza de Cache"
echo "=================="

# Limpar cache do Next.js
echo "🗂️ Limpando cache do Next.js..."
rm -rf .next

# Limpar node_modules (opcional)
read -p "🗑️ Limpar node_modules? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Removendo node_modules..."
    rm -rf node_modules
    echo "📦 Reinstalando dependências..."
    npm install
fi

# Limpar cache do npm
echo "🧽 Limpando cache do npm..."
npm cache clean --force

# Regenerar cliente Prisma
echo "🔧 Regenerando cliente Prisma..."
npx prisma generate

echo "✅ Limpeza concluída!"
```

### 4.2 Atualização de Dependências

```bash
#!/bin/bash
# update-dependencies.sh

echo "📦 Atualização de Dependências"
echo "=============================="

# Verificar dependências desatualizadas
echo "🔍 Verificando dependências desatualizadas..."
npm outdated

# Atualizar dependências patch/minor
echo "⬆️ Atualizando dependências (patch/minor)..."
npm update

# Verificar vulnerabilidades
echo "🔒 Verificando vulnerabilidades..."
npm audit

# Corrigir vulnerabilidades automáticas
read -p "🔧 Corrigir vulnerabilidades automaticamente? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    npm audit fix
fi

# Executar testes após atualizações
read -p "🧪 Executar testes após atualizações? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    npm test
fi

echo "✅ Atualização concluída!"
```

## 5. Configuração de CI/CD

### 5.1 GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: fisioflow_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup test database
        run: |
          npx prisma migrate deploy
          npx prisma generate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fisioflow_test
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fisioflow_test
      
      - name: Build application
        run: npm run build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      
      - name: Deploy to Railway
        run: railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      
      - name: Health check
        run: |
          sleep 30
          curl -f ${{ secrets.APP_URL }}/api/health
```

### 5.2 Makefile para Comandos Rápidos

```makefile
# Makefile
.PHONY: help install dev build test deploy clean

help: ## Mostrar ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Instalar dependências
	npm install
	npx prisma generate

dev: ## Iniciar desenvolvimento
	npm run dev

build: ## Build da aplicação
	npm run build

test: ## Executar testes
	./scripts/run-tests.sh

deploy: ## Deploy para produção
	./scripts/deploy-production.sh

backup: ## Fazer backup do banco
	./scripts/backup-database.sh

health: ## Verificar saúde da aplicação
	./scripts/health-check.sh

clean: ## Limpar cache
	./scripts/clear-cache.sh

setup: ## Setup inicial
	./scripts/setup-initial.sh

setup-dev: ## Setup desenvolvimento
	./scripts/setup-dev.sh

migrate: ## Migrar banco
	./scripts/migrate-database.sh

update: ## Atualizar dependências
	./scripts/update-dependencies.sh
```

***

**Como usar os scripts:**

1. **Primeiro setup**: `./scripts/setup-initial.sh`
2. **Migrar banco**: `./scripts/migrate-database.sh`
3. **Deploy**: `./scripts/deploy-production.sh`
4. **Monitoramento**: `./scripts/health-check.sh`
5. **Backup**: `./scripts/backup-database.sh`

**Ou usando Makefile:**

* `make setup` - Setup inicial

* `make deploy` - Deploy para produção

* `make health` - Health check

* `make backup` - Backup do banco

