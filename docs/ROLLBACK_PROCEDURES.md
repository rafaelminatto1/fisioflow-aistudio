# Procedimentos de Rollback - FisioFlow

## Visão Geral

Este documento detalha os procedimentos específicos de rollback para diferentes cenários de falha
durante ou após a migração do FisioFlow para Railway + Neon DB.

## Classificação de Incidentes

### Severidade 1 - Crítica (Rollback Imediato)

- Aplicação completamente inacessível
- Perda de dados detectada
- Falhas de segurança
- Corrupção do banco de dados

### Severidade 2 - Alta (Rollback em 15 min)

- Funcionalidades principais indisponíveis
- Performance degradada significativamente
- Erros em > 50% das requisições

### Severidade 3 - Média (Rollback em 1 hora)

- Funcionalidades secundárias com problemas
- Performance levemente degradada
- Erros em < 10% das requisições

## Procedimentos por Severidade

### Rollback Severidade 1 (< 5 minutos)

#### Passo 1: Ativação do Plano de Emergência

```bash
# Executar script de emergência
./scripts/emergency-rollback.sh

# Ou comandos manuais rápidos:
railway rollback --immediate
echo "EMERGENCY ROLLBACK INITIATED" | railway logs
```

#### Passo 2: Isolamento do Problema

```bash
# Parar tráfego para nova versão
railway scale --replicas=0

# Ativar página de manutenção
railway env set MAINTENANCE_MODE=true
```

#### Passo 3: Rollback do Banco (se necessário)

```bash
# Usar backup mais recente
psql $ROLLBACK_DATABASE_URL < $(ls -t backups/*.sql | head -1)

# Verificar integridade
npx prisma db pull
npx prisma validate
```

### Rollback Severidade 2 (< 15 minutos)

#### Passo 1: Análise Rápida

```bash
# Verificar logs dos últimos 10 minutos
railway logs --since=10m --filter="ERROR|FATAL"

# Verificar métricas
railway metrics --period=15m
```

#### Passo 2: Rollback Seletivo

```bash
# Rollback apenas da aplicação
railway rollback --app-only

# Manter banco de dados atual se estável
echo "Keeping current database state"
```

#### Passo 3: Verificação

```bash
# Health check
curl -f https://seu-app.railway.app/api/health || echo "Health check failed"

# Teste de funcionalidades críticas
npm run test:critical
```

### Rollback Severidade 3 (< 1 hora)

#### Passo 1: Investigação Detalhada

```bash
# Análise completa de logs
railway logs --since=1h > investigation.log

# Análise de performance
npm run performance:analyze
```

#### Passo 2: Rollback Planejado

```bash
# Notificar usuários
echo "Planned maintenance in 15 minutes" | railway notify

# Aguardar janela de manutenção
sleep 900

# Executar rollback
railway rollback --planned
```

## Scripts de Rollback Automatizados

### Script Principal: emergency-rollback.sh

```bash
#!/bin/bash

# emergency-rollback.sh
set -e

echo "[$(date)] EMERGENCY ROLLBACK INITIATED"

# 1. Backup de emergência
echo "Creating emergency backup..."
npm run backup:emergency

# 2. Rollback da aplicação
echo "Rolling back application..."
railway rollback --immediate

# 3. Verificar status
echo "Checking rollback status..."
sleep 30
curl -f https://seu-app.railway.app/api/health

if [ $? -eq 0 ]; then
    echo "[$(date)] ROLLBACK SUCCESSFUL"
    railway logs --message="Emergency rollback completed successfully"
else
    echo "[$(date)] ROLLBACK FAILED - MANUAL INTERVENTION REQUIRED"
    railway logs --message="Emergency rollback failed - manual intervention needed"
    exit 1
fi
```

### Script de Rollback do Banco: db-rollback.sh

