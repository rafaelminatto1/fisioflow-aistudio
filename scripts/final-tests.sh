#!/bin/bash
# Script: final-tests.sh
# Executa bateria completa de testes finais para o FisioFlow

set -e

# Configurações
APP_URL="https://fisioflow-aistudio-1-7wnxs.ondigitalocean.app"
APP_ID="fc4f8558-d183-4d7e-8ea4-347355a20230"
TEST_RESULTS_DIR="./test-results"
DATE=$(date +"%Y%m%d_%H%M%S")
TEST_REPORT="$TEST_RESULTS_DIR/final_test_report_${DATE}.txt"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNING_TESTS=0

# Função para logging
log() {
    echo -e "$1" | tee -a "$TEST_REPORT"
}

# Função para teste com resultado
test_with_result() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    ((TOTAL_TESTS++))
    log "\n🧪 Teste: $test_name"
    
    if eval "$test_command"; then
        if [ "$expected_result" = "pass" ]; then
            log "${GREEN}✅ PASSOU${NC}"
            ((PASSED_TESTS++))
        else
            log "${RED}❌ FALHOU (esperado falha, mas passou)${NC}"
            ((FAILED_TESTS++))
        fi
    else
        if [ "$expected_result" = "fail" ]; then
            log "${GREEN}✅ PASSOU (falha esperada)${NC}"
            ((PASSED_TESTS++))
        else
            log "${RED}❌ FALHOU${NC}"
            ((FAILED_TESTS++))
        fi
    fi
}

# Função para teste de performance
performance_test() {
    local endpoint="$1"
    local max_time="$2"
    local test_name="$3"
    
    ((TOTAL_TESTS++))
    log "\n⚡ Teste de Performance: $test_name"
    
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "$APP_URL$endpoint" 2>/dev/null || echo "999")
    
    # Usar awk para comparação de float no macOS
    if awk "BEGIN {exit !($response_time <= $max_time)}"; then
        log "${GREEN}✅ PASSOU${NC} - Tempo: ${response_time}s (limite: ${max_time}s)"
        ((PASSED_TESTS++))
    else
        log "${RED}❌ FALHOU${NC} - Tempo: ${response_time}s (limite: ${max_time}s)"
        ((FAILED_TESTS++))
    fi
}

# Inicialização
log "${BLUE}🚀 TESTES FINAIS DO FISIOFLOW${NC}"
log "====================================="
log "Data/Hora: $(date)"
log "URL da Aplicação: $APP_URL"
log "ID da Aplicação: $APP_ID"
log "Relatório: $TEST_REPORT"

mkdir -p "$TEST_RESULTS_DIR"

# ============================================================================
# 1. TESTES DE INFRAESTRUTURA
# ============================================================================

log "\n${BLUE}📊 1. TESTES DE INFRAESTRUTURA${NC}"
log "================================"

# Conectividade básica
test_with_result "Conectividade HTTP básica" \
    "curl -s -o /dev/null -w '%{http_code}' '$APP_URL' | grep -q '200'" \
    "pass"

# Certificado SSL
test_with_result "Certificado SSL válido" \
    "curl -s -I '$APP_URL' | grep -q 'HTTP/2 200\|HTTP/1.1 200'" \
    "pass"

# ============================================================================
# 2. TESTES DE ENDPOINTS CRÍTICOS
# ============================================================================

log "\n${BLUE}🔍 2. TESTES DE ENDPOINTS CRÍTICOS${NC}"
log "==================================="

# Endpoints críticos
test_with_result "Página inicial (/)" \
    "curl -s -o /dev/null -w '%{http_code}' '$APP_URL/' | grep -q '200'" \
    "pass"

test_with_result "Health check (/api/health)" \
    "curl -s -o /dev/null -w '%{http_code}' '$APP_URL/api/health' | grep -q '200'" \
    "pass"

test_with_result "Página de login (/login)" \
    "curl -s -o /dev/null -w '%{http_code}' '$APP_URL/login' | grep -q '200'" \
    "pass"

test_with_result "Dashboard (/dashboard)" \
    "curl -s -o /dev/null -w '%{http_code}' '$APP_URL/dashboard' | grep -q '200\|302\|401'" \
    "pass"

# ============================================================================
# 3. TESTES DE PERFORMANCE
# ============================================================================

log "\n${BLUE}⚡ 3. TESTES DE PERFORMANCE${NC}"
log "=============================="

# Testes de tempo de resposta
performance_test "/" 3.0 "Página inicial"
performance_test "/api/health" 1.0 "Health check"
performance_test "/login" 3.0 "Página de login"

# Teste de carga básico
log "\n🔥 Teste de Carga Básica (5 requisições simultâneas)"
((TOTAL_TESTS++))

start_time=$(date +%s)
for i in {1..5}; do
    curl -s -o /dev/null "$APP_URL/api/health" &
done
wait
end_time=$(date +%s)
load_test_time=$((end_time - start_time))

if [ $load_test_time -le 10 ]; then
    log "${GREEN}✅ PASSOU${NC} - 5 requisições em ${load_test_time}s"
    ((PASSED_TESTS++))
else
    log "${RED}❌ FALHOU${NC} - 5 requisições em ${load_test_time}s (limite: 10s)"
    ((FAILED_TESTS++))
fi

# ============================================================================
# 4. TESTES DE SEGURANÇA
# ============================================================================

log "\n${BLUE}🔒 4. TESTES DE SEGURANÇA${NC}"
log "============================="

# Headers de segurança
test_with_result "Header X-Frame-Options" \
    "curl -s -I '$APP_URL' | grep -qi 'X-Frame-Options'" \
    "pass"

test_with_result "Header X-Content-Type-Options" \
    "curl -s -I '$APP_URL' | grep -qi 'X-Content-Type-Options'" \
    "pass"

