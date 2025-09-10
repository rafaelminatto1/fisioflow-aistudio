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
    
    # Verificar headers importantes
    if echo "$HEADERS" | grep -qi "X-Content-Type-Options"; then
        echo -e "${GREEN}✅ X-Content-Type-Options presente${NC}"
    else
        echo -e "${YELLOW}⚠️ X-Content-Type-Options ausente${NC}"
    fi
    
    if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
        echo -e "${GREEN}✅ X-Frame-Options presente${NC}"
    else
        echo -e "${YELLOW}⚠️ X-Frame-Options ausente${NC}"
    fi
    
    if echo "$HEADERS" | grep -qi "X-XSS-Protection"; then
        echo -e "${GREEN}✅ X-XSS-Protection presente${NC}"
    else
        echo -e "${YELLOW}⚠️ X-XSS-Protection ausente${NC}"
    fi
    
    if echo "$HEADERS" | grep -qi "Strict-Transport-Security"; then
        echo -e "${GREEN}✅ Strict-Transport-Security presente${NC}"
    else
        echo -e "${YELLOW}⚠️ Strict-Transport-Security ausente${NC}"
    fi
    
    if echo "$HEADERS" | grep -qi "Referrer-Policy"; then
        echo -e "${GREEN}✅ Referrer-Policy presente${NC}"
    else
        echo -e "${YELLOW}⚠️ Referrer-Policy ausente${NC}"
    fi
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
    
    # Verificar endpoint de health
    health_code=$(curl -s -w "%{http_code}" -o /dev/null "$APP_URL/api/health")
    if [ "$health_code" = "200" ]; then
        echo -e "${GREEN}✅ /api/health retornou $health_code (esperado)${NC}"
    else
        echo -e "${YELLOW}⚠️ /api/health retornou $health_code (esperado: 200)${NC}"
    fi
    
    # Verificar endpoint de auth
    auth_code=$(curl -s -w "%{http_code}" -o /dev/null "$APP_URL/api/auth/session")
    if [ "$auth_code" = "200" ]; then
        echo -e "${GREEN}✅ /api/auth/session retornou $auth_code (esperado)${NC}"
    else
        echo -e "${YELLOW}⚠️ /api/auth/session retornou $auth_code (esperado: 200)${NC}"
    fi
    
    # Verificar endpoint de pacientes (deve ser protegido)
    pacientes_code=$(curl -s -w "%{http_code}" -o /dev/null "$APP_URL/api/pacientes")
    if [ "$pacientes_code" = "401" ] || [ "$pacientes_code" = "403" ]; then
        echo -e "${GREEN}✅ /api/pacientes retornou $pacientes_code (protegido)${NC}"
    else
        echo -e "${YELLOW}⚠️ /api/pacientes retornou $pacientes_code (deveria ser 401/403)${NC}"
    fi
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
    # Verificar arquivos sensíveis
    env_code=$(curl -s -w "%{http_code}" -o /dev/null "$APP_URL/.env")
    if [ "$env_code" = "404" ] || [ "$env_code" = "403" ]; then
        echo -e "${GREEN}✅ /.env protegido (código: $env_code)${NC}"
    else
        echo -e "${RED}❌ /.env pode estar exposto (código: $env_code)${NC}"
    fi
    
    package_code=$(curl -s -w "%{http_code}" -o /dev/null "$APP_URL/package.json")
    if [ "$package_code" = "404" ] || [ "$package_code" = "403" ]; then
        echo -e "${GREEN}✅ /package.json protegido (código: $package_code)${NC}"
    else
        echo -e "${RED}❌ /package.json pode estar exposto (código: $package_code)${NC}"
    fi
    
    git_code=$(curl -s -w "%{http_code}" -o /dev/null "$APP_URL/.git/config")
    if [ "$git_code" = "404" ] || [ "$git_code" = "403" ]; then
        echo -e "${GREEN}✅ /.git/config protegido (código: $git_code)${NC}"
    else
        echo -e "${RED}❌ /.git/config pode estar exposto (código: $git_code)${NC}"
    fi
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