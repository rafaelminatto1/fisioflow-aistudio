#!/usr/bin/env pwsh

# 🚂 FisioFlow - Railway CLI Setup Script
# Script para instalação e configuração inicial do Railway CLI

param(
    [string]$ProjectName = "fisioflow",
    [switch]$SkipInstall,
    [switch]$Force,
    [switch]$Help
)

# Cores para output
$Colors = @{
    Reset = "`e[0m"
    Red = "`e[31m"
    Green = "`e[32m"
    Yellow = "`e[33m"
    Blue = "`e[34m"
    Magenta = "`e[35m"
    Cyan = "`e[36m"
}

# Função para log colorido
function Write-ColorLog {
    param(
        [string]$Message,
        [string]$Color = "Reset"
    )
    Write-Host "$($Colors[$Color])$Message$($Colors.Reset)"
}

# Função para verificar se comando existe
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Função para executar comando com tratamento de erro
function Invoke-SafeCommand {
    param(
        [string]$Command,
        [string]$ErrorMessage = "Falha ao executar comando",
        [switch]$Silent
    )
    
    try {
        if ($Silent) {
            $result = Invoke-Expression $Command 2>$null
        } else {
            $result = Invoke-Expression $Command
        }
        return @{ Success = $true; Output = $result }
    }
    catch {
        Write-ColorLog "❌ $ErrorMessage`: $($_.Exception.Message)" "Red"
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# Mostrar ajuda
function Show-Help {
    Write-ColorLog "🚂 FisioFlow - Railway CLI Setup" "Magenta"
    Write-ColorLog "================================" "Magenta"
    Write-Host ""
    Write-ColorLog "USAGE:" "Yellow"
    Write-Host "  .\scripts\railway-setup.ps1 [OPTIONS]"
    Write-Host ""
    Write-ColorLog "OPTIONS:" "Yellow"
    Write-Host "  -ProjectName <name>    Nome do projeto (padrão: fisioflow)"
    Write-Host "  -SkipInstall          Pular instalação do Railway CLI"
    Write-Host "  -Force                Forçar reinstalação"
    Write-Host "  -Help                 Mostrar esta ajuda"
    Write-Host ""
    Write-ColorLog "EXAMPLES:" "Yellow"
    Write-Host "  .\scripts\railway-setup.ps1"
    Write-Host "  .\scripts\railway-setup.ps1 -ProjectName meu-projeto"
    Write-Host "  .\scripts\railway-setup.ps1 -SkipInstall"
    exit 0
}

# Verificar pré-requisitos
function Test-Prerequisites {
    Write-ColorLog "🔍 Verificando pré-requisitos..." "Blue"
    
    $prerequisites = @(
        @{ Name = "Node.js"; Command = "node"; Version = "node --version" },
        @{ Name = "npm"; Command = "npm"; Version = "npm --version" },
        @{ Name = "Git"; Command = "git"; Version = "git --version" }
    )
    
    $allGood = $true
    
    foreach ($prereq in $prerequisites) {
        if (Test-Command $prereq.Command) {
            $version = (Invoke-SafeCommand $prereq.Version -Silent).Output
            Write-ColorLog "✅ $($prereq.Name): $version" "Green"
        } else {
            Write-ColorLog "❌ $($prereq.Name) não encontrado" "Red"
            $allGood = $false
        }
    }
    
    if (-not $allGood) {
        Write-ColorLog "❌ Alguns pré-requisitos não foram atendidos" "Red"
        Write-ColorLog "💡 Instale Node.js, npm e Git antes de continuar" "Yellow"
        exit 1
    }
    
    Write-ColorLog "✅ Todos os pré-requisitos atendidos!" "Green"
}

# Instalar Railway CLI
function Install-RailwayCLI {
    if ($SkipInstall) {
        Write-ColorLog "⏭️  Pulando instalação do Railway CLI" "Yellow"
        return
    }
    
    Write-ColorLog "📦 Verificando Railway CLI..." "Blue"
    
    $railwayInstalled = Test-Command "railway"
    
    if ($railwayInstalled -and -not $Force) {
        $version = (Invoke-SafeCommand "railway --version" -Silent).Output
        Write-ColorLog "✅ Railway CLI já instalado: $version" "Green"
        return
    }
    
    if ($Force -and $railwayInstalled) {
        Write-ColorLog "🔄 Forçando reinstalação do Railway CLI..." "Yellow"
    } else {
        Write-ColorLog "📦 Instalando Railway CLI..." "Yellow"
    }
    
    $installResult = Invoke-SafeCommand "npm install -g @railway/cli" "Falha ao instalar Railway CLI"
    
    if (-not $installResult.Success) {
        Write-ColorLog "❌ Falha na instalação do Railway CLI" "Red"
        Write-ColorLog "💡 Tente executar como administrador ou usar yarn" "Yellow"
        exit 1
    }
    
    # Verificar instalação
    if (Test-Command "railway") {
        $version = (Invoke-SafeCommand "railway --version" -Silent).Output
        Write-ColorLog "✅ Railway CLI instalado com sucesso: $version" "Green"
    } else {
        Write-ColorLog "❌ Railway CLI não foi instalado corretamente" "Red"
        exit 1
    }
}

# Configurar Railway CLI
function Initialize-Railway {
    Write-ColorLog "🔐 Configurando Railway CLI..." "Blue"
    
    # Verificar se já está logado
    $whoamiResult = Invoke-SafeCommand "railway whoami" -Silent
    
    if ($whoamiResult.Success) {
        Write-ColorLog "✅ Já logado no Railway: $($whoamiResult.Output)" "Green"
    } else {
        Write-ColorLog "🔑 Fazendo login no Railway..." "Yellow"
        Write-ColorLog "💡 Uma janela do browser será aberta para login" "Cyan"
        
        $loginResult = Invoke-SafeCommand "railway login" "Falha no login do Railway"
        
        if (-not $loginResult.Success) {
            Write-ColorLog "❌ Falha no login do Railway" "Red"
            exit 1
        }
        
        Write-ColorLog "✅ Login realizado com sucesso!" "Green"
    }
}

# Configurar projeto
function Setup-Project {
    Write-ColorLog "🚂 Configurando projeto Railway..." "Blue"
    
    # Verificar se já existe um projeto linkado
    $statusResult = Invoke-SafeCommand "railway status" -Silent
    
    if ($statusResult.Success -and $statusResult.Output -notmatch "not linked") {
        Write-ColorLog "✅ Projeto já linkado!" "Green"
        return
    }
    
    Write-ColorLog "🔗 Configurando projeto: $ProjectName" "Yellow"
    
    # Listar projetos existentes
    $projectsResult = Invoke-SafeCommand "railway projects" -Silent
    
    if ($projectsResult.Success -and $projectsResult.Output -match $ProjectName) {
        Write-ColorLog "🔗 Linkando ao projeto existente: $ProjectName" "Yellow"
        $linkResult = Invoke-SafeCommand "railway link $ProjectName" "Falha ao linkar projeto"
        
        if (-not $linkResult.Success) {
            Write-ColorLog "❌ Falha ao linkar projeto existente" "Red"
            exit 1
        }
    } else {
        Write-ColorLog "🆕 Criando novo projeto: $ProjectName" "Yellow"
        $initResult = Invoke-SafeCommand "railway init $ProjectName" "Falha ao criar projeto"
        
        if (-not $initResult.Success) {
            Write-ColorLog "❌ Falha ao criar projeto" "Red"
            exit 1
        }
    }
    
    Write-ColorLog "✅ Projeto configurado com sucesso!" "Green"
}

# Configurar variáveis de ambiente básicas
function Setup-EnvironmentVariables {
    Write-ColorLog "🔧 Configurando variáveis de ambiente básicas..." "Blue"
    
    $basicVars = @{
        "NODE_ENV" = "production"
        "RAILWAY_STRUCTURED_LOGGING" = "true"
        "RAILWAY_METRICS_ENABLED" = "true"
        "HEALTH_CHECK_ENABLED" = "true"
    }
    
    foreach ($var in $basicVars.GetEnumerator()) {
        $setResult = Invoke-SafeCommand "railway variables set $($var.Key)=$($var.Value)" -Silent
        
        if ($setResult.Success) {
            Write-ColorLog "✅ $($var.Key) configurado" "Green"
        } else {
            Write-ColorLog "⚠️  Falha ao configurar $($var.Key)" "Yellow"
        }
    }
    
    Write-ColorLog "💡 Configure as variáveis específicas do projeto:" "Cyan"
    Write-ColorLog "   railway variables set DATABASE_URL=<sua-url-neon>" "Cyan"
    Write-ColorLog "   railway variables set NEXTAUTH_SECRET=<seu-secret>" "Cyan"
    Write-ColorLog "   railway variables set NEXTAUTH_URL=<sua-url-app>" "Cyan"
}

# Criar arquivos de configuração
function Create-ConfigFiles {
    Write-ColorLog "📄 Criando arquivos de configuração..." "Blue"
    
    # Criar .railwayignore se não existir
    $railwayIgnorePath = ".railwayignore"
    if (-not (Test-Path $railwayIgnorePath)) {
        $railwayIgnoreContent = @"
# Railway ignore file
.env
.env.local
.env.*.local
node_modules/
.next/
.git/
*.log
.DS_Store
Thumbs.db
"@
        Set-Content -Path $railwayIgnorePath -Value $railwayIgnoreContent
        Write-ColorLog "✅ .railwayignore criado" "Green"
    }
    
    # Criar railway.json se não existir
    $railwayJsonPath = "railway.json"
    if (-not (Test-Path $railwayJsonPath)) {
        $railwayJsonContent = @"
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 3
  }
}
"@
        Set-Content -Path $railwayJsonPath -Value $railwayJsonContent
        Write-ColorLog "✅ railway.json criado" "Green"
    }
}

