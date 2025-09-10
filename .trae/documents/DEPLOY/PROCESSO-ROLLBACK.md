# Processo de Rollback - FisioFlow

## 📋 Visão Geral

Este documento descreve os procedimentos de rollback para o sistema FisioFlow, incluindo rollback de aplicação, banco de dados e configurações.

## 🚨 Quando Fazer Rollback

### Critérios para Rollback Imediato
- **Aplicação não responde** (> 5 minutos)
- **Erro crítico** afetando > 50% dos usuários
- **Perda de dados** detectada
- **Falha de segurança** identificada
- **Performance degradada** (> 300% do tempo normal)

### Critérios para Rollback Planejado
- **Bugs não críticos** mas impactantes
- **Funcionalidades com problemas** específicos
- **Feedback negativo** consistente dos usuários
- **Métricas de negócio** em declínio

## 🔄 Tipos de Rollback

### 1. Rollback de Aplicação (Código)

#### Rollback Rápido via Digital Ocean
```bash
#!/bin/bash
# Script: rollback-app.sh

set -e

APP_ID="fc4f8558-d183-4d7e-8ea4-347355a20230"

echo "🔄 Iniciando Rollback da Aplicação"
echo "================================="

# 1. Verificar status atual
echo "\n📊 Status atual da aplicação:"
current_deployment=$(doctl apps get $APP_ID --format ActiveDeployment.ID --no-header)
echo "Deployment ativo: $current_deployment"

# 2. Listar deployments disponíveis
echo "\n📋 Deployments disponíveis para rollback:"
doctl apps list-deployments $APP_ID --format ID,Phase,CreatedAt,UpdatedAt | head -10

# 3. Solicitar deployment para rollback
read -p "\nDigite o ID do deployment para rollback: " target_deployment

if [ -z "$target_deployment" ]; then
    echo "❌ ID do deployment é obrigatório"
    exit 1
fi

# 4. Confirmar rollback
echo "\n⚠️ CONFIRMAÇÃO DE ROLLBACK"
echo "Deployment atual: $current_deployment"
echo "Rollback para: $target_deployment"
read -p "Confirma o rollback? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelado"
    exit 1
fi

# 5. Executar rollback
echo "\n🔄 Executando rollback..."
rollback_deployment=$(doctl apps create-deployment $APP_ID --from-deployment $target_deployment --format ID --no-header)
echo "Novo deployment criado: $rollback_deployment"

# 6. Monitorar progresso
echo "\n📊 Monitorando progresso do rollback..."
start_time=$(date +%s)
timeout=600  # 10 minutos

while true; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    if [ $elapsed -gt $timeout ]; then
        echo "❌ Timeout: Rollback demorou mais que 10 minutos"
        exit 1
    fi
    
    status=$(doctl apps get-deployment $APP_ID $rollback_deployment --format Phase --no-header)
    echo "[$(date +'%H:%M:%S')] Status: $status (${elapsed}s)"
    
    case $status in
        "ACTIVE")
            echo "\n✅ Rollback concluído com sucesso!"
            break
            ;;
        "ERROR"|"CANCELED")
            echo "\n❌ Rollback falhou: $status"
            echo "📋 Verificando logs de erro..."
            doctl apps logs $APP_ID --type=deploy --deployment $rollback_deployment
            exit 1
            ;;
        "PENDING_BUILD"|"BUILDING"|"PENDING_DEPLOY"|"DEPLOYING")
            # Continuar monitorando
            ;;
        *)
            echo "⚠️ Status desconhecido: $status"
            ;;
    esac
    
    sleep 10
done

# 7. Verificar saúde pós-rollback
echo "\n🏥 Verificando saúde da aplicação..."
sleep 30  # Aguardar estabilização

APP_URL="https://fisioflow-aistudio-1-7wnxs.ondigitalocean.app"
health_check=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health" || echo "000")

if [ "$health_check" = "200" ]; then
    echo "✅ Health check passou: $health_check"
else
    echo "❌ Health check falhou: $health_check"
    echo "🚨 AÇÃO NECESSÁRIA: Verificar logs e considerar rollback adicional"
fi

# 8. Testar endpoints críticos
echo "\n🔍 Testando endpoints críticos..."
endpoints=("/" "/login" "/dashboard" "/api/pacientes")
error_count=0

for endpoint in "${endpoints[@]}"; do
    echo -n "Testando $endpoint... "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL$endpoint" || echo "000")
    
    if [ "$status" = "200" ]; then
        echo "✅ OK"
    else
        echo "❌ FALHA ($status)"
        ((error_count++))
    fi
done

# 9. Relatório final
echo "\n📊 RELATÓRIO DE ROLLBACK"
echo "========================"
echo "Data/Hora: $(date)"
echo "Deployment original: $current_deployment"
echo "Deployment rollback: $target_deployment"
echo "Novo deployment: $rollback_deployment"
echo "Tempo total: ${elapsed}s"
echo "Endpoints com erro: $error_count"

if [ $error_count -eq 0 ]; then
    echo "\n🎉 ROLLBACK CONCLUÍDO COM SUCESSO!"
    echo "📢 Notificar equipe sobre rollback bem-sucedido"
else
    echo "\n⚠️ ROLLBACK COM PROBLEMAS!"
    echo "🚨 $error_count endpoint(s) com falha"
    echo "📞 Escalar para equipe de desenvolvimento"
fi

echo "\n📋 Próximos passos:"
echo "1. Monitorar logs por 30 minutos"
echo "2. Verificar métricas de performance"
echo "3. Comunicar status aos stakeholders"
echo "4. Investigar causa raiz do problema original"
```

