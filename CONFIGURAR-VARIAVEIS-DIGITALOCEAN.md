# 🔧 Configuração de Variáveis de Ambiente - DigitalOcean

## 📋 Resumo das Variáveis Geradas

### ✅ Variáveis OBRIGATÓRIAS (6)

| Variável | Valor | Tipo | Descrição |
|----------|-------|------|-----------|
| `NODE_ENV` | `production` | Plain Text | Ambiente de execução |
| `NEXT_TELEMETRY_DISABLED` | `1` | Plain Text | Desabilita telemetria |
| `PORT` | `3000` | Plain Text | Porta da aplicação |
| `NEXTAUTH_SECRET` | `f365EQlM7ebceKvSuBf9KyCxxbv59p1f` | **Encrypted** | Secret NextAuth |
| `NEXTAUTH_URL` | `${APP_URL}` | Plain Text | URL automática |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_p7LXBZvaMF0f@ep-shiny-dawn-ae4085f3.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require` | **Encrypted** | Banco Neon |

### 🔄 Variáveis OPCIONAIS (5)

| Variável | Descrição | Tipo |
|----------|-----------|------|
| `OPENAI_API_KEY` | API OpenAI (substitua o placeholder) | **Encrypted** |
| `ANTHROPIC_API_KEY` | API Anthropic Claude | **Encrypted** |
| `GEMINI_API_KEY` | API Google Gemini | **Encrypted** |
| `ENCRYPTION_KEY` | Chave criptografia interna | **Encrypted** |
| `STATUS_CHECK_TOKEN` | Token verificações status | **Encrypted** |

## 🚀 Passo a Passo - Configuração no DigitalOcean

### 1️⃣ Acessar o Painel
```bash
# Abra no navegador:
https://cloud.digitalocean.com/apps
```

### 2️⃣ Localizar sua Aplicação
- Clique na sua aplicação `fisioflow-aistudio`
- Vá para a aba **Settings**
- Clique em **Environment Variables**

### 3️⃣ Adicionar Variáveis OBRIGATÓRIAS

#### ⚠️ IMPORTANTE: Tipos de Variáveis
- **Plain Text**: Para configurações simples
- **Encrypted**: Para dados sensíveis (senhas, tokens, URLs de banco)

#### Configurar uma por uma:

**1. NODE_ENV**
```
Key: NODE_ENV
Value: production
Type: Plain Text
Scope: All components
```

**2. NEXT_TELEMETRY_DISABLED**
```
Key: NEXT_TELEMETRY_DISABLED
Value: 1
Type: Plain Text
Scope: All components
```

**3. PORT**
```
Key: PORT
Value: 3000
Type: Plain Text
Scope: All components
```

**4. NEXTAUTH_SECRET** ⚠️ CRÍTICO
```
Key: NEXTAUTH_SECRET
Value: f365EQlM7ebceKvSuBf9KyCxxbv59p1f
Type: Encrypted
Scope: All components
```

**5. NEXTAUTH_URL**
```
Key: NEXTAUTH_URL
Value: ${APP_URL}
Type: Plain Text
Scope: All components
```

**6. DATABASE_URL** ⚠️ CRÍTICO
```
Key: DATABASE_URL
Value: postgresql://neondb_owner:npg_p7LXBZvaMF0f@ep-shiny-dawn-ae4085f3.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
Type: Encrypted
Scope: All components
```

### 4️⃣ Adicionar Variáveis OPCIONAIS (se necessário)

**Se usar OpenAI:**
```
Key: OPENAI_API_KEY
Value: [SUA_API_KEY_REAL_AQUI]
Type: Encrypted
Scope: All components
```

**Outras opcionais:**
- `ANTHROPIC_API_KEY`: Para Claude AI
- `GEMINI_API_KEY`: Para Google Gemini
- `ENCRYPTION_KEY`: Chave gerada automaticamente
- `STATUS_CHECK_TOKEN`: Token gerado automaticamente

### 5️⃣ Salvar e Fazer Deploy

1. **Salvar Configurações**
   - Clique em **Save** após adicionar cada variável
   - Verifique se todas estão listadas corretamente

2. **Fazer Redeploy**
   - Vá para a aba **Deployments**
   - Clique em **Deploy**
   - Ou use o comando:
   ```bash
   doctl apps create-deployment [APP-ID]
   ```

## 🔍 Verificação e Monitoramento

### Verificar Variáveis Configuradas
```bash
# Listar variáveis da app
doctl apps get [APP-ID] --format json | jq ".spec.services[0].envs"
```

### Monitorar Deploy
```bash
# Ver logs em tempo real
doctl apps logs [APP-ID] --follow

# Verificar status do deploy
doctl apps get-deployment [APP-ID] [DEPLOYMENT-ID]
```

### Health Check
```bash
# Testar endpoint de saúde
curl https://[SUA-APP-URL]/api/health
```

## ⚠️ Checklist Final

- [ ] Todas as 6 variáveis obrigatórias configuradas
- [ ] Tipos corretos (Plain Text vs Encrypted)
- [ ] `NEXTAUTH_SECRET` configurado como Encrypted
- [ ] `DATABASE_URL` configurado como Encrypted
- [ ] Deploy realizado com sucesso
- [ ] Health check funcionando
- [ ] Logs sem erros críticos

## 🆘 Troubleshooting

### Erro: "NEXTAUTH_SECRET is not defined"
- Verifique se `NEXTAUTH_SECRET` está configurado como **Encrypted**
- Confirme que o valor não está vazio

### Erro: "Database connection failed"
- Verifique se `DATABASE_URL` está correto
- Confirme que está configurado como **Encrypted**
- Teste a conexão do banco Neon

### Deploy falha
```bash
# Ver logs detalhados
doctl apps logs [APP-ID] --type build
doctl apps logs [APP-ID] --type deploy
```

## 📞 Próximos Passos

1. ✅ Configurar variáveis (você está aqui)
2. 🚀 Fazer deploy da aplicação
3. 🔍 Testar funcionalidades
4. 🌐 Configurar domínio personalizado (opcional)
5. 🔒 Configurar SSL/HTTPS

---

**📁 Arquivo de referência:** `digitalocean-env-config.json`
**📖 Guia completo:** `DEPLOY-DIGITALOCEAN.md`