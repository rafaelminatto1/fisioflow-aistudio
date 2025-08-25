# Guia de Migração FisioFlow - Railway + Neon DB

## Visão Geral

Este documento descreve o processo completo de migração do FisioFlow para Railway (hosting) e Neon DB (banco de dados), incluindo procedimentos de rollback em caso de problemas.

## Pré-requisitos

### Ferramentas Necessárias
- Railway CLI instalado e configurado
- Node.js 18+ e npm
- Git configurado
- Acesso ao painel do Neon DB
- Variáveis de ambiente configuradas

### Verificações Iniciais
```bash
# Verificar Railway CLI
railway --version

# Verificar conexão com o projeto
railway status

# Verificar build local
npm run build
```

## Processo de Migração

### 1. Preparação do Banco de Dados (Neon DB)

#### 1.1 Configuração Inicial
1. Criar projeto no Neon DB
2. Obter string de conexão
3. Configurar connection pooling
4. Aplicar migrações do Prisma

```bash
# Aplicar migrações
npx prisma migrate deploy

# Gerar cliente Prisma
npx prisma generate

# Verificar conexão
npx prisma db pull
```

#### 1.2 Backup dos Dados
```bash
# Backup automático via script
npm run backup:create

# Backup manual
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Configuração do Railway

#### 2.1 Deploy Inicial
```bash
# Login no Railway
railway login

# Conectar ao projeto
railway link

# Deploy
railway up
```

#### 2.2 Configuração de Variáveis
```bash
# Configurar variáveis via CLI
railway variables set DATABASE_URL="postgresql://..."
railway variables set NEXTAUTH_SECRET="..."
railway variables set NEXTAUTH_URL="https://seu-app.railway.app"
```

### 3. Verificação Pós-Deploy

#### 3.1 Health Checks
```bash
# Verificar saúde da aplicação
curl https://seu-app.railway.app/api/health

# Verificar logs
railway logs

# Monitorar métricas
railway status
```

#### 3.2 Testes de Funcionalidade
- [ ] Login/logout funcionando
- [ ] CRUD de pacientes
- [ ] CRUD de sessões
- [ ] Upload de arquivos
- [ ] Relatórios
- [ ] Notificações

## Procedimentos de Rollback

### Rollback Rápido (< 5 minutos)

#### 1. Rollback da Aplicação
```bash
# Voltar para versão anterior
railway rollback

# Ou fazer deploy de commit específico
git checkout <commit-anterior>
railway up
```

#### 2. Rollback do Banco (se necessário)
```bash
# Restaurar backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Ou usar script automatizado
npm run backup:restore -- --file=backup_YYYYMMDD_HHMMSS.sql
```

### Rollback Completo (ambiente anterior)

#### 1. Preparação
```bash
# Criar backup de emergência
npm run backup:emergency

# Documentar estado atual
railway status > rollback_status.txt
railway logs > rollback_logs.txt
```

#### 2. Migração de Dados
```bash
# Exportar dados do Neon DB
npm run data:export

# Importar para ambiente anterior
npm run data:import -- --target=previous-env
```

#### 3. Redirecionamento
- Atualizar DNS/CDN para ambiente anterior
- Notificar usuários sobre manutenção
- Monitorar logs de erro

## Scripts de Automação

### Deploy Automatizado
```bash
# Deploy completo com verificações
npm run deploy:production

# Deploy com rollback automático em caso de falha
npm run deploy:safe
```

### Monitoramento
```bash
# Health check contínuo
npm run monitor:health

# Verificação de performance
npm run monitor:performance

# Alertas automáticos
npm run monitor:alerts
```

## Checklist de Migração

### Pré-Migração
- [ ] Backup completo dos dados
- [ ] Testes em ambiente de staging
- [ ] Variáveis de ambiente configuradas
- [ ] DNS/domínio preparado
- [ ] Equipe notificada

### Durante a Migração
- [ ] Deploy da aplicação
- [ ] Migração do banco de dados
- [ ] Verificação de health checks
- [ ] Testes de funcionalidade
- [ ] Monitoramento de logs

### Pós-Migração
- [ ] Verificação completa de funcionalidades
- [ ] Monitoramento de performance
- [ ] Backup pós-migração
- [ ] Documentação atualizada
- [ ] Equipe treinada

## Contatos de Emergência

### Equipe Técnica
- **DevOps**: [email]
- **Backend**: [email]
- **Frontend**: [email]

### Fornecedores
- **Railway Support**: support@railway.app
- **Neon Support**: support@neon.tech

## Logs e Monitoramento

### Comandos Úteis
```bash
# Logs em tempo real
railway logs --follow

# Logs com filtro
railway logs --filter="ERROR"

# Status detalhado
railway status --verbose

# Métricas de performance
railway metrics
```

### Alertas Configurados
- Erro 5xx > 5% por 5 minutos
- Tempo de resposta > 2s por 10 minutos
- CPU > 80% por 15 minutos
- Memória > 90% por 10 minutos
- Falha no health check por 3 tentativas

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco
```bash
# Verificar string de conexão
echo $DATABASE_URL

# Testar conexão
npx prisma db pull

# Verificar pool de conexões
npm run db:pool-status
```

#### 2. Erro de Build
```bash
# Limpar cache
npm run clean
npm install

# Build local
npm run build

# Verificar dependências
npm audit
```

#### 3. Erro de Autenticação
```bash
# Verificar variáveis NextAuth
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL

# Testar endpoints
curl https://seu-app.railway.app/api/auth/session
```

### Comandos de Diagnóstico
```bash
# Status completo do sistema
npm run system:status

# Verificação de saúde
npm run health:full-check

# Relatório de performance
npm run performance:report
```

## Atualizações Futuras

Este documento deve ser atualizado a cada:
- Nova versão major da aplicação
- Mudança na infraestrutura
- Lições aprendidas de incidentes
- Mudanças nos procedimentos

---

**Última atualização**: $(date)
**Versão**: 1.0.0
**Responsável**: Equipe DevOps FisioFlow