#### Rollback via Git + GitHub Actions
```bash
#!/bin/bash
# Script: rollback-git.sh

set -e

echo "🔄 Rollback via Git + GitHub Actions"
echo "==================================="

# 1. Verificar branch atual
current_branch=$(git branch --show-current)
echo "Branch atual: $current_branch"

if [ "$current_branch" != "main" ]; then
    echo "⚠️ Mudando para branch main..."
    git checkout main
    git pull origin main
fi

# 2. Mostrar commits recentes
echo "\n📋 Commits recentes:"
git log --oneline -10

# 3. Solicitar commit para rollback
read -p "\nDigite o hash do commit para rollback: " target_commit

if [ -z "$target_commit" ]; then
    echo "❌ Hash do commit é obrigatório"
    exit 1
fi

# 4. Verificar se commit existe
if ! git cat-file -e "$target_commit" 2>/dev/null; then
    echo "❌ Commit não encontrado: $target_commit"
    exit 1
fi

# 5. Mostrar detalhes do commit
echo "\n📝 Detalhes do commit para rollback:"
git show --stat "$target_commit"

# 6. Confirmar rollback
read -p "\nConfirma rollback para este commit? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelado"
    exit 1
fi

# 7. Criar branch de rollback
rollback_branch="rollback-$(date +%Y%m%d-%H%M%S)"
echo "\n🌿 Criando branch de rollback: $rollback_branch"
git checkout -b "$rollback_branch"

# 8. Fazer revert
echo "\n🔄 Fazendo revert para commit: $target_commit"
git reset --hard "$target_commit"

# 9. Push da branch de rollback
echo "\n📤 Fazendo push da branch de rollback..."
git push origin "$rollback_branch"

# 10. Merge para main
echo "\n🔀 Fazendo merge para main..."
git checkout main
git merge "$rollback_branch" --no-ff -m "Rollback to commit $target_commit"

# 11. Push para main (dispara deploy)
echo "\n🚀 Fazendo push para main (dispara deploy automático)..."
git push origin main

# 12. Monitorar GitHub Actions
echo "\n📊 Monitorando GitHub Actions..."
echo "Acesse: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:\/]\([^.]*\).*/\1/')/actions"

# 13. Aguardar deploy
echo "\n⏳ Aguardando deploy (estimativa: 5-10 minutos)..."
echo "Monitorando status da aplicação..."

APP_URL="https://fisioflow-aistudio-1-7wnxs.ondigitalocean.app"
start_time=$(date +%s)
timeout=900  # 15 minutos

while true; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    if [ $elapsed -gt $timeout ]; then
        echo "❌ Timeout: Deploy demorou mais que 15 minutos"
        break
    fi
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health" || echo "000")
    echo "[$(date +'%H:%M:%S')] Health check: $status (${elapsed}s)"
    
    if [ "$status" = "200" ]; then
        echo "\n✅ Deploy do rollback concluído!"
        break
    fi
    
    sleep 30
done

echo "\n🎉 ROLLBACK VIA GIT CONCLUÍDO!"
echo "📋 Branch de rollback criada: $rollback_branch"
echo "📝 Commit de rollback: $(git rev-parse HEAD)"
```

### 2. Rollback de Banco de Dados

