#!/usr/bin/env node

/**
 * Script de Deploy Automatizado para DigitalOcean
 * FisioFlow AI Studio - Deploy via CLI
 * Autor: FisioFlow Team
 * Data: 2024
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const yaml = require('js-yaml');
const crypto = require('crypto');

class DigitalOceanDeploy {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.projectRoot = process.cwd();
        this.appYamlPath = path.join(this.projectRoot, '.do', 'app.yaml');
        this.envConfigPath = path.join(this.projectRoot, 'digitalocean-env-config.json');
        this.appName = 'fisioflow-aistudio';
        this.deploymentId = null;
        this.appId = null;
    }

    async question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            warning: '\x1b[33m', // Yellow
            error: '\x1b[31m',   // Red
            reset: '\x1b[0m'
        };
        
        const prefix = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        const timestamp = new Date().toLocaleTimeString();
        console.log(`${colors[type]}[${timestamp}] ${prefix[type]} ${message}${colors.reset}`);
    }

    async checkPrerequisites() {
        this.log('🔍 Verificando pré-requisitos...', 'info');
        
        // Verificar doctl
        try {
            const version = execSync('doctl version', { encoding: 'utf8', stdio: 'pipe' });
            this.log(`doctl encontrado: ${version.trim()}`, 'success');
        } catch (error) {
            this.log('doctl não encontrado. Execute primeiro: node scripts/setup-doctl.js', 'error');
            return false;
        }
        
        // Verificar autenticação
        try {
            const account = execSync('doctl account get', { encoding: 'utf8', stdio: 'pipe' });
            this.log('Autenticação DigitalOcean OK', 'success');
        } catch (error) {
            this.log('Erro de autenticação. Execute: doctl auth init', 'error');
            return false;
        }
        
        // Verificar arquivo app.yaml
        if (!fs.existsSync(this.appYamlPath)) {
            this.log(`Arquivo app.yaml não encontrado: ${this.appYamlPath}`, 'error');
            return false;
        }
        
        this.log('Todos os pré-requisitos atendidos!', 'success');
        return true;
    }

    async loadAppConfig() {
        this.log('📋 Carregando configuração da aplicação...', 'info');
        
        try {
            const yamlContent = fs.readFileSync(this.appYamlPath, 'utf8');
            this.appConfig = yaml.load(yamlContent);
            
            this.log(`Aplicação: ${this.appConfig.name}`, 'info');
            this.log(`Repositório: ${this.appConfig.services[0].github.repo}`, 'info');
            this.log(`Branch: ${this.appConfig.services[0].github.branch}`, 'info');
            
            return true;
        } catch (error) {
            this.log(`Erro ao carregar app.yaml: ${error.message}`, 'error');
            return false;
        }
    }

    async generateSecureValues() {
        this.log('🔐 Gerando valores seguros para variáveis...', 'info');
        
        const secureValues = {
            NEXTAUTH_SECRET: crypto.randomBytes(32).toString('hex'),
            JWT_SECRET: crypto.randomBytes(32).toString('hex'),
            ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex')
        };
        
        this.log('Valores seguros gerados com sucesso', 'success');
        return secureValues;
    }

    async loadEnvironmentConfig() {
        this.log('🔧 Carregando configuração de ambiente...', 'info');
        
        let envConfig = {};
        
        if (fs.existsSync(this.envConfigPath)) {
            try {
                const configContent = fs.readFileSync(this.envConfigPath, 'utf8');
                envConfig = JSON.parse(configContent);
                this.log('Configuração existente carregada', 'success');
            } catch (error) {
                this.log('Erro ao carregar configuração existente', 'warning');
            }
        }
        
        // Gerar valores seguros se não existirem
        const secureValues = await this.generateSecureValues();
        
        // Configuração padrão
        const defaultConfig = {
            mandatory: {
                NODE_ENV: 'production',
                NEXT_TELEMETRY_DISABLED: '1',
                PORT: '3000',
                DATABASE_URL: envConfig.mandatory?.DATABASE_URL || '',
                NEXTAUTH_SECRET: envConfig.mandatory?.NEXTAUTH_SECRET || secureValues.NEXTAUTH_SECRET,
                NEXTAUTH_URL: envConfig.mandatory?.NEXTAUTH_URL || 'https://fisioflow-aistudio.ondigitalocean.app'
            },
            optional: {
                OPENAI_API_KEY: envConfig.optional?.OPENAI_API_KEY || '',
                ANTHROPIC_API_KEY: envConfig.optional?.ANTHROPIC_API_KEY || '',
                GOOGLE_API_KEY: envConfig.optional?.GOOGLE_API_KEY || '',
                STRIPE_SECRET_KEY: envConfig.optional?.STRIPE_SECRET_KEY || '',
                STRIPE_PUBLISHABLE_KEY: envConfig.optional?.STRIPE_PUBLISHABLE_KEY || ''
            }
        };
        
        this.envConfig = defaultConfig;
        return defaultConfig;
    }

    async promptForMissingVariables() {
        this.log('📝 Configurando variáveis de ambiente...', 'info');
        
        // Variáveis obrigatórias
        console.log('\n🔴 VARIÁVEIS OBRIGATÓRIAS:');
        
        if (!this.envConfig.mandatory.DATABASE_URL) {
            this.envConfig.mandatory.DATABASE_URL = await this.question('DATABASE_URL (PostgreSQL): ');
        }
        
        // Variáveis opcionais
        console.log('\n🟡 VARIÁVEIS OPCIONAIS (pressione Enter para pular):');
        
        const optionalPrompts = {
            OPENAI_API_KEY: 'OpenAI API Key: ',
            ANTHROPIC_API_KEY: 'Anthropic API Key: ',
            GOOGLE_API_KEY: 'Google API Key: ',
            STRIPE_SECRET_KEY: 'Stripe Secret Key: ',
            STRIPE_PUBLISHABLE_KEY: 'Stripe Publishable Key: '
        };
        
        for (const [key, prompt] of Object.entries(optionalPrompts)) {
            if (!this.envConfig.optional[key]) {
                const value = await this.question(prompt);
                if (value.trim()) {
                    this.envConfig.optional[key] = value.trim();
                }
            }
        }
        
        // Salvar configuração
        fs.writeFileSync(this.envConfigPath, JSON.stringify(this.envConfig, null, 2));
        this.log('Configuração salva em digitalocean-env-config.json', 'success');
    }

    async checkExistingApp() {
        this.log('🔍 Verificando aplicação existente...', 'info');
        
        try {
            const apps = execSync('doctl apps list --format ID,Name --no-header', { encoding: 'utf8' });
            const appLines = apps.trim().split('\n').filter(line => line.trim());
            
            for (const line of appLines) {
                const [id, name] = line.trim().split(/\s+/);
                if (name === this.appName) {
                    this.appId = id;
                    this.log(`Aplicação existente encontrada: ${name} (${id})`, 'success');
                    return true;
                }
            }
            
            this.log('Nenhuma aplicação existente encontrada', 'info');
            return false;
        } catch (error) {
            this.log('Erro ao verificar aplicações existentes', 'warning');
            return false;
        }
    }

    async createOrUpdateApp() {
        const exists = await this.checkExistingApp();
        
        if (exists) {
            this.log('🔄 Atualizando aplicação existente...', 'info');
            return await this.updateApp();
        } else {
            this.log('🆕 Criando nova aplicação...', 'info');
            return await this.createApp();
        }
    }

    async createApp() {
        try {
            this.log('Criando aplicação no DigitalOcean...', 'info');
            
            const result = execSync(`doctl apps create --spec "${this.appYamlPath}"`, { encoding: 'utf8' });
            
            // Extrair ID da aplicação do resultado
            const idMatch = result.match(/ID:\s+([a-f0-9-]+)/);
            if (idMatch) {
                this.appId = idMatch[1];
                this.log(`Aplicação criada com sucesso! ID: ${this.appId}`, 'success');
            }
            
            return true;
        } catch (error) {
            this.log(`Erro ao criar aplicação: ${error.message}`, 'error');
            return false;
        }
    }

    async updateApp() {
        try {
            this.log(`Atualizando aplicação ${this.appId}...`, 'info');
            
            const result = execSync(`doctl apps update "${this.appId}" --spec "${this.appYamlPath}"`, { encoding: 'utf8' });
            this.log('Aplicação atualizada com sucesso!', 'success');
            
            return true;
        } catch (error) {
            this.log(`Erro ao atualizar aplicação: ${error.message}`, 'error');
            return false;
        }
    }

    async setEnvironmentVariables() {
        if (!this.appId) {
            this.log('ID da aplicação não encontrado', 'error');
            return false;
        }
        
        this.log('🔧 Configurando variáveis de ambiente...', 'info');
        
        try {
            // Combinar todas as variáveis
            const allVars = { ...this.envConfig.mandatory, ...this.envConfig.optional };
            
            // Filtrar variáveis vazias
            const validVars = Object.entries(allVars).filter(([key, value]) => value && value.trim());
            
            this.log(`Configurando ${validVars.length} variáveis de ambiente...`, 'info');
            
            for (const [key, value] of validVars) {
                try {
                    execSync(`doctl apps update-env "${this.appId}" "${key}=${value}"`, { stdio: 'pipe' });
                    this.log(`✓ ${key} configurada`, 'success');
                } catch (error) {
                    this.log(`✗ Erro ao configurar ${key}`, 'warning');
                }
            }
            
            this.log('Variáveis de ambiente configuradas!', 'success');
            return true;
        } catch (error) {
            this.log(`Erro ao configurar variáveis: ${error.message}`, 'error');
            return false;
        }
    }

    async deployApp() {
        if (!this.appId) {
            this.log('ID da aplicação não encontrado', 'error');
            return false;
        }
        
        this.log('🚀 Iniciando deploy...', 'info');
        
        try {
            const result = execSync(`doctl apps create-deployment "${this.appId}"`, { encoding: 'utf8' });
            
            // Extrair ID do deployment
            const deployMatch = result.match(/ID:\s+([a-f0-9-]+)/);
            if (deployMatch) {
                this.deploymentId = deployMatch[1];
                this.log(`Deploy iniciado! ID: ${this.deploymentId}`, 'success');
            }
            
            return true;
        } catch (error) {
            this.log(`Erro ao iniciar deploy: ${error.message}`, 'error');
            return false;
        }
    }

    async monitorDeployment() {
        if (!this.appId || !this.deploymentId) {
            this.log('IDs necessários não encontrados para monitoramento', 'error');
            return false;
        }
        
        this.log('📊 Monitorando progresso do deploy...', 'info');
        
        const maxAttempts = 60; // 10 minutos (60 * 10s)
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            try {
                const status = execSync(`doctl apps get-deployment "${this.appId}" "${this.deploymentId}" --format Phase --no-header`, { encoding: 'utf8' }).trim();
                
                this.log(`Status: ${status}`, 'info');
                
                if (status === 'ACTIVE') {
                    this.log('🎉 Deploy concluído com sucesso!', 'success');
                    return true;
                } else if (status === 'ERROR' || status === 'CANCELED') {
                    this.log(`❌ Deploy falhou: ${status}`, 'error');
                    return false;
                }
                
                // Aguardar 10 segundos antes da próxima verificação
                await new Promise(resolve => setTimeout(resolve, 10000));
                attempts++;
                
            } catch (error) {
                this.log('Erro ao verificar status do deploy', 'warning');
                attempts++;
            }
        }
        
        this.log('Timeout no monitoramento do deploy', 'warning');
        return false;
    }

    async performHealthCheck() {
        this.log('🏥 Executando health check...', 'info');
        
        try {
            const appInfo = execSync(`doctl apps get "${this.appId}" --format LiveURL --no-header`, { encoding: 'utf8' }).trim();
            
            if (appInfo) {
                const healthUrl = `${appInfo}/api/health`;
                this.log(`Testando: ${healthUrl}`, 'info');
                
                // Usar curl para testar o endpoint
                try {
                    const response = execSync(`curl -s -o /dev/null -w "%{http_code}" "${healthUrl}"`, { encoding: 'utf8' });
                    
                    if (response.trim() === '200') {
                        this.log('✅ Health check passou!', 'success');
                        return { success: true, url: appInfo };
                    } else {
                        this.log(`⚠️ Health check retornou: ${response}`, 'warning');
                        return { success: false, url: appInfo };
                    }
                } catch (error) {
                    this.log('⚠️ Erro no health check via curl', 'warning');
                    return { success: false, url: appInfo };
                }
            }
            
        } catch (error) {
            this.log(`Erro ao obter URL da aplicação: ${error.message}`, 'error');
        }
        
        return { success: false, url: null };
    }

    async showDeploymentSummary(healthResult) {
        console.log('\n' + '='.repeat(60));
        console.log('🎉 RESUMO DO DEPLOY - FISIOFLOW AI STUDIO');
        console.log('='.repeat(60));
        
        if (this.appId) {
            console.log(`📱 App ID: ${this.appId}`);
        }
        
        if (this.deploymentId) {
            console.log(`🚀 Deployment ID: ${this.deploymentId}`);
        }
        
        if (healthResult.url) {
            console.log(`🌐 URL da Aplicação: ${healthResult.url}`);
            console.log(`🏥 Health Check: ${healthResult.url}/api/health`);
        }
        
        console.log(`✅ Status: ${healthResult.success ? 'SUCESSO' : 'ATENÇÃO NECESSÁRIA'}`);
        
        console.log('\n📋 Próximos passos:');
        console.log('1. Verificar logs: doctl apps logs ' + this.appId);
        console.log('2. Monitorar métricas no painel DigitalOcean');
        console.log('3. Configurar domínio customizado (opcional)');
        console.log('4. Configurar SSL/HTTPS');
        
        console.log('\n' + '='.repeat(60));
    }

    async run() {
        try {
            console.log('\n🚀 DEPLOY AUTOMATIZADO - FISIOFLOW AI STUDIO');
            console.log('DigitalOcean App Platform via CLI\n');
            
            // 1. Verificar pré-requisitos
            if (!(await this.checkPrerequisites())) {
                return false;
            }
            
            // 2. Carregar configuração
            if (!(await this.loadAppConfig())) {
                return false;
            }
            
            // 3. Configurar ambiente
            await this.loadEnvironmentConfig();
            await this.promptForMissingVariables();
            
            // 4. Confirmar deploy
            const confirm = await this.question('\n❓ Confirma o deploy? (s/n): ');
            if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'sim') {
                this.log('Deploy cancelado pelo usuário', 'warning');
                return false;
            }
            
            // 5. Criar/atualizar aplicação
            if (!(await this.createOrUpdateApp())) {
                return false;
            }
            
            // 6. Configurar variáveis de ambiente
            if (!(await this.setEnvironmentVariables())) {
                return false;
            }
            
            // 7. Fazer deploy
            if (!(await this.deployApp())) {
                return false;
            }
            
            // 8. Monitorar deploy
            const deploySuccess = await this.monitorDeployment();
            
            // 9. Health check
            const healthResult = await this.performHealthCheck();
            
            // 10. Mostrar resumo
            await this.showDeploymentSummary(healthResult);
            
            return deploySuccess && healthResult.success;
            
        } catch (error) {
            this.log(`❌ Erro durante o deploy: ${error.message}`, 'error');
            return false;
        } finally {
            this.rl.close();
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const deploy = new DigitalOceanDeploy();
    deploy.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = DigitalOceanDeploy;