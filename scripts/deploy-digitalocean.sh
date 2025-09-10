#!/bin/bash

# ========================================
# FISIOFLOW - SCRIPT DE DEPLOY DIGITALOCEAN
# ========================================
# Este script facilita o deploy no DigitalOcean App Platform

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
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

# Verificar se doctl está instalado
check_doctl() {
    if ! command -v doctl &> /dev/null; then
        error "doctl CLI não está instalado. Instale com:"
        echo "  snap install doctl"
        echo "  ou"
        echo "  brew install doctl"
        exit 1
    fi
}

# Verificar autenticação
check_auth() {
    if ! doctl auth list | grep -q "current"; then
        error "DigitalOcean CLI não está autenticado. Execute:"
        echo "  doctl auth init"
        exit 1
    fi
}

# Verificar variáveis de ambiente obrigatórias
check_env_vars() {
    log "Verificando variáveis de ambiente..."
    
    required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        error "Variáveis de ambiente obrigatórias não configuradas:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "Configure no arquivo .env.production ou nas variáveis de ambiente do DigitalOcean App Platform"
        exit 1
    fi
    
    log "Todas as variáveis obrigatórias estão configuradas ✓"
}

# Executar testes
run_tests() {
    log "Executando testes..."
    
    if npm run lint > /dev/null 2>&1; then
        log "Lint passou ✓"
    else
        warn "Lint falhou - continuando..."
    fi
    
    if npm run type-check > /dev/null 2>&1; then
        log "Type check passou ✓"
    else
        error "Type check falhou - abortando deploy"
        exit 1
    fi
    
    log "Testes concluídos ✓"
}

# Build local para verificar se funciona
test_build() {
    log "Testando build local..."
    
    # Fazer backup do .env atual
    if [ -f .env ]; then
        cp .env .env.backup
    fi
    
    # Usar variáveis de produção
    cp .env.production .env
    
    # Tentar fazer o build
    if npm run build > build.log 2>&1; then
        log "Build local passou ✓"
        rm -f build.log
    else
        error "Build local falhou. Verifique build.log para detalhes"
        cat build.log
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

# Criar app no DigitalOcean (se não existir)
create_app() {
    local app_name="$1"
    
    log "Verificando se app '$app_name' existe..."
    
    if doctl apps list | grep -q "$app_name"; then
        info "App '$app_name' já existe"
        return 0
    fi
    
    log "Criando app '$app_name'..."
    
    # Criar spec do app
    cat > app-spec.yaml << EOF
name: $app_name
services:
- name: web
  source_dir: /
  github:
    repo: $GITHUB_REPO
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
  envs:
  - key: NODE_ENV
    value: production
  - key: NEXT_TELEMETRY_DISABLED
    value: "1"
  health_check:
    http_path: /api/health
databases:
- engine: PG
  name: fisioflow-db
  version: "15"
EOF

    if [ ! -z "$GITHUB_REPO" ]; then
        doctl apps create app-spec.yaml
        log "App '$app_name' criado ✓"
    else
        warn "GITHUB_REPO não definido. Crie o app manualmente no console do DigitalOcean"
    fi
    
    rm -f app-spec.yaml
}

# Deploy da aplicação
deploy_app() {
    local app_name="$1"
    
    log "Iniciando deploy para '$app_name'..."
    
    # Obter ID do app
    app_id=$(doctl apps list | grep "$app_name" | awk '{print $1}')
    
    if [ -z "$app_id" ]; then
        error "App '$app_name' não encontrado"
        exit 1
    fi
    
    # Trigger deploy
    if doctl apps create-deployment "$app_id"; then
        log "Deploy iniciado com sucesso ✓"
        info "Acompanhe o progresso em: https://cloud.digitalocean.com/apps/$app_id"
    else
        error "Falha ao iniciar deploy"
        exit 1
    fi
}

# Verificar status do deploy
check_deployment() {
    local app_name="$1"
    
    log "Verificando status do deployment..."
    
    app_id=$(doctl apps list | grep "$app_name" | awk '{print $1}')
    
    if [ -z "$app_id" ]; then
        error "App '$app_name' não encontrado"
        return 1
    fi
    
    # Mostrar status
    doctl apps get "$app_id"
}

# Função principal
main() {
    local app_name="${1:-fisioflow}"
    
    log "Iniciando deploy do FisioFlow para DigitalOcean"
    log "App name: $app_name"
    
    # Verificações
    check_doctl
    check_auth
    
    # Source das variáveis de ambiente se existir arquivo
    if [ -f .env.production ]; then
        log "Carregando variáveis de .env.production..."
        set -a
        source .env.production
        set +a
    fi
    
    check_env_vars
    
    # Testes e build
    run_tests
    test_build
    
    # Deploy
    create_app "$app_name"
    deploy_app "$app_name"
    
    log "Deploy concluído! ✓"
    
    # Mostrar informações úteis
    echo ""
    echo "==================================="
    echo "Deploy realizado com sucesso!"
    echo "==================================="
    echo ""
    echo "Próximos passos:"
    echo "1. Configure o domínio personalizado (se necessário)"
    echo "2. Configure as variáveis de ambiente no console"
    echo "3. Execute as migrações do banco"
    echo "4. Configure monitoramento e alertas"
    echo ""
    echo "Links úteis:"
    echo "- Console: https://cloud.digitalocean.com/apps"
    echo "- Logs: doctl apps logs $app_name"
    echo "- Status: doctl apps get $app_name"
}

# Mostrar ajuda
show_help() {
    echo "Deploy do FisioFlow para DigitalOcean"
    echo ""
    echo "Uso: $0 [nome-do-app]"
    echo ""
    echo "Opções:"
    echo "  -h, --help     Mostrar esta ajuda"
    echo "  -s, --status   Verificar status do deployment"
    echo ""
    echo "Exemplos:"
    echo "  $0                    # Deploy com nome padrão 'fisioflow'"
    echo "  $0 meu-app           # Deploy com nome personalizado"
    echo "  $0 --status fisioflow # Verificar status"
}

# Processar argumentos
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -s|--status)
        check_deployment "${2:-fisioflow}"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac