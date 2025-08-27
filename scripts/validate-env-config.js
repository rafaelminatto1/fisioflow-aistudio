#!/usr/bin/env node

/**
 * Script de Validação e Testes das Configurações do .env.local
 * 
 * Este script valida se as configurações atualizadas pelos scripts de automação
 * estão funcionando corretamente e se as conexões com Railway e Neon DB são válidas.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Client } = require('pg');

class EnvConfigValidator {
    constructor() {
        this.envPath = path.join(process.cwd(), '.env.local');
        this.config = {};
        this.errors = [];
        this.warnings = [];
        this.results = {
            railway: { status: 'pending', details: {} },
            neon: { status: 'pending', details: {} },
            general: { status: 'pending', details: {} }
        };
    }

    /**
     * Carrega e parseia o arquivo .env.local
     */
    loadEnvConfig() {
        try {
            if (!fs.existsSync(this.envPath)) {
                throw new Error('Arquivo .env.local não encontrado');
            }

            const envContent = fs.readFileSync(this.envPath, 'utf8');
            const lines = envContent.split('\n');

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                    const [key, ...valueParts] = trimmed.split('=');
                    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                    this.config[key.trim()] = value.trim();
                }
            }

            console.log('✅ Arquivo .env.local carregado com sucesso');
            return true;
        } catch (error) {
            this.errors.push(`Erro ao carregar .env.local: ${error.message}`);
            return false;
        }
    }

    /**
     * Valida configurações gerais
     */
    validateGeneralConfig() {
        console.log('\n🔍 Validando configurações gerais...');
        
        const requiredVars = [
            'NEXTAUTH_SECRET',
            'NEXTAUTH_URL',
            'NODE_ENV'
        ];

        const missing = [];
        const present = [];

        for (const varName of requiredVars) {
            if (!this.config[varName] || this.config[varName] === 'your-secret-here') {
                missing.push(varName);
            } else {
                present.push(varName);
            }
        }

        this.results.general = {
            status: missing.length === 0 ? 'success' : 'warning',
            details: {
                present: present.length,
                missing: missing.length,
                missingVars: missing
            }
        };

        if (missing.length > 0) {
            this.warnings.push(`Variáveis gerais faltando: ${missing.join(', ')}`);
        }

        console.log(`   ✅ ${present.length} variáveis configuradas`);
        if (missing.length > 0) {
            console.log(`   ⚠️  ${missing.length} variáveis faltando: ${missing.join(', ')}`);
        }
    }

    /**
     * Valida configurações do Railway
     */
    async validateRailwayConfig() {
        console.log('\n🚂 Validando configurações do Railway...');
        
        const railwayVars = [
            'RAILWAY_API_KEY',
            'RAILWAY_PROJECT_ID',
            'RAILWAY_PRODUCTION_DOMAIN',
            'RAILWAY_STAGING_DOMAIN'
        ];

        const missing = [];
        const present = [];

        for (const varName of railwayVars) {
            if (!this.config[varName] || this.config[varName].includes('your-') || this.config[varName].includes('xxx')) {
                missing.push(varName);
            } else {
                present.push(varName);
            }
        }

        // Testa conexão com Railway API se as credenciais estão presentes
        let apiTest = { status: 'skipped', message: 'Credenciais não configuradas' };
        
        if (this.config.RAILWAY_API_KEY && !this.config.RAILWAY_API_KEY.includes('your-')) {
            try {
                apiTest = await this.testRailwayAPI();
            } catch (error) {
                apiTest = { status: 'error', message: error.message };
            }
        }

        this.results.railway = {
            status: missing.length === 0 && apiTest.status === 'success' ? 'success' : 
                   missing.length > 0 ? 'warning' : 'error',
            details: {
                present: present.length,
                missing: missing.length,
                missingVars: missing,
                apiTest
            }
        };

        console.log(`   ✅ ${present.length} variáveis configuradas`);
        if (missing.length > 0) {
            console.log(`   ⚠️  ${missing.length} variáveis faltando: ${missing.join(', ')}`);
        }
        console.log(`   🔗 API Test: ${apiTest.status} - ${apiTest.message}`);
    }

    /**
     * Testa conexão com Railway API
     */
    async testRailwayAPI() {
        try {
            const response = await fetch('https://backboard.railway.app/graphql', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.RAILWAY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: 'query { me { id name email } }'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.errors) {
                throw new Error(`GraphQL Error: ${data.errors[0].message}`);
            }

            return {
                status: 'success',
                message: `Conectado como ${data.data.me.name} (${data.data.me.email})`
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Falha na conexão: ${error.message}`
            };
        }
    }

    /**
     * Valida configurações do Neon DB
     */
    async validateNeonConfig() {
        console.log('\n🐘 Validando configurações do Neon DB...');
        
        const neonVars = [
            'NEON_API_KEY',
            'NEON_PROJECT_ID',
            'NEON_DATABASE_URL',
            'NEON_DATABASE_URL_STAGING'
        ];

        const missing = [];
        const present = [];

        for (const varName of neonVars) {
            if (!this.config[varName] || this.config[varName].includes('your-') || this.config[varName].includes('xxx')) {
                missing.push(varName);
            } else {
                present.push(varName);
            }
        }

        // Testa conexão com Neon DB se as credenciais estão presentes
        let dbTest = { status: 'skipped', message: 'Credenciais não configuradas' };
        
        if (this.config.NEON_DATABASE_URL && !this.config.NEON_DATABASE_URL.includes('your-')) {
            try {
                dbTest = await this.testNeonConnection();
            } catch (error) {
                dbTest = { status: 'error', message: error.message };
            }
        }

        this.results.neon = {
            status: missing.length === 0 && dbTest.status === 'success' ? 'success' : 
                   missing.length > 0 ? 'warning' : 'error',
            details: {
                present: present.length,
                missing: missing.length,
                missingVars: missing,
                dbTest
            }
        };

        console.log(`   ✅ ${present.length} variáveis configuradas`);
        if (missing.length > 0) {
            console.log(`   ⚠️  ${missing.length} variáveis faltando: ${missing.join(', ')}`);
        }
        console.log(`   🔗 DB Test: ${dbTest.status} - ${dbTest.message}`);
    }

    /**
     * Testa conexão com Neon DB
     */
    async testNeonConnection() {
        const client = new Client({
            connectionString: this.config.NEON_DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        try {
            await client.connect();
            const result = await client.query('SELECT version(), current_database(), current_user');
            await client.end();

            const row = result.rows[0];
            return {
                status: 'success',
                message: `Conectado ao ${row.current_database} como ${row.current_user}`
            };
        } catch (error) {
            try {
                await client.end();
            } catch (e) {
                // Ignore cleanup errors
            }
            
            return {
                status: 'error',
                message: `Falha na conexão: ${error.message}`
            };
        }
    }

    /**
     * Verifica se as CLIs estão instaladas
     */
    checkCLIInstallation() {
        console.log('\n🛠️  Verificando instalação das CLIs...');
        
        const clis = [
            { name: 'Railway CLI', command: 'railway --version' },
            { name: 'Neon CLI', command: 'neon --version' }
        ];

        const cliStatus = {};

        for (const cli of clis) {
            try {
                const output = execSync(cli.command, { encoding: 'utf8', stdio: 'pipe' });
                cliStatus[cli.name] = {
                    installed: true,
                    version: output.trim()
                };
                console.log(`   ✅ ${cli.name}: ${output.trim()}`);
            } catch (error) {
                cliStatus[cli.name] = {
                    installed: false,
                    error: error.message
                };
                console.log(`   ❌ ${cli.name}: Não instalado`);
            }
        }

        return cliStatus;
    }

    /**
     * Gera relatório final
     */
    generateReport() {
        console.log('\n📊 RELATÓRIO DE VALIDAÇÃO');
        console.log('=' .repeat(50));
        
        const overallStatus = this.errors.length === 0 ? 
            (this.warnings.length === 0 ? 'SUCCESS' : 'WARNING') : 'ERROR';

        console.log(`\n🎯 Status Geral: ${overallStatus}`);
        
        // Resumo por categoria
        console.log('\n📋 Resumo por Categoria:');
        console.log(`   🔧 Geral: ${this.results.general.status.toUpperCase()}`);
        console.log(`   🚂 Railway: ${this.results.railway.status.toUpperCase()}`);
        console.log(`   🐘 Neon DB: ${this.results.neon.status.toUpperCase()}`);

        // Erros
        if (this.errors.length > 0) {
            console.log('\n❌ Erros:');
            this.errors.forEach(error => console.log(`   • ${error}`));
        }

        // Avisos
        if (this.warnings.length > 0) {
            console.log('\n⚠️  Avisos:');
            this.warnings.forEach(warning => console.log(`   • ${warning}`));
        }

        // Próximos passos
        console.log('\n🚀 Próximos Passos:');
        if (this.results.railway.status === 'warning') {
            console.log('   • Execute: npm run env:setup-railway');
        }
        if (this.results.neon.status === 'warning') {
            console.log('   • Execute: npm run env:setup-neon');
        }
        if (overallStatus === 'SUCCESS') {
            console.log('   • ✅ Configuração completa! Você pode executar: npm run dev');
        }

        console.log('\n' + '=' .repeat(50));
        
        return {
            status: overallStatus,
            results: this.results,
            errors: this.errors,
            warnings: this.warnings
        };
    }

    /**
     * Executa validação completa
     */
    async runValidation() {
        console.log('🔍 INICIANDO VALIDAÇÃO DAS CONFIGURAÇÕES DO .env.local');
        console.log('=' .repeat(60));

        // Carrega configurações
        if (!this.loadEnvConfig()) {
            return this.generateReport();
        }

        // Verifica CLIs
        this.checkCLIInstallation();

        // Valida configurações
        this.validateGeneralConfig();
        await this.validateRailwayConfig();
        await this.validateNeonConfig();

        // Gera relatório
        return this.generateReport();
    }
}

// Execução principal
if (require.main === module) {
    const validator = new EnvConfigValidator();
    
    validator.runValidation()
        .then(report => {
            process.exit(report.status === 'SUCCESS' ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Erro durante validação:', error.message);
            process.exit(1);
        });
}

module.exports = EnvConfigValidator;