#### Rollback de Schema (Migrações)
```bash
#!/bin/bash
# Script: rollback-database-schema.sh

set -e

echo "🗄️ Rollback de Schema do Banco de Dados"
echo "======================================="

# 1. Verificar conexão com banco
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não configurada"
    exit 1
fi

echo "\n🔍 Testando conexão com banco..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Falha na conexão com banco de dados"
    exit 1
fi
echo "✅ Conexão com banco OK"

# 2. Backup preventivo
echo "\n💾 Criando backup preventivo..."
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="./backups/pre_rollback_backup_${DATE}.sql"
mkdir -p ./backups

pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
gzip "$BACKUP_FILE"
echo "✅ Backup criado: ${BACKUP_FILE}.gz"

# 3. Listar migrações aplicadas (Prisma)
if [ -f "prisma/schema.prisma" ]; then
    echo "\n📋 Verificando migrações Prisma..."
    npx prisma migrate status || echo "⚠️ Erro ao verificar status das migrações"
fi

# 4. Rollback manual de schema
echo "\n⚠️ ATENÇÃO: Rollback de schema deve ser feito manualmente"
echo "Opções disponíveis:"
echo "1. Restaurar backup completo"
echo "2. Executar SQL de rollback específico"
echo "3. Reverter migrações Prisma"

read -p "\nEscolha uma opção (1-3): " option

case $option in
    1)
        echo "\n📋 Para restaurar backup completo:"
        echo "1. Liste os backups disponíveis:"
        echo "   ls -la ./backups/*.sql.gz"
        echo "2. Execute o restore:"
        echo "   gunzip -c backup_file.sql.gz | psql \$DATABASE_URL"
        ;;
    2)
        echo "\n📋 Para executar SQL de rollback:"
        echo "1. Crie arquivo SQL com comandos de rollback"
        echo "2. Execute: psql \$DATABASE_URL < rollback.sql"
        ;;
    3)
        echo "\n📋 Para reverter migrações Prisma:"
        echo "1. Identifique a migração: npx prisma migrate status"
        echo "2. Reverta: npx prisma migrate resolve --rolled-back <migration_name>"
        echo "3. Aplique estado anterior: npx prisma db push"
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo "\n⚠️ IMPORTANTE: Teste a aplicação após rollback de schema!"
```

#### Rollback de Dados
```bash
#!/bin/bash
# Script: rollback-database-data.sh

set -e

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Uso: $0 <arquivo_backup.sql.gz>"
    echo "Exemplo: $0 ./backups/backup_20241210_120000.sql.gz"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Arquivo de backup não encontrado: $BACKUP_FILE"
    exit 1
fi

echo "🗄️ Rollback de Dados do Banco"
echo "============================="
echo "Arquivo de backup: $BACKUP_FILE"

# 1. Verificar conexão
echo "\n🔍 Verificando conexão com banco..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Falha na conexão com banco de dados"
    exit 1
fi

# 2. Backup atual antes do rollback
echo "\n💾 Criando backup do estado atual..."
DATE=$(date +"%Y%m%d_%H%M%S")
CURRENT_BACKUP="./backups/before_rollback_${DATE}.sql"
pg_dump "$DATABASE_URL" > "$CURRENT_BACKUP"
gzip "$CURRENT_BACKUP"
echo "✅ Backup atual salvo: ${CURRENT_BACKUP}.gz"

# 3. Confirmar rollback
echo "\n⚠️ CONFIRMAÇÃO DE ROLLBACK DE DADOS"
echo "Esta operação irá SUBSTITUIR todos os dados atuais!"
echo "Backup atual salvo em: ${CURRENT_BACKUP}.gz"
read -p "Confirma o rollback? (digite 'CONFIRMO'): " confirmation

if [ "$confirmation" != "CONFIRMO" ]; then
    echo "❌ Rollback cancelado"
    exit 1
fi

# 4. Executar rollback
echo "\n🔄 Executando rollback de dados..."
start_time=$(date +%s)

if [[ $BACKUP_FILE == *.gz ]]; then
    echo "Descomprimindo e restaurando..."
    gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
else
    echo "Restaurando..."
    psql "$DATABASE_URL" < "$BACKUP_FILE"
fi

end_time=$(date +%s)
elapsed=$((end_time - start_time))

echo "✅ Rollback concluído em ${elapsed}s"

# 5. Verificar integridade
echo "\n🔍 Verificando integridade dos dados..."

# Contar registros principais
echo "Contagem de registros:"
psql "$DATABASE_URL" -c "
    SELECT 'users' as tabela, COUNT(*) as registros FROM users
    UNION ALL
    SELECT 'pacientes', COUNT(*) FROM pacientes
    UNION ALL
    SELECT 'consultas', COUNT(*) FROM consultas
    UNION ALL
    SELECT 'agendamentos', COUNT(*) FROM agendamentos;
" 2>/dev/null || echo "⚠️ Erro ao verificar contagens"

# 6. Testar queries básicas
echo "\n🧪 Testando queries básicas..."
psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_users FROM users;" > /dev/null 2>&1 && echo "✅ Query users OK" || echo "❌ Erro em users"
psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_pacientes FROM pacientes;" > /dev/null 2>&1 && echo "✅ Query pacientes OK" || echo "❌ Erro em pacientes"

echo "\n🎉 ROLLBACK DE DADOS CONCLUÍDO!"
echo "📊 Tempo total: ${elapsed}s"
echo "💾 Backup anterior salvo em: ${CURRENT_BACKUP}.gz"
echo "\n📋 Próximos passos:"
echo "1. Testar aplicação completamente"
echo "2. Verificar funcionalidades críticas"
echo "3. Monitorar logs por 1 hora"
echo "4. Comunicar rollback à equipe"
```

