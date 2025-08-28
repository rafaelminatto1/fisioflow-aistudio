#!/bin/bash
# scripts/auto-fix.sh
# Script de correção automática de problemas do FisioFlow

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log com timestamp
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Função para executar comando com retry
execute_with_retry() {
    local command="$1"
    local max_attempts="${2:-3}"
    local delay="${3:-5}"
    
    for ((i=1; i<=max_attempts; i++)); do
        log "${BLUE}Tentativa $i/$max_attempts: $command${NC}"
        
        if eval "$command"; then
            log "${GREEN}✅ Comando executado com sucesso${NC}"
            return 0
        else
            if [ $i -lt $max_attempts ]; then
                log "${YELLOW}⚠️ Falha na tentativa $i, aguardando ${delay}s...${NC}"
                sleep $delay
            else
                log "${RED}❌ Comando falhou após $max_attempts tentativas${NC}"
                return 1
            fi
        fi
    done
}

# Função para backup de arquivos importantes
backup_files() {
    log "${BLUE}💾 Criando backup de arquivos importantes...${NC}"
    
    local backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup de arquivos críticos
    local critical_files=(
        "package.json"
        "package-lock.json"
        ".env"
        "next.config.js"
        "tsconfig.json"
        "prisma/schema.prisma"
    )
    
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            cp "$file" "$backup_dir/"
            log "${GREEN}✅ Backup de $file criado${NC}"
        fi
    done
    
    log "${GREEN}✅ Backup criado em $backup_dir${NC}"
    echo "$backup_dir" > .last_backup
}

# Função para limpar cache e arquivos temporários
clean_cache() {
    log "${BLUE}🧹 Limpando cache e arquivos temporários...${NC}"
    
    # Limpar cache do Next.js
    if [ -d ".next" ]; then
        rm -rf .next
        log "${GREEN}✅ Cache do Next.js removido${NC}"
    fi
    
    # Limpar cache do Node.js
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
        log "${GREEN}✅ Cache do Node.js removido${NC}"
    fi
    
    # Limpar cache do npm
    if command -v npm &> /dev/null; then
        npm cache clean --force
        log "${GREEN}✅ Cache do npm limpo${NC}"
    fi
    
    # Limpar arquivos de log antigos
    find . -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
    log "${GREEN}✅ Logs antigos removidos${NC}"
    
    # Limpar arquivos temporários
    rm -f typescript_errors.log eslint_errors.log build_status.log test_results.log
    rm -f railway_status.json neon_status.log
    log "${GREEN}✅ Arquivos temporários removidos${NC}"
}

# Função para reinstalar dependências
reinstall_dependencies() {
    log "${BLUE}📦 Reinstalando dependências...${NC}"
    
    # Remover node_modules e package-lock.json
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        log "${GREEN}✅ node_modules removido${NC}"
    fi
    
    if [ -f "package-lock.json" ]; then
        rm -f package-lock.json
        log "${GREEN}✅ package-lock.json removido${NC}"
    fi
    
    # Reinstalar dependências
    execute_with_retry "npm install" 3 10
}

# Função para regenerar Prisma
regenerate_prisma() {
    log "${BLUE}🔄 Regenerando Prisma...${NC}"
    
    if [ -f "prisma/schema.prisma" ]; then
        # Gerar cliente Prisma
        execute_with_retry "npx prisma generate" 3 5
        
        # Executar migrations (se necessário)
        if [ "$1" = "--with-migrate" ]; then
            log "${BLUE}🗄️ Executando migrations...${NC}"
            execute_with_retry "npx prisma migrate deploy" 3 10
        fi
        
        log "${GREEN}✅ Prisma regenerado com sucesso${NC}"
    else
        log "${YELLOW}⚠️ Schema do Prisma não encontrado${NC}"
    fi
}

