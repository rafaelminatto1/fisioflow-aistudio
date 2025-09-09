# Deploy FisioFlow no DigitalOcean App Platform

## 📋 Checklist Pré-Deploy

### ✅ Preparação do Projeto

* [ ] Código commitado no GitHub/GitLab

* [ ] Dockerfile otimizado para DigitalOcean

* [ ] Variáveis de ambiente configuradas (.env.production.example)

* [ ] Dependências verificadas no package.json

* [ ] Build local testado com sucesso

* [ ] Testes passando

### ✅ Configuração DigitalOcean

* [ ] Conta DigitalOcean criada

* [ ] Plano Professional ($25/mês) selecionado

* [ ] Database Basic ($15/mês) configurado

* [ ] Domínio personalizado configurado (opcional)

* [ ] SSL/TLS habilitado

## 🚀 Planos Recomendados

### App Platform - Professional Plan ($25/mês)

* **vCPUs**: 1 vCPU dedicado

* **RAM**: 2 GB

* **Bandwidth**: 1 TB

* **Build Minutes**: 400 min/mês

* **Concurrent Builds**: 2

* **Custom Domains**: Ilimitados

* **SSL**: Automático

* **Rollbacks**: Sim

* **Alerts**: Sim

### Managed Database - Basic Plan ($15/mês)

* **PostgreSQL**: 14+

* **RAM**: 1 GB

* **vCPUs**: 1 vCPU dedicado

* **Storage**: 10 GB SSD

* **Connections**: 22 simultâneas

* **Backups**: Diários (7 dias)

* **High Availability**: Não (upgrade para $30/mês)

**Total Mensal**: $40 USD (\~R$240/mês)

## 📝 Passo a Passo do Deploy

### 1. Preparar Repositório

```bash
# Verificar se está tudo commitado
git status
git add .
git commit -m "feat: prepare for DigitalOcean deployment"
git push origin main
```

### 2. Criar App no DigitalOcean

1. Acesse [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Clique em "Create App"
3. Conecte seu repositório GitHub/GitLab
4. Selecione o repositório `fisioflow-aistudio`
5. Configure:

   * **Branch**: main

   * **Source Directory**: / (raiz)

   * **Autodeploy**: Habilitado

### 3. Configurar Build Settings

```yaml
# App Spec (será gerado automaticamente)
name: fisioflow
services:
- name: web
  source_dir: /
  github:
    repo: seu-usuario/fisioflow-aistudio
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: professional-xs
  routes:
  - path: /
  health_check:
    http_path: /api/health
```

### 4. Configurar Database

1. No painel DigitalOcean, vá em "Databases"
2. Clique "Create Database Cluster"
3. Selecione:

   * **Engine**: PostgreSQL 14+

   * **Plan**: Basic ($15/mês)

   * **Region**: New York (nyc1)

   * **Name**: fisioflow-db

### 5. Configurar Variáveis de Ambiente

No App Platform, adicione as seguintes variáveis:

```bash
# Ambiente
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Database (obtido do DigitalOcean Database)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
DIRECT_URL=postgresql://username:password@host:port/database?sslmode=require

# NextAuth
NEXTAUTH_URL=https://seu-app.ondigitalocean.app
NEXTAUTH_SECRET=seu-secret-super-seguro-aqui

# Outras variáveis conforme .env.production.example
```

### 6. Deploy e Verificação

1. Clique "Create Resources"
2. Aguarde o build (5-10 minutos)
3. Verifique logs em tempo real
4. Teste a aplicação no URL fornecido

## 🔧 Configurações Avançadas

### Custom Domain

1. No App Settings, vá em "Domains"
2. Adicione seu domínio personalizado
3. Configure DNS:

   ```
   Type: CNAME
   Name: www (ou @)
   Value: seu-app.ondigitalocean.app
   ```

### SSL/TLS

* SSL é automático para domínios .ondigitalocean.app

* Para domínios personalizados, o certificado é gerado automaticamente

### Scaling

```yaml
# Para escalar horizontalmente
instance_count: 2  # Aumentar conforme necessidade

# Para escalar verticalmente
instance_size_slug: professional-s  # $50/mês por instância
```

## 📊 Monitoramento

### Métricas Disponíveis

* CPU Usage

* Memory Usage

* Request Rate

* Response Time

* Error Rate

### Alerts Recomendados

```yaml
# CPU > 80% por 5 minutos
# Memory > 85% por 5 minutos
# Error Rate > 5% por 2 minutos
# Response Time > 2s por 3 minutos
```

## 🔄 CI/CD Pipeline

### Auto-Deploy

* Push para `main` → Deploy automático

* Pull Request → Preview deployment

* Rollback com 1 clique

### Build Optimization

```dockerfile
# Já configurado no Dockerfile
# Build cache otimizado
# Multi-stage build
# Dependências em camadas
```

## 💾 Backup Strategy

### Database Backups

* **Automático**: Diário (7 dias de retenção)

* **Manual**: Sob demanda via painel

* **Restore**: Point-in-time recovery

### Application Backups

* **Code**: Git repository

* **Assets**: DigitalOcean Spaces (se configurado)

* **Logs**: 7 dias de retenção

## 🚨 Troubleshooting

### Build Failures

```bash
# Verificar logs de build
# Comum: dependências faltando
npm ci --production

# Verificar Dockerfile
docker build -t fisioflow .
docker run -p 3000:3000 fisioflow
```

### Runtime Errors

```bash
# Verificar logs da aplicação
# Comum: variáveis de ambiente
# Verificar DATABASE_URL
# Verificar NEXTAUTH_SECRET
```

### Performance Issues

```bash
# Verificar métricas
# Considerar upgrade de plano
# Otimizar queries do banco
# Implementar cache Redis
```

## 📞 Suporte

### DigitalOcean Support

* **Professional Plan**: Ticket support

* **Business Plan**: Priority support

* **Documentação**: [docs.digitalocean.com](https://docs.digitalocean.com)

### Recursos Úteis

* [App Platform Docs](https://docs.digitalocean.com/products/app-platform/)

* [Database Docs](https://docs.digitalocean.com/products/databases/)

* [Community Forum](https://www.digitalocean.com/community)

***

**Próximos Passos**: Após o deploy, configure monitoramento, backups e considere implementar Redis para cache e sessões.
