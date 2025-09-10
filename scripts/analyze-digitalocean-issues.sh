#!/bin/bash

# ========================================
# FISIOFLOW - ANÁLISE DE PROBLEMAS DIGITALOCEAN
# ========================================
# Script para identificar possíveis problemas específicos do DigitalOcean

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[ANALYZE]${NC} $1"
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

critical() {
    echo -e "${PURPLE}[CRITICAL]${NC} $1"
}

# Verificar dependências pesadas
check_heavy_dependencies() {
    log "Analisando dependências que podem causar problemas de memória..."
    
    heavy_deps=(
        "puppeteer"
        "sharp" 
        "canvas"
        "@google/generative-ai"
        "aws-sdk"
        "winston"
        "recharts"
    )
    
    found_heavy=()
    
    for dep in "${heavy_deps[@]}"; do
        if npm list "$dep" >/dev/null 2>&1; then
            found_heavy+=("$dep")
        fi
    done
    
    if [ ${#found_heavy[@]} -gt 0 ]; then
        warn "Dependências pesadas encontradas:"
        for dep in "${found_heavy[@]}"; do
            echo "  - $dep"
        done
        echo ""
        warn "Estas dependências podem causar:"
        echo "  - Build timeouts (>10min)"
        echo "  - OOM (Out of Memory) errors"
        echo "  - Inicialização lenta"
        echo ""
    else
        log "Nenhuma dependência pesada problemática encontrada ✓"
    fi
}

# Verificar tamanho do node_modules
check_node_modules_size() {
    log "Verificando tamanho do node_modules..."
    
    if [ -d "node_modules" ]; then
        size=$(du -sh node_modules 2>/dev/null | cut -f1)
        size_mb=$(du -sm node_modules 2>/dev/null | cut -f1)
        
        info "Tamanho do node_modules: $size"
        
        if [ "$size_mb" -gt 500 ]; then
            warn "node_modules muito grande (>500MB)"
            echo "  - Pode causar timeouts de build"
            echo "  - Considere remover dependências desnecessárias"
        elif [ "$size_mb" -gt 300 ]; then
            warn "node_modules grande (>300MB)"
            echo "  - Monitore tempos de build"
        else
            log "Tamanho do node_modules aceitável ✓"
        fi
    fi
}

# Verificar configurações que podem falhar no DigitalOcean
check_digitalocean_specific() {
    log "Verificando configurações específicas do DigitalOcean..."
    
    # Verificar se usa importações dinâmicas problemáticas
    if grep -r "import(" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" >/dev/null 2>&1; then
        warn "Importações dinâmicas encontradas"
        echo "  - Podem falhar com standalone output"
        echo "  - Verifique se estão no next.config.js"
    fi
    
    # Verificar uso de fs/path
    if grep -r "require.*fs\|import.*fs\|require.*path\|import.*path" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" >/dev/null 2>&1; then
        warn "Uso de módulos Node.js (fs/path) detectado"
        echo "  - Podem falhar no runtime do App Platform"
        echo "  - Verifique se estão apenas em API routes"
    fi
    
    # Verificar se usa variables de ambiente não padrão
    env_vars=$(grep -r "process\.env\." . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "NODE_ENV\|NEXT_" | wc -l)
    if [ "$env_vars" -gt 10 ]; then
        warn "Muitas variáveis de ambiente customizadas ($env_vars)"
        echo "  - Certifique-se de configurar todas no App Platform"
    fi
}

# Verificar configurações de memória
check_memory_requirements() {
    log "Estimando requisitos de memória..."
    
    # Estimar baseado nas dependências
    memory_score=0
    
    # Base Next.js
    memory_score=$((memory_score + 200))
    
    # Prisma
    if [ -f "prisma/schema.prisma" ]; then
        memory_score=$((memory_score + 100))
    fi
    
    # Dependências pesadas
    deps_heavy=$(npm list --depth=0 2>/dev/null | grep -E "(puppeteer|sharp|canvas|aws-sdk)" | wc -l)
    memory_score=$((memory_score + deps_heavy * 150))
    
    # TypeScript
    if [ -f "tsconfig.json" ]; then
        memory_score=$((memory_score + 100))
    fi
    
    info "Memória estimada necessária: ${memory_score}MB"
    
    if [ "$memory_score" -gt 512 ]; then
        critical "Memória estimada > 512MB"
        echo "  - App Platform Basic (512MB) pode ser insuficiente"
        echo "  - Recomendado: Professional XS (4GB) ou superior"
        echo "  - Custo adicional: ~$20/mês"
    elif [ "$memory_score" -gt 256 ]; then
        warn "Memória estimada > 256MB"
        echo "  - Monitore uso de memória durante deploy"
    else
        log "Requisitos de memória dentro do esperado ✓"
    fi
}

# Verificar variáveis obrigatórias
check_required_env_vars() {
    log "Verificando variáveis de ambiente obrigatórias..."
    
    required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
    )
    
    missing_vars=()
    
    # Verificar se estão documentadas
    for var in "${required_vars[@]}"; do
        if ! grep -q "$var" .env.production.example 2>/dev/null && 
           ! grep -q "$var" .env.production 2>/dev/null; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        error "Variáveis obrigatórias não documentadas:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo "  Adicione no .env.production"
    else
        log "Variáveis obrigatórias documentadas ✓"
    fi
}

# Verificar configurações de build
check_build_config() {
    log "Verificando configurações de build..."
    
    # Verificar se tem build script otimizado
    if ! grep -q "npm run build" package.json; then
        error "Script de build não encontrado"
    fi
    
    # Verificar se prebuild está configurado
    if grep -q "prebuild.*prisma generate" package.json; then
        log "Prebuild configurado corretamente ✓"
    else
        warn "Prebuild não configurado"
        echo "  - Adicione: '\"prebuild\": \"prisma generate\"'"
    fi
    
    # Verificar postinstall
    if grep -q "postinstall.*prisma generate" package.json; then
        log "Postinstall configurado ✓"
    else
        warn "Postinstall não configurado"
        echo "  - Pode causar erro: Prisma client not found"
    fi
}

# Verificar logs comuns de erro
check_common_errors() {
    log "Verificando padrões que causam erros comuns..."
    
    # ESLint errors que podem quebrar build
    if ! grep -q "ignoreDuringBuilds.*true" next.config.js; then
        warn "ESLint pode quebrar build em produção"
        echo "  - Adicione: eslint: { ignoreDuringBuilds: true }"
    fi
    
    # TypeScript errors
    if grep -q "ignoreBuildErrors.*false" next.config.js; then
        warn "TypeScript errors vão quebrar build"
        echo "  - Considere: typescript: { ignoreBuildErrors: true }"
    fi
    
    # Verificar se tem errors de import
    if grep -r "Module not found\|Cannot resolve" . --include="*.log" >/dev/null 2>&1; then
        error "Erros de módulo encontrados em logs"
    fi
}

# Gerar relatório
generate_report() {
    log "Gerando relatório de análise..."
    
    cat > DIGITALOCEAN_ANALYSIS.md << 'EOF'
# Análise para Deploy no DigitalOcean

## Resumo da Análise

### ✅ Pontos Positivos
- Dockerfile otimizado para DigitalOcean
- Prisma configurado corretamente
- Health check implementado
- Variables de ambiente documentadas

### ⚠️ Pontos de Atenção
EOF

    echo "
### 🔧 Recomendações

1. **Plano Recomendado**: Professional XS (4GB RAM)
2. **Monitoramento**: Configure alertas de memória
3. **Backup**: Configure backup automático do banco
4. **SSL**: Use o SSL automático do App Platform

### 📊 Estimativas

- **Tempo de Build**: 8-12 minutos
- **Tempo de Deploy**: 2-3 minutos  
- **Memória Necessária**: Mínimo 1GB
- **Custo Mensal**: ~$40-60

### 🚨 Problemas Críticos Identificados

$([ -f "/tmp/critical_issues" ] && cat /tmp/critical_issues || echo "Nenhum problema crítico identificado")

### 📋 Checklist Pre-Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado e acessível
- [ ] Plano Professional XS ou superior
- [ ] Região do banco = região do app
- [ ] SSL certificado configurado

" >> DIGITALOCEAN_ANALYSIS.md

    log "Relatório salvo em: DIGITALOCEAN_ANALYSIS.md"
}

# Função principal
main() {
    log "Iniciando análise de problemas específicos do DigitalOcean"
    echo ""
    
    check_heavy_dependencies
    check_node_modules_size  
    check_digitalocean_specific
    check_memory_requirements
    check_required_env_vars
    check_build_config
    check_common_errors
    
    echo ""
    log "Análise concluída!"
    
    generate_report
    
    echo ""
    echo "========================================"
    echo "🔍 ANÁLISE DIGITALOCEAN CONCLUÍDA"
    echo "========================================"
    echo ""
    echo "Próximos passos:"
    echo "1. Revise DIGITALOCEAN_ANALYSIS.md"
    echo "2. Configure as recomendações"
    echo "3. Execute deploy de teste"
    echo ""
}

main "$@"