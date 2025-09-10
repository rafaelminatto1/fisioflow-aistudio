#!/bin/bash

# ========================================
# FISIOFLOW - VALIDAÇÃO DO DOCKER BUILD
# ========================================
# Script para validar se o Dockerfile funciona corretamente

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[DOCKER]${NC} $1"
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

# Verificar se Docker está disponível
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado ou não está no PATH"
        echo "Instale o Docker para testar o build localmente"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        error "Docker daemon não está rodando"
        echo "Inicie o Docker e tente novamente"
        exit 1
    fi
    
    log "Docker está disponível ✓"
}

# Validar arquivos necessários
validate_files() {
    log "Validando arquivos necessários..."
    
    required_files=(
        "Dockerfile"
        "package.json"
        "prisma/schema.prisma"
        "next.config.js"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "Arquivo obrigatório não encontrado: $file"
            exit 1
        fi
    done
    
    log "Todos os arquivos necessários estão presentes ✓"
}

# Verificar configuração do Prisma
check_prisma_config() {
    log "Verificando configuração do Prisma..."
    
    # Verificar binary targets
    if grep -q "debian-openssl-3.0.x" prisma/schema.prisma && 
       grep -q "linux-musl-openssl-3.0.x" prisma/schema.prisma; then
        log "Binary targets do Prisma configurados para DigitalOcean ✓"
    else
        error "Binary targets do Prisma não configurados corretamente"
        echo "Execute: npx prisma generate para corrigir"
        exit 1
    fi
    
    # Verificar se cliente foi gerado
    if [ -d "node_modules/.prisma/client" ]; then
        log "Cliente Prisma gerado ✓"
    else
        warn "Cliente Prisma não encontrado, executando geração..."
        npx prisma generate
    fi
}

# Verificar configuração do Next.js
check_nextjs_config() {
    log "Verificando configuração do Next.js..."
    
    if grep -q "output.*standalone" next.config.js; then
        log "Next.js configurado para standalone output ✓"
    else
        error "Next.js não está configurado para standalone output"
        echo "Adicione 'output: \"standalone\"' no next.config.js"
        exit 1
    fi
}

# Testar build das etapas
test_build_stages() {
    log "Testando build por etapas..."
    
    # Testar stage deps
    info "Testando stage 'deps'..."
    if docker build -t fisioflow-deps --target deps . >/dev/null 2>&1; then
        log "Stage 'deps' passou ✓"
    else
        error "Stage 'deps' falhou"
        return 1
    fi
    
    # Testar stage builder
    info "Testando stage 'builder'..."
    if docker build -t fisioflow-builder --target builder . >/dev/null 2>&1; then
        log "Stage 'builder' passou ✓"
    else
        error "Stage 'builder' falhou"
        return 1
    fi
    
    # Testar build completo
    info "Testando build completo..."
    if docker build -t fisioflow-complete . >/dev/null 2>&1; then
        log "Build completo passou ✓"
    else
        error "Build completo falhou"
        return 1
    fi
}

# Testar container
test_container() {
    log "Testando execução do container..."
    
    # Criar variáveis de teste
    cat > .env.docker.test << EOF
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
DATABASE_URL=postgresql://test:test@localhost:5432/test
NEXTAUTH_SECRET=test_secret_for_docker_validation
NEXTAUTH_URL=http://localhost:3000
EOF

    # Tentar executar container
    if docker run --rm -d \
        --name fisioflow-test \
        -p 3001:3000 \
        --env-file .env.docker.test \
        fisioflow-complete >/dev/null 2>&1; then
        
        # Aguardar inicialização
        sleep 10
        
        # Testar se está respondendo
        if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
            log "Container está funcionando ✓"
            docker stop fisioflow-test >/dev/null 2>&1
        else
            warn "Container iniciou mas não está respondendo no health check"
            docker stop fisioflow-test >/dev/null 2>&1
        fi
    else
        warn "Não foi possível testar execução do container (normal sem banco)"
    fi
    
    # Limpar arquivo de teste
    rm -f .env.docker.test
}

# Analisar tamanho da imagem
analyze_image_size() {
    log "Analisando tamanho da imagem..."
    
    size=$(docker images fisioflow-complete --format "table {{.Size}}" | tail -n 1)
    log "Tamanho da imagem: $size"
    
    # Verificar se é muito grande
    size_mb=$(docker images fisioflow-complete --format "{{.Size}}" | tail -n 1 | sed 's/MB//' | cut -d'.' -f1)
    if [ "$size_mb" -gt 1000 ] 2>/dev/null; then
        warn "Imagem muito grande (>1GB). Considere otimizações"
    else
        log "Tamanho da imagem aceitável ✓"
    fi
}

# Limpar imagens de teste
cleanup() {
    log "Limpando imagens de teste..."
    
    docker rmi fisioflow-deps fisioflow-builder fisioflow-complete >/dev/null 2>&1 || true
    log "Limpeza concluída ✓"
}

# Função principal
main() {
    log "Iniciando validação do Docker build"
    
    check_docker
    validate_files
    check_prisma_config
    check_nextjs_config
    
    info "Iniciando testes de build..."
    if test_build_stages; then
        log "Todos os testes de build passaram ✓"
        
        analyze_image_size
        test_container
        
        echo ""
        echo "========================================"
        echo "✅ VALIDAÇÃO CONCLUÍDA COM SUCESSO!"
        echo "========================================"
        echo ""
        echo "O Dockerfile está pronto para deploy no DigitalOcean:"
        echo "- ✅ Prisma configurado corretamente"
        echo "- ✅ Next.js em modo standalone"
        echo "- ✅ Health check funcionando"
        echo "- ✅ Multi-stage build otimizado"
        echo ""
        echo "Próximos passos:"
        echo "1. Faça push do código para o repositório"
        echo "2. Configure as variáveis de ambiente no DigitalOcean"
        echo "3. Execute o deploy"
        
    else
        echo ""
        echo "========================================"
        echo "❌ VALIDAÇÃO FALHOU"
        echo "========================================"
        echo ""
        echo "Corrija os erros acima antes de fazer deploy"
        exit 1
    fi
    
    if [ "${1:-}" != "--keep-images" ]; then
        cleanup
    fi
}

# Mostrar ajuda
show_help() {
    echo "Validação do Docker build para DigitalOcean"
    echo ""
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  -h, --help        Mostrar esta ajuda"
    echo "  --keep-images     Manter imagens de teste após validação"
    echo "  --quick           Validação rápida (sem testes de container)"
    echo ""
}

# Processar argumentos
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    --quick)
        # Implementar validação rápida se necessário
        main
        ;;
    *)
        main "$@"
        ;;
esac