# Configuração de Segurança - FisioFlow

## Status Atual da Aplicação
- **App ID**: fc4f8558-d183-4d7e-8ea4-347355a20230
- **URL Principal**: https://fisioflow-uaphq.ondigitalocean.app
- **Status**: Ativo
- **Deployment ID**: eeccb600-4d44-4e12-b392-8227b05d5b5a

## 1. SSL/TLS Configuration

### Status Atual
✅ **SSL/TLS Automático**: Digital Ocean App Platform fornece certificados SSL/TLS automáticos
✅ **HTTPS Redirect**: Redirecionamento automático de HTTP para HTTPS
✅ **TLS 1.2+**: Suporte apenas para versões seguras do TLS

### Verificações Implementadas
- Certificado SSL válido e renovação automática
- Headers de segurança configurados
- HSTS (HTTP Strict Transport Security) habilitado

## 2. Firewall e Proteção de Rede

### Digital Ocean App Platform Security
✅ **DDoS Protection**: Proteção automática contra ataques DDoS
✅ **WAF (Web Application Firewall)**: Filtros automáticos de tráfego malicioso
✅ **Rate Limiting**: Limitação de requisições por IP

### Configurações de Rede
- Tráfego HTTPS apenas (porta 443)
- Bloqueio automático de IPs suspeitos
- Proteção contra ataques de força bruta

## 3. Rate Limiting

### Implementação no Código
```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Muitas requisições, tente novamente em 15 minutos'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // máximo 5 tentativas de login
  skipSuccessfulRequests: true
});
```

### Configurações por Endpoint
- **API Geral**: 100 req/15min por IP
- **Autenticação**: 5 tentativas/15min por IP
- **Upload de arquivos**: 10 req/hora por usuário
- **Relatórios**: 20 req/hora por usuário

## 4. Backup Automático do Banco

### Neon Database Backup
✅ **Backup Automático**: Neon realiza backups automáticos
✅ **Point-in-Time Recovery**: Recuperação para qualquer momento
✅ **Retenção**: 7 dias para plano gratuito, 30 dias para planos pagos

### Backup Manual via CI/CD
```yaml
# Backup antes de cada deploy
- name: Pre-deploy Neon backup
  run: |
    BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
    curl -X POST \
      "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches" \
      -H "Authorization: Bearer $NEON_API_KEY" \
      -d "{\"name\": \"$BACKUP_BRANCH\", \"parent_id\": \"main\"}"
```

## 5. Autenticação e Autorização

### NextAuth.js Security
✅ **JWT Tokens**: Tokens seguros com expiração
✅ **CSRF Protection**: Proteção contra ataques CSRF
✅ **Session Security**: Sessões seguras com cookies httpOnly

### Configurações de Segurança
```javascript
// next-auth.config.js
export const authConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true // HTTPS apenas
      }
    }
  }
};
```

## 6. Headers de Segurança

### Implementação
```javascript
// middleware/security.js
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
});
```

## 7. Validação de Dados

### Sanitização de Input
✅ **Zod Validation**: Validação de esquemas rigorosa
✅ **SQL Injection Protection**: Prisma ORM com prepared statements
✅ **XSS Protection**: Sanitização automática de dados

### Exemplo de Validação
```javascript
// schemas/patient.js
const patientSchema = z.object({
  nome: z.string().min(2).max(100).regex(/^[a-zA-ZÀ-ÿ\s]+$/),
  email: z.string().email(),
  telefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
});
```

## 8. Monitoramento de Segurança

### Logs de Segurança
- Tentativas de login falhadas
- Acessos suspeitos
- Alterações de dados sensíveis
- Uploads de arquivos

### Alertas Configurados
- Múltiplas tentativas de login falhadas
- Acessos de IPs não reconhecidos
- Alterações em dados críticos
- Erros de autenticação

## 9. Compliance e Privacidade

### LGPD Compliance
✅ **Consentimento**: Coleta de consentimento explícito
✅ **Minimização**: Coleta apenas dados necessários
✅ **Transparência**: Política de privacidade clara
✅ **Direitos**: Implementação de direitos do titular

### Dados Sensíveis
- Criptografia de dados em trânsito (HTTPS)
- Criptografia de dados em repouso (Neon)
- Anonimização de logs
- Retenção limitada de dados

## 10. Checklist de Segurança

### ✅ Implementado
- [x] SSL/TLS automático
- [x] Headers de segurança
- [x] Rate limiting
- [x] Backup automático
- [x] Autenticação segura
- [x] Validação de dados
- [x] Proteção DDoS
- [x] Monitoramento básico

### 🔄 Em Progresso
- [ ] Auditoria de logs avançada
- [ ] Testes de penetração
- [ ] Certificação de segurança

### 📋 Próximos Passos
1. Implementar auditoria detalhada
2. Configurar alertas avançados
3. Realizar testes de segurança
4. Documentar procedimentos de incidente

## 11. Contatos de Emergência

### Equipe de Segurança
- **Administrador**: admin@fisioflow.com
- **Suporte Digital Ocean**: Painel de controle
- **Suporte Neon**: Console Neon

### Procedimentos de Incidente
1. Identificar e isolar o problema
2. Notificar a equipe de segurança
3. Documentar o incidente
4. Implementar correções
5. Revisar e melhorar processos

---

**Última atualização**: $(date)
**Status**: Configurações de segurança implementadas e ativas
**Próxima revisão**: Mensal
