#!/bin/bash
# Script de Monitoramento de Saúde - FisioFlow
# Executa verificações de saúde e envia alertas quando necessário

set -e

# Configurações
APP_URL="https://fisioflow-uaphq.ondigitalocean.app"
HEALTH_ENDPOINT="$APP_URL/api/health"
STATUS_ENDPOINT="$APP_URL/api/status"
TIMEOUT=30
LOG_FILE="/tmp/fisioflow-health.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Função para enviar alerta Slack (se configurado)
send_slack_alert() {
    local message="$1"
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 FisioFlow Alert: $message\"}" \
            "$SLACK_WEBHOOK_URL" > /dev/null
    fi
}

# Função para verificar endpoint
check_endpoint() {
    local endpoint="$1"
    local name="$2"
    
    log "Verificando $name: $endpoint"
    
    response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" \
        --max-time $TIMEOUT -L "$endpoint" || echo "000:0")
    
    http_code=$(echo $response | cut -d: -f1)
    response_time=$(echo $response | cut -d: -f2)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "307" ] || [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
        log "✅ $name OK (${response_time}s)"
        return 0
    else
        log "❌ $name FALHOU - HTTP $http_code (${response_time}s)"
        send_slack_alert "$name falhou - HTTP $http_code"
        return 1
    fi
}

# Função para verificar recursos do sistema
check_system_resources() {
    log "Verificando recursos do sistema via Digital Ocean..."
    
    # Verificar status da aplicação
    if command -v doctl &> /dev/null; then
        app_status=$(doctl apps get fc4f8558-d183-4d7e-8ea4-347355a20230 --format ID,Name,ActiveDeployment.Phase 2>/dev/null || echo "ERROR")
        
        if [[ "$app_status" == *"ACTIVE"* ]]; then
            log "✅ Aplicação ATIVA no Digital Ocean"
        else
            log "❌ Problema na aplicação Digital Ocean: $app_status"
            send_slack_alert "Aplicação não está ATIVA no Digital Ocean"
        fi
    else
        log "⚠️  doctl não instalado - pulando verificação DO"
    fi
}

# Função para verificar banco de dados
check_database() {
    log "Verificando conectividade do banco de dados..."
    
    # Tentar endpoint que usa banco
    db_check=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time $TIMEOUT "$APP_URL/api/test" || echo "000")
    
    if [ "$db_check" = "200" ]; then
        log "✅ Banco de dados conectado"
    else
        log "❌ Problema na conexão do banco - HTTP $db_check"
        send_slack_alert "Problema na conexão do banco de dados"
    fi
}

# Função principal
main() {
    log "=== Iniciando verificação de saúde do FisioFlow ==="
    
    local errors=0
    
    # Verificar endpoints principais
    check_endpoint "$HEALTH_ENDPOINT" "Health Check" || ((errors++))
    check_endpoint "$STATUS_ENDPOINT" "Status API" || ((errors++))
    check_endpoint "$APP_URL" "Página Principal" || ((errors++))
    
    # Verificar recursos do sistema
    check_system_resources
    
    # Verificar banco de dados
    check_database
    
    # Resumo final
    if [ $errors -eq 0 ]; then
        log "✅ Todas as verificações passaram!"
        echo -e "${GREEN}✅ FisioFlow está funcionando normalmente${NC}"
    else
        log "❌ $errors verificação(ões) falharam"
        echo -e "${RED}❌ Encontrados $errors problema(s) no FisioFlow${NC}"
        send_slack_alert "$errors verificação(ões) de saúde falharam"
        exit 1
    fi
    
    log "=== Verificação concluída ==="
}

# Verificar se é execução direta
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi