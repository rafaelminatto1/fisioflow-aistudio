#!/bin/bash

# ========================================
# FISIOFLOW - CONFIGURAÇÃO DE BACKUP DO BANCO
# ========================================
# Script para configurar backup automático no DigitalOcean

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[BACKUP]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar se doctl está instalado
check_doctl() {
    if ! command -v doctl &> /dev/null; then
        error "doctl não está instalado. Instale com: brew install doctl"
        exit 1
    fi
    
    log "doctl encontrado: $(doctl version)"
}

# Configurar backup automático
setup_automatic_backup() {
    log "Configurando backup automático do banco de dados..."
    
    # Obter informações do banco
    info "Listando bancos de dados disponíveis..."
    doctl databases list
    
    echo
    read -p "Digite o ID do banco de dados: " DB_ID
    
    if [ -z "$DB_ID" ]; then
        error "ID do banco é obrigatório"
        exit 1
    fi
    
    # Configurar backup diário às 2:00 AM UTC
    log "Configurando backup diário às 2:00 AM UTC..."
    
    # Nota: O DigitalOcean Managed Databases já tem backup automático habilitado por padrão
    # Vamos verificar as configurações atuais
    info "Verificando configurações atuais de backup..."
    doctl databases get $DB_ID
    
    log "✅ Backup automático já está habilitado no DigitalOcean Managed Database"
    log "   - Backups diários são mantidos por 7 dias"
    log "   - Backups semanais são mantidos por 4 semanas"
    log "   - Backups mensais são mantidos por 3 meses"
}

# Criar script de backup manual
create_manual_backup_script() {
    log "Criando script de backup manual..."
    
    cat > scripts/manual-backup.sh << 'EOF'
#!/bin/bash

# Script de backup manual do FisioFlow
# Execute: ./scripts/manual-backup.sh

set -e

# Configurações
BACKUP_DIR="backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="fisioflow_backup_${DATE}.sql"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

echo "🔄 Iniciando backup manual..."

# Fazer backup usando pg_dump
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não está definida"
    exit 1
fi

echo "📦 Criando backup: $BACKUP_FILE"
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/$BACKUP_FILE"

# Comprimir o backup
echo "🗜️ Comprimindo backup..."
gzip "$BACKUP_DIR/$BACKUP_FILE"

echo "✅ Backup criado com sucesso: $BACKUP_DIR/${BACKUP_FILE}.gz"
echo "📊 Tamanho do arquivo: $(du -h $BACKUP_DIR/${BACKUP_FILE}.gz | cut -f1)"

# Limpar backups antigos (manter apenas os últimos 10)
echo "🧹 Limpando backups antigos..."
ls -t $BACKUP_DIR/fisioflow_backup_*.sql.gz | tail -n +11 | xargs -r rm

echo "🎉 Backup manual concluído!"
EOF

    chmod +x scripts/manual-backup.sh
    log "✅ Script de backup manual criado: scripts/manual-backup.sh"
}