### 3. Rollback de Configurações

```bash
#!/bin/bash
# Script: rollback-config.sh

CONFIG_BACKUP="$1"

if [ -z "$CONFIG_BACKUP" ]; then
    echo "❌ Uso: $0 <arquivo_config_backup.tar.gz>"
    exit 1
fi

echo "⚙️ Rollback de Configurações"
echo "============================"

# 1. Verificar arquivo de backup
if [ ! -f "$CONFIG_BACKUP" ]; then
    echo "❌ Arquivo de backup não encontrado: $CONFIG_BACKUP"
    exit 1
fi

# 2. Backup das configurações atuais
echo "\n💾 Fazendo backup das configurações atuais..."
DATE=$(date +"%Y%m%d_%H%M%S")
CURRENT_CONFIG_DIR="./backups/current_config_${DATE}"
mkdir -p "$CURRENT_CONFIG_DIR"

# Arquivos de configuração importantes
CONFIG_FILES=(
    ".env.example"
    "package.json"
    "next.config.js"
    "tailwind.config.js"
    "tsconfig.json"
    "prisma/schema.prisma"
    ".github/workflows/deploy.yml"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$CURRENT_CONFIG_DIR/" 2>/dev/null || echo "⚠️ Não foi possível copiar $file"
    fi
done

echo "✅ Backup atual salvo em: $CURRENT_CONFIG_DIR"

# 3. Confirmar rollback
echo "\n⚠️ CONFIRMAÇÃO DE ROLLBACK DE CONFIGURAÇÕES"
echo "Backup de configurações: $CONFIG_BACKUP"
echo "Configurações atuais salvas em: $CURRENT_CONFIG_DIR"
read -p "Confirma o rollback? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelado"
    exit 1
fi

# 4. Restaurar configurações
echo "\n🔄 Restaurando configurações..."
tar -xzf "$CONFIG_BACKUP" -C .

echo "✅ Configurações restauradas"

# 5. Verificar arquivos restaurados
echo "\n🔍 Verificando arquivos restaurados:"
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (não encontrado)"
    fi
done

# 6. Reinstalar dependências se necessário
if [ -f "package.json" ]; then
    echo "\n📦 Reinstalando dependências..."
    npm install
fi

# 7. Verificar configuração do Prisma
if [ -f "prisma/schema.prisma" ]; then
    echo "\n🗄️ Gerando cliente Prisma..."
    npx prisma generate
fi

echo "\n🎉 ROLLBACK DE CONFIGURAÇÕES CONCLUÍDO!"
echo "📁 Configurações anteriores em: $CURRENT_CONFIG_DIR"
echo "\n📋 Próximos passos:"
echo "1. Verificar variáveis de ambiente"
echo "2. Testar build da aplicação"
echo "3. Executar testes"
echo "4. Fazer deploy se necessário"
```

## 🚨 Procedimento de Emergência

