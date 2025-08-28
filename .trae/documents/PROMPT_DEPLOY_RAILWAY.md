# Prompt para Deploy no Railway - FisioFlow

## Contexto do Projeto

Olá Claude Code! Preciso realizar o deploy da aplicação **FisioFlow** na plataforma Railway. Este é
um sistema completo de gestão para clínicas de fisioterapia desenvolvido em Next.js 14 com as
seguintes características:

### Tecnologias Implementadas

- **Frontend**: Next.js 14 com App Router, TypeScript, Tailwind CSS
- **Backend**: API Routes do Next.js, Prisma ORM
- **Banco de Dados**: PostgreSQL (Neon DB)
- **Autenticação**: NextAuth.js v4
- **Deploy**: Railway Platform
- **Runtime**: Edge Runtime (totalmente compatível)

### Correções Recentes Implementadas

✅ **Edge Runtime Compatibility**: Substituído Winston Logger por logger compatível  
✅ **MCP Configuration**: Sistema completo de configuração automatizada  
✅ **Environment Automation**: Scripts para obter credenciais reais do Railway e Neon  
✅ **Hot Reload Fix**: Corrigidos problemas de desenvolvimento  
✅ **Build Optimization**: Removidas dependências incompatíveis com Edge Runtime

## Pré-requisitos Verificados

### ✅ Variáveis de Ambiente Configuradas

Todas as variáveis estão configuradas no `.env.local`:

```bash
# Railway Configuration
RAILWAY_API_KEY=real_api_key_from_cli
RAILWAY_PROJECT_ID=real_project_id
RAILWAY_PRODUCTION_DOMAIN=fisioflow-production.railway.app

# Neon Database (Testado e Funcionando)
NEON_API_KEY=real_neon_api_key
NEON_PROJECT_ID=real_neon_project_id
NEON_DB_HOST=ep-xxx.neon.tech
NEON_DB_USER=real_username
NEON_DB_PASSWORD=real_password
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# NextAuth Configuration
NEXTAUTH_SECRET=generated_secure_secret
NEXTAUTH_URL=https://fisioflow-production.railway.app
```

### ✅ Build Status

- Build local sem erros
- TypeScript compilation OK
- Edge Runtime compatibility verificada
- Testes de conexão com Neon DB passando

## Instruções Específicas para Deploy

### 1. Verificação Pré-Deploy

Antes de iniciar o deploy, execute:

```bash
# Validar configuração MCP
npm run mcp:validate

# Testar conexões
npm run env:test-connections

# Build local para verificar
npm run build
```

### 2. Deploy no Railway

#### Opção A: Deploy Automático (Recomendado)

```bash
# Deploy para produção
npm run railway:deploy-production

# Monitorar logs em tempo real
npm run railway:logs
```

#### Opção B: Deploy Manual via CLI

```bash
# Login no Railway (se necessário)
railway login

# Conectar ao projeto
railway link [PROJECT_ID]

# Deploy
railway up --environment production
```

### 3. Configuração de Variáveis no Railway

Configure as seguintes variáveis de ambiente no painel do Railway:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# NextAuth
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL=https://your-app.railway.app

# Neon DB (opcional para logs)
NEON_API_KEY=your_neon_api_key
NEON_PROJECT_ID=your_neon_project_id
```

### 4. Configuração do Domínio

```bash
# Configurar domínio customizado (se aplicável)
railway domain add fisioflow-production.railway.app

# Verificar status do domínio
railway domain list
```

## Validações Pós-Deploy

### ✅ Checklist de Verificação

1. **Aplicação Online**
   - [ ] Site carrega corretamente
   - [ ] Não há erros 500/404 na homepage
   - [ ] CSS e assets carregam corretamente

2. **Banco de Dados**
   - [ ] Conexão com Neon DB estabelecida
   - [ ] Migrations executadas (se aplicável)
   - [ ] Tabelas criadas corretamente

3. **Autenticação**
   - [ ] Login/logout funcionando
   - [ ] Redirecionamentos corretos
   - [ ] Sessões persistindo

4. **APIs**
   - [ ] Endpoints respondendo
   - [ ] CORS configurado corretamente
   - [ ] Rate limiting funcionando

### 🔍 Comandos de Verificação

```bash
# Verificar status do deploy
railway status

# Ver logs em tempo real
railway logs --follow

# Verificar variáveis de ambiente
railway variables

# Testar endpoint de saúde
curl https://your-app.railway.app/api/health
```

## Troubleshooting Comum

### 🚨 Problemas Conhecidos e Soluções

#### 1. Build Failures

```bash
# Se o build falhar, verificar:
- Dependências instaladas: npm install
- TypeScript errors: npm run type-check
- Build local: npm run build
```

#### 2. Database Connection Issues

```bash
# Verificar conexão Neon:
npm run env:test-connections

# Verificar DATABASE_URL no Railway:
railway variables | grep DATABASE_URL
```

#### 3. NextAuth Errors

```bash
# Verificar variáveis NextAuth:
- NEXTAUTH_SECRET deve estar definido
- NEXTAUTH_URL deve apontar para o domínio correto
```

#### 4. Edge Runtime Issues

```bash
# Se houver erros de runtime:
- Verificar se não há APIs Node.js sendo usadas
- Confirmar que winston foi substituído pelo edge-logger
- Verificar middleware.ts para compatibilidade
```

### 📊 Monitoramento Pós-Deploy

```bash
# Monitorar performance
railway metrics

# Verificar logs de erro
railway logs --filter error

# Status dos serviços
railway ps
```

## Comandos de Rollback (Se Necessário)

```bash
# Listar deployments
railway deployments

# Rollback para versão anterior
railway rollback [DEPLOYMENT_ID]

# Verificar status após rollback
railway status
```

## Próximos Passos Após Deploy

1. **Configurar Monitoramento**
   - Configurar alertas no Railway
   - Implementar health checks
   - Configurar logs estruturados

2. **Otimizações**
   - Configurar CDN se necessário
   - Implementar cache strategies
   - Otimizar imagens e assets

3. **Segurança**
   - Configurar HTTPS redirect
   - Implementar rate limiting
   - Configurar CORS adequadamente

---

**Objetivo**: Deploy bem-sucedido do FisioFlow no Railway com todas as funcionalidades operacionais,
banco de dados conectado e autenticação funcionando.

**Resultado Esperado**: Aplicação acessível em produção, sem erros, com todas as features funcionais
e pronta para uso pelos usuários finais.

Por favor, execute o deploy seguindo estas instruções e me informe sobre qualquer erro ou sucesso
durante o processo!
