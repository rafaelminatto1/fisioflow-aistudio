#!/bin/bash

# Script para configurar headers de segurança no FisioFlow
# Este script cria um arquivo de configuração para o Digital Ocean App Platform

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Configurando headers de segurança para FisioFlow...${NC}"

# Criar arquivo de configuração nginx para headers de segurança
cat > nginx-security.conf << 'EOF'
# Headers de segurança para FisioFlow
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Remover headers que expõem informações do servidor
server_tokens off;
more_clear_headers Server;
more_clear_headers X-Powered-By;
EOF

echo -e "${GREEN}✅ Arquivo nginx-security.conf criado${NC}"

# Criar documentação das configurações
cat > SECURITY-HEADERS.md << 'EOF'
# Configuração de Headers de Segurança - FisioFlow

## Headers Implementados

### X-Content-Type-Options: nosniff
- **Função**: Previne ataques de MIME type sniffing
- **Valor**: `nosniff`
- **Proteção**: Força o navegador a respeitar o Content-Type declarado

### X-Frame-Options: DENY
- **Função**: Previne ataques de clickjacking
- **Valor**: `DENY`
- **Proteção**: Impede que a página seja carregada em frames/iframes

### X-XSS-Protection: 1; mode=block
- **Função**: Ativa proteção XSS do navegador
- **Valor**: `1; mode=block`
- **Proteção**: Bloqueia páginas quando XSS é detectado

### Strict-Transport-Security
- **Função**: Força uso de HTTPS
- **Valor**: `max-age=31536000; includeSubDomains`
- **Proteção**: Previne downgrade attacks e cookie hijacking

### Referrer-Policy
- **Função**: Controla informações de referrer
- **Valor**: `strict-origin-when-cross-origin`
- **Proteção**: Limita vazamento de informações de navegação

### Content-Security-Policy (CSP)
- **Função**: Previne XSS e injeção de código
- **Valor**: Política restritiva personalizada
- **Proteção**: Controla recursos que podem ser carregados

## Verificação

Após aplicar as configurações, todos os headers de segurança devem aparecer como ✅ no relatório de segurança.

## Manutenção

- Execute verificações regulares com o script de segurança
- Monitore logs de segurança no Digital Ocean
- Atualize políticas CSP conforme necessário
EOF

echo -e "${GREEN}✅ Documentação SECURITY-HEADERS.md criada${NC}"

echo -e "\n${BLUE}🎉 Configuração de segurança concluída!${NC}"
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo -e "   1. Configure os headers no Digital Ocean App Platform"
echo -e "   2. Aguarde alguns minutos para aplicação"
echo -e "   3. Teste com: ./scripts/security-check.sh"
echo -e "   4. Leia a documentação em SECURITY-HEADERS.md"