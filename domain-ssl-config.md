# 🌐 Configuração de Domínio e SSL - FisioFlow

Guia para configurar domínio personalizado e certificado SSL no DigitalOcean App Platform.

## 📋 Pré-requisitos

- Aplicação deployada na DigitalOcean App Platform
- Domínio registrado (ex: fisioflow.com)
- Acesso ao painel DNS do seu provedor

## 🔧 Configuração do Domínio

### 1. Via Interface Web (Recomendado)

1. **Acesse o App Platform**
   - Vá para [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
   - Selecione sua aplicação FisioFlow

2. **Adicionar Domínio**
   - Clique na aba "Settings"
   - Vá para "Domains"
   - Clique em "Add Domain"

3. **Configurar Domínio**
   - Digite seu domínio: `fisioflow.com`
   - Marque "Redirect www to non-www" (opcional)
   - Clique em "Add Domain"

### 2. Via CLI

```bash
# Listar aplicações
doctl apps list

# Obter ID da aplicação
APP_ID=$(doctl apps list --format ID,Spec.Name --no-header | grep fisioflow | awk '{print $1}')

# Adicionar domínio
doctl apps update $APP_ID --spec .do/app.yaml
```

## 🔒 Configuração DNS

### Registros DNS Necessários

Adicione os seguintes registros no seu provedor DNS:

#### Para Domínio Principal (fisioflow.com)
```
Tipo: CNAME
Nome: @
Valor: fisioflow-xxxxx.ondigitalocean.app
TTL: 3600
```

#### Para Subdomínio WWW (www.fisioflow.com)
```
Tipo: CNAME
Nome: www
Valor: fisioflow-xxxxx.ondigitalocean.app
TTL: 3600
```

#### Para Subdomínios Adicionais (Opcional)
```
# API
Tipo: CNAME
Nome: api
Valor: fisioflow-xxxxx.ondigitalocean.app
TTL: 3600

# Admin
Tipo: CNAME
Nome: admin
Valor: fisioflow-xxxxx.ondigitalocean.app
TTL: 3600
```

### Provedores DNS Populares

#### Cloudflare
1. Acesse o painel Cloudflare
2. Selecione seu domínio
3. Vá em "DNS" > "Records"
4. Adicione os registros CNAME
5. Certifique-se que o proxy está **desabilitado** (nuvem cinza)

#### Namecheap
1. Acesse o painel Namecheap
2. Vá em "Domain List" > "Manage"
3. Clique em "Advanced DNS"
4. Adicione os registros CNAME

#### GoDaddy
1. Acesse o painel GoDaddy
2. Vá em "My Products" > "DNS"
3. Adicione os registros CNAME

#### Route 53 (AWS)
```bash
# Exemplo usando AWS CLI
aws route53 change-resource-record-sets --hosted-zone-id Z123456789 --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "fisioflow.com",
      "Type": "CNAME",
      "TTL": 3600,
      "ResourceRecords": [{"Value": "fisioflow-xxxxx.ondigitalocean.app"}]
    }
  }]
}'
```

## 🔐 Certificado SSL

### Configuração Automática

O DigitalOcean App Platform configura SSL automaticamente:

1. **Após adicionar o domínio**
   - O certificado SSL é solicitado automaticamente
   - Processo leva de 5-15 minutos
   - Status visível na interface

2. **Verificação**
   - Vá em Settings > Domains
   - Status deve mostrar "Active" com ícone de cadeado

### Verificação Manual

```bash
# Verificar certificado SSL
curl -I https://fisioflow.com

# Verificar detalhes do certificado
openssl s_client -connect fisioflow.com:443 -servername fisioflow.com

# Verificar expiração
echo | openssl s_client -connect fisioflow.com:443 2>/dev/null | openssl x509 -noout -dates
```

## 🔄 Redirecionamentos

### HTTP para HTTPS

Configurado automaticamente pelo App Platform.

### WWW para Non-WWW (ou vice-versa)

Configuração no arquivo `.do/app.yaml`:

```yaml
domains:
- domain: fisioflow.com
  type: PRIMARY
- domain: www.fisioflow.com
  type: ALIAS
```

### Redirecionamentos Personalizados

Adicione no `next.config.js`:

```javascript
module.exports = {
  async redirects() {
    return [
      {
        source: '/old-page',
        destination: '/new-page',
        permanent: true,
      },
      {
        source: '/blog/:slug*',
        destination: '/articles/:slug*',
        permanent: true,
      },
    ]
  },
}
```

## 🧪 Testes

### Verificar Configuração

```bash
# Testar resolução DNS
nslookup fisioflow.com
dig fisioflow.com CNAME

# Testar HTTPS
curl -I https://fisioflow.com

# Testar redirecionamento HTTP -> HTTPS
curl -I http://fisioflow.com

# Testar redirecionamento WWW
curl -I https://www.fisioflow.com
```

### Ferramentas Online

- [DNS Checker](https://dnschecker.org/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [What's My DNS](https://www.whatsmydns.net/)
- [SSL Shopper](https://www.sslshopper.com/ssl-checker.html)

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. DNS não Resolve
```bash
# Verificar propagação DNS
dig fisioflow.com @8.8.8.8
dig fisioflow.com @1.1.1.1

# Limpar cache DNS local
sudo dscacheutil -flushcache
```

**Soluções:**
- Aguardar propagação (até 48h)
- Verificar registros DNS no provedor
- Confirmar TTL baixo durante mudanças

#### 2. Certificado SSL não Funciona

**Sintomas:**
- Erro "Certificate not valid"
- Aviso de segurança no navegador

**Soluções:**
- Aguardar emissão do certificado (5-15 min)
- Verificar se DNS está resolvendo corretamente
- Remover e readicionar domínio no App Platform

#### 3. Redirecionamento não Funciona

**Verificar:**
- Configuração no `.do/app.yaml`
- Cache do navegador
- CDN/Proxy (Cloudflare)

#### 4. Subdomínio não Funciona

**Verificar:**
- Registro CNAME para subdomínio
- Configuração no App Platform
- Wildcard certificate (se necessário)

### Logs e Monitoramento

```bash
# Logs da aplicação
doctl apps logs fisioflow --type run

# Status da aplicação
doctl apps get fisioflow

# Verificar domínios configurados
doctl apps get fisioflow --format Spec.Domains
```

## 📊 Monitoramento

### Alertas Recomendados

1. **Expiração de Certificado**
   - Configurar alerta 30 dias antes
   - DigitalOcean renova automaticamente

2. **Disponibilidade do Domínio**
   - Monitor HTTP/HTTPS
   - Verificação a cada 5 minutos

3. **Tempo de Resposta**
   - Alerta se > 2 segundos
   - Monitor de diferentes regiões

### Ferramentas de Monitoramento

- **UptimeRobot**: Monitor gratuito
- **Pingdom**: Monitor profissional
- **StatusCake**: Monitor com múltiplas localizações
- **New Relic**: APM completo

## 🔧 Configurações Avançadas

### CDN (Content Delivery Network)

```yaml
# .do/app.yaml
static_sites:
- name: fisioflow-static
  source_dir: /out
  github:
    repo: your-username/fisioflow
    branch: main
  routes:
  - path: /static
```

### Headers de Segurança

Já configurados em `security.config.js`:

- HSTS (HTTP Strict Transport Security)
- CSP (Content Security Policy)
- X-Frame-Options
- X-Content-Type-Options

### Cache Headers

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

## ✅ Checklist de Configuração

### DNS
- [ ] Registro CNAME para domínio principal
- [ ] Registro CNAME para www
- [ ] Registros para subdomínios (se necessário)
- [ ] TTL configurado adequadamente
- [ ] Propagação DNS verificada

### App Platform
- [ ] Domínio adicionado na interface
- [ ] Certificado SSL ativo
- [ ] Redirecionamentos configurados
- [ ] Health checks funcionando

### Testes
- [ ] HTTPS funcionando
- [ ] Redirecionamento HTTP -> HTTPS
- [ ] Redirecionamento WWW (se configurado)
- [ ] Subdomínios funcionando
- [ ] Certificado SSL válido

### Monitoramento
- [ ] Monitor de uptime configurado
- [ ] Alertas de certificado
- [ ] Logs sendo coletados
- [ ] Métricas de performance

---

## 🎯 Próximos Passos

1. **Configurar DNS** nos seus provedores
2. **Adicionar domínio** no App Platform
3. **Aguardar propagação** (até 48h)
4. **Verificar SSL** e redirecionamentos
5. **Configurar monitoramento**
6. **Testar em produção**

**🌐 Seu FisioFlow estará acessível em https://fisioflow.com!**