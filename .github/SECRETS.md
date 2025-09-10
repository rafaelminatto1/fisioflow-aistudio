# GitHub Secrets Configuration

Para que o CI/CD pipeline funcione corretamente, você precisa configurar os seguintes secrets no GitHub:

## Secrets Obrigatórios

### Digital Ocean
- `DIGITALOCEAN_ACCESS_TOKEN`: Token de acesso do Digital Ocean
- `DIGITALOCEAN_APP_ID`: ID da aplicação no Digital Ocean (fc4f8558-d183-4d7e-8ea4-347355a20230)

### Database (Neon)
- `NEON_DATABASE_URL`: URL de conexão com o banco Neon
- `NEON_DIRECT_URL`: URL direta do banco Neon
- `NEON_API_KEY`: Chave da API do Neon
- `NEON_PROJECT_ID`: ID do projeto no Neon

### Notificações (Opcional)
- `SLACK_WEBHOOK_URL`: URL do webhook do Slack para notificações

## Como Configurar

1. Acesse o repositório no GitHub
2. Vá em Settings > Secrets and variables > Actions
3. Clique em "New repository secret"
4. Adicione cada secret com o nome exato listado acima

## Environments

O workflow usa dois environments:
- `staging`: Para deploys de pull requests
- `production`: Para deploys da branch main

Configure estes environments em Settings > Environments no GitHub.

## Verificação

Após configurar todos os secrets, o pipeline será executado automaticamente em:
- Push para a branch `main` (deploy para produção)
- Pull requests para a branch `main` (deploy para staging)