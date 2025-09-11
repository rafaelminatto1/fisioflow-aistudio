#!/bin/bash

# 🗄️ Script de Configuração do Banco PostgreSQL - FisioFlow
# Este script configura o banco de dados PostgreSQL na DigitalOcean

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
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

# Verificar se doctl está instalado
check_doctl() {
    if ! command -v doctl &> /dev/null; then
        log_error "doctl CLI não encontrado. Instale com: brew install doctl"
        exit 1
    fi
    log_success "doctl CLI encontrado"
}

# Verificar autenticação
check_auth() {
    if ! doctl account get &> /dev/null; then
        log_error "Não autenticado no DigitalOcean. Execute: doctl auth init"
        exit 1
    fi
    log_success "Autenticado no DigitalOcean"
}

# Criar banco de dados
create_database() {
    local db_name="fisioflow-db"
    local region="nyc3"
    local size="db-s-1vcpu-1gb"
    
    log "Criando banco de dados PostgreSQL..."
    
    # Verificar se já existe
    if doctl databases list | grep -q "$db_name"; then
        log_warning "Banco de dados '$db_name' já existe"
        return 0
    fi
    
    # Criar banco
    doctl databases create "$db_name" \
        --engine pg \
        --version 14 \
        --size "$size" \
        --region "$region" \
        --wait
    
    if [ $? -eq 0 ]; then
        log_success "Banco de dados criado com sucesso"
    else
        log_error "Falha ao criar banco de dados"
        exit 1
    fi
}

# Obter informações de conexão
get_connection_info() {
    local db_name="fisioflow-db"
    
    log "Obtendo informações de conexão..."
    
    # Obter ID do banco
    local db_id=$(doctl databases list --format ID,Name --no-header | grep "$db_name" | awk '{print $1}')
    
    if [ -z "$db_id" ]; then
        log_error "Banco de dados não encontrado"
        exit 1
    fi
    
    # Obter string de conexão
    local connection_info=$(doctl databases connection "$db_id" --format URI --no-header)
    
    echo ""
    log_success "Informações de conexão obtidas:"
    echo "Database ID: $db_id"
    echo "Connection URI: $connection_info"
    echo ""
    
    # Salvar em arquivo temporário
    echo "DATABASE_URL=\"$connection_info\"" > .env.database
    echo "DIRECT_URL=\"$connection_info\"" >> .env.database
    
    log_success "Variáveis salvas em .env.database"
    log_warning "Adicione essas variáveis ao seu arquivo .env.production"
}

# Configurar firewall
configure_firewall() {
    local db_name="fisioflow-db"
    
    log "Configurando firewall do banco..."
    
    # Obter ID do banco
    local db_id=$(doctl databases list --format ID,Name --no-header | grep "$db_name" | awk '{print $1}')
    
    # Permitir conexões da App Platform
    doctl databases firewalls append "$db_id" --rule "type:app,value:fisioflow"
    
    log_success "Firewall configurado para permitir conexões da App Platform"
}

# Executar migrações
run_migrations() {
    log "Executando migrações do Prisma..."
    
    # Verificar se DATABASE_URL está definida
    if [ -z "$DATABASE_URL" ]; then
        if [ -f ".env.database" ]; then
            source .env.database
        else
            log_error "DATABASE_URL não definida. Execute primeiro: ./setup-database.sh create"
            exit 1
        fi
    fi
    
    # Executar migrações
    npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        log_success "Migrações executadas com sucesso"
    else
        log_error "Falha ao executar migrações"
        exit 1
    fi
}

# Executar seed
run_seed() {
    log "Executando seed do banco..."
    
    # Verificar se DATABASE_URL está definida
    if [ -z "$DATABASE_URL" ]; then
        if [ -f ".env.database" ]; then
            source .env.database
        else
            log_error "DATABASE_URL não definida. Execute primeiro: ./setup-database.sh create"
            exit 1
        fi
    fi
    
    # Executar seed
    npx prisma db seed
    
    if [ $? -eq 0 ]; then
        log_success "Seed executado com sucesso"
    else
        log_warning "Seed falhou ou não está configurado"
    fi
}

# Verificar status do banco
check_status() {
    local db_name="fisioflow-db"
    
    log "Verificando status do banco..."
    
    # Listar bancos
    doctl databases list --format Name,Status,Engine,Version,Region,Size
    
    # Obter ID do banco
    local db_id=$(doctl databases list --format ID,Name --no-header | grep "$db_name" | awk '{print $1}')
    
    if [ -n "$db_id" ]; then
        echo ""
        log "Detalhes do banco '$db_name':"
        doctl databases get "$db_id"
    fi
}

# Backup do banco
backup_database() {
    local db_name="fisioflow-db"
    
    log "Criando backup do banco..."
    
    # Obter ID do banco
    local db_id=$(doctl databases list --format ID,Name --no-header | grep "$db_name" | awk '{print $1}')
    
    if [ -z "$db_id" ]; then
        log_error "Banco de dados não encontrado"
        exit 1
    fi
    
    # Criar backup
    local backup_name="fisioflow-backup-$(date +%Y%m%d-%H%M%S)"
    
    # Nota: DigitalOcean faz backups automáticos, mas podemos exportar dados
    log_warning "DigitalOcean faz backups automáticos diários"
    log "Para backup manual, use: pg_dump com a connection string"
}

# Menu de ajuda
show_help() {
    echo "🗄️ Script de Configuração do Banco PostgreSQL - FisioFlow"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  create     - Criar banco de dados PostgreSQL"
    echo "  connect    - Obter informações de conexão"
    echo "  firewall   - Configurar firewall do banco"
    echo "  migrate    - Executar migrações do Prisma"
    echo "  seed       - Executar seed do banco"
    echo "  status     - Verificar status do banco"
    echo "  backup     - Informações sobre backup"
    echo "  setup      - Executar configuração completa"
    echo "  help       - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 setup      # Configuração completa"
    echo "  $0 create     # Apenas criar banco"
    echo "  $0 migrate    # Apenas executar migrações"
}

# Configuração completa
full_setup() {
    log "🚀 Iniciando configuração completa do banco..."
    
    check_doctl
    check_auth
    create_database
    sleep 30  # Aguardar banco ficar disponível
    get_connection_info
    configure_firewall
    
    log_success "✅ Configuração do banco concluída!"
    log "📝 Próximos passos:"
    echo "1. Adicione as variáveis de .env.database ao seu .env.production"
    echo "2. Execute: ./setup-database.sh migrate"
    echo "3. Execute: ./setup-database.sh seed (opcional)"
}

# Main
case "${1:-help}" in
    "create")
        check_doctl
        check_auth
        create_database
        ;;
    "connect")
        check_doctl
        check_auth
        get_connection_info
        ;;
    "firewall")
        check_doctl
        check_auth
        configure_firewall
        ;;
    "migrate")
        run_migrations
        ;;
    "seed")
        run_seed
        ;;
    "status")
        check_doctl
        check_auth
        check_status
        ;;
    "backup")
        check_doctl
        check_auth
        backup_database
        ;;
    "setup")
        full_setup
        ;;
    "help")
        show_help
        ;;
    *)
        log_error "Comando inválido: $1"
        show_help
        exit 1
        ;;
esac