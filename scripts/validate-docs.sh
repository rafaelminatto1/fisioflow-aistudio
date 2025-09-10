#!/bin/bash

# Script de Validação da Documentação FisioFlow
# Verifica se todas as referências obsoletas foram removidas e a estrutura está correta

set -e

echo "🔍 Iniciando validação da documentação FisioFlow..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
ERRORS=0
WARNINGS=0
CHECKS=0

# Função para log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((ERRORS++))
}

log_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
    ((CHECKS++))
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    log_error "Este script deve ser executado na raiz do projeto FisioFlow"
    exit 1
fi

log_info "Iniciando validação da estrutura e conteúdo..."

# Função para verificar referências obsoletas
check_obsolete_references() {
    local search_term="$1"
    local description="$2"
    local severity="$3" # "error" ou "warn"
    
    log_check "Verificando referências obsoletas: $description"
    
    local files=$(grep -r -l "$search_term" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.backup --exclude-dir=.next --exclude-dir=scripts 2>/dev/null || true)
    
    if [ -n "$files" ]; then
        if [ "$severity" = "error" ]; then
            log_error "Referências obsoletas encontradas para '$search_term':"
        else
            log_warn "Referências obsoletas encontradas para '$search_term':"
        fi
        echo "$files" | while read -r file; do
            if [ -f "$file" ]; then
                echo "  📄 $file"
                grep -n "$search_term" "$file" | head -3 | sed 's/^/    /'
            fi
        done
        echo ""
    else
        log_info "✅ Nenhuma referência obsoleta encontrada para: $search_term"
    fi
}

# Verificar estrutura de pastas
log_check "Verificando estrutura de pastas da documentação"

required_dirs=(
    ".trae/documents/OVERVIEW"
    ".trae/documents/DEPLOY"
    ".trae/documents/DESENVOLVIMENTO"
    ".trae/documents/OPERACIONAL"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        log_info "✅ Diretório existe: $dir"
    else
        log_error "❌ Diretório não encontrado: $dir"
    fi
done

# Verificar arquivos essenciais
log_check "Verificando arquivos essenciais da documentação"

required_files=(
    ".trae/documents/DEPLOY/ARQUITETURA-DIGITAL-OCEAN.md"
    ".trae/documents/DESENVOLVIMENTO/CONFIGURACAO-AMBIENTE.md"
    ".trae/documents/OVERVIEW/planejamento-estrategico-fisioflow.md"
    ".trae/documents/OVERVIEW/FUNCIONALIDADES_COMPLETAS.md"
    ".trae/documents/DESENVOLVIMENTO/technical-implementation-guide.md"
    ".trae/documents/OPERACIONAL/plano-limpeza-documentacao.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        log_info "✅ Arquivo existe: $(basename "$file")"
        # Verificar se o arquivo não está vazio
        if [ ! -s "$file" ]; then
            log_warn "⚠️  Arquivo vazio: $file"
        fi
    else
        log_error "❌ Arquivo não encontrado: $file"
    fi
done

# Verificar arquivos obsoletos que devem ter sido removidos
log_check "Verificando remoção de arquivos obsoletos"

obsolete_files=(
    "guia-hospedagem-fisioflow.md"
    ".trae/documents/guia-hospedagem-fisioflow.md"
    "vercel.json"
    ".vercel"
)

for file in "${obsolete_files[@]}"; do
    if [ -e "$file" ]; then
        log_error "❌ Arquivo obsoleto ainda existe: $file"
    else
        log_info "✅ Arquivo obsoleto removido: $file"
    fi
done

# Verificar referências obsoletas
log_info "Verificando referências obsoletas no código e documentação..."

# Referências críticas que devem ser removidas
check_obsolete_references "railway.app" "URLs do Railway" "error"
check_obsolete_references "neon.tech" "URLs do Neon" "error"
check_obsolete_references "vercel.app" "URLs do Vercel" "error"
check_obsolete_references "ashopedagem" "Referências aShopedagem" "error"

# Referências que podem existir em contextos específicos
check_obsolete_references "RAILWAY_" "Variáveis de ambiente Railway" "warn"
check_obsolete_references "NEON_" "Variáveis de ambiente Neon" "warn"
check_obsolete_references "VERCEL_" "Variáveis de ambiente Vercel" "warn"

# Verificar se as novas referências estão presentes
log_check "Verificando presença das novas referências Digital Ocean"

positive_checks=(
    "digitalocean.app:URLs Digital Ocean"
    "DO_APP_:Variáveis Digital Ocean"
    "DO Managed PostgreSQL:Referências PostgreSQL"
    "Digital Ocean App Platform:Plataforma de deploy"
)

for check in "${positive_checks[@]}"; do
    IFS=':' read -r search_term description <<< "$check"
    
    local files=$(grep -r -l "$search_term" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.backup --exclude-dir=.next 2>/dev/null || true)
    
    if [ -n "$files" ]; then
        log_info "✅ Referências encontradas para: $description"
    else
        log_warn "⚠️  Nenhuma referência encontrada para: $description"
    fi
done

# Verificar .gitignore
log_check "Verificando configuração do .gitignore"

if grep -q ".do/" .gitignore 2>/dev/null; then
    log_info "✅ .gitignore contém configurações Digital Ocean"
else
    log_warn "⚠️  .gitignore não contém configurações Digital Ocean"
fi

if grep -q ".vercel" .gitignore 2>/dev/null; then
    log_warn "⚠️  .gitignore ainda contém referências Vercel"
else
    log_info "✅ .gitignore não contém referências Vercel obsoletas"
fi

# Verificar package.json
log_check "Verificando package.json"

if [ -f "package.json" ]; then
    if grep -q "vercel" package.json 2>/dev/null; then
        log_warn "⚠️  package.json ainda contém referências Vercel"
    else
        log_info "✅ package.json não contém referências Vercel"
    fi
    
    if grep -q "railway" package.json 2>/dev/null; then
        log_warn "⚠️  package.json ainda contém referências Railway"
    else
        log_info "✅ package.json não contém referências Railway"
    fi
fi

# Verificar integridade dos documentos
log_check "Verificando integridade dos documentos"

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        # Verificar se contém conteúdo mínimo
        local word_count=$(wc -w < "$file" 2>/dev/null || echo "0")
        if [ "$word_count" -lt 50 ]; then
            log_warn "⚠️  Documento muito pequeno (${word_count} palavras): $(basename "$file")"
        fi
        
        # Verificar se contém referências Digital Ocean
        if grep -q -i "digital.ocean\|digitalocean" "$file" 2>/dev/null; then
            log_info "✅ Documento contém referências Digital Ocean: $(basename "$file")"