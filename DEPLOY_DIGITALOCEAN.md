# 🚀 Guia de Deploy - FisioFlow no DigitalOcean

Este guia fornece instruções completas para fazer o deploy do FisioFlow na DigitalOcean App Platform.

## 📋 Pré-requisitos

### 1. Conta DigitalOcean
- Crie uma conta em [DigitalOcean](https://www.digitalocean.com/)
- Adicione um método de pagamento
- Gere um Personal Access Token em Account > API

### 2. Ferramentas Necessárias
```bash
# Instalar doctl CLI (macOS)
brew install doctl

# Ou baixar diretamente
curl -OL https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-darwin-amd64.tar.gz
tar xf doctl-1.94.0-darwin-amd64.tar.gz
sudo mv doctl /usr/local/bin
```

### 3. Autenticação
```bash
# Configurar autenticação
doctl auth init
# Cole seu Personal Access Token quando solicitado

# Verificar autenticação
doctl account get
```

## 🔧 Configuração do Projeto

### 1. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.production .env.production.local

# Editar com suas configurações
nano .env.production.local
```

**Variáveis obrigatórias:**
- `DATABASE_URL`: String de conexão PostgreSQL
- `NEXTAUTH_SECRET`: Chave secreta para autenticação (gere com `openssl rand -base64 32`)
- `NEXTAUTH_URL`: URL da sua aplicação (ex: https://fisioflow-xxxxx.ondigitalocean.app)

### 2. Configurar Repositório GitHub

```bash
# Adicionar arquivos ao Git
git add .
git commit -m "feat: configuração para deploy DigitalOcean"
git push origin main
```

### 3. Atualizar Configuração da App

Edite `.do/app.yaml` e substitua:
- `your-github-username/fisioflow-aistudio-1` pelo seu repositório
- `fisioflow.com` pelo seu domínio (opcional)

## 🚀 Deploy Automático

### Opção 1: Script Automatizado (Recomendado)

```bash
# Deploy completo
./deploy.sh

# Ou executar etapas individuais
./deploy.sh check    # Verificar pré-requisitos
./deploy.sh build    # Build e testes
./deploy.sh deploy   # Deploy para DO
./deploy.sh db       # Configurar banco
```

### Opção 2: Deploy Manual

#### 1. Criar Aplicação
```bash
# Criar nova app
doctl apps create --spec .do/app.yaml

# Ou atualizar existente
doctl apps update fisioflow --spec .do/app.yaml
```

#### 2. Configurar Variáveis de Ambiente

**Via CLI:**
```bash
# Listar apps
doctl apps list

# Configurar variáveis (substitua APP_ID)
doctl apps update APP_ID --spec .do/app.yaml
```

**Via Interface Web:**
1. Acesse [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Selecione sua aplicação
3. Vá em Settings > Environment Variables
4. Adicione as variáveis do arquivo `.env.production`

#### 3. Configurar Banco de Dados

```bash
# Executar migrações
npx prisma migrate deploy

# Seed inicial (opcional)
npx prisma db seed
```

## 🗄️ Configuração do Banco de Dados

### 1. Criar Banco PostgreSQL

**Via CLI:**
```bash
# Criar cluster de banco
doctl databases create fisioflow-db \
  --engine pg \
  --version 14 \
  --size db-s-1vcpu-1gb \
  --region nyc3

# Obter string de conexão
doctl databases connection fisioflow-db
```

**Via Interface Web:**
1. Acesse [DigitalOcean Databases](https://cloud.digitalocean.com/databases)
2. Create Database Cluster
3. Escolha PostgreSQL 14
4. Selecione região (preferencialmente mesma da app)
5. Escolha plano (Basic $15/mês para desenvolvimento)

### 2. Configurar Conexão

1. Copie a connection string do banco
2. Adicione como variável `DATABASE_URL` na sua app
3. Configure `DIRECT_URL` com a mesma string

### 3. Executar Migrações

```bash
# Definir DATABASE_URL temporariamente
export DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"

# Executar migrações
npx prisma migrate deploy

# Verificar status
npx prisma migrate status
```

## 🌐 Configuração de Domínio

### 1. Domínio Personalizado

**Via Interface Web:**
1. Vá em Settings > Domains
2. Add Domain
3. Digite seu domínio (ex: fisioflow.com)
4. Configure DNS conforme instruções

**Configuração DNS:**
```
# Adicione estes registros no seu provedor DNS
Tipo: CNAME
Nome: @
Valor: fisioflow-xxxxx.ondigitalocean.app

Tipo: CNAME
Nome: www
Valor: fisioflow-xxxxx.ondigitalocean.app
```

### 2. SSL/TLS

O SSL é configurado automaticamente pela DigitalOcean após a configuração do domínio.

## 🔒 Configurações de Segurança

### 1. Variáveis Sensíveis

- ✅ Use sempre variáveis de ambiente para dados sensíveis
- ✅ Marque variáveis como "Encrypted" na interface
- ❌ Nunca commite chaves API no código

### 2. Headers de Segurança

O arquivo `security.config.js` já inclui:
- HSTS (HTTP Strict Transport Security)
- CSP (Content Security Policy)
- X-Frame-Options
- X-XSS-Protection

### 3. Rate Limiting

Configurado para:
- 100 requests por 15 minutos por IP
- Exceção para health checks

## 📊 Monitoramento

### 1. Health Checks

A aplicação inclui endpoint de health check em `/api/health`

### 2. Logs

```bash
# Ver logs da aplicação
doctl apps logs fisioflow --type run

# Logs de build
doctl apps logs fisioflow --type build

# Logs em tempo real
doctl apps logs fisioflow --follow
```

### 3. Métricas

Acesse métricas em:
- DigitalOcean > Apps > fisioflow > Insights
- CPU, Memória, Requests por minuto
- Alertas automáticos configurados

## 🔄 Atualizações

### Deploy Automático

Configurado para deploy automático quando:
- Push para branch `main`
- Merge de Pull Request

### Deploy Manual

```bash
# Forçar novo deploy
doctl apps create-deployment fisioflow

# Verificar status
doctl apps get fisioflow
```

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Build Falha
```bash
# Verificar logs de build
doctl apps logs fisioflow --type build

# Problemas comuns:
# - Dependências faltando no package.json
# - Erro de TypeScript
# - Variáveis de ambiente faltando
```

#### 2. Aplicação não Inicia
```bash
# Verificar logs de runtime
doctl apps logs fisioflow --type run

# Problemas comuns:
# - DATABASE_URL inválida
# - Porta incorreta (deve ser 3000)
# - Migrações não executadas
```

#### 3. Erro de Conexão com Banco
```bash
# Testar conexão
npx prisma db pull

# Verificar:
# - String de conexão correta
# - Firewall do banco configurado
# - SSL habilitado
```

#### 4. Domínio não Funciona
- Verificar configuração DNS
- Aguardar propagação (até 48h)
- Verificar certificado SSL

### Comandos Úteis

```bash
# Status da aplicação
doctl apps get fisioflow

# Listar deployments
doctl apps list-deployments fisioflow

# Informações do banco
doctl databases get fisioflow-db

# Reiniciar aplicação
doctl apps create-deployment fisioflow
```

## 💰 Custos Estimados

### Configuração Básica
- **App Platform (Basic)**: $5/mês
- **PostgreSQL (Basic)**: $15/mês
- **Total**: ~$20/mês

### Configuração Produção
- **App Platform (Professional)**: $12/mês
- **PostgreSQL (Professional)**: $50/mês
- **CDN**: $1-5/mês
- **Total**: ~$65/mês

## 📞 Suporte

### Recursos
- [Documentação DigitalOcean](https://docs.digitalocean.com/products/app-platform/)
- [Community Forum](https://www.digitalocean.com/community/)
- [Status Page](https://status.digitalocean.com/)

### Contato
- Suporte DigitalOcean: Via ticket no painel
- Documentação do projeto: README.md

---

## ✅ Checklist de Deploy

- [ ] Conta DigitalOcean criada
- [ ] doctl CLI instalado e configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Repositório GitHub atualizado
- [ ] Banco de dados criado
- [ ] Aplicação deployada
- [ ] Migrações executadas
- [ ] Domínio configurado (opcional)
- [ ] SSL ativo
- [ ] Health checks funcionando
- [ ] Logs sendo gerados
- [ ] Monitoramento ativo

**🎉 Parabéns! Seu FisioFlow está rodando na DigitalOcean!**