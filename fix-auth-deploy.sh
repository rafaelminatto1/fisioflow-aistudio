#!/bin/bash

# Script para corrigir o problema de autenticação em produção
# Remove dependência do Redis que estava causando erro 500

echo "🔧 Corrigindo problema de autenticação em produção..."
echo "==========================================="

# 1. Verificar se o backup foi criado
if [ -f "lib/auth-backup.ts" ]; then
    echo "✅ Backup do arquivo original criado: lib/auth-backup.ts"
else
    echo "❌ Backup não encontrado. Criando backup..."
    cp lib/auth.ts lib/auth-backup.ts
fi

# 2. Verificar se a versão sem Redis existe
if [ -f "lib/auth-no-redis.ts" ]; then
    echo "✅ Versão sem Redis encontrada: lib/auth-no-redis.ts"
else
    echo "❌ Versão sem Redis não encontrada!"
    exit 1
fi

# 3. Aplicar a correção
echo "🔄 Aplicando correção (removendo dependência do Redis)..."
cp lib/auth-no-redis.ts lib/auth.ts
echo "✅ Arquivo de autenticação atualizado"

# 4. Verificar sintaxe TypeScript
echo "🔍 Verificando sintaxe TypeScript..."
npx tsc --noEmit --skipLibCheck
if [ $? -eq 0 ]; then
    echo "✅ Sintaxe TypeScript válida"
else
    echo "❌ Erro de sintaxe TypeScript. Revertendo..."
    cp lib/auth-backup.ts lib/auth.ts
    exit 1
fi

# 5. Testar build local
echo "🏗️ Testando build local..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build local bem-sucedido"
else
    echo "❌ Erro no build. Revertendo..."
    cp lib/auth-backup.ts lib/auth.ts
    exit 1
fi

# 6. Fazer commit das mudanças
echo "📝 Fazendo commit das correções..."
git add lib/auth.ts lib/auth-no-redis.ts lib/auth-backup.ts
git commit -m "fix: remove Redis dependency from auth to fix 500 error in production

- Created auth version without Redis rate limiting
- Backup original auth.ts as auth-backup.ts
- This fixes the 500 Internal Server Error on /api/auth/session
- Redis can be re-enabled later when properly configured in production"

if [ $? -eq 0 ]; then
    echo "✅ Commit realizado com sucesso"
else
    echo "⚠️ Erro no commit, mas continuando..."
fi

# 7. Push para o repositório (isso vai triggerar o deploy automático)
echo "🚀 Fazendo push para triggerar deploy automático..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Push realizado com sucesso"
    echo "🎉 Deploy automático iniciado no Digital Ocean"
else
    echo "❌ Erro no push"
    exit 1
fi

echo ""
echo "==========================================="
echo "🎯 CORREÇÃO APLICADA COM SUCESSO!"
echo ""
echo "📋 O que foi feito:"
echo "   1. ✅ Backup do arquivo original criado"
echo "   2. ✅ Removida dependência do Redis do sistema de auth"
echo "   3. ✅ Rate limiting temporariamente desabilitado"
echo "   4. ✅ Build local testado e aprovado"
echo "   5. ✅ Commit e push realizados"
echo ""
echo "⏳ Aguarde alguns minutos para o deploy ser concluído."
echo "🔗 Teste o endpoint: https://fisioflow-uaphq.ondigitalocean.app/api/auth/session"
echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "   1. Configurar Redis no Digital Ocean (opcional)"
echo "   2. Re-habilitar rate limiting quando Redis estiver disponível"
echo "   3. Monitorar logs de produção"
echo ""
echo "🔄 Para reverter (se necessário):"
echo "   cp lib/auth-backup.ts lib/auth.ts && git add lib/auth.ts && git commit -m 'revert auth changes' && git push"
echo "==========================================="