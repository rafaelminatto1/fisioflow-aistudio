#!/bin/bash

# FisioFlow - Script de Deploy para DigitalOcean
# Este script automatiza o processo de deploy para DigitalOcean App Platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if doctl is installed
check_doctl() {
    if ! command -v doctl &> /dev/null; then
        log_error "doctl CLI não está instalado. Instale com: brew install doctl"
        exit 1
    fi
    log_success "doctl CLI encontrado"
}

# Check if user is authenticated
check_auth() {
    if ! doctl auth list | grep -q "current"; then
        log_error "Você não está autenticado no DigitalOcean. Execute: doctl auth init"
        exit 1
    fi
    log_success "Autenticação DigitalOcean verificada"
}

# Validate environment variables
validate_env() {
    log_info "Validando variáveis de ambiente..."
    
    if [ ! -f ".env.production" ]; then
        log_error "Arquivo .env.production não encontrado!"
        log_info "Copie .env.production.example e configure as variáveis"
        exit 1
    fi
    
    # Check for required variables
    required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env.production || grep -q "^$var=$" .env.production; then
            log_error "Variável $var não está configurada em .env.production"
            exit 1
        fi
    done
    
    log_success "Variáveis de ambiente validadas"
}

# Build and test locally
build_and_test() {
    log_info "Executando build e testes locais..."
    
    # Install dependencies
    npm ci
    
    # Generate Prisma client
    npx prisma generate
    
    # Run linting
    npm run lint
    
    # Run type checking
    npm run type-check 2>/dev/null || npx tsc --noEmit
    
    # Build the application
    npm run build
    
    log_success "Build e testes concluídos com sucesso"
}

# Deploy to DigitalOcean
deploy_to_do() {
    log_info "Iniciando deploy para DigitalOcean..."
    
    # Check if app exists
    APP_NAME="fisioflow"
    
    if doctl apps list | grep -q "$APP_NAME"; then
        log_info "Atualizando aplicação existente..."
        doctl apps update $APP_NAME --spec .do/app.yaml
    else
        log_info "Criando nova aplicação..."
        doctl apps create --spec .do/app.yaml
    fi
    
    log_success "Deploy iniciado! Acompanhe o progresso em: https://cloud.digitalocean.com/apps"
}

# Set up database
setup_database() {
    log_info "Configurando banco de dados..."
    
    # Run migrations
    log_info "Executando migrações do banco de dados..."
    npx prisma migrate deploy
    
    # Seed database if needed
    if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
        log_info "Executando seed do banco de dados..."
        npx prisma db seed
    fi
    
    log_success "Banco de dados configurado"
}

# Main deployment function
main() {
    log_info "🚀 Iniciando processo de deploy do FisioFlow para DigitalOcean"
    
    # Pre-deployment checks
    check_doctl
    check_auth
    validate_env
    
    # Build and test
    build_and_test
    
    # Deploy
    deploy_to_do
    
    # Database setup (run after first deployment)
    read -p "Deseja executar as migrações do banco de dados? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_database
    fi
    
    log_success "🎉 Deploy concluído com sucesso!"
    log_info "Acesse sua aplicação em: https://fisioflow-xxxxx.ondigitalocean.app"
    log_info "Configure seu domínio personalizado no painel do DigitalOcean"
}

# Handle script arguments
case "${1:-}" in
    "check")
        log_info "Executando verificações pré-deploy..."
        check_doctl
        check_auth
        validate_env
        log_success "Todas as verificações passaram!"
        ;;
    "build")
        build_and_test
        ;;
    "deploy")
        deploy_to_do
        ;;
    "db")
        setup_database
        ;;
    "")
        main
        ;;
    *)
        echo "Uso: $0 [check|build|deploy|db]"
        echo "  check  - Verifica pré-requisitos"
        echo "  build  - Executa build e testes"
        echo "  deploy - Faz deploy para DigitalOcean"
        echo "  db     - Configura banco de dados"
        echo "  (sem argumentos) - Executa deploy completo"
        exit 1
        ;;
esac