# Procedimentos de Backup - FisioFlow

## 📋 Visão Geral

Este documento descreve os procedimentos de backup para o sistema FisioFlow, incluindo backup automático e manual do banco de dados, arquivos de configuração e código fonte.

## 🗄️ Tipos de Backup

### 1. Backup do Banco de Dados (Neon)

#### Backup Automático
O Neon PostgreSQL possui backup automático configurado:
- **Frequência**: Diário
- **Retenção**: 7 dias (plano gratuito) / 30 dias (plano pago)
- **Horário**: 02:00 UTC
- **Localização**: Neon Cloud Storage

#### Backup Manual

##### Backup Completo
```bash
#!/bin/bash
# Script: backup-database.sh

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/database"
BACKUP_FILE="fisioflow_backup_${DATE}.sql"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Fazer backup completo
echo "🗄️ Iniciando backup do banco de dados..."
pg_dump $DATABASE_URL > "$BACKUP_DIR/$BACKUP_FILE"

# Comprimir backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

echo "✅ Backup concluído: $BACKUP_DIR/$BACKUP_FILE.gz"
echo "📊 Tamanho: $(du -h $BACKUP_DIR/$BACKUP_FILE.gz | cut -f1)"

# Limpar backups antigos (manter últimos 7)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

##### Backup por Tabela
```bash
#!/bin/bash
# Backup de tabelas específicas

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/tables"

mkdir -p $BACKUP_DIR

# Tabelas críticas
TABLES=("users" "pacientes" "consultas" "prontuarios" "agendamentos")

for table in "${TABLES[@]}"; do
    echo "📋 Fazendo backup da tabela: $table"
    pg_dump $DATABASE_URL -t $table > "$BACKUP_DIR/${table}_${DATE}.sql"
    gzip "$BACKUP_DIR/${table}_${DATE}.sql"
done

echo "✅ Backup de tabelas concluído"
```

### 2. Backup de Configurações

#### Arquivos de Configuração
```bash
#!/bin/bash
# Script: backup-config.sh

DATE=$(date +"%Y%m%d_%H%M%S")
CONFIG_BACKUP_DIR="./backups/config"

mkdir -p $CONFIG_BACKUP_DIR

# Arquivos importantes para backup
FILES=(
    ".env.example"
    "package.json"
    "package-lock.json"
    "next.config.js"
    "tailwind.config.js"
    "tsconfig.json"
    "prisma/schema.prisma"
    ".github/workflows/deploy.yml"
    "vercel.json"
)

# Criar arquivo tar com configurações
echo "📦 Criando backup de configurações..."
tar -czf "$CONFIG_BACKUP_DIR/config_backup_${DATE}.tar.gz" "${FILES[@]}" 2>/dev/null

echo "✅ Backup de configurações concluído: $CONFIG_BACKUP_DIR/config_backup_${DATE}.tar.gz"

# Backup das configurações do Digital Ocean
echo "☁️ Fazendo backup das configurações do Digital Ocean..."
doctl apps get fc4f8558-d183-4d7e-8ea4-347355a20230 --format json > "$CONFIG_BACKUP_DIR/do_app_config_${DATE}.json"

echo "✅ Configurações do Digital Ocean salvas"
```

### 3. Backup do Código Fonte

#### Git Repository
```bash
#!/bin/bash
# Script: backup-source.sh

DATE=$(date +"%Y%m%d_%H%M%S")
SOURCE_BACKUP_DIR="./backups/source"

mkdir -p $SOURCE_BACKUP_DIR

# Criar bundle do repositório Git
echo "📚 Criando backup do código fonte..."
git bundle create "$SOURCE_BACKUP_DIR/fisioflow_source_${DATE}.bundle" --all

# Backup dos node_modules (opcional, para deploy rápido)
echo "📦 Fazendo backup das dependências..."
tar -czf "$SOURCE_BACKUP_DIR/node_modules_${DATE}.tar.gz" node_modules/ 2>/dev/null

echo "✅ Backup do código fonte concluído"
```

## 🔄 Procedimentos de Restauração

### 1. Restaurar Banco de Dados

#### Restauração Completa
```bash
#!/bin/bash
# Script: restore-database.sh

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Uso: $0 <arquivo_backup.sql.gz>"
    exit 1
fi