# Função para corrigir problemas de TypeScript
fix_typescript() {
    log "${BLUE}📝 Corrigindo problemas de TypeScript...${NC}"
    
    # Verificar e corrigir tsconfig.json
    if [ ! -f "tsconfig.json" ]; then
        log "${YELLOW}⚠️ tsconfig.json não encontrado, criando...${NC}"
        npx tsc --init
    fi
    
    # Executar verificação de tipos
    if npx tsc --noEmit > typescript_fix.log 2>&1; then
        log "${GREEN}✅ TypeScript sem erros${NC}"
    else
        log "${YELLOW}⚠️ Erros de TypeScript encontrados, tentando correção automática...${NC}"
        
        # Tentar corrigir imports automáticamente
        if command -v eslint &> /dev/null; then
            npm run lint -- --fix 2>/dev/null || true
            log "${GREEN}✅ ESLint auto-fix executado${NC}"
        fi
    fi
}

# Função para corrigir problemas de build
fix_build() {
    log "${BLUE}🔨 Corrigindo problemas de build...${NC}"
    
    # Verificar next.config.js
    if [ ! -f "next.config.js" ] && [ ! -f "next.config.mjs" ]; then
        log "${YELLOW}⚠️ Configuração do Next.js não encontrada${NC}"
    fi
    
    # Tentar build
    if npm run build > build_fix.log 2>&1; then
        log "${GREEN}✅ Build executado com sucesso${NC}"
    else
        log "${RED}❌ Build falhou, verifique build_fix.log${NC}"
        
        # Tentar correções comuns
        log "${BLUE}🔧 Tentando correções comuns...${NC}"
        
        # Limpar cache novamente
        clean_cache
        
        # Reinstalar dependências críticas
        npm install next react react-dom typescript @types/node @types/react @types/react-dom
        
        # Tentar build novamente
        if npm run build > build_fix_retry.log 2>&1; then
            log "${GREEN}✅ Build corrigido com sucesso${NC}"
        else
            log "${RED}❌ Build ainda falhando após correções${NC}"
            return 1
        fi
    fi
}

# Função para corrigir problemas de banco de dados
fix_database() {
    log "${BLUE}🗄️ Corrigindo problemas de banco de dados...${NC}"
    
    # Verificar conexão
    if node -e "require('./lib/prisma.ts').default.\$connect().then(() => console.log('OK')).catch(() => process.exit(1))" > /dev/null 2>&1; then
        log "${GREEN}✅ Conexão com banco funcionando${NC}"
    else
        log "${YELLOW}⚠️ Problemas de conexão com banco, tentando correções...${NC}"
        
        # Regenerar Prisma com migrations
        regenerate_prisma --with-migrate
        
        # Testar conexão novamente
        if node -e "require('./lib/prisma.ts').default.\$connect().then(() => console.log('OK')).catch(() => process.exit(1))" > /dev/null 2>&1; then
            log "${GREEN}✅ Conexão com banco corrigida${NC}"
        else
            log "${RED}❌ Problemas de conexão persistem${NC}"
            return 1
        fi
    fi
}

# Função para corrigir variáveis de ambiente
fix_environment() {
    log "${BLUE}🔧 Verificando e corrigindo variáveis de ambiente...${NC}"
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log "${YELLOW}⚠️ Arquivo .env criado a partir do .env.example${NC}"
            log "${RED}❗ IMPORTANTE: Configure as variáveis em .env${NC}"
        else
            log "${RED}❌ Arquivo .env e .env.example não encontrados${NC}"
            return 1
        fi
    fi
    
    # Verificar variáveis críticas
    local missing_vars=()
    local critical_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
    
    for var in "${critical_vars[@]}"; do
        if ! grep -q "^$var=" .env || grep -q "^$var=$" .env; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log "${RED}❌ Variáveis não configuradas: ${missing_vars[*]}${NC}"
        log "${YELLOW}⚠️ Configure essas variáveis em .env${NC}"
        return 1
    else
        log "${GREEN}✅ Variáveis de ambiente configuradas${NC}"
    fi
}

