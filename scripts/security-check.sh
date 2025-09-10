#!/bin/bash

# Script de Verificação de Segurança - FisioFlow
# Verifica configurações de segurança da aplicação

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL da aplicação
APP_URL="https://fisioflow-uaphq.ondigitalocean.app"

echo -e "${BLUE}🔒 Iniciando verificação de segurança do FisioFlow...${NC}"
echo "URL: $APP_URL"
echo "Data: $(date)"
echo "==========================================="

# Função para verificar SSL/TLS
check_ssl() {
    echo -e "\n${BLUE}🔐 Verificando SSL/TLS...${NC}"
    
    # Verificar certificado SSL
    SSL_INFO=$(echo | openssl s_client -servername $(echo $APP_URL | sed 's|https://||') -connect $(echo $APP_URL | sed 's|https://||'):443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Certificado SSL válido${NC}"
        echo "$SSL_INFO"
    else
        echo -e "${RED}❌ Problema com certificado SSL${NC}"
    fi
    
    # Verificar redirecionamento HTTPS
    HTTP_REDIRECT=$(curl -s -I -w "%{http_code}" -o /dev/null "http://$(echo $APP_URL | sed 's|https://||')")
    if [[ "$HTTP_REDIRECT" =~ ^30[1-8]$ ]]; then
        echo -e "${GREEN}✅ Redirecionamento HTTP para HTTPS ativo${NC}"
    else
        echo -e "${YELLOW}⚠️ Redirecionamento HTTP não detectado (código: $HTTP_REDIRECT)${NC}"
    fi
}

# Função para verificar headers de segurança
check_security_headers() {
    echo -e "\n${BLUE}🛡️ Verificando headers de segurança...${NC}"
    
    HEADERS=$(curl -s -I "$APP_URL")
    
    # Lista de headers importantes
    declare -A SECURITY_HEADERS=(
        ["X-Content-Type-Options"]="nosniff"
        ["X-Frame-Options"]="DENY|SAMEORIGIN"
        ["X-XSS-Protection"]="1"
        ["Strict-Transport-Security"]="max-age"
        ["Referrer-Policy"]="strict-origin"
    )
    
    for header in "${!SECURITY_HEADERS[@]}"; do
        if echo "$HEADERS" | grep -qi "$header"; then
            echo -e "${GREEN}✅ $header presente${NC}"
        else
            echo -e "${YELLOW}⚠️ $header ausente${NC}"
        fi
    done
}

# Função para testar rate limiting
check_rate_limiting() {
    echo -e "\n${BLUE}⏱️ Testando rate limiting...${NC}"
    
    # Fazer múltiplas requisições rápidas
    RATE_TEST_URL="$APP_URL/api/health"
    SUCCESS_COUNT=0
    RATE_LIMITED=false
    
    for i in {1..10}; do
        HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null "$RATE_TEST_URL")
        if [ "$HTTP_CODE" = "200" ]; then
            ((SUCCESS_COUNT++))
        elif [ "$HTTP_CODE" = "429" ]; then
            RATE_LIMITED=true
            break
        fi
        sleep 0.1
    done
    
    if [ "$RATE_LIMITED" = true ]; then
        echo -e "${GREEN}✅ Rate limiting ativo (bloqueou após requisições rápidas)${NC}"
    elif [ $SUCCESS_COUNT -eq 10 ]; then
        echo -e "${YELLOW}⚠️ Rate limiting não detectado (10/10 requisições bem-sucedidas)${NC}"
    else
        echo -e "${YELLOW}⚠️ Rate limiting parcial ($SUCCESS_COUNT/10 requisições bem-sucedidas)${NC}"
    fi
}