echo "⚠️ ATENÇÃO: Esta operação irá substituir todos os dados!"
read -p "Deseja continuar? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️ Restaurando banco de dados..."
    
    # Descomprimir se necessário
    if [[ $BACKUP_FILE == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" | psql $DATABASE_URL
    else
        psql $DATABASE_URL < "$BACKUP_FILE"
    fi
    
    echo "✅ Restauração concluída"
else
    echo "❌ Operação cancelada"
fi
```

#### Restauração de Tabela Específica
```bash
#!/bin/bash
# Restaurar apenas uma tabela

TABLE_NAME="$1"
BACKUP_FILE="$2"

if [ -z "$TABLE_NAME" ] || [ -z "$BACKUP_FILE" ]; then
    echo "❌ Uso: $0 <nome_tabela> <arquivo_backup.sql.gz>"
    exit 1
fi

echo "📋 Restaurando tabela: $TABLE_NAME"

# Fazer backup da tabela atual antes de restaurar
DATE=$(date +"%Y%m%d_%H%M%S")
pg_dump $DATABASE_URL -t $TABLE_NAME > "backup_before_restore_${TABLE_NAME}_${DATE}.sql"

# Restaurar tabela
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql $DATABASE_URL
else
    psql $DATABASE_URL < "$BACKUP_FILE"
fi

echo "✅ Tabela $TABLE_NAME restaurada"
```

### 2. Restaurar Configurações

```bash
#!/bin/bash
# Script: restore-config.sh

CONFIG_BACKUP="$1"

if [ -z "$CONFIG_BACKUP" ]; then
    echo "❌ Uso: $0 <arquivo_config_backup.tar.gz>"
    exit 1
fi

echo "⚙️ Restaurando configurações..."

# Fazer backup das configurações atuais
DATE=$(date +"%Y%m%d_%H%M%S")
mkdir -p "./backups/current_config_${DATE}"
cp .env package.json next.config.js "./backups/current_config_${DATE}/" 2>/dev/null

# Restaurar configurações
tar -xzf "$CONFIG_BACKUP"

echo "✅ Configurações restauradas"
echo "📋 Backup das configurações atuais em: ./backups/current_config_${DATE}/"
```

## 🤖 Automação de Backups

### Script de Backup Completo
```bash
#!/bin/bash
# Script: full-backup.sh
# Executa backup completo do sistema

set -e

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_ROOT="./backups/full_backup_${DATE}"

echo "🚀 Iniciando backup completo do FisioFlow..."
echo "📅 Data: $(date)"
echo "📁 Destino: $BACKUP_ROOT"

mkdir -p "$BACKUP_ROOT"

# 1. Backup do banco de dados
echo "\n🗄️ 1/4 - Backup do banco de dados..."
mkdir -p "$BACKUP_ROOT/database"
pg_dump $DATABASE_URL | gzip > "$BACKUP_ROOT/database/fisioflow_db.sql.gz"

# 2. Backup de configurações
echo "\n⚙️ 2/4 - Backup de configurações..."
mkdir -p "$BACKUP_ROOT/config"
tar -czf "$BACKUP_ROOT/config/config_files.tar.gz" \
    .env.example package.json next.config.js tailwind.config.js \
    tsconfig.json prisma/schema.prisma .github/workflows/ 2>/dev/null

# 3. Backup do código fonte
echo "\n📚 3/4 - Backup do código fonte..."
mkdir -p "$BACKUP_ROOT/source"
git bundle create "$BACKUP_ROOT/source/fisioflow_repo.bundle" --all

# 4. Backup das configurações do Digital Ocean
echo "\n☁️ 4/4 - Backup das configurações do Digital Ocean..."
mkdir -p "$BACKUP_ROOT/cloud"
doctl apps get fc4f8558-d183-4d7e-8ea4-347355a20230 --format json > "$BACKUP_ROOT/cloud/do_app_config.json"

# Criar arquivo de informações do backup
cat > "$BACKUP_ROOT/backup_info.txt" << EOF
FisioFlow - Backup Completo
===========================
Data: $(date)
Versão: $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Branch: $(git branch --show-current 2>/dev/null || echo "N/A")
Tamanho total: $(du -sh $BACKUP_ROOT | cut -f1)

Conteúdo:
- database/fisioflow_db.sql.gz: Backup completo do banco
- config/config_files.tar.gz: Arquivos de configuração
- source/fisioflow_repo.bundle: Repositório Git completo
- cloud/do_app_config.json: Configurações do Digital Ocean

Para restaurar:
1. Restaurar banco: gunzip -c database/fisioflow_db.sql.gz | psql \$DATABASE_URL
2. Restaurar config: tar -xzf config/config_files.tar.gz
3. Restaurar código: git clone source/fisioflow_repo.bundle fisioflow-restored
EOF

# Comprimir backup completo
echo "\n📦 Comprimindo backup completo..."
tar -czf "./backups/fisioflow_full_backup_${DATE}.tar.gz" -C "./backups" "full_backup_${DATE}"

# Limpar diretório temporário
rm -rf "$BACKUP_ROOT"

echo "\n✅ Backup completo concluído!"
echo "📁 Arquivo: ./backups/fisioflow_full_backup_${DATE}.tar.gz"
echo "📊 Tamanho: $(du -h ./backups/fisioflow_full_backup_${DATE}.tar.gz | cut -f1)"

# Limpar backups antigos (manter últimos 5)
find ./backups -name "fisioflow_full_backup_*.tar.gz" -mtime +30 -delete

echo "\n🎉 Backup completo finalizado com sucesso!"
```

### Cron Job para Backup Automático
```bash
# Adicionar ao crontab para backup diário às 3:00 AM
# crontab -e
0 3 * * * /path/to/fisioflow/scripts/full-backup.sh >> /var/log/fisioflow-backup.log 2>&1

# Backup semanal completo aos domingos às 2:00 AM
0 2 * * 0 /path/to/fisioflow/scripts/full-backup.sh >> /var/log/fisioflow-weekly-backup.log 2>&1
```

## 📊 Monitoramento de Backups

### Script de Verificação
```bash
#!/bin/bash
# Script: check-backups.sh

echo "📊 Verificando status dos backups..."

# Verificar backups locais
echo "\n🗄️ Backups Locais:"
if [ -d "./backups" ]; then
    find ./backups -name "*.gz" -o -name "*.tar.gz" | while read backup; do
        size=$(du -h "$backup" | cut -f1)
        date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null | cut -d' ' -f1,2)
        echo "  📁 $(basename "$backup") - $size - $date"
    done
else
    echo "  ❌ Diretório de backups não encontrado"
fi

# Verificar backup automático do Neon
echo "\n☁️ Backup Automático (Neon):"
echo "  ✅ Configurado para backup diário às 02:00 UTC"
echo "  📅 Retenção: 7 dias (verificar no console Neon)"

# Verificar espaço disponível
echo "\n💾 Espaço em Disco:"
df -h . | tail -1 | awk '{print "  📊 Usado: " $3 " / " $2 " (" $5 ")"}'

echo "\n✅ Verificação de backups concluída"
```

## 🚨 Plano de Recuperação de Desastres

### Cenário 1: Falha Completa da Aplicação
1. **Avaliar danos**: Verificar logs e status
2. **Backup preventivo**: Fazer backup do estado atual se possível
3. **Restaurar aplicação**: Deploy da última versão estável
4. **Verificar integridade**: Executar testes de sanidade
5. **Monitorar**: Acompanhar métricas pós-restauração

### Cenário 2: Corrupção do Banco de Dados
1. **Isolar problema**: Colocar aplicação em modo manutenção
2. **Backup atual**: Salvar estado corrompido para análise
3. **Restaurar backup**: Usar backup mais recente válido
4. **Verificar dados**: Executar queries de validação
5. **Reativar aplicação**: Remover modo manutenção

### Cenário 3: Perda de Configurações
1. **Identificar configurações perdidas**
2. **Restaurar do backup de configurações**
3. **Reconfigurar variáveis de ambiente**
4. **Testar funcionalidades críticas**
5. **Documentar mudanças**

## 📞 Contatos e Recursos

- **Neon Console**: https://console.neon.tech/
- **Digital Ocean Console**: https://cloud.digitalocean.com/
- **Documentação Neon Backup**: https://neon.tech/docs/manage/backups
- **Suporte Digital Ocean**: https://cloud.digitalocean.com/support

---

**Última atualização**: 10/09/2025
**Versão**: 1.0
**Responsável**: Equipe DevOps FisioFlow