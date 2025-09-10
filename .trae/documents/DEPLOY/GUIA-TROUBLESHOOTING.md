# Guia de Troubleshooting - FisioFlow

## 🚨 Problemas Comuns e Soluções

### 1. Aplicação Não Responde

#### Sintomas:
- Site não carrega (timeout)
- Erro 502 Bad Gateway
- Erro 503 Service Unavailable

#### Diagnóstico:
```bash
# Verificar status da aplicação
doctl apps get fc4f8558-d183-4d7e-8ea4-347355a20230

# Verificar logs da aplicação
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 --type=run

# Verificar health check
curl -I https://fisioflow-uaphq.ondigitalocean.app/api/health
```

#### Soluções:
1. **Restart da aplicação:**
   ```bash
   doctl apps create-deployment fc4f8558-d183-4d7e-8ea4-347355a20230
   ```

2. **Verificar recursos:**
   - CPU > 80%: Escalar verticalmente
   - Memória > 90%: Aumentar instância
   - Disco > 85%: Limpar logs/cache

3. **Rollback se necessário:**
   ```bash
   # Listar deployments
   doctl apps list-deployments fc4f8558-d183-4d7e-8ea4-347355a20230
   
   # Fazer rollback
   doctl apps create-deployment fc4f8558-d183-4d7e-8ea4-347355a20230 --deployment-id=PREVIOUS_ID
   ```

### 2. Problemas de Banco de Dados

#### Sintomas:
- Erro 500 nas APIs
- "Database connection failed"
- Timeout em queries

#### Diagnóstico:
```bash
# Testar conexão com o banco
psql $DATABASE_URL -c "SELECT 1;"

# Verificar logs do banco no Neon
# Acessar: https://console.neon.tech/

# Verificar variáveis de ambiente
doctl apps get fc4f8558-d183-4d7e-8ea4-347355a20230 --format json | jq '.spec.services[0].envs'
```

#### Soluções:
1. **Verificar conexões ativas:**
   ```sql
   SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
   ```

2. **Reiniciar conexões:**
   ```bash
   # Restart da aplicação para renovar pool de conexões
   doctl apps create-deployment fc4f8558-d183-4d7e-8ea4-347355a20230
   ```

3. **Verificar limites do Neon:**
   - Conexões simultâneas
   - Uso de CPU do banco
   - Storage disponível

### 3. Problemas de Autenticação

#### Sintomas:
- Login não funciona
- Sessões expiram rapidamente
- Erro "Invalid credentials"

#### Diagnóstico:
```bash
# Testar endpoint de auth
curl -X POST https://fisioflow-uaphq.ondigitalocean.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Verificar variáveis de ambiente
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL
```

#### Soluções:
1. **Verificar configuração NextAuth:**
   - NEXTAUTH_SECRET definido
   - NEXTAUTH_URL correto
   - Providers configurados

2. **Limpar sessões:**
   ```sql
   DELETE FROM sessions WHERE expires < NOW();
   ```

### 4. Performance Lenta

#### Sintomas:
- Páginas carregam lentamente
- APIs demoram para responder
- Timeout em operações

#### Diagnóstico:
```bash
# Testar performance
./scripts/monitor-health.sh

# Verificar métricas no Digital Ocean
doctl monitoring alert list

# Testar endpoints específicos
curl -w "@curl-format.txt" -o /dev/null -s https://fisioflow-uaphq.ondigitalocean.app/
```

#### Soluções:
1. **Otimizar queries do banco:**
   ```sql
   -- Verificar queries lentas
   SELECT query, mean_exec_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```

2. **Escalar recursos:**
   - Aumentar CPU/memória
   - Adicionar réplicas
   - Implementar cache

### 5. Problemas de Deploy

#### Sintomas:
- Deploy falha no GitHub Actions
- Aplicação não atualiza
- Erro de build

#### Diagnóstico:
```bash
# Verificar último deploy
doctl apps list-deployments fc4f8558-d183-4d7e-8ea4-347355a20230

# Verificar logs de build
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 --type=build

# Verificar GitHub Actions
# Acessar: https://github.com/seu-usuario/fisioflow/actions
```

#### Soluções:
1. **Re-executar deploy:**
   ```bash
   # Via GitHub Actions
   gh workflow run deploy.yml
   
   # Via doctl
   doctl apps create-deployment fc4f8558-d183-4d7e-8ea4-347355a20230
   ```

2. **Verificar dependências:**
   - package.json atualizado
   - Node.js version compatível
   - Variáveis de ambiente corretas

## 🔧 Comandos Úteis

### Monitoramento
```bash
# Status geral
./scripts/monitor-health.sh

# Verificação de segurança
./scripts/security-check.sh

# Logs em tempo real
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 --follow

# Métricas de performance
doctl monitoring alert list
```

### Manutenção
```bash
# Backup do banco
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Limpeza de logs
doctl apps logs fc4f8558-d183-4d7e-8ea4-347355a20230 --type=run --since=1h

# Verificar espaço em disco
df -h
```

### Emergência
```bash
# Rollback rápido
doctl apps create-deployment fc4f8558-d183-4d7e-8ea4-347355a20230 --deployment-id=LAST_GOOD_ID

# Parar aplicação (emergência)
doctl apps update fc4f8558-d183-4d7e-8ea4-347355a20230 --spec=app-stopped.yaml

# Restaurar backup
psql $DATABASE_URL < backup-YYYYMMDD.sql
```

## 📞 Contatos de Emergência

- **Desenvolvedor Principal**: [seu-email@exemplo.com]
- **Suporte Digital Ocean**: https://cloud.digitalocean.com/support
- **Suporte Neon**: https://console.neon.tech/support
- **Status Pages**:
  - Digital Ocean: https://status.digitalocean.com/
  - Neon: https://neonstatus.com/

## 📋 Checklist de Troubleshooting

- [ ] Verificar status da aplicação
- [ ] Analisar logs de erro
- [ ] Testar conectividade do banco
- [ ] Verificar métricas de performance
- [ ] Confirmar variáveis de ambiente
- [ ] Testar endpoints críticos
- [ ] Verificar recursos disponíveis
- [ ] Considerar rollback se necessário
- [ ] Documentar problema e solução
- [ ] Notificar stakeholders se aplicável

---

**Última atualização**: 10/09/2025
**Versão**: 1.0
**Responsável**: Equipe DevOps FisioFlow