# Função para executar testes de validação
run_validation_tests() {
    log "${BLUE}🧪 Executando testes de validação...${NC}"
    
    local validation_errors=0
    
    # Teste de TypeScript
    if npx tsc --noEmit > /dev/null 2>&1; then
        log "${GREEN}✅ TypeScript: OK${NC}"
    else
        log "${RED}❌ TypeScript: ERRO${NC}"
        ((validation_errors++))
    fi
    
    # Teste de Build
    if npm run build > /dev/null 2>&1; then
        log "${GREEN}✅ Build: OK${NC}"
    else
        log "${RED}❌ Build: ERRO${NC}"
        ((validation_errors++))
    fi
    
    # Teste de Conexão com Banco
    if node -e "require('./lib/prisma.ts').default.\$connect().then(() => console.log('OK')).catch(() => process.exit(1))" > /dev/null 2>&1; then
        log "${GREEN}✅ Banco de Dados: OK${NC}"
    else
        log "${RED}❌ Banco de Dados: ERRO${NC}"
        ((validation_errors++))
    fi
    
    return $validation_errors
}

# Função principal
main() {
    log "${BLUE}🔧 Iniciando correção automática do sistema FisioFlow...${NC}"
    
    local fix_errors=0
    local start_time=$(date +%s)
    
    # Criar backup
    backup_files
    
    # Executar correções em sequência
    log "${YELLOW}📋 Executando correções automáticas...${NC}"
    
    # 1. Limpar cache
    clean_cache || ((fix_errors++))
    
    # 2. Corrigir variáveis de ambiente
    fix_environment || ((fix_errors++))
    
    # 3. Reinstalar dependências
    reinstall_dependencies || ((fix_errors++))
    
    # 4. Regenerar Prisma
    regenerate_prisma || ((fix_errors++))
    
    # 5. Corrigir TypeScript
    fix_typescript || ((fix_errors++))
    
    # 6. Corrigir problemas de banco
    fix_database || ((fix_errors++))
    
    # 7. Corrigir build
    fix_build || ((fix_errors++))
    
    # Executar testes de validação
    log "${BLUE}🔍 Executando validação final...${NC}"
    run_validation_tests
    local validation_errors=$?
    
    # Calcular tempo total
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Gerar relatório
    log "${BLUE}📊 Gerando relatório de correção...${NC}"
    
    echo "" > auto_fix_report.txt
    echo "=== RELATÓRIO DE CORREÇÃO AUTOMÁTICA ===" >> auto_fix_report.txt
    echo "Data: $(date)" >> auto_fix_report.txt
    echo "Duração: ${duration}s" >> auto_fix_report.txt
    echo "Erros de correção: $fix_errors" >> auto_fix_report.txt
    echo "Erros de validação: $validation_errors" >> auto_fix_report.txt
    echo "" >> auto_fix_report.txt
    
    if [ $fix_errors -eq 0 ] && [ $validation_errors -eq 0 ]; then
        log "${GREEN}🎉 Correção automática concluída com sucesso!${NC}"
        echo "Status: SUCESSO" >> auto_fix_report.txt
    elif [ $validation_errors -eq 0 ]; then
        log "${YELLOW}⚠️ Correção concluída com alguns problemas ($fix_errors erros de correção)${NC}"
        echo "Status: PARCIAL" >> auto_fix_report.txt
    else
        log "${RED}🚨 Correção falhou ($fix_errors erros de correção, $validation_errors erros de validação)${NC}"
        echo "Status: FALHA" >> auto_fix_report.txt
    fi
    
    # Mostrar backup criado
    if [ -f ".last_backup" ]; then
        local backup_dir=$(cat .last_backup)
        echo "Backup criado em: $backup_dir" >> auto_fix_report.txt
        log "${BLUE}💾 Backup disponível em: $backup_dir${NC}"
    fi
    
    log "${BLUE}📄 Relatório salvo em auto_fix_report.txt${NC}"
    log "${GREEN}✅ Correção automática finalizada${NC}"
    
    return $((fix_errors + validation_errors))
}

# Verificar argumentos
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Uso: $0 [opções]"
    echo "Opções:"
    echo "  --help, -h     Mostrar esta ajuda"
    echo "  --dry-run      Simular correções sem executar"
    echo "  --force        Forçar correções mesmo com erros"
    exit 0
fi

if [ "$1" = "--dry-run" ]; then
    log "${YELLOW}🔍 Modo simulação - nenhuma alteração será feita${NC}"
    # Implementar modo dry-run se necessário
    exit 0
fi

# Executar correção
main "$@"
exit $?