test_with_result "Header Strict-Transport-Security" \
    "curl -s -I '$APP_URL' | grep -qi 'Strict-Transport-Security'" \
    "pass"

# Teste de endpoints sensíveis (devem retornar erro)
test_with_result "Proteção de arquivos sensíveis (.env)" \
    "curl -s -o /dev/null -w '%{http_code}' '$APP_URL/.env' | grep -q '404\|403'" \
    "pass"

test_with_result "Proteção de diretórios sensíveis (.git)" \
    "curl -s -o /dev/null -w '%{http_code}' '$APP_URL/.git/config' | grep -q '404\|403'" \
    "pass"

# ============================================================================
# 5. TESTES FUNCIONAIS BÁSICOS
# ============================================================================

log "\n${BLUE}🎯 5. TESTES FUNCIONAIS BÁSICOS${NC}"
log "=================================="

# Teste de formulário de login (estrutura HTML)
test_with_result "Formulário de login presente" \
    "curl -s '$APP_URL/login' | grep -q 'form\|input.*password\|input.*email'" \
    "pass"

# Teste de assets estáticos
test_with_result "Assets CSS carregando" \
    "curl -s '$APP_URL' | grep -q 'stylesheet\|css'" \
    "pass"

test_with_result "Assets JavaScript carregando" \
    "curl -s '$APP_URL' | grep -q 'script.*js'" \
    "pass"

# Teste de meta tags importantes
test_with_result "Meta tags básicas presentes" \
    "curl -s '$APP_URL' | grep -q '<title>\|<meta.*viewport'" \
    "pass"

# ============================================================================
# 6. TESTES DE DOCUMENTAÇÃO
# ============================================================================

log "\n${BLUE}📚 6. TESTES DE DOCUMENTAÇÃO${NC}"
log "=================================="

# Verificar documentos essenciais
test_with_result "Documento CONFIGURACAO-FINAL-DEPLOY.md existe" \
    "[ -f '.trae/documents/DEPLOY/CONFIGURACAO-FINAL-DEPLOY.md' ]" \
    "pass"

test_with_result "Documento GUIA-TROUBLESHOOTING.md existe" \
    "[ -f '.trae/documents/DEPLOY/GUIA-TROUBLESHOOTING.md' ]" \
    "pass"

test_with_result "Documento PROCEDIMENTOS-BACKUP.md existe" \
    "[ -f '.trae/documents/DEPLOY/PROCEDIMENTOS-BACKUP.md' ]" \
    "pass"

test_with_result "Documento RUNBOOK-OPERACOES.md existe" \
    "[ -f '.trae/documents/DEPLOY/RUNBOOK-OPERACOES.md' ]" \
    "pass"

test_with_result "Documento PROCESSO-ROLLBACK.md existe" \
    "[ -f '.trae/documents/DEPLOY/PROCESSO-ROLLBACK.md' ]" \
    "pass"

# ============================================================================
# 7. TESTES DE SCRIPTS
# ============================================================================

log "\n${BLUE}🔧 7. TESTES DE SCRIPTS${NC}"
log "========================"

# Verificar se scripts essenciais existem
test_with_result "Script de backup completo existe" \
    "[ -f './scripts/full-backup.sh' ]" \
    "pass"

test_with_result "Script de monitoramento existe" \
    "[ -f './scripts/monitoring-setup.sh' ]" \
    "pass"

test_with_result "Script de segurança existe" \
    "[ -f './scripts/security-check.sh' ]" \
    "pass"

test_with_result "Workflow do GitHub Actions existe" \
    "[ -f './.github/workflows/deploy.yml' ]" \
    "pass"

# ============================================================================
# RELATÓRIO FINAL
# ============================================================================

log "\n${BLUE}📊 RELATÓRIO FINAL DOS TESTES${NC}"
log "==============================="
log "Data/Hora: $(date)"
log "\n📈 Estatísticas:"
log "Total de testes: $TOTAL_TESTS"
log "${GREEN}✅ Passou: $PASSED_TESTS${NC}"
log "${RED}❌ Falhou: $FAILED_TESTS${NC}"
log "${YELLOW}⚠️ Avisos: $WARNING_TESTS${NC}"

# Calcular porcentagem de sucesso
if [ $TOTAL_TESTS -gt 0 ]; then
    success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    log "\n📊 Taxa de sucesso: ${success_rate}%"
fi

# Determinar status geral
if [ $FAILED_TESTS -eq 0 ]; then
    if [ $WARNING_TESTS -eq 0 ]; then
        log "\n${GREEN}🎉 TODOS OS TESTES PASSARAM! Sistema pronto para produção.${NC}"
        exit_code=0
    else
        log "\n${YELLOW}⚠️ Testes passaram com avisos. Revisar itens marcados.${NC}"
        exit_code=0
    fi
else
    log "\n${RED}❌ ALGUNS TESTES FALHARAM! Ação necessária antes da produção.${NC}"
    exit_code=1
fi

# Recomendações finais
log "\n📋 Próximos passos:"
if [ $FAILED_TESTS -eq 0 ]; then
    log "1. ✅ Sistema aprovado para produção"
    log "2. 📊 Monitorar métricas por 24h após deploy"
    log "3. 📝 Documentar quaisquer observações"
    log "4. 🎯 Agendar revisão pós-deploy"
else
    log "1. 🔧 Corrigir falhas identificadas"
    log "2. 🧪 Re-executar testes após correções"
    log "3. 📞 Consultar equipe se necessário"
    log "4. 📋 Não prosseguir para produção até resolver falhas"
fi

log "\n📁 Relatório completo salvo em: $TEST_REPORT"
log "\n${BLUE}🏁 TESTES FINAIS CONCLUÍDOS${NC}"

exit $exit_code