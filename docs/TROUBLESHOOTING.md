# 🚨 Guia de Troubleshooting - FisioFlow

Guia completo para resolução de problemas no sistema FisioFlow com Neon DB.

## 📋 Índice

1. [Problemas de Conexão](#problemas-de-conexão)
2. [Erros de Migração](#erros-de-migração)
3. [Performance e Scaling](#performance-e-scaling)
4. [Backup e Recuperação](#backup-e-recuperação)
5. [Monitoramento e Alertas](#monitoramento-e-alertas)
6. [Problemas de Deploy](#problemas-de-deploy)
7. [Comandos de Emergência](#comandos-de-emergência)

## 🔌 Problemas de Conexão

### Erro: "Connection refused" ou "timeout"

**Diagnóstico:**
```bash
# Testar conectividade básica
node scripts/validate-db.js

# Verificar status do endpoint Neon
curl -X GET "https://console.neon.tech/api/v2/projects/{PROJECT_ID}/endpoints" \
  -H "Authorization: Bearer {API_KEY}"
```

**Soluções:**
1. **Verificar credenciais:**
   ```bash
   # Validar DATABASE_URL
   echo $DATABASE_URL
   
   # Testar conexão direta
   psql $DATABASE_URL -c "SELECT version();"
   ```

2. **Verificar status do endpoint:**
   - Endpoint pode estar em sleep mode
   - Verificar se o projeto não foi pausado
   - Confirmar região do endpoint

3. **Problemas de rede:**
   ```bash
   # Testar DNS
   nslookup ep-xxx.us-east-1.aws.neon.tech
   
   # Testar conectividade
   telnet ep-xxx.us-east-1.aws.neon.tech 5432
   ```

### Erro: "SSL connection required"

**Solução:**
```env
# Adicionar parâmetros SSL na DATABASE_URL
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

### Erro: "Too many connections"

**Diagnóstico:**
```bash
# Verificar conexões ativas
node -e "console.log(require('./lib/neon-config').getConnectionStats())"
```

**Soluções:**
1. **Ajustar pool de conexões:**
   ```typescript
   // lib/neon-config.ts
   const config = {
     connectionLimit: 10, // Reduzir se necessário
     idleTimeout: 30000,
     maxLifetime: 1800000
   }
   ```

2. **Forçar limpeza de conexões:**
   ```bash
   # Reiniciar aplicação
   pm2 restart fisioflow
   
   # Ou matar processos órfãos
   pkill -f "node.*fisioflow"
   ```

## 🔄 Erros de Migração

### Erro: "Migration failed" ou "Schema drift"

**Diagnóstico:**
```bash
# Verificar status das migrações
npx prisma migrate status

# Comparar schema atual vs esperado
npx prisma db pull
npx prisma format
```

**Soluções:**
1. **Reset completo (CUIDADO - apaga dados):**
   ```bash
   # Backup antes do reset
   node scripts/backup.js full --priority=high
   
   # Reset das migrações
   npx prisma migrate reset --force
   ```

2. **Aplicar migrações manualmente:**
   ```bash
   # Push schema sem migração
   npx prisma db push --force-reset
   
   # Marcar migrações como aplicadas
   npx prisma migrate resolve --applied "20240115000000_init"
   ```

3. **Resolver conflitos de schema:**
   ```bash
   # Gerar nova migração baseada no estado atual
   npx prisma migrate diff \
     --from-schema-datamodel prisma/schema.prisma \
     --to-schema-datasource prisma/schema.prisma \
     --script > fix-migration.sql
   ```

### Erro: "Foreign key constraint violation"

**Solução:**
```sql
-- Desabilitar temporariamente constraints
SET session_replication_role = replica;

-- Executar migração
-- ...

-- Reabilitar constraints
SET session_replication_role = DEFAULT;
```

## ⚡ Performance e Scaling

### Performance Lenta

**Diagnóstico:**
```bash
# Analisar queries lentas
node scripts/neon-autoscaling.js --analyze-only

# Verificar métricas
curl http://localhost:3000/api/neon/metrics
```

**Soluções:**
1. **Otimizar queries:**
   ```sql
   -- Identificar queries lentas
   SELECT query, mean_exec_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   
   -- Verificar índices faltantes
   SELECT schemaname, tablename, attname, n_distinct, correlation 
   FROM pg_stats 
   WHERE schemaname = 'public';
   ```

2. **Ajustar auto-scaling:**
   ```javascript
   // scripts/neon-autoscaling.js
   const config = {
     scaleUpThreshold: {
       cpu: 70,        // Reduzir threshold
       connections: 80,
       responseTime: 500
     }
   }
   ```

3. **Escalar manualmente:**
   ```bash
   # Aumentar compute units
   curl -X PATCH "https://console.neon.tech/api/v2/projects/{PROJECT_ID}/endpoints/{ENDPOINT_ID}" \
     -H "Authorization: Bearer {API_KEY}" \
     -H "Content-Type: application/json" \
     -d '{"endpoint": {"compute_units": 2}}'
   ```

### Auto-scaling Não Funciona

**Diagnóstico:**
```bash
# Verificar logs do auto-scaler
tail -f logs/autoscaling.log

# Testar manualmente
node scripts/neon-autoscaling.js --test-mode
```

**Soluções:**
1. **Verificar permissões da API:**
   ```bash
   # Testar API key
   curl -H "Authorization: Bearer {API_KEY}" \
     "https://console.neon.tech/api/v2/projects"
   ```

2. **Reiniciar serviço:**
   ```bash
   # Parar auto-scaler
   pkill -f "neon-autoscaling"
   
   # Reiniciar com logs
   node scripts/neon-autoscaling.js --verbose
   ```

## 💾 Backup e Recuperação

### Backup Falha

**Diagnóstico:**
```bash
# Testar backup local
node scripts/backup.js full --local-only --verbose

# Verificar espaço em disco
df -h

# Verificar permissões AWS
aws s3 ls s3://fisioflow-backups/
```

**Soluções:**
1. **Problemas de espaço:**
   ```bash
   # Limpar backups antigos
   node scripts/backup.js cleanup --days=30
   
   # Usar compressão máxima
   node scripts/backup.js full --compression=9
   ```

2. **Problemas AWS S3:**
   ```bash
   # Verificar credenciais
   aws sts get-caller-identity
   
   # Testar upload
   echo "test" | aws s3 cp - s3://fisioflow-backups/test.txt
   ```

3. **Problemas de criptografia:**
   ```bash
   # Verificar chave de criptografia
   echo $BACKUP_ENCRYPTION_KEY | wc -c  # Deve ser 32 caracteres
   
   # Testar sem criptografia
   node scripts/backup.js full --no-encryption
   ```

### Recuperação Falha

**Diagnóstico:**
```bash
# Listar backups disponíveis
node scripts/recovery.js list

# Verificar integridade
node scripts/backup.js validate --file=backup.sql.gz.enc
```

**Soluções:**
1. **Backup corrompido:**
   ```bash
   # Tentar backup anterior
   node scripts/recovery.js list --show-all
   node scripts/recovery.js file --path=older-backup.sql.gz.enc
   ```

2. **Problemas de permissão:**
   ```bash
   # Verificar permissões do banco
   psql $DATABASE_URL -c "\du"
   
   # Usar usuário admin
   node scripts/recovery.js auto --admin-user
   ```

## 📊 Monitoramento e Alertas

### Alertas Não Funcionam

**Diagnóstico:**
```bash
# Testar webhook
curl -X POST $WEBHOOK_URL -d '{"test": true}'

# Testar Slack
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-type: application/json' \
  -d '{"text":"Teste de alerta"}'
```

**Soluções:**
1. **Verificar configuração:**
   ```env
   # Verificar URLs
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   WEBHOOK_URL=https://your-webhook.com/alerts
   ```

2. **Testar manualmente:**
   ```bash
   # Forçar alerta
   node -e "require('./lib/monitoring/alerts').sendAlert('test', 'Test alert')"
   ```

### Dashboard Não Carrega

**Diagnóstico:**
```bash
# Verificar API de métricas
curl http://localhost:3000/api/neon/metrics

# Verificar logs da aplicação
tail -f logs/app.log
```

**Soluções:**
1. **Reiniciar serviços:**
   ```bash
   # Reiniciar aplicação
   npm run dev
   
   # Ou com PM2
   pm2 restart fisioflow
   ```

2. **Limpar cache:**
   ```bash
   # Limpar cache do browser
   # Ou forçar rebuild
   npm run build
   ```

## 🚀 Problemas de Deploy

### CI/CD Pipeline Falha

**Diagnóstico:**
```bash
# Executar testes localmente
npm run test
npm run lint
npm run type-check

# Testar build
npm run build
```

**Soluções:**
1. **Problemas de teste:**
   ```bash
   # Executar testes específicos
   npm test -- --testNamePattern="database"
   
   # Pular testes temporariamente
   npm test -- --passWithNoTests
   ```

2. **Problemas de build:**
   ```bash
   # Limpar cache
   rm -rf .next node_modules
   npm install
   npm run build
   ```

3. **Problemas de deploy:**
   ```bash
   # Deploy manual
   npm run deploy:manual
   
   # Rollback
   git revert HEAD
   git push origin main
   ```

### Rollback Automático Falha

**Solução Manual:**
```bash
# 1. Parar aplicação
pm2 stop fisioflow

# 2. Restaurar backup
node scripts/recovery.js auto --fast

# 3. Reverter código
git reset --hard HEAD~1

# 4. Reiniciar aplicação
pm2 start fisioflow
```

## 🆘 Comandos de Emergência

### Sistema Completamente Inoperante

```bash
#!/bin/bash
# Script de emergência

echo "🚨 INICIANDO RECUPERAÇÃO DE EMERGÊNCIA"

# 1. Parar todos os processos
pkill -f "fisioflow"
pkill -f "neon-autoscaling"

# 2. Backup de emergência
node scripts/backup.js full --priority=critical --no-compression

# 3. Verificar integridade do banco
node scripts/validate-db.js --emergency

# 4. Recuperar se necessário
if [ $? -ne 0 ]; then
  echo "⚠️ Banco corrompido, iniciando recuperação"
  node scripts/recovery.js auto --emergency
fi

# 5. Reiniciar sistema
npm run build
npm start

echo "✅ RECUPERAÇÃO CONCLUÍDA"
```

### Contatos de Emergência

- **Suporte Neon DB**: support@neon.tech
- **Suporte Técnico**: suporte@fisioflow.com
- **Emergência 24h**: +55 11 99999-9999

### Logs Importantes

```bash
# Logs principais
tail -f logs/app.log
tail -f logs/autoscaling.log
tail -f logs/backup.log
tail -f logs/error.log

# Logs do sistema
journalctl -u fisioflow -f

# Logs do Neon (via API)
curl -H "Authorization: Bearer {API_KEY}" \
  "https://console.neon.tech/api/v2/projects/{PROJECT_ID}/operations"
```

---

## 📞 Quando Buscar Ajuda

Busque suporte imediatamente se:

- ❌ Sistema inoperante por mais de 15 minutos
- ❌ Perda de dados confirmada
- ❌ Backup e recuperação falhando
- ❌ Alertas críticos de segurança
- ❌ Performance degradada por mais de 1 hora

**Informações para incluir no suporte:**

1. Logs relevantes (últimas 100 linhas)
2. Configuração do ambiente (sem senhas)
3. Passos para reproduzir o problema
4. Horário exato do incidente
5. Impacto nos usuários

---

*Mantenha este guia sempre atualizado e acessível à equipe técnica.*