### Rollback de Emergência (< 5 minutos)
```bash
#!/bin/bash
# Script: emergency-rollback.sh

set -e

APP_ID="fc4f8558-d183-4d7e-8ea4-347355a20230"

echo "🚨 ROLLBACK DE EMERGÊNCIA"
echo "========================"
echo "⏰ Iniciado em: $(date)"

# 1. Pegar último deployment estável
echo "\n🔍 Buscando último deployment estável..."
last_stable=$(doctl apps list-deployments $APP_ID --format ID,Phase --no-header | grep ACTIVE | head -2 | tail -1 | awk '{print $1}')

if [ -z "$last_stable" ]; then
    echo "❌ Nenhum deployment estável encontrado!"
    echo "🚨 ESCALAÇÃO NECESSÁRIA!"
    exit 1
fi

echo "📋 Último deployment estável: $last_stable"

# 2. Executar rollback imediato
echo "\n🔄 Executando rollback imediato..."
rollback_id=$(doctl apps create-deployment $APP_ID --from-deployment $last_stable --format ID --no-header)
echo "🚀 Rollback iniciado: $rollback_id"

# 3. Monitoramento acelerado
echo "\n📊 Monitoramento acelerado (timeout: 5 min)..."
start_time=$(date +%s)
timeout=300  # 5 minutos

while true; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    if [ $elapsed -gt $timeout ]; then
        echo "❌ TIMEOUT: Rollback demorou mais que 5 minutos"
        echo "🚨 ESCALAÇÃO IMEDIATA NECESSÁRIA!"
        exit 1
    fi
    
    status=$(doctl apps get-deployment $APP_ID $rollback_id --format Phase --no-header)
    echo "[$(date +'%H:%M:%S')] $status (${elapsed}s)"
    
    if [ "$status" = "ACTIVE" ]; then
        echo "\n✅ ROLLBACK DE EMERGÊNCIA CONCLUÍDO!"
        break
    elif [ "$status" = "ERROR" ] || [ "$status" = "CANCELED" ]; then
        echo "\n❌ ROLLBACK FALHOU: $status"
        echo "🚨 ESCALAÇÃO CRÍTICA NECESSÁRIA!"
        exit 1
    fi
    
    sleep 5
done

# 4. Verificação rápida
echo "\n🏥 Verificação rápida de saúde..."
sleep 15
health=$(curl -s -o /dev/null -w "%{http_code}" "https://fisioflow-aistudio-1-7wnxs.ondigitalocean.app/api/health" || echo "000")

if [ "$health" = "200" ]; then
    echo "✅ Sistema respondendo: $health"
else
    echo "❌ Sistema não responde: $health"
    echo "🚨 INVESTIGAÇÃO ADICIONAL NECESSÁRIA!"
fi

end_time=$(date +%s)
total_time=$((end_time - start_time))

echo "\n📊 RELATÓRIO DE EMERGÊNCIA"
echo "========================="
echo "⏰ Início: $(date -d @$start_time)"
echo "⏰ Fim: $(date -d @$end_time)"
echo "⏱️ Tempo total: ${total_time}s"
echo "🔄 Deployment rollback: $last_stable → $rollback_id"
echo "🏥 Health check: $health"

echo "\n📞 AÇÕES IMEDIATAS:"
echo "1. ✅ Notificar equipe sobre rollback de emergência"
echo "2. 📊 Monitorar métricas por 30 minutos"
echo "3. 🔍 Investigar causa raiz do problema"
echo "4. 📝 Documentar incidente"
echo "5. 📋 Agendar post-mortem"

echo "\n🎉 ROLLBACK DE EMERGÊNCIA FINALIZADO!"
```

## 📊 Checklist Pós-Rollback

### Verificações Obrigatórias
- [ ] **Aplicação responde** (< 3s)
- [ ] **Health check passa** (200 OK)
- [ ] **Login funciona** (autenticação)
- [ ] **Endpoints críticos** funcionam
- [ ] **Banco de dados** acessível
- [ ] **Logs sem erros** críticos
- [ ] **Performance normal** (< 2s)

### Testes Funcionais
- [ ] **Cadastro de paciente**
- [ ] **Agendamento de consulta**
- [ ] **Visualização de prontuário**
- [ ] **Relatórios básicos**
- [ ] **Backup automático** funcionando

### Comunicação
- [ ] **Equipe técnica** notificada
- [ ] **Stakeholders** informados
- [ ] **Usuários** comunicados (se necessário)
- [ ] **Documentação** atualizada
- [ ] **Post-mortem** agendado

## 📞 Contatos de Emergência

### Escalação Imediata
- **DevOps Lead**: devops@fisioflow.com
- **CTO**: cto@fisioflow.com
- **Slack**: #fisioflow-emergencia

### Suporte Externo
- **Digital Ocean**: https://cloud.digitalocean.com/support
- **Neon**: https://neon.tech/docs/introduction/support
- **GitHub**: https://support.github.com/

## 📚 Recursos Adicionais

- **Runbook de Operações**: ./RUNBOOK-OPERACOES.md
- **Guia de Troubleshooting**: ./GUIA-TROUBLESHOOTING.md
- **Procedimentos de Backup**: ./PROCEDIMENTOS-BACKUP.md
- **Documentação Digital Ocean**: https://docs.digitalocean.com/products/app-platform/

---

**Última atualização**: 10/09/2025
**Versão**: 1.0
**Responsável**: Equipe DevOps FisioFlow
**Revisão**: Mensal