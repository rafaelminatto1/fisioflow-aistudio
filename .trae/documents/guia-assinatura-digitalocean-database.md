# Guia Completo: Como Assinar o DigitalOcean Managed Database Basic

## 🎯 Visão Geral

Este guia te ensina como assinar e configurar o **DigitalOcean Managed Database Basic** para o FisioFlow. O plano Basic custa **$15/mês** (\~R$75) e é perfeito para começar com segurança e simplicidade.

### Por que escolher o Managed Database?

* ✅ **Zero manutenção**: DigitalOcean cuida de tudo

* ✅ **Backups automáticos**: 7 dias de point-in-time recovery

* ✅ **Alta disponibilidade**: Failover automático

* ✅ **Segurança**: Criptografia e VPC network

* ✅ **Escalabilidade**: Upgrade sem downtime

***

## 📋 Pré-requisitos

* [ ] Conta no DigitalOcean (se não tem, vamos criar)

* [ ] Cartão de crédito válido

* [ ] Projeto FisioFlow pronto para deploy

***

## 🚀 Passo 1: Criar Conta no DigitalOcean

### Se você já tem conta, pule para o Passo 2

**Acesse**: <https://www.digitalocean.com>

* **Clique em "Sign Up"**

* **Preencha os dados**:

  * Email

  * Senha forte

  * Nome completo

* **Verifique o email** (check sua caixa de entrada)

* **Adicione método de pagamento**:

  * Cartão de crédito OU

  * PayPal

* **Ganhe $200 de crédito** (válido por 60 dias para contas novas)

### 💡 Dica de Ouro

> Use um email profissional. Você receberá alertas importantes sobre o banco de dados.

***

## 🗄️ Passo 2: Criar o Managed Database

### 2.1 Iniciar Criação

1. **Faça login** no DigitalOcean
2. **Clique no botão verde "Create"** (canto superior direito)
3. **Selecione "Databases"** na lista

### 2.2 Configurar o Database

#### **Região (Datacenter)**

* **Recomendado**: `New York 1` ou `San Francisco 2`

* **Por quê**: Menor latência para o Brasil

* ⚠️ **Importante**: Escolha a mesma região do seu App Platform

#### **Engine do Database**

* **Selecione**: `PostgreSQL`

* **Versão**: Deixe a mais recente (padrão)

#### **Configuração da Máquina**

* **Machine Type**: `Basic nodes` (suficiente para começar)

* **Node Plan**: `Basic - $15/mo`

  * 1 vCPU

  * 1 GB RAM

  * 10 GB SSD

  * Perfeito para até 1000 usuários

#### **Standby Nodes**

* **Deixe em 0** (economiza dinheiro)

* Você pode adicionar depois se precisar

#### **Nome do Database**

* **Sugestão**: `fisioflow-production-db`

* **Projeto**: Selecione seu projeto (ou deixe Default)

### 2.3 Finalizar Criação

1. **Revise as configurações**:

   * PostgreSQL

   * Basic $15/mo

   * Região correta
2. **Clique em "Create Database Cluster"**
3. **Aguarde 3-5 minutos** (vai aparecer "Setting up...")

***

## 🔒 Passo 3: Configurar Segurança

### 3.1 Configurar Trusted Sources

Quando o database estiver pronto, você verá o wizard "Getting Started":

1. **Clique em "Get Started"**
2. **Adicionar Trusted Sources**:

   * Se já tem o App Platform rodando: selecione ele na lista

   * Se ainda não tem: clique "Skip for now" (configuramos depois)
3. **Clique em "Allow these inbound sources only"**

### 3.2 Obter Credenciais de Conexão

**IMPORTANTE**: Use sempre as credenciais da **VPC Network** (mais seguro)

1. **Clique na aba "VPC network"**
2. **Anote estas informações**:

   ```
   Host: private-db-postgresql-nyc1-xxxxx.db.ondigitalocean.com
   Port: 25060
   Username: doadmin
   Password: [clique em "show" para ver]
   Database: defaultdb
   ```

### 3.3 String de Conexão Completa

Você receberá algo assim:

```
postgresql://doadmin:senha123@private-db-postgresql-nyc1-xxxxx.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```

***

## 🔗 Passo 4: Conectar com o FisioFlow

### 4.1 Configurar Variáveis de Ambiente

No seu projeto FisioFlow, edite o arquivo `.env.production`:

```env
# Database Configuration
DATABASE_URL="postgresql://doadmin:SUA_SENHA@private-db-postgresql-nyc1-xxxxx.db.ondigitalocean.com:25060/defaultdb?sslmode=require"

# Backup da URL (caso precise)
DIRECT_URL="postgresql://doadmin:SUA_SENHA@private-db-postgresql-nyc1-xxxxx.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
```

### 4.2 Testar Conexão

Antes do deploy, teste localmente:

```bash
# Instalar cliente PostgreSQL (se não tiver)
npm install -g pg

# Testar conexão
psql "postgresql://doadmin:SUA_SENHA@private-db-postgresql-nyc1-xxxxx.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
```

Se conectar com sucesso, verá:

```
defaultdb=>
```

***

## ⚙️ Passo 5: Configurações Iniciais

