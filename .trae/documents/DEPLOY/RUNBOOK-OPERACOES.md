# Runbook de Operações - FisioFlow

## 📋 Visão Geral

Este runbook contém procedimentos operacionais padronizados para o sistema FisioFlow, incluindo operações de rotina, manutenção e resolução de problemas.

## 🚀 Operações de Deploy

### Deploy Manual

#### 1. Deploy via GitHub Actions
```bash
# 1. Verificar branch atual
git branch --show-current

# 2. Fazer merge para main (se necessário)
git checkout main
git pull origin main
git merge develop

# 3. Push para main (dispara deploy automático)
git push origin main

# 4. Monitorar deploy no GitHub Actions
# Acessar: https://github.com/seu-usuario/fisioflow/actions
```

#### 2. Deploy Direto via Digital Ocean CLI
```bash
# 1. Verificar status atual
doctl apps get fc4f8558-d183-4d7e-8ea4-347355a20230

# 2. Criar novo deployment
doctl apps create-deployment fc4f8558-d183-4d7e-8ea4-347355a20230

# 3. Monitorar progresso
doctl apps get-deployment fc4f8558-d183-4d7e-8ea4-347355a20230 <deployment-id>

# 4. Verificar logs
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 --type=deploy
```

### Rollback

#### Rollback Rápido
```bash
#!/bin/bash
# Script: quick-rollback.sh

set -e

echo "🔄 Iniciando rollback rápido..."

# 1. Listar deployments recentes
echo "📋 Deployments disponíveis:"
doctl apps list-deployments fc4f8558-d183-4d7e-8ea4-347355a20230 --format ID,CreatedAt,Phase

# 2. Solicitar ID do deployment para rollback
read -p "Digite o ID do deployment para rollback: " DEPLOYMENT_ID

if [ -z "$DEPLOYMENT_ID" ]; then
    echo "❌ ID do deployment é obrigatório"
    exit 1
fi

# 3. Executar rollback
echo "🔄 Executando rollback para deployment: $DEPLOYMENT_ID"
doctl apps create-deployment fc4f8558-d183-4d7e-8ea4-347355a20230 --from-deployment $DEPLOYMENT_ID

# 4. Monitorar rollback
echo "📊 Monitorando rollback..."
while true; do
    STATUS=$(doctl apps get fc4f8558-d183-4d7e-8ea4-347355a20230 --format Phase --no-header)
    echo "Status: $STATUS"
    
    if [ "$STATUS" = "ACTIVE" ]; then
        echo "✅ Rollback concluído com sucesso!"
        break
    elif [ "$STATUS" = "ERROR" ]; then
        echo "❌ Erro durante rollback!"
        exit 1
    fi
    
    sleep 10
done

# 5. Verificar saúde da aplicação
echo "🏥 Verificando saúde da aplicação..."
curl -f https://fisioflow-aistudio-1-7wnxs.ondigitalocean.app/api/health || echo "⚠️ Health check falhou"

echo "🎉 Rollback finalizado!"
```

## 🔧 Operações de Manutenção

### Manutenção Programada

#### Checklist Pré-Manutenção
```bash
#!/bin/bash
# Script: pre-maintenance.sh

echo "🔧 Checklist de Pré-Manutenção"
echo "============================="

# 1. Backup completo
echo "\n1. 🗄️ Executando backup completo..."
./scripts/full-backup.sh

# 2. Verificar métricas atuais
echo "\n2. 📊 Coletando métricas atuais..."
echo "CPU/Memória:"
doctl apps get fc4f8558-d183-4d7e-8ea4-347355a20230 --format Spec.Services

# 3. Verificar logs recentes
echo "\n3. 📋 Verificando logs recentes..."
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 --type=run --tail=50

# 4. Testar endpoints críticos
echo "\n4. 🏥 Testando endpoints críticos..."
ENDPOINTS=(
    "/api/health"
    "/api/auth/session"
    "/api/pacientes"
    "/api/consultas"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo "Testando: $endpoint"
    curl -f "https://fisioflow-aistudio-1-7wnxs.ondigitalocean.app$endpoint" > /dev/null 2>&1 && echo "✅ OK" || echo "❌ FALHA"
done

# 5. Notificar início da manutenção
echo "\n5. 📢 Notificando usuários..."
echo "Enviar notificação de manutenção programada"

echo "\n✅ Pré-manutenção concluída. Prosseguir com manutenção."
```

