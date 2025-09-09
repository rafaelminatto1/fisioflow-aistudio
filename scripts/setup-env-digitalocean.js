#!/usr/bin/env node

/**
 * Script de Configuração Automática de Variáveis de Ambiente
 * DigitalOcean App Platform - FisioFlow AI Studio
 * Autor: FisioFlow Team
 * Data: 2024
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

class DigitalOceanEnvSetup {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.projectRoot = process.cwd();
        this.envConfigPath = path.join(this.projectRoot, 'digitalocean-env-config.json');
        this.envTemplatePath = path.join(this.projectRoot, '.env.example');
        this.appName = 'fisioflow-aistudio';
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

    generateSecureValue(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    async checkDoctlAuth() {
        this.log('🔍 Verificando autenticação DigitalOcean...', 'info');
        
        try {
            const account = execSync('doctl account get', { encoding: 'utf8', stdio: 'pipe' });
            this.log('Autenticação DigitalOcean OK', 'success');
            return true;
        } catch (error) {
            this.log('Erro de autenticação. Execute: doctl auth init', 'error');
            return false;
        }
    }

    async findApp() {
        this.log('🔍 Procurando aplicação DigitalOcean...', 'info');
        
        try {
            const apps = execSync('doctl apps list --format ID,Name --no-header', { encoding: 'utf8' });
            const appLines = apps.trim().split('\n').filter(line => line.trim());
            
            for (const line of appLines) {
                const [id, name] = line.trim().split(/\s+/);
                if (name === this.appName) {
                    this.appId = id;
                    this.log(`Aplicação encontrada: ${name} (${id})`, 'success');
                    return true;
                }
            }
            
            this.log('Aplicação não encontrada. Execute o deploy primeiro.', 'warning');
            return false;
        } catch (error) {
            this.log('Erro ao procurar aplicação', 'error');
            return false;
        }
    }

    async loadExistingConfig() {
        this.log('📋 Carregando configuração existente...', 'info');
        
        let config = {
            mandatory: {},
            optional: {},
            generated: {}
        };
        
        if (fs.existsSync(this.envConfigPath)) {
            try {
                const content = fs.readFileSync(this.envConfigPath, 'utf8');
                config = { ...config, ...JSON.parse(content) };
                this.log('Configuração existente carregada', 'success');
            } catch (error) {
                this.log('Erro ao carregar configuração existente', 'warning');
            }
        }
        
        return config;
    }

    async generateDefaultConfig() {
        this.log('🔧 Gerando configuração padrão...', 'info');
        
        const config = {
            mandatory: {
                NODE_ENV: 'production',
                NEXT_TELEMETRY_DISABLED: '1',
                PORT: '3000',
                DATABASE_URL: '',
                NEXTAUTH_SECRET: this.generateSecureValue(32),
                NEXTAUTH_URL: 'https://fisioflow-aistudio.ondigitalocean.app'
            },
            optional: {
                OPENAI_API_KEY: '',
                ANTHROPIC_API_KEY: '',
                GOOGLE_API_KEY: '',
                STRIPE_SECRET_KEY: '',
                STRIPE_PUBLISHABLE_KEY: '',
                STRIPE_WEBHOOK_SECRET: '',
                REDIS_URL: '',
                SMTP_HOST: '',
                SMTP_PORT: '',
                SMTP_USER: '',
                SMTP_PASS: '',
                AWS_ACCESS_KEY_ID: '',
                AWS_SECRET_ACCESS_KEY: '',
                AWS_REGION: 'us-east-1'
            },
            generated: {
                JWT_SECRET: this.generateSecureValue(32),
                ENCRYPTION_KEY: this.generateSecureValue(32),
                SESSION_SECRET: this.generateSecureValue(24),
                API_SECRET: this.generateSecureValue(16)
            },
            metadata: {
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        
        this.log('Configuração padrão gerada', 'success');
        return config;
    }

    async promptForVariables(config) {
        console.log('\n' + '='.repeat(60));
        console.log('🔧 CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE');
        console.log('='.repeat(60));
        
        // Variáveis obrigatórias
        console.log('\n🔴 VARIÁVEIS OBRIGATÓRIAS:');
        console.log('(Pressione Enter para manter o valor atual)');
        
        const mandatoryPrompts = {
            DATABASE_URL: 'URL do PostgreSQL (ex: postgresql://user:pass@host:5432/db): ',
            NEXTAUTH_URL: 'URL da aplicação (ex: https://seu-app.ondigitalocean.app): '
        };
        
        for (const [key, prompt] of Object.entries(mandatoryPrompts)) {
            const current = config.mandatory[key] || '';
            const displayCurrent = current ? ` [atual: ${current.substring(0, 20)}...]` : '';
            
            const value = await this.question(`${prompt}${displayCurrent}\n> `);
            if (value.trim()) {
                config.mandatory[key] = value.trim();
            }
        }
        
        // Variáveis opcionais - AI APIs
        console.log('\n🤖 APIs DE INTELIGÊNCIA ARTIFICIAL (opcional):');
        const aiPrompts = {
            OPENAI_API_KEY: 'OpenAI API Key (sk-...): ',
            ANTHROPIC_API_KEY: 'Anthropic API Key (sk-ant-...): ',
            GOOGLE_API_KEY: 'Google Gemini API Key: '
        };
        
        for (const [key, prompt] of Object.entries(aiPrompts)) {
            const current = config.optional[key] || '';
            const displayCurrent = current ? ` [configurado]` : '';
            
            const value = await this.question(`${prompt}${displayCurrent}\n> `);
            if (value.trim()) {
                config.optional[key] = value.trim();
            }
        }
        
        // Variáveis opcionais - Pagamentos
        console.log('\n💳 CONFIGURAÇÃO DE PAGAMENTOS (opcional):');
        const paymentPrompts = {
            STRIPE_SECRET_KEY: 'Stripe Secret Key (sk_...): ',
            STRIPE_PUBLISHABLE_KEY: 'Stripe Publishable Key (pk_...): ',
            STRIPE_WEBHOOK_SECRET: 'Stripe Webhook Secret (whsec_...): '
        };
        
        for (const [key, prompt] of Object.entries(paymentPrompts)) {
            const current = config.optional[key] || '';
            const displayCurrent = current ? ` [configurado]` : '';
            
            const value = await this.question(`${prompt}${displayCurrent}\n> `);
            if (value.trim()) {
                config.optional[key] = value.trim();
            }
        }
        
        // Variáveis opcionais - Infraestrutura
        console.log('\n🏗️ INFRAESTRUTURA ADICIONAL (opcional):');
        const infraPrompts = {
            REDIS_URL: 'Redis URL (redis://...): ',
            SMTP_HOST: 'SMTP Host (ex: smtp.gmail.com): ',
            SMTP_PORT: 'SMTP Port (ex: 587): ',
            SMTP_USER: 'SMTP User: ',
            SMTP_PASS: 'SMTP Password: '
        };
        
        for (const [key, prompt] of Object.entries(infraPrompts)) {
            const current = config.optional[key] || '';
            const displayCurrent = current ? ` [configurado]` : '';
            
            const value = await this.question(`${prompt}${displayCurrent}\n> `);
            if (value.trim()) {
                config.optional[key] = value.trim();
            }
        }
        
        // Atualizar metadata
        if (!config.metadata) {
            config.metadata = {
                created_at: new Date().toISOString(),
                version: '1.0.0'
            };
        }
        config.metadata.updated_at = new Date().toISOString();
        
        return config;
    }

    async saveConfig(config) {
        this.log('💾 Salvando configuração...', 'info');
        
        try {
            fs.writeFileSync(this.envConfigPath, JSON.stringify(config, null, 2));
            this.log(`Configuração salva em: ${this.envConfigPath}`, 'success');
            return true;
        } catch (error) {
            this.log(`Erro ao salvar configuração: ${error.message}`, 'error');
            return false;
        }
    }

    async createEnvFile(config) {
        this.log('📄 Criando arquivo .env local...', 'info');
        
        const envPath = path.join(this.projectRoot, '.env.local');
        
        try {
            let envContent = '# Arquivo gerado automaticamente - FisioFlow AI Studio\n';
            envContent += `# Gerado em: ${new Date().toISOString()}\n\n`;
            
            // Variáveis obrigatórias
            envContent += '# VARIÁVEIS OBRIGATÓRIAS\n';
            for (const [key, value] of Object.entries(config.mandatory)) {
                if (value) {
                    envContent += `${key}="${value}"\n`;
                }
            }
            
            // Variáveis geradas
            envContent += '\n# VARIÁVEIS GERADAS AUTOMATICAMENTE\n';
            for (const [key, value] of Object.entries(config.generated)) {
                envContent += `${key}="${value}"\n`;
            }
            
            // Variáveis opcionais (apenas as preenchidas)
            const filledOptional = Object.entries(config.optional).filter(([key, value]) => value && value.trim());
            if (filledOptional.length > 0) {
                envContent += '\n# VARIÁVEIS OPCIONAIS\n';
                for (const [key, value] of filledOptional) {
                    envContent += `${key}="${value}"\n`;
                }
            }
            
            fs.writeFileSync(envPath, envContent);
            this.log(`Arquivo .env.local criado: ${envPath}`, 'success');
            return true;
        } catch (error) {
            this.log(`Erro ao criar .env.local: ${error.message}`, 'error');
            return false;
        }
    }

    async deployVariablesToDigitalOcean(config) {
        if (!this.appId) {
            this.log('ID da aplicação não encontrado', 'error');
            return false;
        }
        
        this.log('🚀 Enviando variáveis para DigitalOcean...', 'info');
        
        try {
            // Combinar todas as variáveis
            const allVars = {
                ...config.mandatory,
                ...config.generated,
                ...Object.fromEntries(
                    Object.entries(config.optional).filter(([key, value]) => value && value.trim())
                )
            };
            
            const varCount = Object.keys(allVars).length;
            this.log(`Configurando ${varCount} variáveis de ambiente...`, 'info');
            
            let successCount = 0;
            let errorCount = 0;
            
            for (const [key, value] of Object.entries(allVars)) {
                try {
                    execSync(`doctl apps update-env "${this.appId}" "${key}=${value}"`, { stdio: 'pipe' });
                    this.log(`✓ ${key}`, 'success');
                    successCount++;
                } catch (error) {
                    this.log(`✗ Erro ao configurar ${key}`, 'warning');
                    errorCount++;
                }
            }
            
            this.log(`Configuração concluída: ${successCount} sucesso, ${errorCount} erros`, 
                errorCount === 0 ? 'success' : 'warning');
            
            return errorCount === 0;
        } catch (error) {
            this.log(`Erro geral na configuração: ${error.message}`, 'error');
            return false;
        }
    }

    async validateConfiguration(config) {
        this.log('🔍 Validando configuração...', 'info');
        
        const errors = [];
        const warnings = [];
        
        // Validar variáveis obrigatórias
        const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
        for (const varName of requiredVars) {
            if (!config.mandatory[varName] || !config.mandatory[varName].trim()) {
                errors.push(`Variável obrigatória ausente: ${varName}`);
            }
        }
        
        // Validar formato da DATABASE_URL
        if (config.mandatory.DATABASE_URL && !config.mandatory.DATABASE_URL.startsWith('postgresql://')) {
            warnings.push('DATABASE_URL deve começar com postgresql://');
        }
        
        // Validar NEXTAUTH_URL
        if (config.mandatory.NEXTAUTH_URL && !config.mandatory.NEXTAUTH_URL.startsWith('https://')) {
            warnings.push('NEXTAUTH_URL deve usar HTTPS em produção');
        }
        
        // Validar chaves API
        if (config.optional.OPENAI_API_KEY && !config.optional.OPENAI_API_KEY.startsWith('sk-')) {
            warnings.push('OPENAI_API_KEY deve começar com sk-');
        }
        
        if (config.optional.STRIPE_SECRET_KEY && !config.optional.STRIPE_SECRET_KEY.startsWith('sk_')) {
            warnings.push('STRIPE_SECRET_KEY deve começar com sk_');
        }
        
        // Mostrar resultados
        if (errors.length > 0) {
            this.log('❌ Erros de validação encontrados:', 'error');
            errors.forEach(error => console.log(`  - ${error}`));
        }
        
        if (warnings.length > 0) {
            this.log('⚠️ Avisos de validação:', 'warning');
            warnings.forEach(warning => console.log(`  - ${warning}`));
        }
        
        if (errors.length === 0 && warnings.length === 0) {
            this.log('✅ Configuração válida!', 'success');
        }
        
        return { valid: errors.length === 0, errors, warnings };
    }

    async showConfigSummary(config) {
        console.log('\n' + '='.repeat(60));
        console.log('📋 RESUMO DA CONFIGURAÇÃO');
        console.log('='.repeat(60));
        
        const mandatoryCount = Object.values(config.mandatory).filter(v => v && v.trim()).length;
        const optionalCount = Object.values(config.optional).filter(v => v && v.trim()).length;
        const generatedCount = Object.keys(config.generated).length;
        
        console.log(`🔴 Variáveis obrigatórias: ${mandatoryCount}/${Object.keys(config.mandatory).length}`);
        console.log(`🟡 Variáveis opcionais: ${optionalCount}/${Object.keys(config.optional).length}`);
        console.log(`🔐 Variáveis geradas: ${generatedCount}`);
        
        console.log('\n📋 Variáveis configuradas:');
        
        // Mostrar obrigatórias
        console.log('\n🔴 Obrigatórias:');
        for (const [key, value] of Object.entries(config.mandatory)) {
            const status = value && value.trim() ? '✅' : '❌';
            const display = value && value.trim() ? `${value.substring(0, 20)}...` : 'NÃO CONFIGURADA';
            console.log(`  ${status} ${key}: ${display}`);
        }
        
        // Mostrar opcionais configuradas
        const configuredOptional = Object.entries(config.optional).filter(([key, value]) => value && value.trim());
        if (configuredOptional.length > 0) {
            console.log('\n🟡 Opcionais configuradas:');
            for (const [key, value] of configuredOptional) {
                console.log(`  ✅ ${key}: ${value.substring(0, 20)}...`);
            }
        }
        
        // Mostrar geradas
        console.log('\n🔐 Geradas automaticamente:');
        for (const key of Object.keys(config.generated)) {
            console.log(`  ✅ ${key}: [valor seguro gerado]`);
        }
        
        console.log('\n' + '='.repeat(60));
    }

    async run() {
        try {
            console.log('\n🔧 CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE');
            console.log('DigitalOcean App Platform - FisioFlow AI Studio\n');
            
            // 1. Verificar autenticação
            if (!(await this.checkDoctlAuth())) {
                return false;
            }
            
            // 2. Encontrar aplicação (opcional para configuração local)
            const appFound = await this.findApp();
            
            // 3. Carregar configuração existente
            let config = await this.loadExistingConfig();
            
            // 4. Se não existe, gerar padrão
            if (!config.mandatory || Object.keys(config.mandatory).length === 0) {
                config = await this.generateDefaultConfig();
            }
            
            // 5. Prompt para variáveis
            config = await this.promptForVariables(config);
            
            // 6. Validar configuração
            const validation = await this.validateConfiguration(config);
            
            if (!validation.valid) {
                const continueAnyway = await this.question('\n❓ Continuar mesmo com erros? (s/n): ');
                if (continueAnyway.toLowerCase() !== 's' && continueAnyway.toLowerCase() !== 'sim') {
                    this.log('Configuração cancelada', 'warning');
                    return false;
                }
            }
            
            // 7. Salvar configuração
            if (!(await this.saveConfig(config))) {
                return false;
            }
            
            // 8. Criar arquivo .env local
            await this.createEnvFile(config);
            
            // 9. Deploy para DigitalOcean (se aplicação encontrada)
            if (appFound) {
                const deployToCloud = await this.question('\n❓ Enviar variáveis para DigitalOcean agora? (s/n): ');
                
                if (deployToCloud.toLowerCase() === 's' || deployToCloud.toLowerCase() === 'sim') {
                    await this.deployVariablesToDigitalOcean(config);
                }
            }
            
            // 10. Mostrar resumo
            await this.showConfigSummary(config);
            
            this.log('\n🎉 Configuração de variáveis concluída!', 'success');
            
            return true;
            
        } catch (error) {
            this.log(`❌ Erro durante a configuração: ${error.message}`, 'error');
            return false;
        } finally {
            this.rl.close();
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const envSetup = new DigitalOceanEnvSetup();
    envSetup.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = DigitalOceanEnvSetup;