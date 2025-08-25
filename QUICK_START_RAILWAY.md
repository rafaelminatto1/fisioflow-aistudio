# 🚂 Guia de Início Rápido - Railway CLI

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Git configurado
- Conta no Railway (https://railway.app)
- Projeto FisioFlow configurado

## 🚀 Deploy em 3 Passos

### 1. Setup Inicial (Primeira vez)

```bash
# Executar script de setup automático
npm run railway:setup

# OU manualmente:
npm install -g @railway/cli
railway login
railway init fisioflow
```

### 2. Configurar Variáveis de Ambiente

```bash
# Configurar variáveis essenciais
railway variables set DATABASE_URL="postgresql://..."
railway variables set NEXTAUTH_SECRET="seu-secret-aqui"
railway variables set NEXTAUTH_URL="https://fisioflow.up.railway.app"

# Ver todas as variáveis necessárias
cat .env.example
```

### 3. Deploy

```bash
# Deploy completo com validação
npm run deploy:railway-cli

# OU apenas validar configurações
npm run railway:validate
```

## 🛠️ Comandos Essenciais

### Deploy e Monitoramento

```bash
# Deploy rápido
npm run railway:deploy:quick

# Ver logs em tempo real
npm run railway:logs

# Status do projeto
npm run railway:status

# Abrir projeto no navegador
npm run railway:open
```

### Gerenciamento

```bash
# Restart da aplicação
npm run railway:restart

# Rollback para deploy anterior
npm run railway:rollback

# Conectar ao shell da aplicação
npm run railway:shell
```

### Variáveis de Ambiente

```bash
# Listar todas as variáveis
npm run railway:vars

# Adicionar nova variável
railway variables set NOVA_VAR="valor"

# Remover variável
railway variables delete NOVA_VAR
```

## 🔧 Configuração Avançada

### Múltiplos Ambientes

```bash
# Deploy para staging
railway up --environment staging

# Deploy para produção
railway up --environment production
```

### Domínio Customizado

```bash
# Adicionar domínio
railway domain add meudominio.com

# Listar domínios
railway domain list
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de autenticação**
   ```bash
   railway logout
   railway login
   ```

2. **Deploy falha**
   ```bash
   # Verificar logs
   railway logs --tail 100
   
   # Validar configurações
   npm run railway:validate
   ```

3. **Variáveis não configuradas**
   ```bash
   # Verificar variáveis
   railway variables
   
   # Comparar com .env.example
   cat .env.example
   ```

### Comandos de Emergência

```bash
# Parar aplicação
railway down

# Rollback imediato
railway rollback

# Logs de erro
railway logs --filter error

# Status detalhado
railway status --verbose
```

## 📊 Monitoramento

### Health Checks

```bash
# Verificar saúde da aplicação
curl https://fisioflow.up.railway.app/api/health

# Verificar banco de dados
curl https://fisioflow.up.railway.app/api/health/db
```

### Métricas

```bash
# Ver métricas no Railway
npm run railway:metrics

# Logs em tempo real
npm run railway:logs:live
```

## 🔗 Links Úteis

- [Railway Dashboard](https://railway.app/dashboard)
- [Documentação Railway](https://docs.railway.app)
- [Railway CLI Reference](https://docs.railway.app/reference/cli-api)
- [FisioFlow Repository](https://github.com/seu-usuario/fisioflow)

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `npm run railway:logs`
2. Consulte o troubleshooting: `docs/TROUBLESHOOTING.md`
3. Execute validação: `npm run railway:validate`
4. Verifique a documentação completa: `README-RAILWAY.md`

---

**🎉 Pronto! Seu FisioFlow está rodando no Railway!**

Acesse: https://fisioflow.up.railway.app