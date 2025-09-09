# 🚀 Guia Completo de Deploy - DigitalOcean App Platform

## FisioFlow - Deploy em Produção

### 📋 Pré-requisitos

- [x] Conta DigitalOcean ativa
- [x] Repositório GitHub configurado
- [x] Código commitado e enviado para `main`
- [x] Arquivo `.do/app.yaml` configurado
- [x] Dockerfile otimizado
- [x] Health check endpoint `/api/health` funcionando

---

## 🔧 Passo 1: Verificar Repositório GitHub

### 1.1 Confirmar Status do Repositório
```bash
# Verificar status atual
git status

# Verificar último commit
git log --oneline -5

# Verificar se está sincronizado com origin
git fetch origin
git status
```

### 1.2 Fazer Push Final (se necessário)
```bash
# Adicionar alterações pendentes
git add .

# Commit final
git commit -m "feat: ready for DigitalOcean deployment"

# Push para main
git push origin main
```

---

## 🌐 Passo 2: Configurar DigitalOcean App Platform

### 2.1 Acessar o Painel DigitalOcean
1. Acesse: https://cloud.digitalocean.com/
2. Faça login na sua conta
3. Navegue para **Apps** no menu lateral

### 2.2 Criar Nova Aplicação
1. Clique em **"Create App"**
2. Selecione **"GitHub"** como fonte
3. Autorize o acesso ao repositório `fisioflow-aistudio`
4. Selecione o branch `main`
5. Marque **"Autodeploy"** para deploys automáticos

### 2.3 Configurar com app.yaml
1. Selecione **"Use existing app spec"**
2. Cole o conteúdo do arquivo `.do/app.yaml`:

```yaml
name: fisioflow
services:
- name: web
  source_dir: /
  github:
    repo: rafaelminatto1/fisioflow-aistudio
    branch: main
  dockerfile_path: Dockerfile
  run_command: npm start
  instance_count: 1
  instance_size_slug: professional-xs
  http_port: 3000
  routes:
  - path: /
  health_check:
    http_path: /api/health
    initial_delay_seconds: 60
    period_seconds: 10
    timeout_seconds: 5
    success_threshold: 1
    failure_threshold: 3
  envs:
  - key: NODE_ENV
    value: production
  - key: NEXT_TELEMETRY_DISABLED
    value: "1"
  - key: PORT
    value: "3000"
  - key: DATABASE_URL
    value: postgresql://doadmin:AVNS_4zgOHhDU6UGzIe8OlTg@fisioflow-production-db-do-user-25633309-0.m.db.ondigitalocean.com:25060/defaultdb?sslmode=require
  - key: NEXTAUTH_SECRET
    value: your-nextauth-secret-here-32-chars-min
  - key: NEXTAUTH_URL
    value: ${APP_URL}
```

---

## 🔐 Passo 3: Configurar Variáveis de Ambiente Sensíveis

### 3.1 Variáveis Obrigatórias

#### NEXTAUTH_SECRET
```bash
# Gerar um secret seguro (32+ caracteres)
openssl rand -base64 32
```
**Exemplo:** `wX9fK2mN8pQ7rS5tU6vY3zA1bC4dE7fH9jK2mN5pQ8r`

#### DATABASE_URL
**Formato:** `postgresql://username:password@host:port/database?sslmode=require`

**Exemplo atual:**
```
postgresql://doadmin:AVNS_4zgOHhDU6UGzIe8OlTg@fisioflow-production-db-do-user-25633309-0.m.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```

### 3.2 Configurar no Painel DigitalOcean

1. **Acesse a aplicação criada**
2. Vá para **"Settings" → "App-Level Environment Variables"**
3. Adicione/edite as variáveis:

| Variável | Valor | Tipo |
|----------|-------|------|
| `NEXTAUTH_SECRET` | `[seu-secret-gerado]` | Encrypted |
| `DATABASE_URL` | `[sua-connection-string]` | Encrypted |
| `NEXTAUTH_URL` | `${APP_URL}` | Plain Text |

### 3.3 Variáveis Opcionais (APIs)

```bash
# Se usar OpenAI
OPENAI_API_KEY=sk-...

# Se usar outros serviços
GOOGLE_API_KEY=...
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## 🚀 Passo 4: Executar Deploy

### 4.1 Iniciar Deploy
1. No painel da aplicação, clique em **"Deploy"**
2. Ou use **"Create"** se for a primeira vez
3. Aguarde o processo de build iniciar

### 4.2 Monitorar Build
```bash
# Via CLI (opcional)
doctl apps list
doctl apps get [APP-ID]
doctl apps logs [APP-ID] --follow
```

### 4.3 Fases do Deploy
1. **Build Phase** (5-10 min)
   - Download do código
   - Build do Docker
   - Instalação de dependências
   - Build da aplicação Next.js

2. **Deploy Phase** (2-5 min)
   - Deploy da imagem
   - Inicialização do container
   - Health checks

---

## 🔍 Passo 5: Verificar Health Checks

### 5.1 Endpoint de Health Check
**URL:** `https://[sua-app].ondigitalocean.app/api/health`

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "database": "connected",
  "version": "1.0.0"
}
```

### 5.2 Configuração do Health Check
```yaml
health_check:
  http_path: /api/health
  initial_delay_seconds: 60    # Aguarda 60s antes do primeiro check
  period_seconds: 10           # Verifica a cada 10s
  timeout_seconds: 5           # Timeout de 5s por request
  success_threshold: 1         # 1 sucesso = healthy
  failure_threshold: 3         # 3 falhas = unhealthy