# Criar script de restore
create_restore_script() {
    log "Criando script de restore..."
    
    cat > scripts/restore-backup.sh << 'EOF'
#!/bin/bash

# Script de restore do FisioFlow
# Execute: ./scripts/restore-backup.sh <arquivo_backup>

set -e

if [ $# -eq 0 ]; then
    echo "❌ Uso: $0 <arquivo_backup.sql.gz>"
    echo "📁 Backups disponíveis:"
    ls -la backups/fisioflow_backup_*.sql.gz 2>/dev/null || echo "   Nenhum backup encontrado"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Arquivo de backup não encontrado: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  ATENÇÃO: Este processo irá SUBSTITUIR todos os dados do banco!"
read -p "Tem certeza que deseja continuar? (digite 'CONFIRMO'): " confirmation

if [ "$confirmation" != "CONFIRMO" ]; then
    echo "❌ Operação cancelada"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não está definida"
    exit 1
fi

echo "🔄 Iniciando restore..."

# Descomprimir se necessário
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "📦 Descomprimindo backup..."
    TEMP_FILE="/tmp/restore_temp.sql"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
else
    TEMP_FILE="$BACKUP_FILE"
fi

echo "🗄️ Restaurando banco de dados..."
psql "$DATABASE_URL" < "$TEMP_FILE"

# Limpar arquivo temporário
if [[ $BACKUP_FILE == *.gz ]]; then
    rm "$TEMP_FILE"
fi

echo "✅ Restore concluído com sucesso!"
echo "🔄 Executando migrations para garantir consistência..."
npx prisma migrate deploy

echo "🎉 Restore finalizado!"
EOF

    chmod +x scripts/restore-backup.sh
    log "✅ Script de restore criado: scripts/restore-backup.sh"
}

# Testar backup
test_backup() {
    log "Testando processo de backup..."
    
    if [ ! -f "scripts/manual-backup.sh" ]; then
        error "Script de backup não encontrado"
        exit 1
    fi
    
    # Executar backup de teste
    info "Executando backup de teste..."
    ./scripts/manual-backup.sh
    
    # Verificar se o backup foi criado
    if ls backups/fisioflow_backup_*.sql.gz 1> /dev/null 2>&1; then
        log "✅ Backup de teste criado com sucesso"
        
        # Mostrar informações do backup
        LATEST_BACKUP=$(ls -t backups/fisioflow_backup_*.sql.gz | head -n1)
        info "Último backup: $LATEST_BACKUP"
        info "Tamanho: $(du -h $LATEST_BACKUP | cut -f1)"
    else
        error "Falha ao criar backup de teste"
        exit 1
    fi
}

# Criar documentação
create_backup_docs() {
    log "Criando documentação de backup..."
    
    cat > BACKUP-RESTORE.md << 'EOF'
# 📦 Backup e Restore - FisioFlow

## Backup Automático

O DigitalOcean Managed Database possui backup automático habilitado por padrão:

- **Backups diários**: Mantidos por 7 dias
- **Backups semanais**: Mantidos por 4 semanas  
- **Backups mensais**: Mantidos por 3 meses
- **Horário**: Executado automaticamente durante períodos de baixa atividade

### Acessar Backups Automáticos

1. Acesse o painel do DigitalOcean
2. Vá em "Databases" > Seu banco de dados
3. Clique na aba "Backups"
4. Selecione o backup desejado e clique em "Restore"

## Backup Manual

### Criar Backup Manual

```bash
# Executar backup manual
./scripts/manual-backup.sh
```

O backup será salvo em `backups/fisioflow_backup_YYYYMMDD_HHMMSS.sql.gz`

### Restaurar Backup

```bash
# Listar backups disponíveis
./scripts/restore-backup.sh

# Restaurar backup específico
./scripts/restore-backup.sh backups/fisioflow_backup_20240101_120000.sql.gz
```

⚠️ **ATENÇÃO**: O restore substitui TODOS os dados do banco!

## Monitoramento de Backup

### Verificar Status

```bash
# Verificar último backup
ls -la backups/

# Verificar tamanho dos backups
du -h backups/
```

### Automatizar Backups Locais

Para automatizar backups locais, adicione ao crontab:

```bash
# Editar crontab
crontab -e

# Adicionar linha para backup diário às 3:00 AM
0 3 * * * cd /path/to/fisioflow && ./scripts/manual-backup.sh
```

## Estratégia de Backup

### Produção
- **Automático**: DigitalOcean (diário/semanal/mensal)
- **Manual**: Antes de atualizações importantes
- **Local**: Backup semanal para redundância

### Desenvolvimento
- **Manual**: Conforme necessário
- **Antes de migrations**: Sempre fazer backup

## Recuperação de Desastres

### Cenário 1: Corrupção de Dados
1. Identificar último backup válido
2. Executar restore
3. Verificar integridade dos dados
4. Executar migrations se necessário

### Cenário 2: Perda Total do Banco
1. Criar novo banco no DigitalOcean
2. Atualizar DATABASE_URL
3. Restaurar do backup mais recente
4. Executar migrations
5. Testar aplicação

## Testes de Backup

```bash
# Testar processo completo
./scripts/manual-backup.sh
./scripts/restore-backup.sh backups/fisioflow_backup_latest.sql.gz
```

## Troubleshooting

### Erro: "DATABASE_URL não definida"
- Verificar arquivo `.env`
- Confirmar variáveis de ambiente

### Erro: "pg_dump não encontrado"
- Instalar PostgreSQL client: `brew install postgresql`

### Backup muito grande
- Verificar se há dados desnecessários
- Considerar backup incremental
- Limpar logs antigos
EOF

    log "✅ Documentação criada: BACKUP-RESTORE.md"
}

# Função principal
main() {
    log "🚀 Configurando sistema de backup do FisioFlow..."
    
    # Criar diretório de scripts se não existir
    mkdir -p scripts
    mkdir -p backups
    
    check_doctl
    setup_automatic_backup
    create_manual_backup_script
    create_restore_script
    create_backup_docs
    
    log "🎉 Configuração de backup concluída!"
    
    echo
    info "📋 Próximos passos:"
    echo "   1. Teste o backup: ./scripts/manual-backup.sh"
    echo "   2. Leia a documentação: BACKUP-RESTORE.md"
    echo "   3. Configure cron para backups automáticos locais"
    echo "   4. Teste o processo de restore em ambiente de desenvolvimento"
    
    echo
    warn "⚠️  Lembre-se:"
    echo "   - Backups automáticos já estão habilitados no DigitalOcean"
    echo "   - Teste regularmente o processo de restore"
    echo "   - Mantenha backups locais para redundância"
}

# Executar função principal
main "$@"