# Script PowerShell para Criar Projeto Neon DB
# Execute: .\scripts\create-neon-project.ps1

param(
    [string]$ApiKey = "",
    [string]$ProjectName = "fisioflow",
    [string]$DatabaseName = "fisioflow"
)

Write-Host "🌿 FISIOFLOW - CRIAÇÃO DE PROJETO NEON DB" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Coletar API Key se não fornecida
if (-not $ApiKey) {
    $ApiKey = Read-Host "🔑 Neon API Key"
    if (-not $ApiKey) {
        Write-Host "❌ API Key é obrigatória!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "📋 Configuração:" -ForegroundColor Yellow
Write-Host "   Projeto: $ProjectName" -ForegroundColor White
Write-Host "   Banco: $DatabaseName" -ForegroundColor White
Write-Host "   API Key: $($ApiKey.Substring(0,8))..." -ForegroundColor White

# 1. Criar projeto Neon
Write-Host "`n🚀 Criando projeto Neon..." -ForegroundColor Yellow

try {
    $headers = @{
        "accept" = "application/json"
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        name = $ProjectName
        database_name = $DatabaseName
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "https://api.neon.tech/v2/projects" -Method POST -Headers $headers -Body $body
    
    Write-Host "✅ Projeto criado com sucesso!" -ForegroundColor Green
    Write-Host "   Project ID: $($response.id)" -ForegroundColor White
    Write-Host "   Status: $($response.status)" -ForegroundColor White
    
    $projectId = $response.id
    
} catch {
    Write-Host "❌ Erro ao criar projeto: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Aguardar projeto estar pronto
Write-Host "`n⏳ Aguardando projeto estar pronto..." -ForegroundColor Yellow

do {
    Start-Sleep -Seconds 5
    try {
        $statusResponse = Invoke-RestMethod -Uri "https://api.neon.tech/v2/projects/$projectId" -Method GET -Headers $headers
        $status = $statusResponse.status
        Write-Host "   Status atual: $status" -ForegroundColor White
    } catch {
        Write-Host "   Erro ao verificar status: $($_.Exception.Message)" -ForegroundColor Red
        break
    }
} while ($status -eq "creating")

if ($status -eq "ready") {
    Write-Host "✅ Projeto está pronto!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Projeto não está pronto. Status: $status" -ForegroundColor Yellow
}

# 3. Obter informações do projeto
Write-Host "`n🔍 Obtendo informações do projeto..." -ForegroundColor Yellow

try {
    $projectInfo = Invoke-RestMethod -Uri "https://api.neon.tech/v2/projects/$projectId" -Method GET -Headers $headers
    
    Write-Host "📊 Informações do projeto:" -ForegroundColor White
    Write-Host "   Nome: $($projectInfo.name)" -ForegroundColor White
    Write-Host "   ID: $($projectInfo.id)" -ForegroundColor White
    Write-Host "   Status: $($projectInfo.status)" -ForegroundColor White
    Write-Host "   Criado em: $($projectInfo.created_at)" -ForegroundColor White
    
} catch {
    Write-Host "⚠️ Erro ao obter informações do projeto: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4. Obter connection string
Write-Host "`n🔗 Obtendo connection string..." -ForegroundColor Yellow

try {
    $branchesResponse = Invoke-RestMethod -Uri "https://api.neon.tech/v2/projects/$projectId/branches" -Method GET -Headers $headers
    $mainBranch = $branchesResponse.branches | Where-Object { $_.name -eq "main" } | Select-Object -First 1
    
    if ($mainBranch) {
        $connectionString = "postgresql://$($projectInfo.owner_id):$($projectInfo.password)@$($mainBranch.endpoints[0].host):5432/$DatabaseName?sslmode=require"
        
        Write-Host "✅ Connection string obtida:" -ForegroundColor Green
        Write-Host "   $connectionString" -ForegroundColor White
        
        # Salvar em arquivo
        $connectionString | Out-File -FilePath ".neon-connection.txt" -Encoding UTF8
        Write-Host "   💾 Salva em .neon-connection.txt" -ForegroundColor White
        
    } else {
        Write-Host "⚠️ Branch main não encontrada" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "⚠️ Erro ao obter connection string: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 5. Configurar variáveis de ambiente
Write-Host "`n🌍 Configurando variáveis de ambiente..." -ForegroundColor Yellow

$envVars = @{
    "NEON_API_KEY" = $ApiKey
    "NEON_PROJECT_ID" = $projectId
    "NEON_DB_NAME" = $DatabaseName
    "NEON_BRANCH_NAME" = "main"
    "NEON_POOLED_CONNECTION" = "true"
    "NEON_MAX_CONNECTIONS" = "20"
    "NEON_MIN_CONNECTIONS" = "2"
}

# Salvar no .env.local
$envContent = $envVars.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "✅ Variáveis salvas em .env.local" -ForegroundColor Green

# 6. Tentar configurar no Railway
Write-Host "`n🚂 Tentando configurar no Railway..." -ForegroundColor Yellow

try {
    $railwayStatus = railway status 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Railway configurado, configurando variáveis..." -ForegroundColor Green
        
        foreach ($var in $envVars.GetEnumerator()) {
            try {
                railway variables --set "$($var.Key)=$($var.Value)" 2>$null
                Write-Host "   ✅ $($var.Key)=$($var.Key.Contains('API_KEY') ? '***' : $var.Value)" -ForegroundColor White
            } catch {
                Write-Host "   ⚠️ Erro ao configurar $($var.Key): $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
        
        # Configurar DATABASE_URL se disponível
        if ($connectionString) {
            try {
                railway variables --set "DATABASE_URL=$connectionString" 2>$null
                Write-Host "   ✅ DATABASE_URL configurado" -ForegroundColor White
            } catch {
                Write-Host "   ⚠️ Erro ao configurar DATABASE_URL" -ForegroundColor Yellow
            }
        }
        
    } else {
        Write-Host "⚠️ Railway não configurado ou não disponível" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Railway não configurado ou não disponível" -ForegroundColor Yellow
}

# 7. Resumo final
Write-Host "`n🎯 RESUMO DA CONFIGURAÇÃO:" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

Write-Host "✅ Projeto Neon criado:" -ForegroundColor Green
Write-Host "   Nome: $ProjectName" -ForegroundColor White
Write-Host "   ID: $projectId" -ForegroundColor White
Write-Host "   Banco: $DatabaseName" -ForegroundColor White

Write-Host "`n✅ Arquivos criados:" -ForegroundColor Green
Write-Host "   .env.local - Variáveis de ambiente" -ForegroundColor White
Write-Host "   .neon-connection.txt - Connection string" -ForegroundColor White

Write-Host "`n🔧 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Configure o MCP Server do Neon:" -ForegroundColor White
Write-Host "      npx @neondatabase/mcp-server-neon start $ApiKey" -ForegroundColor Cyan
Write-Host "`n   2. Use os comandos MCP:" -ForegroundColor White
Write-Host "      describe_project('$projectId')" -ForegroundColor Cyan
Write-Host "      get_connection_string('$projectId', 'main')" -ForegroundColor Cyan
Write-Host "      run_sql('$projectId', 'main', 'SELECT 1 as test')" -ForegroundColor Cyan

Write-Host "`n🎉 PROJETO NEON DB CRIADO COM SUCESSO!" -ForegroundColor Green