#### Modo Manutenção
```bash
#!/bin/bash
# Script: maintenance-mode.sh

ACTION="$1"

if [ "$ACTION" != "on" ] && [ "$ACTION" != "off" ]; then
    echo "❌ Uso: $0 [on|off]"
    exit 1
fi

if [ "$ACTION" = "on" ]; then
    echo "🚧 Ativando modo manutenção..."
    
    # Criar página de manutenção
    cat > public/maintenance.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>FisioFlow - Manutenção</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { color: #333; }
        p { color: #666; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔧</div>
        <h1>Sistema em Manutenção</h1>
        <p>O FisioFlow está temporariamente indisponível para manutenção programada.</p>
        <p>Previsão de retorno: <strong id="eta"></strong></p>
        <p>Agradecemos sua compreensão.</p>
    </div>
    <script>
        // Calcular ETA (2 horas a partir de agora)
        const eta = new Date(Date.now() + 2 * 60 * 60 * 1000);
        document.getElementById('eta').textContent = eta.toLocaleString('pt-BR');
    </script>
</body>
</html>
EOF
    
    # Configurar redirecionamento (implementar conforme necessário)
    echo "✅ Modo manutenção ativado"
    
else
    echo "🚀 Desativando modo manutenção..."
    
    # Remover página de manutenção
    rm -f public/maintenance.html
    
    # Remover redirecionamentos
    echo "✅ Modo manutenção desativado"
fi
```

### Limpeza de Logs

```bash
#!/bin/bash
# Script: cleanup-logs.sh

echo "🧹 Iniciando limpeza de logs..."

# 1. Logs locais (se existirem)
if [ -d "logs" ]; then
    echo "📋 Limpando logs locais..."
    find logs -name "*.log" -mtime +7 -delete
    find logs -name "*.log.*" -mtime +7 -delete
fi

# 2. Logs do Digital Ocean (via API - limitado)
echo "☁️ Verificando logs do Digital Ocean..."
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 --type=run --tail=1 > /dev/null

# 3. Limpar backups antigos
echo "🗄️ Limpando backups antigos..."
find ./backups -name "*.gz" -mtime +30 -delete
find ./backups -name "*.tar.gz" -mtime +30 -delete

# 4. Limpar arquivos temporários
echo "🗑️ Limpando arquivos temporários..."
find . -name "*.tmp" -delete
find . -name ".DS_Store" -delete

echo "✅ Limpeza concluída"
```

## 📊 Monitoramento e Alertas

### Verificação de Saúde

```bash
#!/bin/bash
# Script: health-check.sh

set -e

echo "🏥 Verificação de Saúde do FisioFlow"
echo "===================================="

APP_URL="https://fisioflow-aistudio-1-7wnxs.ondigitalocean.app"
ERROR_COUNT=0

# Função para testar endpoint
test_endpoint() {
    local endpoint="$1"
    local expected_status="$2"
    local description="$3"
    
    echo -n "Testando $description... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL$endpoint" || echo "000")
    
    if [ "$status" = "$expected_status" ]; then
        echo "✅ OK ($status)"
    else
        echo "❌ FALHA ($status)"
        ((ERROR_COUNT++))
    fi
}

# Testes de endpoints
echo "\n🔍 Testando Endpoints:"
test_endpoint "/" "200" "Página inicial"
test_endpoint "/api/health" "200" "Health check"
test_endpoint "/api/auth/session" "200" "Sessão de autenticação"
test_endpoint "/login" "200" "Página de login"
test_endpoint "/dashboard" "200" "Dashboard"

# Teste de performance
echo "\n⚡ Teste de Performance:"
echo -n "Tempo de resposta da página inicial... "
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$APP_URL/")
echo "${response_time}s"

if (( $(echo "$response_time > 3.0" | bc -l) )); then
    echo "⚠️ Tempo de resposta alto: ${response_time}s"
    ((ERROR_COUNT++))
fi

# Verificar status da aplicação no Digital Ocean
echo "\n☁️ Status Digital Ocean:"
app_status=$(doctl apps get fc4f8558-d183-4d7e-8ea4-347355a20230 --format Phase --no-header)
echo "Status da aplicação: $app_status"

if [ "$app_status" != "ACTIVE" ]; then
    echo "❌ Aplicação não está ativa!"
    ((ERROR_COUNT++))
fi

# Verificar banco de dados
echo "\n🗄️ Teste de Conectividade do Banco:"
if [ -n "$DATABASE_URL" ]; then
    echo -n "Conectividade com banco... "
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ OK"
    else
        echo "❌ FALHA"
        ((ERROR_COUNT++))
    fi
else
    echo "⚠️ DATABASE_URL não configurada"
fi

# Resumo
echo "\n📊 Resumo:"
if [ $ERROR_COUNT -eq 0 ]; then
    echo "✅ Todos os testes passaram! Sistema saudável."
    exit 0
else
    echo "❌ $ERROR_COUNT erro(s) encontrado(s)!"
    echo "🚨 Ação necessária!"
    exit 1
fi
```

