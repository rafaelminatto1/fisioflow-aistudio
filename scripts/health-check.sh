#!/bin/bash
# scripts/health-check.sh
# Script de verificação completa do sistema FisioFlow

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

# Função para verificar comando
check_command() {
    if command -v "$1" &> /dev/null; then
        log "${GREEN}✅ $1 está disponível${NC}"
        return 0
    else
        log "${RED}❌ $1 não encontrado${NC}"
        return 1
    fi
}

# Função para verificar status de serviço
check_service() {
    local service_name="$1"
    local check_command="$2"
    
    log "${BLUE}🔍 Verificando $service_name...${NC}"
    
    if eval "$check_command" &> /dev/null; then
        log "${GREEN}✅ $service_name está funcionando${NC}"
        return 0
    else
        log "${RED}❌ $service_name com problemas${NC}"
        return 1
    fi
}

# Função principal de verificação
main() {
    log "${BLUE}🔍 Iniciando verificação completa do sistema FisioFlow...${NC}"
    
    local errors=0
    
    # Verificar dependências básicas
    log "${YELLOW}📋 Verificando dependências básicas...${NC}"
    check_command "node" || ((errors++))
    check_command "npm" || ((errors++))
    check_command "git" || ((errors++))
    
    # Verificar Railway CLI (opcional)
    if check_command "railway"; then
        log "${BLUE}📡 Verificando Railway...${NC}"
        if railway status --json > railway_status.json 2>/dev/null; then
            log "${GREEN}✅ Railway conectado e funcionando${NC}"
        else
            log "${YELLOW}⚠️ Railway CLI disponível mas não conectado${NC}"
            ((errors++))
        fi
    else
        log "${YELLOW}⚠️ Railway CLI não instalado (opcional)${NC}"
    fi
    
    # Verificar Neon CLI (opcional)
    if check_command "neon"; then
        log "${BLUE}🗄️ Verificando Neon DB...${NC}"
        if neon connection test > neon_status.log 2>&1; then
            log "${GREEN}✅ Neon DB conectado e funcionando${NC}"
        else
            log "${YELLOW}⚠️ Neon CLI disponível mas conexão falhou${NC}"
            ((errors++))
        fi
    else
        log "${YELLOW}⚠️ Neon CLI não instalado (opcional)${NC}"
    fi
    
    # Verificar Node.js e dependências
    log "${BLUE}📦 Verificando dependências do projeto...${NC}"
    if [ -f "package.json" ]; then
        if npm list --depth=0 > /dev/null 2>&1; then
            log "${GREEN}✅ Dependências do npm instaladas corretamente${NC}"
        else
            log "${RED}❌ Problemas com dependências do npm${NC}"
            ((errors++))
        fi
    else
        log "${RED}❌ package.json não encontrado${NC}"
        ((errors++))
    fi
    
    # Verificar TypeScript
    log "${BLUE}📝 Verificando TypeScript...${NC}"
    if npx tsc --noEmit > typescript_errors.log 2>&1; then
        log "${GREEN}✅ TypeScript sem erros${NC}"
    else
        log "${RED}❌ TypeScript com erros - verifique typescript_errors.log${NC}"
        ((errors++))
    fi
    
    # Verificar ESLint
    log "${BLUE}🔍 Verificando ESLint...${NC}"
    if npm run lint > eslint_errors.log 2>&1; then
        log "${GREEN}✅ ESLint sem erros${NC}"
    else
        log "${YELLOW}⚠️ ESLint encontrou problemas - verifique eslint_errors.log${NC}"
    fi
    
    # Verificar Build
    log "${BLUE}🔨 Verificando Build...${NC}"
    if npm run build > build_status.log 2>&1; then
        log "${GREEN}✅ Build executado com sucesso${NC}"
    else
        log "${RED}❌ Build falhou - verifique build_status.log${NC}"
        ((errors++))
    fi
    
    # Verificar Testes (se existirem)
    if npm run test --silent > /dev/null 2>&1; then
        log "${BLUE}🧪 Executando Testes...${NC}"
        if npm test > test_results.log 2>&1; then
            log "${GREEN}✅ Testes passaram${NC}"
        else
            log "${YELLOW}⚠️ Alguns testes falharam - verifique test_results.log${NC}"
        fi
    else
        log "${YELLOW}⚠️ Script de teste não encontrado${NC}"
    fi
    
    # Verificar variáveis de ambiente
    log "${BLUE}🔧 Verificando variáveis de ambiente...${NC}"
    if [ -f ".env" ]; then
        log "${GREEN}✅ Arquivo .env encontrado${NC}"
        
        # Verificar variáveis críticas
        critical_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
        for var in "${critical_vars[@]}"; do
            if grep -q "^$var=" .env; then
                log "${GREEN}✅ $var configurada${NC}"
            else
                log "${RED}❌ $var não encontrada no .env${NC}"
                ((errors++))
            fi
        done
    else
        log "${RED}❌ Arquivo .env não encontrado${NC}"
        ((errors++))
    fi
    
    # Verificar conexão com banco de dados
    log "${BLUE}🗄️ Verificando conexão com banco de dados...${NC}"
    if node -e "require('./lib/prisma.ts').default.\$connect().then(() => console.log('OK')).catch(() => process.exit(1))" > /dev/null 2>&1; then
        log "${GREEN}✅ Conexão com banco de dados funcionando${NC}"
    else
        log "${RED}❌ Falha na conexão com banco de dados${NC}"
        ((errors++))
    fi
    
    # Verificar arquivos de configuração importantes
    log "${BLUE}📋 Verificando arquivos de configuração...${NC}"
    config_files=("next.config.js" "tsconfig.json" "tailwind.config.js" "prisma/schema.prisma")
    for file in "${config_files[@]}"; do
        if [ -f "$file" ]; then
            log "${GREEN}✅ $file encontrado${NC}"
        else
            log "${RED}❌ $file não encontrado${NC}"
            ((errors++))
        fi
    done
    
    # Gerar relatório final
    log "${BLUE}📊 Gerando relatório final...${NC}"
    
    echo "" > health_check_report.txt
    echo "=== RELATÓRIO DE VERIFICAÇÃO DO SISTEMA FISIOFLOW ===" >> health_check_report.txt
    echo "Data: $(date)" >> health_check_report.txt
    echo "Erros encontrados: $errors" >> health_check_report.txt
    echo "" >> health_check_report.txt
    
    if [ $errors -eq 0 ]; then
        log "${GREEN}🎉 Sistema está funcionando perfeitamente!${NC}"
        echo "Status: SAUDÁVEL" >> health_check_report.txt
    elif [ $errors -le 3 ]; then
        log "${YELLOW}⚠️ Sistema funcionando com alguns problemas menores ($errors erros)${NC}"
        echo "Status: ATENÇÃO" >> health_check_report.txt
    else
        log "${RED}🚨 Sistema com problemas críticos ($errors erros)${NC}"
        echo "Status: CRÍTICO" >> health_check_report.txt
    fi
    
    # Listar arquivos de log gerados
    echo "" >> health_check_report.txt
    echo "Logs gerados:" >> health_check_report.txt
    for logfile in railway_status.json neon_status.log typescript_errors.log eslint_errors.log build_status.log test_results.log; do
        if [ -f "$logfile" ]; then
            echo "- $logfile" >> health_check_report.txt
        fi
    done
    
    log "${BLUE}📄 Relatório salvo em health_check_report.txt${NC}"
    log "${GREEN}✅ Verificação completa finalizada${NC}"
    
    # Executar análise de logs se o script existir
    if [ -f "scripts/analyze-logs.js" ]; then
        log "${BLUE}🔍 Executando análise de logs...${NC}"
        node scripts/analyze-logs.js
    fi
    
    return $errors
}

# Executar verificação
main "$@"
exit $?