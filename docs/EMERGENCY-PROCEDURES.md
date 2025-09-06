# 🚨 Procedimentos de Emergência - FisioFlow

Guia de ação rápida para situações críticas no sistema FisioFlow.

## ⚡ Classificação de Emergências

### 🔴 CRÍTICA (P0) - Ação Imediata

- Sistema completamente inoperante
- Perda de dados confirmada
- Vazamento de dados pessoais
- Falha total do banco de dados

### 🟡 ALTA (P1) - Ação em 15 min

- Performance severamente degradada
- Funcionalidades principais indisponíveis
- Falha no sistema de backup
- Alertas críticos de segurança

### 🟢 MÉDIA (P2) - Ação em 1 hora

- Funcionalidades secundárias indisponíveis
- Performance moderadamente degradada
- Alertas de monitoramento

## 🚨 Procedimentos P0 - CRÍTICA

### 1. Sistema Completamente Inoperante

**Tempo de Resposta: IMEDIATO**

```bash
#!/bin/bash
# SCRIPT DE EMERGÊNCIA P0
echo "🚨 EMERGÊNCIA P0 - SISTEMA INOPERANTE"
echo "Iniciado em: $(date)"

# PASSO 1: Notificar equipe
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-type: application/json' \
  -d '{"text":"🚨 EMERGÊNCIA P0: Sistema FisioFlow INOPERANTE", "channel":"#emergencia"}'

# PASSO 2: Backup de emergência
echo "📦 Iniciando backup de emergência..."
node scripts/backup.js full --priority=critical --no-compression --timeout=300

# PASSO 3: Verificar status do Neon DB
echo "🔍 Verificando status do Neon DB..."
curl -s -H "Authorization: Bearer $NEON_API_KEY" \
  "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/endpoints" | jq '.endpoints[0].current_state'

# PASSO 4: Tentar reinicialização rápida
echo "🔄 Tentando reinicialização..."
pkill -f "fisioflow"
sleep 5
npm run start:emergency

# PASSO 5: Verificar se voltou
sleep 30
if curl -f http://localhost:3000/api/health; then
  echo "✅ Sistema restaurado"
  curl -X POST $SLACK_WEBHOOK_URL \
    -H 'Content-type: application/json' \
    -d '{"text":"✅ Sistema FisioFlow RESTAURADO", "channel":"#emergencia"}'
else
  echo "❌ Falha na restauração - ESCALAR PARA SUPORTE"
  # Executar procedimento de escalação
  ./scripts/emergency-escalation.sh
fi
```

### 2. Perda de Dados Confirmada

**Ações Imediatas:**

1. **PARAR TODAS AS OPERAÇÕES**

   ```bash
   # Parar aplicação imediatamente
   pm2 stop all
   pkill -f "fisioflow"

   # Isolar banco de dados
   # (Não executar mais queries)
   ```

2. **NOTIFICAR AUTORIDADES**

   ```bash
   # Notificar equipe jurídica
   echo "PERDA DE DADOS DETECTADA" | mail -s "EMERGÊNCIA LGPD" juridico@empresa.com

   # Notificar ANPD se necessário
   # (Dentro de 72 horas)
   ```

3. **INICIAR RECUPERAÇÃO**

   ```bash
   # Listar backups disponíveis
   node scripts/recovery.js list --emergency

   # Recuperar backup mais recente
   node scripts/recovery.js auto --verify-integrity
   ```

### 3. Vazamento de Dados Pessoais

**Protocolo LGPD:**

1. **Contenção Imediata (0-15 min)**

   ```bash
   # Isolar sistema
   iptables -A INPUT -p tcp --dport 3000 -j DROP

   # Revogar tokens de acesso
   node scripts/revoke-all-tokens.js

   # Capturar logs de acesso
   cp /var/log/nginx/access.log /backup/incident-$(date +%Y%m%d-%H%M%S).log
   ```

2. **Investigação (15-60 min)**

   ```bash
   # Analisar logs de acesso
   grep -E "(SELECT|UPDATE|DELETE).*users" logs/app.log > incident-queries.log

   # Identificar dados afetados
   node scripts/audit-data-access.js --since="1 hour ago"
   ```

3. **Notificação (1-24 horas)**
   - Notificar usuários afetados
   - Comunicar à ANPD (se aplicável)
   - Preparar relatório de incidente

## 🟡 Procedimentos P1 - ALTA

### 1. Performance Severamente Degradada

```bash
#!/bin/bash
echo "🟡 EMERGÊNCIA P1 - PERFORMANCE DEGRADADA"

# Verificar métricas atuais
node scripts/neon-autoscaling.js --analyze-only

# Escalar recursos imediatamente
curl -X PATCH "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/endpoints/$NEON_ENDPOINT_ID" \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"endpoint": {"compute_units": 4}}'

# Identificar queries problemáticas
psql $DATABASE_URL -c "
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;"

# Matar queries longas se necessário
psql $DATABASE_URL -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
AND query_start < NOW() - INTERVAL '5 minutes'
AND query NOT LIKE '%pg_stat_activity%';"
```

### 2. Falha no Sistema de Backup

```bash
#!/bin/bash
echo "🟡 EMERGÊNCIA P1 - FALHA NO BACKUP"

# Tentar backup alternativo
node scripts/backup.js full --method=snapshot --no-s3

# Se falhar, usar pg_dump direto
if [ $? -ne 0 ]; then
  echo "Usando pg_dump como fallback"
  pg_dump $DATABASE_URL | gzip > "emergency-backup-$(date +%Y%m%d-%H%M%S).sql.gz"
fi

# Verificar integridade
if [ -f "emergency-backup-$(date +%Y%m%d-%H%M%S).sql.gz" ]; then
  echo "✅ Backup de emergência criado"
else
  echo "❌ FALHA CRÍTICA NO BACKUP - ESCALAR"
  ./scripts/emergency-escalation.sh "BACKUP_FAILURE"
fi
```