### 5.1 Executar Migrações do Prisma

Quando fizer o deploy do FisioFlow:

```bash
# No seu projeto local
npx prisma migrate deploy
npx prisma generate
```

### 5.2 Popular Dados Iniciais (Seed)

```bash
npx prisma db seed
```

### 5.3 Verificar Tabelas Criadas

Conecte no database e verifique:

```sql
-- Listar todas as tabelas
\dt

-- Ver estrutura de uma tabela
\d users
```

***

## 📊 Passo 6: Monitoramento e Manutenção

### 6.1 Dashboard do DigitalOcean

Acesse: `Databases > seu-database > Overview`

**Métricas importantes**:

* **CPU Usage**: Mantenha abaixo de 80%

* **Memory Usage**: Mantenha abaixo de 85%

* **Disk Usage**: **CRÍTICO** - mantenha abaixo de 90%

* **Connections**: Monitore picos

### 6.2 Configurar Alertas

1. **Vá em "Settings" > "Alerts"**
2. **Configure alertas para**:

   * Disk usage > 85%

   * CPU > 90%

   * Memory > 90%
3. **Adicione seu email**

### 6.3 Backups Automáticos

✅ **Já configurado automaticamente**:

* Backup diário às 2h da manhã (UTC)

* Retenção de 7 dias

* Point-in-time recovery

**Para restaurar um backup**:

1. Vá em "Backups" no dashboard
2. Escolha a data/hora
3. Clique "Restore"

***

## 🚨 Troubleshooting Comum

### Problema 1: "Connection Refused"

**Causa**: Trusted sources não configuradas

**Solução**:

1. Vá em `Databases > Settings > Trusted Sources`
2. Adicione seu App Platform
3. Aguarde 2-3 minutos

### Problema 2: "SSL Required"

**Causa**: Conexão sem SSL

**Solução**: Sempre use `?sslmode=require` na URL

### Problema 3: "Too Many Connections"

**Causa**: Muitas conexões simultâneas

**Solução**: Configure connection pooling no Prisma:

```javascript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Problema 4: Database Lento

**Diagnóstico**:

1. Check CPU/Memory no dashboard
2. Analise queries lentas em "Insights"

**Soluções**:

* Adicionar índices nas tabelas

* Otimizar queries

* Upgrade do plano se necessário

### Problema 5: Não Consegue Conectar do App Platform

**Checklist**:

* [ ] App e Database na mesma região?

* [ ] App adicionado como trusted source?

* [ ] URL de conexão correta (VPC network)?

* [ ] Variáveis de ambiente configuradas?

***

## 💰 Custos e Billing

### Plano Basic - $15/mês

**Inclui**:

* 1 vCPU dedicado

* 1 GB RAM

* 10 GB SSD storage

* Backups automáticos

* SSL/TLS encryption

* Monitoring e alertas

* Suporte 24/7

### Quando Fazer Upgrade?

**Sinais que precisa de upgrade**:

* CPU constantemente > 80%

* Memory > 85%

* Disk > 90%

* Mais de 50 conexões simultâneas

* Queries ficando lentas

**Próximo plano**: $30/mês (2 vCPU, 2 GB RAM, 25 GB)

### Dicas para Economizar

1. **Monitore o uso**: Configure alertas
2. **Otimize queries**: Use índices apropriados
3. **Cleanup regular**: Delete dados antigos desnecessários
4. **Connection pooling**: Evite conexões desnecessárias

***

## ✅ Checklist Final

Antes de colocar em produção:

* [ ] Database criado e funcionando

* [ ] Trusted sources configuradas

* [ ] Variáveis de ambiente definidas

* [ ] Migrações executadas

* [ ] Seed executado (se aplicável)

* [ ] Conexão testada

* [ ] Alertas configurados

* [ ] Backup verificado

* [ ] App Platform conectado

* [ ] Testes de carga básicos

***

## 🆘 Suporte e Ajuda

### Documentação Oficial

* [DigitalOcean Managed Databases](https://docs.digitalocean.com/products/databases/)

* [PostgreSQL no DigitalOcean](https://docs.digitalocean.com/products/databases/postgresql/)

### Suporte DigitalOcean

* **Chat 24/7**: Disponível no dashboard

* **Tickets**: Para problemas complexos

* **Community**: <https://www.digitalocean.com/community>

### Em Caso de Emergência

1. **Database offline**: Verifique status no dashboard
2. **Dados corrompidos**: Restore do backup mais recente
3. **Performance crítica**: Upgrade temporário do plano
4. **Problemas de conexão**: Verifique trusted sources

***

## 🎉 Próximos Passos

Com o database configurado, você pode:

1. **Fazer deploy do FisioFlow** no App Platform
2. **Configurar domínio personalizado**
3. **Implementar monitoramento avançado**
4. **Configurar CI/CD** para deploys automáticos
5. **Adicionar read replicas** (quando crescer)

***

**🚀 Parabéns! Seu DigitalOcean Managed Database está pronto para produção!**

> **Lembre-se**: Comece pequeno, monitore sempre, e escale conforme a necessidade. O plano Basic é perfeito para começar e você pode fazer upgrade a qualquer momento sem downtime.

