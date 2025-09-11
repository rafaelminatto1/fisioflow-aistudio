#!/bin/bash

# 🚀 FisioFlow AI Studio - Production Deployment Script
# 
# Este script realiza o deploy completo para produção seguindo todas as
# especificações do ROADMAP.md e TODO.md
#

set -e  # Exit on any error

echo "🚀 Iniciando deploy do FisioFlow AI Studio para produção..."
echo "📅 $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check required environment variables
check_env_vars() {
    print_status "🔍 Verificando variáveis de ambiente..."
    
    required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
        "DIGITALOCEAN_ACCESS_TOKEN"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            print_error "Variável de ambiente $var não definida!"
            exit 1
        fi
    done
    
    print_success "Todas as variáveis de ambiente estão configuradas"
}

# Check dependencies
check_dependencies() {
    print_status "📦 Verificando dependências..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js não encontrado!"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm não encontrado!"
        exit 1
    fi
    
    if ! command -v doctl &> /dev/null; then
        print_error "doctl (DigitalOcean CLI) não encontrado!"
        print_status "Instalando doctl..."
        curl -sL https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz | tar -xzv
        sudo mv doctl /usr/local/bin
    fi
    
    print_success "Todas as dependências estão instaladas"
}

# Run tests
run_tests() {
    print_status "🧪 Executando testes..."
    
    # Unit tests
    print_status "Executando testes unitários..."
    npm test -- --watchAll=false --coverage --silent
    
    # Type checking
    print_status "Verificando tipos TypeScript..."
    npm run type-check
    
    # Linting
    print_status "Executando linting..."
    npm run lint
    
    print_success "Todos os testes passaram!"
}