### Monitoramento de Recursos

```bash
#!/bin/bash
# Script: monitor-resources.sh

echo "📊 Monitoramento de Recursos"
echo "============================"

# Informações da aplicação
echo "\n🏗️ Informações da Aplicação:"
doctl apps get fc4f8558-d183-4d7e-8ea4-347355a20230 --format ID,Spec.Name,Phase,CreatedAt,UpdatedAt

# Deployments recentes
echo "\n🚀 Deployments Recentes:"
doctl apps list-deployments fc4f8558-d183-4d7e-8ea4-347355a20230 --format ID,Phase,CreatedAt | head -5

# Logs de erro recentes
echo "\n🚨 Logs de Erro Recentes:"
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 --type=run --tail=20 | grep -i error || echo "Nenhum erro encontrado"

# Métricas de performance (simulado)
echo "\n⚡ Métricas de Performance:"
echo "Tempo de resposta médio: $(curl -s -o /dev/null -w "%{time_total}" https://fisioflow-aistudio-1-7wnxs.ondigitalocean.app/)s"
echo "Status HTTP: $(curl -s -o /dev/null -w "%{http_code}" https://fisioflow-aistudio-1-7wnxs.ondigitalocean.app/)"

# Verificar certificado SSL
echo "\n🔒 Certificado SSL:"
ssl_info=$(echo | openssl s_client -servername fisioflow-aistudio-1-7wnxs.ondigitalocean.app -connect fisioflow-aistudio-1-7wnxs.ondigitalocean.app:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
echo "$ssl_info"

echo "\n✅ Monitoramento concluído"
```

## 🔐 Operações de Segurança

### Rotação de Secrets

```bash
#!/bin/bash
# Script: rotate-secrets.sh

echo "🔐 Rotação de Secrets"
echo "==================="

echo "\n⚠️ ATENÇÃO: Esta operação irá gerar novos secrets!"
read -p "Deseja continuar? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operação cancelada"
    exit 1
fi

# 1. Gerar novos secrets
echo "\n🔑 Gerando novos secrets..."
NEW_JWT_SECRET=$(openssl rand -base64 32)
NEW_NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEW_API_KEY=$(openssl rand -hex 16)

echo "Novos secrets gerados:"
echo "JWT_SECRET: $NEW_JWT_SECRET"
echo "NEXTAUTH_SECRET: $NEW_NEXTAUTH_SECRET"
echo "API_KEY: $NEW_API_KEY"

# 2. Backup dos secrets atuais
echo "\n💾 Fazendo backup dos secrets atuais..."
DATE=$(date +"%Y%m%d_%H%M%S")
mkdir -p ./backups/secrets

# Salvar secrets atuais (se existirem)
if [ -f ".env" ]; then
    cp .env "./backups/secrets/env_backup_${DATE}"
fi

# 3. Atualizar secrets no Digital Ocean
echo "\n☁️ Atualizando secrets no Digital Ocean..."
echo "IMPORTANTE: Atualize manualmente no console do Digital Ocean:"
echo "1. Acesse: https://cloud.digitalocean.com/apps/fc4f8558-d183-4d7e-8ea4-347355a20230/settings"
echo "2. Vá para 'Environment Variables'"
echo "3. Atualize as seguintes variáveis:"
echo "   - JWT_SECRET: $NEW_JWT_SECRET"
echo "   - NEXTAUTH_SECRET: $NEW_NEXTAUTH_SECRET"
echo "   - API_KEY: $NEW_API_KEY"

read -p "Pressione Enter após atualizar no console..."

# 4. Trigger novo deploy
echo "\n🚀 Iniciando novo deploy..."
doctl apps create-deployment fc4f8558-d183-4d7e-8ea4-347355a20230

echo "\n✅ Rotação de secrets iniciada!"
echo "📋 Monitore o deploy e teste a aplicação"
```

### Auditoria de Segurança

