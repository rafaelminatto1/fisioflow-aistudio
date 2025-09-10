# Configuração MCP (Model Context Protocol)

Este documento descreve as configurações dos MCPs (Model Context Protocols) implementados no projeto.

## Provedores Configurados

### Digital Ocean MCP
- **Token API**: Configurado com token fornecido
- **Serviços disponíveis**:
  - Droplets (gerenciamento de VMs)
  - Kubernetes (clusters K8s)
  - Databases (bancos de dados gerenciados)
  - Spaces (armazenamento de objetos)
  - Load Balancers (balanceadores de carga)
  - Networking (VPCs, firewalls)

### Context7 MCP
- **Variável de ambiente**: `CONTEXT7_API_KEY`
- **Serviços disponíveis**:
  - Context Analysis (análise de contexto)
  - Semantic Search (busca semântica)
  - Knowledge Graph (grafo de conhecimento)
  - Context Memory (memória de contexto)

## Arquivos de Configuração

### mcp.config.json
Arquivo principal de configuração contendo:
- Configurações de provedores
- Roteamento de serviços
- Cache e otimizações
- Autenticação e segurança
- Monitoramento e health checks

### .env
Variáveis de ambiente necessárias:
```
MCP_ENABLED=true
MCP_CONFIG_PATH="./mcp.config.json"
CONTEXT7_API_KEY="your-context7-api-key-here"
```

## Verificação da Configuração

Para verificar se as configurações estão corretas:
```bash
node -e "try { const config = require('./mcp.config.json'); console.log('✅ MCP config is valid JSON'); console.log('Configured providers:', Object.keys(config.providers)); } catch(e) { console.error('❌ MCP config error:', e.message); }"
```

## Health Checks

Os seguintes endpoints são monitorados:
- **Digital Ocean**: `https://api.digitalocean.com/v2/account`
- **Context7**: `https://api.context7.com/health`

## Cache e Performance

Configurado cache otimizado para cada serviço:
- Digital Ocean: Cache de 30s para status, 5min para databases
- Context7: Cache de 5min para análises, 30min para grafo de conhecimento

## Segurança

- Tokens armazenados de forma segura
- Autenticação Bearer configurada
- Scopes limitados por provedor
- Auto-refresh habilitado onde suportado