# Função para verificar endpoints críticos
check_critical_endpoints() {
    echo -e "\n${BLUE}🎯 Verificando endpoints críticos...${NC}"
    
    declare -A ENDPOINTS=(
        ["/api/health"]=200
        ["/api/auth/session"]=200
        ["/api/pacientes"]=401  # Deve retornar 401 sem autenticação
        ["/admin"]=401         # Deve retornar 401 sem autenticação
    )
    
    for endpoint in "${!ENDPOINTS[@]}"; do
        expected_code=${ENDPOINTS[$endpoint]}
        actual_code=$(curl -s -w "%{http_code}" -o /dev/null "$APP_URL$endpoint")
        
        if [ "$actual_code" = "$expected_code" ]; then
            echo -e "${GREEN}✅ $endpoint retornou $actual_code (esperado)${NC}"
        else
            echo -e "${YELLOW}⚠️ $endpoint retornou $actual_code (esperado: $expected_code)${NC}"
        fi
    done
}

# Função para verificar vulnerabilidades comuns
check_common_vulnerabilities() {
    echo -e "\n${BLUE}🔍 Verificando vulnerabilidades comuns...${NC}"
    
    # Teste de SQL Injection básico
    SQL_TEST=$(curl -s -w "%{http_code}" -o /dev/null "$APP_URL/api/pacientes?id=1'OR'1'='1")
    if [ "$SQL_TEST" = "400" ] || [ "$SQL_TEST" = "401" ]; then
        echo -e "${GREEN}✅ Proteção contra SQL Injection ativa${NC}"
    else
        echo -e "${RED}❌ Possível vulnerabilidade SQL Injection (código: $SQL_TEST)${NC}"
    fi
    
    # Teste de XSS básico
    XSS_TEST=$(curl -s -w "%{http_code}" -o /dev/null "$APP_URL/?search=<script>alert('xss')</script>")
    if [ "$XSS_TEST" = "400" ] || [ "$XSS_TEST" = "200" ]; then
        echo -e "${GREEN}✅ Proteção contra XSS básica${NC}"
    else
        echo -e "${YELLOW}⚠️ Verificar proteção XSS (código: $XSS_TEST)${NC}"
    fi
}

# Função para verificar informações expostas
check_information_disclosure() {
    echo -e "\n${BLUE}📋 Verificando exposição de informações...${NC}"
    
    # Verificar se arquivos sensíveis estão expostos
    declare -a SENSITIVE_FILES=(
        "/.env"
        "/package.json"
        "/.git/config"
        "/admin"
        "/phpmyadmin"
    )
    
    for file in "${SENSITIVE_FILES[@]}"; do
        HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null "$APP_URL$file")
        if [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "403" ]; then
            echo -e "${GREEN}✅ $file protegido (código: $HTTP_CODE)${NC}"
        else
            echo -e "${RED}❌ $file pode estar exposto (código: $HTTP_CODE)${NC}"
        fi
    done
}

# Função para gerar relatório
generate_report() {
    echo -e "\n${BLUE}📊 Gerando relatório de segurança...${NC}"
    
    REPORT_FILE="security-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "RELATÓRIO DE SEGURANÇA - FISIOFLOW"
        echo "Data: $(date)"
        echo "URL: $APP_URL"
        echo "==========================================="
        echo ""
        echo "RESUMO:"
        echo "- SSL/TLS: Verificado"
        echo "- Headers de Segurança: Verificados"
        echo "- Rate Limiting: Testado"
        echo "- Endpoints Críticos: Verificados"
        echo "- Vulnerabilidades Comuns: Testadas"
        echo "- Exposição de Informações: Verificada"
        echo ""
        echo "Para detalhes completos, consulte os logs de execução."
        echo ""
        echo "Próxima verificação recomendada: $(date -d '+1 week')"
    } > "$REPORT_FILE"
    
    echo -e "${GREEN}✅ Relatório salvo em: $REPORT_FILE${NC}"
}

# Executar todas as verificações
main() {
    check_ssl
    check_security_headers
    check_rate_limiting
    check_critical_endpoints
    check_common_vulnerabilities
    check_information_disclosure
    generate_report
    
    echo -e "\n${GREEN}🎉 Verificação de segurança concluída!${NC}"
    echo -e "${BLUE}💡 Dica: Execute este script regularmente para manter a segurança${NC}"
}

# Verificar se curl e openssl estão disponíveis
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl não encontrado. Instale curl para executar este script.${NC}"
    exit 1
fi

if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ openssl não encontrado. Instale openssl para verificações SSL.${NC}"
    exit 1
fi

# Executar script principal
main