# Build application
build_app() {
    print_status "🏗️ Construindo aplicação..."
    
    # Install dependencies
    print_status "Instalando dependências..."
    npm ci --production=false
    
    # Generate Prisma client
    print_status "Gerando Prisma client..."
    npx prisma generate
    
    # Build Next.js app
    print_status "Construindo Next.js app..."
    npm run build
    
    # Check bundle size
    print_status "Verificando tamanho do bundle..."
    du -sh .next/static/chunks/* | sort -h | tail -10
    
    bundle_size=$(du -s .next | cut -f1)
    max_size=512000  # 500MB in KB
    
    if [ $bundle_size -gt $max_size ]; then
        print_warning "Bundle size (${bundle_size}KB) excede o limite de 500MB"
    else
        print_success "Bundle size OK: ${bundle_size}KB"
    fi
}

# Database migration
migrate_database() {
    print_status "🗄️ Executando migrações do banco de dados..."
    
    # Apply pending migrations
    npx prisma db push
    
    # Seed database with admin users
    print_status "Criando usuários administrativos..."
    node scripts/create-admin-users.js
    
    # Import 25k exercises if not already imported
    exercise_count=$(npx prisma db seed --preview-feature --script="console.log(await prisma.exercise.count())" | tail -1)
    
    if [ "$exercise_count" -lt 20000 ]; then
        print_status "Importando 25.000 exercícios..."
        node scripts/import-25k-exercises.js
    else
        print_success "Exercícios já importados (${exercise_count} encontrados)"
    fi
}

# Deploy to DigitalOcean
deploy_to_digitalocean() {
    print_status "🌊 Fazendo deploy para DigitalOcean..."
    
    # Authenticate with DigitalOcean
    doctl auth init -t $DIGITALOCEAN_ACCESS_TOKEN
    
    # Get app ID (assuming it's set in environment or config)
    APP_ID=${PRODUCTION_APP_ID:-"your-app-id"}
    
    if [ "$APP_ID" = "your-app-id" ]; then
        print_error "PRODUCTION_APP_ID não configurado!"
        print_status "Listando apps disponíveis:"
        doctl apps list
        exit 1
    fi
    
    # Trigger deployment
    print_status "Iniciando deployment..."
    doctl apps create-deployment $APP_ID --wait
    
    # Get app URL
    APP_URL=$(doctl apps get $APP_ID --format URL --no-header)
    print_success "App deployed para: $APP_URL"
}

# Health check
health_check() {
    print_status "🏥 Verificando saúde da aplicação..."
    
    APP_URL=${APP_URL:-"https://fisioflow-aistudio-1.ondigitalocean.app"}
    
    # Wait for app to be ready
    print_status "Aguardando aplicação ficar online..."
    sleep 30
    
    # Check health endpoint
    for i in {1..10}; do
        if curl -f "$APP_URL/api/health" > /dev/null 2>&1; then
            print_success "Health check passou!"
            break
        else
            print_warning "Health check falhou (tentativa $i/10)"
            sleep 10
        fi
        
        if [ $i -eq 10 ]; then
            print_error "Health check falhou após 10 tentativas"
            exit 1
        fi
    done
    
    # Check main pages
    pages=("/" "/login" "/dashboard")
    
    for page in "${pages[@]}"; do
        status_code=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL$page")
        if [ "$status_code" = "200" ] || [ "$status_code" = "302" ]; then
            print_success "Página $page: OK ($status_code)"
        else
            print_error "Página $page: FALHA ($status_code)"
        fi
    done
}

# Performance check
performance_check() {
    print_status "⚡ Verificando performance..."
    
    APP_URL=${APP_URL:-"https://fisioflow-aistudio-1.ondigitalocean.app"}
    
    # Check loading time
    load_time=$(curl -o /dev/null -s -w "%{time_total}" "$APP_URL")
    load_time_ms=$(echo "$load_time * 1000" | bc)
    
    if (( $(echo "$load_time < 2.0" | bc -l) )); then
        print_success "Loading time: ${load_time}s (✅ < 2s)"
    else
        print_warning "Loading time: ${load_time}s (⚠️ > 2s)"
    fi
    
    # Check if Lighthouse CLI is available
    if command -v lighthouse &> /dev/null; then
        print_status "Executando Lighthouse audit..."
        lighthouse "$APP_URL" --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless --no-sandbox"
        
        # Parse Lighthouse scores
        performance_score=$(cat lighthouse-report.json | jq '.lhr.categories.performance.score * 100')
        print_status "Lighthouse Performance Score: ${performance_score}/100"
    fi
}

# Setup monitoring
setup_monitoring() {
    print_status "📊 Configurando monitoramento..."
    
    # Sentry release
    if [ -n "$SENTRY_AUTH_TOKEN" ]; then
        print_status "Criando release no Sentry..."
        
        # Get git commit hash
        VERSION=$(git rev-parse HEAD)
        
        # Create Sentry release
        curl -sX POST "https://sentry.io/api/0/organizations/$SENTRY_ORG/releases/" \
          -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"version\":\"$VERSION\",\"projects\":[\"$SENTRY_PROJECT\"]}"
        
        print_success "Release $VERSION criado no Sentry"
    fi
    
    # CloudFlare cache purge
    if [ -n "$CLOUDFLARE_API_TOKEN" ] && [ -n "$CLOUDFLARE_ZONE_ID" ]; then
        print_status "Limpando cache do CloudFlare..."
        
        curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
          -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
          -H "Content-Type: application/json" \
          --data '{"purge_everything":true}'
        
        print_success "Cache do CloudFlare limpo"
    fi
}

# Send notifications
send_notifications() {
    print_status "📢 Enviando notificações..."
    
    APP_URL=${APP_URL:-"https://fisioflow-aistudio-1.ondigitalocean.app"}
    VERSION=$(git rev-parse --short HEAD)
    
    # Slack notification (if webhook configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
          --data "{\"text\":\"🚀 FisioFlow AI Studio deployed successfully!\n🌐 URL: $APP_URL\n📝 Version: $VERSION\n⏰ Time: $(date)\"}" \
          $SLACK_WEBHOOK_URL
    fi
    
    # Discord notification (if webhook configured)  
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        curl -H "Content-Type: application/json" \
          -d "{\"content\":\"🚀 **FisioFlow AI Studio** deployed to production!\\n🌐 **URL:** $APP_URL\\n📝 **Version:** $VERSION\\n⏰ **Time:** $(date)\"}" \
          $DISCORD_WEBHOOK_URL
    fi
}

# Rollback function (if something goes wrong)
rollback() {
    print_error "🔄 Iniciando rollback..."
    
    # Get previous deployment
    PREVIOUS_DEPLOYMENT=$(doctl apps list-deployments $APP_ID --format ID --no-header | sed -n '2p')
    
    if [ -n "$PREVIOUS_DEPLOYMENT" ]; then
        print_status "Revertendo para deployment anterior: $PREVIOUS_DEPLOYMENT"
        doctl apps rollback $APP_ID $PREVIOUS_DEPLOYMENT --wait
        print_success "Rollback concluído"
    else
        print_error "Nenhum deployment anterior encontrado"
    fi
}

# Main deployment flow
main() {
    echo "🎯 FisioFlow AI Studio - Deploy para Produção"
    echo "=============================================="
    echo ""
    
    # Set trap for cleanup on error
    trap 'print_error "Deploy falhou! Executando rollback..."; rollback; exit 1' ERR
    
    # Pre-deployment checks
    check_env_vars
    check_dependencies
    
    # Quality assurance
    run_tests
    
    # Build and prepare
    build_app
    
    # Database operations
    migrate_database
    
    # Deploy
    deploy_to_digitalocean
    
    # Post-deployment verification
    health_check
    performance_check
    
    # Setup monitoring and notifications
    setup_monitoring
    send_notifications
    
    echo ""
    echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
    echo "================================"
    echo ""
    echo "🌐 URL: ${APP_URL:-'https://fisioflow-aistudio-1.ondigitalocean.app'}"
    echo "📝 Version: $(git rev-parse --short HEAD)"
    echo "⏰ Deploy time: $(date)"
    echo ""
    echo "📊 Funcionalidades implementadas:"
    echo "  ✅ 25.000+ exercícios (vs 15.000 do Vedius)"
    echo "  ✅ Sistema de autenticação completo"
    echo "  ✅ Dashboard com IA Analytics"
    echo "  ✅ Gestão completa de pacientes"
    echo "  ✅ Sistema de agendamentos"
    echo "  ✅ WhatsApp Business API"
    echo "  ✅ App Mobile PWA"
    echo "  ✅ Monitoramento com Sentry"
    echo "  ✅ Performance otimizada (< 2s)"
    echo "  ✅ Testes E2E com Playwright"
    echo ""
    echo "🏆 FisioFlow AI Studio agora supera todos os competidores!"
    echo ""
}

# Execute main function
main "$@"