```bash
#!/bin/bash
# Script: security-audit.sh

echo "🔍 Auditoria de Segurança"
echo "========================"

# 1. Verificar configurações de segurança
echo "\n🔒 Verificando Configurações de Segurança:"

# Headers de segurança
echo "\nHeaders de Segurança:"
headers=$(curl -s -I https://fisioflow-aistudio-1-7wnxs.ondigitalocean.app/)
echo "$headers" | grep -i "x-frame-options\|x-content-type-options\|x-xss-protection\|strict-transport-security" || echo "⚠️ Headers de segurança não encontrados"

# 2. Verificar certificado SSL
echo "\n🔐 Certificado SSL:"
ssl_check=$(echo | openssl s_client -servername fisioflow-aistudio-1-7wnxs.ondigitalocean.app -connect fisioflow-aistudio-1-7wnxs.ondigitalocean.app:443 2>/dev/null)
echo "$ssl_check" | openssl x509 -noout -subject -issuer -dates 2>/dev/null

# 3. Verificar vulnerabilidades conhecidas
echo "\n🚨 Verificação de Vulnerabilidades:"
if command -v npm &> /dev/null; then
    echo "Executando npm audit..."
    npm audit --audit-level=high
fi

# 4. Verificar permissões de arquivos
echo "\n📁 Verificando Permissões:"
find . -name "*.env*" -exec ls -la {} \; 2>/dev/null || echo "Nenhum arquivo .env encontrado"
find . -name "*.key" -exec ls -la {} \; 2>/dev/null || echo "Nenhum arquivo .key encontrado"

# 5. Verificar logs de segurança
echo "\n📋 Logs de Segurança Recentes:"
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 --type=run --tail=50 | grep -i "error\|unauthorized\|forbidden\|attack" || echo "Nenhum evento de segurança encontrado"

echo "\n✅ Auditoria de segurança concluída"
```

## 📈 Operações de Scaling

### Scaling Manual

```bash
#!/bin/bash
# Script: scale-app.sh

ACTION="$1"
INSTANCES="$2"

if [ "$ACTION" != "up" ] && [ "$ACTION" != "down" ]; then
    echo "❌ Uso: $0 [up|down] [número_instâncias]"
    echo "Exemplo: $0 up 3"
    exit 1
fi

if [ -z "$INSTANCES" ]; then
    echo "❌ Número de instâncias é obrigatório"
    exit 1
fi

echo "📈 Scaling da aplicação..."
echo "Ação: $ACTION"
echo "Instâncias: $INSTANCES"

# Nota: Digital Ocean App Platform gerencia scaling automaticamente
# Para scaling manual, seria necessário atualizar a spec da aplicação
echo "\n⚠️ NOTA: Digital Ocean App Platform gerencia scaling automaticamente"
echo "Para scaling manual, atualize a configuração no console:"
echo "1. Acesse: https://cloud.digitalocean.com/apps/fc4f8558-d183-4d7e-8ea4-347355a20230/settings"
echo "2. Vá para 'Resources'"
echo "3. Ajuste o número de instâncias"
echo "4. Clique em 'Save'"

# Monitorar status atual
echo "\n📊 Status Atual:"
doctl apps get fc4f8558-d183-4d7e-8ea4-347355a20230 --format Spec.Services

echo "\n✅ Instruções de scaling fornecidas"
```

## 📞 Contatos e Escalação

### Matriz de Escalação

| Severidade | Tempo Resposta | Contato | Ação |
|------------|----------------|---------|-------|
| **P0 - Crítico** | 15 min | DevOps Lead | Página imediata |
| **P1 - Alto** | 1 hora | Equipe Dev | Email + Slack |
| **P2 - Médio** | 4 horas | Suporte | Ticket |
| **P3 - Baixo** | 24 horas | Manutenção | Backlog |

### Contatos de Emergência

```bash
# Contatos (exemplo)
DEVOPS_LEAD="devops@fisioflow.com"
DEV_TEAM="dev-team@fisioflow.com"
SUPPORT="suporte@fisioflow.com"
SLACK_CHANNEL="#fisioflow-alerts"

# Serviços Externos
NEON_SUPPORT="https://neon.tech/docs/introduction/support"
DO_SUPPORT="https://cloud.digitalocean.com/support"
GITHUB_STATUS="https://www.githubstatus.com/"
```

## 📚 Recursos e Documentação

- **Digital Ocean Docs**: https://docs.digitalocean.com/products/app-platform/
- **Neon Docs**: https://neon.tech/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **GitHub Actions**: https://docs.github.com/en/actions

---

**Última atualização**: 10/09/2025
**Versão**: 1.0
**Responsável**: Equipe DevOps FisioFlow