```bash
#!/bin/bash

# db-rollback.sh
set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file>"
    exit 1
fi

echo "[$(date)] DATABASE ROLLBACK INITIATED"

# 1. Verificar backup
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# 2. Criar backup atual antes do rollback
echo "Creating pre-rollback backup..."
pg_dump $DATABASE_URL > "pre-rollback-$(date +%Y%m%d_%H%M%S).sql"

# 3. Restaurar backup
echo "Restoring from backup: $BACKUP_FILE"
psql $DATABASE_URL < "$BACKUP_FILE"

# 4. Verificar integridade
echo "Verifying database integrity..."
npx prisma db pull
npx prisma validate

echo "[$(date)] DATABASE ROLLBACK COMPLETED"
```

## Checklist de Rollback

### Pré-Rollback

- [ ] Identificar severidade do incidente
- [ ] Notificar equipe responsável
- [ ] Criar backup de emergência
- [ ] Documentar estado atual
- [ ] Verificar disponibilidade de backups

### Durante o Rollback

- [ ] Executar procedimento apropriado para severidade
- [ ] Monitorar logs em tempo real
- [ ] Verificar health checks
- [ ] Testar funcionalidades críticas
- [ ] Documentar ações tomadas

### Pós-Rollback

- [ ] Confirmar estabilidade do sistema
- [ ] Notificar usuários sobre resolução
- [ ] Analisar causa raiz
- [ ] Atualizar documentação
- [ ] Planejar correção definitiva

## Pontos de Verificação

### Health Checks Críticos

```bash
# API principal
curl -f https://seu-app.railway.app/api/health

# Banco de dados
curl -f https://seu-app.railway.app/api/health/db

# Autenticação
curl -f https://seu-app.railway.app/api/auth/session

# Upload de arquivos
curl -f https://seu-app.railway.app/api/health/storage
```

### Testes de Funcionalidade

```bash
# Testes críticos
npm run test:critical

# Testes de integração
npm run test:integration

# Testes de performance
npm run test:performance
```

## Comunicação Durante Rollback

### Templates de Mensagem

#### Início do Rollback

```
🚨 ROLLBACK EM ANDAMENTO
Detectamos um problema e estamos revertendo para a versão anterior.
Tempo estimado: [X] minutos
Status: https://status.fisioflow.com
```

#### Rollback Concluído

```
✅ ROLLBACK CONCLUÍDO
O sistema foi revertido com sucesso.
Todas as funcionalidades estão operacionais.
Pedimos desculpas pelo inconveniente.
```

#### Rollback Falhou

```
❌ INTERVENÇÃO MANUAL NECESSÁRIA
O rollback automático falhou.
Equipe técnica foi acionada.
Atualizações em: https://status.fisioflow.com
```

## Contatos de Emergência

### Escalação por Severidade

#### Severidade 1

1. **DevOps Lead** - [telefone] (imediato)
2. **CTO** - [telefone] (5 min)
3. **CEO** - [telefone] (15 min)

#### Severidade 2

1. **DevOps Team** - [slack] (imediato)
2. **Tech Lead** - [telefone] (10 min)
3. **DevOps Lead** - [telefone] (30 min)

#### Severidade 3

1. **DevOps Team** - [slack] (imediato)
2. **Tech Lead** - [slack] (1 hora)

## Lições Aprendidas

### Histórico de Rollbacks

| Data | Severidade | Causa | Tempo de Resolução | Lições |
| ---- | ---------- | ----- | ------------------ | ------ |
| -    | -          | -     | -                  | -      |

### Melhorias Implementadas

- [ ] Monitoramento aprimorado
- [ ] Testes automatizados adicionais
- [ ] Procedimentos de rollback otimizados
- [ ] Treinamento da equipe

## Manutenção deste Documento

- **Revisão**: Mensal
- **Atualização**: Após cada incidente
- **Teste**: Trimestral (simulação)
- **Responsável**: Equipe DevOps

---

**Última atualização**: $(date) **Versão**: 1.0.0 **Próxima revisão**: $(date -d '+1 month')
