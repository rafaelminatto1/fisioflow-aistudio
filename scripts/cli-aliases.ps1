
# FisioFlow CLI Aliases para PowerShell
# Execute: . .\scripts\cli-aliases.ps1

# Railway
Set-Alias -Name rw -Value railway
Set-Alias -Name rw-deploy -Value "railway up"
Set-Alias -Name rw-logs -Value "railway logs --follow"
Set-Alias -Name rw-status -Value "railway status"

# Neon DB
Set-Alias -Name neon -Value "npx @neondatabase/cli"
Set-Alias -Name neon-status -Value "npx @neondatabase/cli status"

# Prisma
Set-Alias -Name pr -Value "npx prisma"
Set-Alias -Name pr-studio -Value "npx prisma studio"
Set-Alias -Name pr-migrate -Value "npx prisma migrate dev"
Set-Alias -Name pr-reset -Value "npx prisma migrate reset --force"

# Docker
Set-Alias -Name d -Value docker
Set-Alias -Name dc -Value docker-compose

# Utilitários
Set-Alias -Name ff-dev -Value "npm run dev"
Set-Alias -Name ff-build -Value "npm run build"
Set-Alias -Name ff-test -Value "npm run test"
Set-Alias -Name ff-deploy -Value "npm run railway:deploy"

Write-Host "🚂 FisioFlow CLI Aliases carregados!" -ForegroundColor Green
Write-Host "Use 'Get-Alias | Where-Object {$_.Name -like "ff-*"}' para ver todos os aliases" -ForegroundColor Yellow