## 🔧 Scripts de Emergência

### Script de Escalação

```bash
#!/bin/bash
# scripts/emergency-escalation.sh

INCIDENT_TYPE=${1:-"UNKNOWN"}
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo "🚨 ESCALANDO INCIDENTE: $INCIDENT_TYPE"

# Notificar Slack
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-type: application/json' \
  -d "{
    \"text\": \"🚨 ESCALAÇÃO DE EMERGÊNCIA\",
    \"channel\": \"#emergencia\",
    \"attachments\": [{
      \"color\": \"danger\",
      \"fields\": [
        {\"title\": \"Tipo\", \"value\": \"$INCIDENT_TYPE\", \"short\": true},
        {\"title\": \"Horário\", \"value\": \"$TIMESTAMP\", \"short\": true},
        {\"title\": \"Servidor\", \"value\": \"$(hostname)\", \"short\": true}
      ]
    }]
  }"

# Enviar email para equipe técnica
echo "Incidente: $INCIDENT_TYPE em $TIMESTAMP" | \
  mail -s "🚨 EMERGÊNCIA FISIOFLOW" \
  -c "cto@empresa.com,devops@empresa.com" \
  "suporte@empresa.com"

# Ligar para plantão (se configurado)
if [ ! -z "$EMERGENCY_PHONE_API" ]; then
  curl -X POST "$EMERGENCY_PHONE_API" \
    -d "message=Emergência FisioFlow: $INCIDENT_TYPE"
fi

# Criar ticket de emergência
curl -X POST "$TICKET_SYSTEM_API" \
  -H "Authorization: Bearer $TICKET_API_KEY" \
  -d "{
    \"title\": \"EMERGÊNCIA: $INCIDENT_TYPE\",
    \"priority\": \"critical\",
    \"description\": \"Incidente automático detectado em $TIMESTAMP\"
  }"
```

### Script de Health Check Contínuo

```bash
#!/bin/bash
# scripts/continuous-health-check.sh

while true; do
  # Verificar API principal
  if ! curl -f -s http://localhost:3000/api/health > /dev/null; then
    echo "❌ API principal falhou - $(date)"
    ./scripts/emergency-escalation.sh "API_DOWN"
    break
  fi

  # Verificar banco de dados
  if ! node -e "require('./lib/neon-config').testConnection().catch(() => process.exit(1))"; then
    echo "❌ Banco de dados falhou - $(date)"
    ./scripts/emergency-escalation.sh "DATABASE_DOWN"
    break
  fi

  # Verificar uso de memória
  MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
  if [ $MEMORY_USAGE -gt 90 ]; then
    echo "⚠️ Memória crítica: ${MEMORY_USAGE}% - $(date)"
    ./scripts/emergency-escalation.sh "HIGH_MEMORY"
  fi

  # Verificar espaço em disco
  DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
  if [ $DISK_USAGE -gt 85 ]; then
    echo "⚠️ Disco crítico: ${DISK_USAGE}% - $(date)"
    ./scripts/emergency-escalation.sh "HIGH_DISK"
  fi

  sleep 30
done
```

## 📞 Contatos de Emergência

### Equipe Técnica

- **CTO**: +55 11 99999-0001 (24h)
- **DevOps Lead**: +55 11 99999-0002 (24h)
- **DBA**: +55 11 99999-0003 (horário comercial)

### Fornecedores

- **Neon DB Support**: support@neon.tech
- **AWS Support**: Caso Enterprise #12345
- **Slack Support**: workspace-admin@empresa.com

### Jurídico/Compliance

- **LGPD Officer**: lgpd@empresa.com
- **Jurídico**: juridico@empresa.com
- **ANPD**: https://www.gov.br/anpd

## 📋 Checklist Pós-Incidente

### Imediatamente Após Resolução

- [ ] Confirmar que sistema está operacional
- [ ] Notificar usuários sobre resolução
- [ ] Documentar timeline do incidente
- [ ] Preservar logs relevantes

### Primeiras 24 horas

- [ ] Análise de causa raiz
- [ ] Relatório preliminar
- [ ] Identificar melhorias necessárias
- [ ] Atualizar procedimentos se necessário

### Primeira semana

- [ ] Relatório final detalhado
- [ ] Implementar melhorias identificadas
- [ ] Treinar equipe em novos procedimentos
- [ ] Revisar e testar planos de emergência

## 🔄 Simulações de Emergência

### Cronograma de Testes

- **Mensal**: Teste de backup e recuperação
- **Trimestral**: Simulação de falha completa
- **Semestral**: Teste de vazamento de dados
- **Anual**: Revisão completa dos procedimentos

### Comando para Simulação

```bash
# Simular falha controlada
node scripts/emergency-simulation.js --type=database_failure --duration=5min
```

---

## ⚠️ LEMBRETE IMPORTANTE

**EM CASO DE DÚVIDA, SEMPRE ESCALE!**

É melhor escalar desnecessariamente do que deixar um problema crítico sem resolução.

**Ordem de Prioridade:**

1. 🛡️ Segurança dos dados
2. 👥 Segurança dos usuários
3. 🔧 Restauração do serviço
4. 📊 Análise e melhoria

---

_Este documento deve ser revisado mensalmente e mantido sempre acessível à equipe técnica._