```

---

## 🌍 Passo 6: Configurar Domínio Personalizado (Opcional)

### 6.1 Adicionar Domínio
1. Vá para **"Settings" → "Domains"**
2. Clique em **"Add Domain"**
3. Digite seu domínio: `fisioflow.com.br`
4. Escolha o tipo:
   - **Primary Domain:** Domínio principal
   - **Alias:** Redirecionamento

### 6.2 Configurar DNS
**No seu provedor de DNS (Registro.br, Cloudflare, etc.):**

```dns
# Registro A
fisioflow.com.br.     A     [IP-DO-DIGITALOCEAN]

# Registro CNAME (alternativo)
www.fisioflow.com.br. CNAME [sua-app].ondigitalocean.app.
```

### 6.3 Aguardar Propagação
- **Tempo:** 5-60 minutos
- **Verificar:** `nslookup fisioflow.com.br`

---

## 🔒 Passo 7: Configurar SSL/HTTPS

### 7.1 SSL Automático
O DigitalOcean App Platform configura SSL automaticamente:
- **Let's Encrypt** para domínios personalizados
- **Certificado gerenciado** para subdomínios `.ondigitalocean.app`

### 7.2 Verificar SSL
```bash
# Testar certificado
curl -I https://fisioflow.com.br

# Verificar detalhes do certificado
openssl s_client -connect fisioflow.com.br:443 -servername fisioflow.com.br
```

### 7.3 Forçar HTTPS
**No Next.js (já configurado):**
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ]
  }
}
```

---

## 📊 Passo 8: Monitoramento e Logs

### 8.1 Acessar Logs
**Via Painel:**
1. Acesse sua aplicação
2. Vá para **"Runtime Logs"**
3. Filtre por tipo: `Error`, `Warning`, `Info`

**Via CLI:**
```bash
# Instalar doctl
snap install doctl
# ou
brew install doctl

# Autenticar
doctl auth init

# Ver logs em tempo real
doctl apps logs [APP-ID] --follow

# Ver logs específicos
doctl apps logs [APP-ID] --type build
doctl apps logs [APP-ID] --type deploy
doctl apps logs [APP-ID] --type run
```

### 8.2 Métricas Importantes
- **CPU Usage:** < 80%
- **Memory Usage:** < 90%
- **Response Time:** < 2s
- **Error Rate:** < 1%
- **Uptime:** > 99.9%

### 8.3 Alertas
1. Vá para **"Insights" → "Alerts"**
2. Configure alertas para:
   - High CPU usage (> 80%)
   - High memory usage (> 90%)
   - High error rate (> 5%)
   - App down

---

## 🔧 Troubleshooting Comum

### 9.1 Build Failures

#### Erro: "npm install failed"
```bash
# Soluções:
1. Verificar package.json
2. Limpar cache: npm cache clean --force
3. Deletar node_modules e package-lock.json
4. Reinstalar: npm install
```

#### Erro: "Prisma generate failed"
```bash
# Verificar:
1. Schema do Prisma está correto
2. DATABASE_URL está configurada
3. Adicionar ao Dockerfile:
RUN npx prisma generate
```

### 9.2 Deploy Failures

#### Erro: "Health check failed"
```bash
# Verificar:
1. Endpoint /api/health existe e responde
2. Aplicação está rodando na porta 3000
3. Aumentar initial_delay_seconds para 120
```

#### Erro: "Port binding failed"
```bash
# Verificar:
1. PORT=3000 nas variáveis de ambiente
2. Aplicação escuta em 0.0.0.0:3000
3. Dockerfile expõe porta 3000
```

### 9.3 Runtime Errors

#### Erro: "Database connection failed"
```bash
# Verificar:
1. DATABASE_URL está correta
2. Database está online
3. Firewall permite conexões
4. SSL está habilitado (?sslmode=require)
```

#### Erro: "NextAuth configuration error"
```bash
# Verificar:
1. NEXTAUTH_SECRET está configurado (32+ chars)
2. NEXTAUTH_URL está correto
3. Providers estão configurados corretamente
```

### 9.4 Performance Issues

#### Aplicação lenta
```bash
# Soluções:
1. Aumentar instance_size_slug para professional-s
2. Otimizar queries do banco
3. Implementar cache Redis
4. Otimizar imagens e assets
```

#### High memory usage
```bash
# Soluções:
1. Verificar memory leaks
2. Otimizar imports
3. Implementar lazy loading
4. Aumentar NODE_OPTIONS="--max-old-space-size=2048"
```

---

## 📋 Checklist Final

### ✅ Pré-Deploy
- [ ] Código commitado e pushed
- [ ] Testes passando
- [ ] Build local funcionando
- [ ] Health check endpoint testado
- [ ] Variáveis de ambiente configuradas

### ✅ Durante Deploy
- [ ] Build phase completou sem erros
- [ ] Deploy phase completou sem erros
- [ ] Health checks passando
- [ ] Aplicação acessível via URL

### ✅ Pós-Deploy
- [ ] SSL/HTTPS funcionando
- [ ] Domínio personalizado (se aplicável)
- [ ] Logs sem erros críticos
- [ ] Performance aceitável
- [ ] Alertas configurados

---

## 🔗 Links Úteis

- **Painel DigitalOcean:** https://cloud.digitalocean.com/apps
- **Documentação App Platform:** https://docs.digitalocean.com/products/app-platform/
- **Status Page:** https://status.digitalocean.com/
- **Suporte:** https://www.digitalocean.com/support/

---

## 📞 Suporte

Em caso de problemas:

1. **Verificar logs** da aplicação
2. **Consultar documentação** oficial
3. **Abrir ticket** no suporte DigitalOcean
4. **Verificar status** dos serviços

---

**🎉 Parabéns! Sua aplicação FisioFlow está agora em produção na DigitalOcean App Platform!**

*Última atualização: Janeiro 2024*