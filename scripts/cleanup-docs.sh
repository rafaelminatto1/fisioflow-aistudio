#!/bin/bash

# Script de Limpeza da Documentação FisioFlow
# Automatiza a remoção de referências obsoletas e organização dos documentos

set -e

echo "🧹 Iniciando limpeza da documentação FisioFlow..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    log_error "Este script deve ser executado na raiz do projeto FisioFlow"
    exit 1
fi

log_info "Verificando estrutura do projeto..."

# Criar backup antes da limpeza
BACKUP_DIR=".backup/docs-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

log_info "Criando backup em $BACKUP_DIR..."
cp -r .trae/documents/* "$BACKUP_DIR/" 2>/dev/null || true
cp package.json "$BACKUP_DIR/package.json.backup" 2>/dev/null || true

# Função para buscar e substituir referências obsoletas
cleanup_references() {
    local search_term="$1"
    local replacement="$2"
    local description="$3"
    
    log_info "Limpando referências: $description"
    
    # Buscar arquivos que contêm a referência
    local files=$(grep -r -l "$search_term" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.backup --exclude-dir=.next 2>/dev/null || true)
    
    if [ -n "$files" ]; then
        echo "$files" | while read -r file; do
            if [ -f "$file" ]; then
                log_warn "Atualizando: $file"
                sed -i.bak "s|$search_term|$replacement|g" "$file"
                rm -f "$file.bak"
            fi
        done
    else
        log_info "Nenhuma referência encontrada para: $search_term"
    fi
}

# Limpeza de referências obsoletas
log_info "Iniciando limpeza de referências obsoletas..."

# Railway -> Digital Ocean
cleanup_references "railway" "digitalocean" "Railway para Digital Ocean"
cleanup_references "Railway" "Digital Ocean" "Railway para Digital Ocean (maiúscula)"
cleanup_references "RAILWAY" "DIGITAL_OCEAN" "Railway para Digital Ocean (maiúscula completa)"

# Neon -> DO Managed PostgreSQL
cleanup_references "neon" "do-postgresql" "Neon para DO PostgreSQL"
cleanup_references "Neon" "DO Managed PostgreSQL" "Neon para DO PostgreSQL (maiúscula)"
cleanup_references "NEON" "DO_POSTGRESQL" "Neon para DO PostgreSQL (maiúscula completa)"

# Vercel -> Digital Ocean
cleanup_references "vercel.app" "digitalocean.app" "Vercel URLs para Digital Ocean"
cleanup_references "vercel.com" "digitalocean.com" "Vercel domain para Digital Ocean"
cleanup_references "VERCEL_" "DO_APP_" "Variáveis Vercel para DO"

# ashopedagem -> Digital Ocean
cleanup_references "ashopedagem" "digitalocean" "aShopedagem para Digital Ocean"
cleanup_references "aShopedagem" "Digital Ocean" "aShopedagem para Digital Ocean (maiúscula)"

# Limpar arquivos obsoletos específicos
log_info "Removendo arquivos obsoletos..."

obsolete_files=(
    "guia-hospedagem-fisioflow.md"
    ".trae/documents/guia-hospedagem-fisioflow.md"
    "vercel.json"
    ".vercel"
)

for file in "${obsolete_files[@]}"; do
    if [ -e "$file" ]; then
        log_warn "Removendo arquivo obsoleto: $file"
        rm -rf "$file"
    fi
done

# Verificar e atualizar .gitignore
log_info "Atualizando .gitignore..."
if ! grep -q ".do/" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Digital Ocean" >> .gitignore
    echo ".do/" >> .gitignore
    echo "*.do.yaml" >> .gitignore
    echo "do-config.json" >> .gitignore
    echo "do-credentials.json" >> .gitignore
fi

# Remover referências do Vercel do .gitignore
sed -i.bak '/# Vercel/d; /.vercel/d' .gitignore 2>/dev/null || true
rm -f .gitignore.bak

log_info "✅ Limpeza da documentação concluída!"
log_info "📁 Backup salvo em: $BACKUP_DIR"
log_info "🔍 Execute 'scripts/validate-docs.sh' para validar as alterações"

echo ""
echo "📋 Resumo da limpeza:"
echo "   • Referências Railway → Digital Ocean"
echo "   • Referências Neon → DO Managed PostgreSQL"
echo "   • Referências Vercel → Digital Ocean"
echo "   • Referências aShopedagem → Digital Ocean"
echo "   • Arquivos obsoletos removidos"
echo "   • .gitignore atualizado"
echo ""
echo "🎉 Documentação limpa e organizada!"