# Verificar configuração final
function Test-Configuration {
    Write-ColorLog "🔍 Verificando configuração final..." "Blue"
    
    $checks = @(
        @{ Name = "Railway CLI"; Command = "railway --version" },
        @{ Name = "Login Railway"; Command = "railway whoami" },
        @{ Name = "Status do projeto"; Command = "railway status" },
        @{ Name = "Variáveis de ambiente"; Command = "railway variables" }
    )
    
    $allPassed = $true
    
    foreach ($check in $checks) {
        $result = Invoke-SafeCommand $check.Command -Silent
        
        if ($result.Success) {
            Write-ColorLog "✅ $($check.Name): OK" "Green"
        } else {
            Write-ColorLog "❌ $($check.Name): Falha" "Red"
            $allPassed = $false
        }
    }
    
    if ($allPassed) {
        Write-ColorLog "🎉 Configuração concluída com sucesso!" "Green"
    } else {
        Write-ColorLog "⚠️  Algumas verificações falharam" "Yellow"
    }
}

# Mostrar próximos passos
function Show-NextSteps {
    Write-ColorLog "📋 Próximos passos:" "Cyan"
    Write-Host ""
    Write-ColorLog "1. Configure as variáveis de ambiente específicas:" "Yellow"
    Write-Host "   railway variables set DATABASE_URL=<sua-url-neon>"
    Write-Host "   railway variables set NEXTAUTH_SECRET=<seu-secret>"
    Write-Host "   railway variables set NEXTAUTH_URL=<sua-url-app>"
    Write-Host ""
    Write-ColorLog "2. Faça o primeiro deploy:" "Yellow"
    Write-Host "   railway up"
    Write-Host ""
    Write-ColorLog "3. Ou use o script automatizado:" "Yellow"
    Write-Host "   node scripts/railway-cli-deploy.js"
    Write-Host ""
    Write-ColorLog "4. Monitore o deploy:" "Yellow"
    Write-Host "   railway logs --follow"
    Write-Host ""
    Write-ColorLog "📚 Documentação completa: railway-commands.md" "Cyan"
}

# Função principal
function Main {
    if ($Help) {
        Show-Help
    }
    
    Write-ColorLog "🚂 FisioFlow - Railway CLI Setup" "Magenta"
    Write-ColorLog "================================" "Magenta"
    Write-Host ""
    
    try {
        Test-Prerequisites
        Install-RailwayCLI
        Initialize-Railway
        Setup-Project
        Setup-EnvironmentVariables
        Create-ConfigFiles
        Test-Configuration
        
        Write-Host ""
        Write-ColorLog "🎉 Setup concluído com sucesso!" "Green"
        Write-Host ""
        
        Show-NextSteps
    }
    catch {
        Write-ColorLog "❌ Erro durante o setup: $($_.Exception.Message)" "Red"
        exit 1
    }
}

# Executar função principal
Main