#!/bin/bash

# ========================================
# FISIOFLOW - SETUP DIGITALOCEAN
# ========================================
# Script para configuração inicial no DigitalOcean

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Função para gerar secrets seguros
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Configurar variáveis de ambiente
setup_env_vars() {
    log "Configurando variáveis de ambiente..."
    
    # Criar arquivo com variáveis específicas para DigitalOcean
    cat > .env.digitalocean << EOF
# ========================================
# FISIOFLOW - VARIÁVEIS DIGITALOCEAN
# ========================================
# Configure estas variáveis no DigitalOcean App Platform

# Ambiente
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0

# Secrets gerados automaticamente
NEXTAUTH_SECRET=$(generate_secret)
STATUS_CHECK_TOKEN=$(generate_secret)
ENCRYPTION_KEY=$(generate_secret)

# URLs (substitua pelos valores reais)
NEXTAUTH_URL=https://fisioflow-app.ondigitalocean.app
CORS_ORIGINS=https://fisioflow-app.ondigitalocean.app

# Banco de dados (configure com os dados do Managed Database)
DATABASE_URL=postgresql://fisioflow_user:PASSWORD@fisioflow-db-do-user-XXXXX-0.b.db.ondigitalocean.com:25060/fisioflow?sslmode=require&pool_timeout=30&connect_timeout=30
DIRECT_URL=postgresql://fisioflow_user:PASSWORD@fisioflow-db-do-user-XXXXX-0.b.db.ondigitalocean.com:25060/fisioflow?sslmode=require&connect_timeout=30

# Configurações de performance
DB_POOL_SIZE=10
DB_CONNECTION_TIMEOUT=30000
DB_IDLE_TIMEOUT=600000
DB_MAX_CONNECTIONS=10
DB_MIN_CONNECTIONS=2

# Cache e performance
ROUTE_CACHE_ENABLED=true
ROUTE_CACHE_TTL=300
IMAGE_CACHE_TTL=31536000
COMPRESSION_ENABLED=true
STATIC_CACHE_TTL=86400

# Monitoramento
LOG_LEVEL=info
HEALTH_CHECK_ENABLED=true
RATE_LIMIT_ENABLED=true

# DigitalOcean específico
DO_APP_NAME=fisioflow
DO_REGION=nyc1
DO_ENVIRONMENT=production
BUILD_COMMAND=npm run build
RUN_COMMAND=npm start

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
EOF

    log "Arquivo .env.digitalocean criado com secrets seguros ✓"
    
    echo ""
    echo "========================================"
    echo "IMPORTANTE: Configure no DigitalOcean"
    echo "========================================"
    echo ""
    echo "1. Vá para o console do DigitalOcean App Platform"
    echo "2. Acesse Settings > Environment Variables"
    echo "3. Copie as variáveis do arquivo .env.digitalocean"
    echo "4. Substitua os valores de exemplo pelos reais:"
    echo "   - DATABASE_URL (dados do Managed Database)"
    echo "   - NEXTAUTH_URL (sua URL do app)"
    echo ""
}

# Criar app spec para DigitalOcean
create_app_spec() {
    log "Criando app specification..."
    
    local app_name="${1:-fisioflow}"
    local github_repo="${2:-}"
    
    cat > digitalocean-app-spec.yaml << EOF
name: $app_name
region: nyc
services:
- name: web
  source_dir: /
  build_command: npm run build
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: professional-xs
  http_port: 3000
  health_check:
    http_path: /api/health
    initial_delay_seconds: 30
    period_seconds: 30
    timeout_seconds: 10
    success_threshold: 1
    failure_threshold: 3
  envs:
  - key: NODE_ENV
    value: production
  - key: NEXT_TELEMETRY_DISABLED
    value: "1"
  - key: PORT
    value: "3000"
  - key: HOSTNAME
    value: "0.0.0.0"
  # Adicione outras variáveis aqui
EOF

    if [ ! -z "$github_repo" ]; then
        cat >> digitalocean-app-spec.yaml << EOF
  github:
    repo: $github_repo
    branch: main
    deploy_on_push: true
EOF
    fi

    log "App spec criado: digitalocean-app-spec.yaml ✓"
}

# Verificar pré-requisitos
check_prerequisites() {
    log "Verificando pré-requisitos..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js não encontrado. Instale Node.js 18+"
        exit 1
    fi
    
    local node_version=$(node -v | cut -c2- | cut -d. -f1)
    if [ "$node_version" -lt 18 ]; then
        error "Node.js versão 18+ é necessária. Versão atual: $(node -v)"
        exit 1
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        error "npm não encontrado"
        exit 1
    fi
    
    # Verificar se é um projeto válido
    if [ ! -f package.json ]; then
        error "package.json não encontrado. Execute este script no diretório do projeto"
        exit 1
    fi
    
    # Verificar doctl (opcional)
    if ! command -v doctl &> /dev/null; then
        warn "doctl CLI não encontrado. Instale para deploys automatizados:"
        echo "  snap install doctl"
        echo "  ou"
        echo "  brew install doctl"
    fi
    
    log "Pré-requisitos verificados ✓"
}

# Instalar dependências
install_dependencies() {
    log "Instalando dependências..."
    
    if npm ci; then
        log "Dependências instaladas ✓"
    else
        error "Falha ao instalar dependências"
        exit 1
    fi
}

