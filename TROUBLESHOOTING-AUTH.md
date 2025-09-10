# 🔧 GUIA DE TROUBLESHOOTING - AUTENTICAÇÃO NEXTAUTH

## 🚨 Problema Atual: 500 Internal Server Error em /api/auth/session

### 📋 PASSOS PARA DIAGNÓSTICO

#### **1. Executar Diagnóstico Automático**
```bash
# Após o deploy, acesse:
curl https://fisioflow-uaphq.ondigitalocean.app/api/auth/debug

# Ou via browser:
https://fisioflow-uaphq.ondigitalocean.app/api/auth/debug
```

#### **2. Verificar Variáveis de Ambiente no DigitalOcean**
Acesse: DigitalOcean App Platform → Settings → Environment Variables

**OBRIGATÓRIAS:**
```bash
NEXTAUTH_SECRET=sua_chave_de_32_caracteres_ou_mais
NEXTAUTH_URL=https://fisioflow-uaphq.ondigitalocean.app
DATABASE_URL=postgresql://user:pass@host:25060/db?sslmode=require
```

**Gerar NEXTAUTH_SECRET:**
```bash
# Execute no terminal:
openssl rand -base64 32

# Ou online:
https://generate-secret.vercel.app/32
```

#### **3. Principais Causas e Soluções**

| **Erro** | **Causa** | **Solução** |
|---|---|---|
| `Missing NEXTAUTH_SECRET` | Variável não configurada | Adicionar chave de 32+ chars |
| `Invalid NEXTAUTH_URL` | URL não bate com domínio | Usar URL exata do app |
| `Database connection failed` | BD não conecta | Verificar DATABASE_URL |
| `PrismaAdapter error` | Tabelas não existem | Executar `prisma db push` |
| `NextAuth v5 beta issues` | Versão instável | Considerar downgrade |

#### **4. Comandos de Verificação Rápida**

**Verificar build local:**
```bash
npm run build
npm run start
# Acessar: http://localhost:3000/api/auth/debug
```

**Verificar conexão de banco:**
```bash
npx prisma db pull
npx prisma generate
```

**Verificar usuários existentes:**
```bash
npx prisma studio
# Navegar para tabela 'User'
```

#### **5. Logs de Debug**

**No DigitalOcean:**
1. Vá para Runtime Logs
2. Procure por mensagens `[AUTH]` e `[DEBUG]`
3. Identifique linha do erro específico

**Logs importantes:**
```
[AUTH] Starting authorization process ✅
[DEBUG] Database connected ✅
[AUTH] NextAuth handlers imported ✅
```

### 🛠️ SOLUÇÕES POR CENÁRIO

#### **Cenário A: Variáveis de Ambiente**
```bash
# Se NEXTAUTH_SECRET estiver faltando ou < 32 chars:
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Se NEXTAUTH_URL estiver incorreta:
NEXTAUTH_URL=https://fisioflow-uaphq.ondigitalocean.app
```

#### **Cenário B: Banco de Dados**
```bash
# Se DATABASE_URL estiver incorreta:
# Verificar formato: postgresql://user:pass@host:port/db?sslmode=require
# Adicionar timeout: ?connect_timeout=30&pool_timeout=30
```

#### **Cenário C: NextAuth v5 Beta**
Se o diagnóstico mostrar erro no NextAuth, considere:

1. **Usar versão simplificada:**
   ```bash
   # Alterar import em app/api/auth/[...nextauth]/route.ts:
   # DE: import { handlers } from '@/lib/auth';
   # PARA: import { handlers } from '@/lib/auth-simple';
   ```

2. **Downgrade para NextAuth v4 (última opção):**
   ```bash
   npm install next-auth@4
   ```

### 📊 CHECKLIST DE VALIDAÇÃO

- [ ] **NEXTAUTH_SECRET** existe e tem 32+ caracteres
- [ ] **NEXTAUTH_URL** bate exatamente com a URL do app
- [ ] **DATABASE_URL** conecta (testado com Prisma)
- [ ] **Prisma Client** gerado (`npm run prebuild`)
- [ ] **Tabelas de auth** existem no banco
- [ ] **Ao menos 1 usuário** existe na tabela User
- [ ] **Endpoint de debug** retorna `"ready": true`

### 🎯 RESOLUÇÃO RÁPIDA (EMERGENCIAL)

Se nada funcionar, implementar login temporário sem NextAuth:

1. **Criar login manual** com session no localStorage
2. **Usar JWT simples** com verificação no servidor
3. **Implementar** após resolver problema do NextAuth

### 📞 SUPORTE

**Diagnóstico completo:**
```bash
https://fisioflow-uaphq.ondigitalocean.app/api/auth/debug
https://fisioflow-uaphq.ondigitalocean.app/api/auth/test
https://fisioflow-uaphq.ondigitalocean.app/api/health
```

**Status do sistema:**
- ✅ Módulo Financeiro: 98% completo
- 🔧 Sistema de Auth: Em correção
- 🚀 Deploy: Automático via GitHub

---

**📝 Última atualização:** Deploy com ferramentas de debugging implementadas. Execute o diagnóstico para identificar a causa exata.