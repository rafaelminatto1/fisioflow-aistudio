# Configuração de Monitoramento e Alertas - FisioFlow

## Status da Aplicação
- **App ID**: fc4f8558-d183-4d7e-8ea4-347355a20230
- **Nome**: fisioflow
- **URL**: https://fisioflow-uaphq.ondigitalocean.app
- **Status**: ATIVO (7/7 componentes ativos)

## Configuração de Alertas via Digital Ocean Console

### 1. Alertas de Aplicação
Acesse: https://cloud.digitalocean.com/apps/fc4f8558-d183-4d7e-8ea4-347355a20230/settings/alerts

**Alertas Recomendados:**
- ✅ Deployment Failed
- ✅ Domain Configuration Failed
- ✅ High CPU Usage (>80%)
- ✅ High Memory Usage (>85%)
- ✅ Application Down

**Destinatários:**
- Email: admin@fisioflow.com
- Slack: #fisioflow-alerts (webhook)

### 2. Monitoramento de Recursos

#### CPU e Memória
```bash
# Verificar métricas da aplicação
doctl apps get fc4f8558-d183-4d7e-8ea4-347355a20230

# Listar instâncias
doctl apps list-instances fc4f8558-d183-4d7e-8ea4-347355a20230
```

#### Logs Centralizados
```bash
# Visualizar logs em tempo real
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 --follow

# Logs de deployment
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 --type=deploy

# Logs de build
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 --type=build
```

### 3. Dashboard de Monitoramento

#### Métricas Principais
- **Uptime**: 99.9% target
- **Response Time**: < 500ms average
- **Error Rate**: < 1%
- **CPU Usage**: < 70% average
- **Memory Usage**: < 80% average

#### URLs de Monitoramento
- **Health Check**: https://fisioflow-uaphq.ondigitalocean.app/api/health
- **Status**: https://fisioflow-uaphq.ondigitalocean.app/api/status
- **Metrics**: https://fisioflow-uaphq.ondigitalocean.app/api/metrics

### 4. Configuração de Logs

#### Estrutura de Logs
```json
{
  "timestamp": "2025-01-10T17:35:00Z",
  "level": "info|warn|error",
  "service": "fisioflow-api",
  "message": "Request processed",
  "metadata": {
    "userId": "user123",
    "endpoint": "/api/pacientes",
    "duration": 150
  }
}
```

#### Comandos de Monitoramento
```bash
# Logs de erro
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 | grep ERROR

# Logs das últimas 24h
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 --since=24h

# Logs específicos de um componente
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 --component=fisioflow-api
```

### 5. Alertas Personalizados

#### Script de Monitoramento
```bash
#!/bin/bash
# scripts/monitor-health.sh

APP_URL="https://fisioflow-uaphq.ondigitalocean.app"
HEALTH_ENDPOINT="$APP_URL/api/health"

# Verificar saúde da aplicação
response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_ENDPOINT)

if [ $response -ne 200 ]; then
    echo "ALERT: FisioFlow health check failed - HTTP $response"
    # Enviar notificação
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🚨 FisioFlow está fora do ar! HTTP '$response'"}' \
        $SLACK_WEBHOOK_URL
fi
```

### 6. Configuração de Backup Automático

#### Database Backup
```bash
# Backup diário do banco
# Configurar via Digital Ocean Managed Database
# Retenção: 7 dias (desenvolvimento), 30 dias (produção)
```

#### Application Backup
```bash
# Backup do código via Git
git push origin main

# Backup de configurações
cp .digitalocean.app.yaml backups/app-config-$(date +%Y%m%d).yaml
```

## Próximos Passos

1. ✅ **Configurar alertas via console DO**
2. ⏳ **Implementar monitoramento customizado**
3. ⏳ **Configurar dashboard Grafana/DataDog**
4. ⏳ **Implementar health checks avançados**
5. ⏳ **Configurar backup automático**

## Comandos Úteis

```bash
# Status da aplicação
doctl apps get fc4f8558-d183-4d7e-8ea4-347355a20230

# Reiniciar aplicação
doctl apps restart fc4f8558-d183-4d7e-8ea4-347355a20230

# Verificar deployments
doctl apps list-deployments fc4f8558-d183-4d7e-8ea4-347355a20230

# Logs em tempo real
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 --follow
```

---
*Última atualização: 10/01/2025*
*Status: Configuração inicial completa*