# Verificar build
test_build() {
    log "Testando build de produção..."
    
    # Backup do .env atual
    if [ -f .env ]; then
        cp .env .env.backup
    fi
    
    # Usar configurações de produção
    if [ -f .env.digitalocean ]; then
        cp .env.digitalocean .env
    fi
    
    # Testar build
    if npm run build > build.log 2>&1; then
        log "Build de produção passou ✓"
        rm -f build.log
    else
        error "Build falhou. Verifique build.log:"
        tail -20 build.log
        
        # Restaurar .env
        if [ -f .env.backup ]; then
            mv .env.backup .env
        fi
        exit 1
    fi
    
    # Restaurar .env
    if [ -f .env.backup ]; then
        mv .env.backup .env
    fi
}

# Executar testes
run_tests() {
    log "Executando verificações..."
    
    # Lint
    if npm run lint > /dev/null 2>&1; then
        log "Lint passou ✓"
    else
        warn "Problemas de lint encontrados"
    fi
    
    # Type check
    if npm run type-check > /dev/null 2>&1; then
        log "Type check passou ✓"
    else
        error "Erros de tipagem encontrados"
        npm run type-check
        exit 1
    fi
}

# Gerar documentação de deploy
generate_docs() {
    log "Gerando documentação..."
    
    cat > DEPLOY.md << 'EOF'
# Deploy no DigitalOcean

## Pré-requisitos

1. Conta no DigitalOcean
2. Managed Database PostgreSQL configurado
3. Repositório GitHub (opcional, para deploy automático)

## Passos para Deploy

### 1. Configurar Banco de Dados

1. Crie um Managed Database PostgreSQL no DigitalOcean
2. Anote as credenciais de conexão
3. Configure as variáveis DATABASE_URL e DIRECT_URL

### 2. Configurar App Platform

1. Acesse https://cloud.digitalocean.com/apps
2. Clique em "Create App"
3. Conecte seu repositório GitHub ou faça upload do código
4. Configure as variáveis de ambiente do arquivo `.env.digitalocean`

### 3. Configurar Variáveis de Ambiente

Copie todas as variáveis do arquivo `.env.digitalocean` para o App Platform:

- Vá em Settings > Environment Variables
- Adicione cada variável uma por uma
- Substitua valores de exemplo pelos reais

### 4. Deploy

1. Clique em "Create Resources"
2. Aguarde o build e deploy
3. Teste a aplicação na URL fornecida

## Monitoramento

- Logs: `doctl apps logs fisioflow`
- Status: `doctl apps get fisioflow`
- Métricas: Console do DigitalOcean

## Troubleshooting

### Build falha
- Verifique as variáveis de ambiente
- Confirme que todas as dependências estão no package.json
- Verifique logs de build no console

### Banco não conecta
- Confirme credenciais do DATABASE_URL
- Verifique se o banco está na mesma região
- Teste conexão com psql

### App não inicia
- Verifique health check endpoint (/api/health)
- Confirme PORT=3000 e HOSTNAME=0.0.0.0
- Verifique logs da aplicação

## Custos Estimados

- App Platform Professional XS: ~$25/mês
- Managed Database Basic: ~$15/mês
- **Total: ~$40/mês**

## Scripts Úteis

```bash
# Deploy automatizado
./scripts/deploy-digitalocean.sh

# Verificar status
./scripts/deploy-digitalocean.sh --status

# Logs em tempo real
doctl apps logs fisioflow --follow
```
EOF

    log "Documentação criada: DEPLOY.md ✓"
}

# Função principal
main() {
    local app_name="${1:-fisioflow}"
    local github_repo="${2:-}"
    
    log "Configurando FisioFlow para DigitalOcean"
    
    check_prerequisites
    install_dependencies
    setup_env_vars
    create_app_spec "$app_name" "$github_repo"
    run_tests
    test_build
    generate_docs
    
    # Tornar scripts executáveis
    chmod +x scripts/deploy-digitalocean.sh 2>/dev/null || true
    
    log "Setup concluído! ✓"
    
    echo ""
    echo "========================================"
    echo "Setup concluído com sucesso!"
    echo "========================================"
    echo ""
    echo "Arquivos criados:"
    echo "- .env.digitalocean (variáveis de ambiente)"
    echo "- digitalocean-app-spec.yaml (especificação do app)"
    echo "- DEPLOY.md (documentação)"
    echo ""
    echo "Próximos passos:"
    echo "1. Configure o Managed Database no DigitalOcean"
    echo "2. Atualize DATABASE_URL no arquivo .env.digitalocean"
    echo "3. Configure as variáveis no App Platform"
    echo "4. Execute: ./scripts/deploy-digitalocean.sh"
    echo ""
    echo "Documentação completa em: DEPLOY.md"
}

# Mostrar ajuda
show_help() {
    echo "Setup do FisioFlow para DigitalOcean"
    echo ""
    echo "Uso: $0 [nome-do-app] [github-repo]"
    echo ""
    echo "Exemplos:"
    echo "  $0                                    # Setup básico"
    echo "  $0 meu-app                           # Com nome personalizado"
    echo "  $0 fisioflow user/repo               # Com repositório GitHub"
}

# Processar argumentos
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac