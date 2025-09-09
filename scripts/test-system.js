#!/usr/bin/env node

/**
 * Script de Teste do Sistema de Deploy DigitalOcean
 * Verifica se todos os componentes estão funcionando corretamente
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SystemTester {
    constructor() {
        this.results = {
            doctl: false,
            auth: false,
            appYaml: false,
            envConfig: false,
            scripts: false
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const icons = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        };
        console.log(`[${timestamp}] ${icons[type]} ${message}`);
    }

    async testDoctl() {
        try {
            const result = execSync('doctl version', { encoding: 'utf8' });
            this.log(`doctl instalado: ${result.trim()}`, 'success');
            this.results.doctl = true;
        } catch (error) {
            this.log('doctl não encontrado', 'error');
        }
    }

    async testAuth() {
        try {
            const result = execSync('doctl account get', { encoding: 'utf8' });
            this.log('Autenticação DigitalOcean OK', 'success');
            this.results.auth = true;
        } catch (error) {
            this.log('Erro na autenticação DigitalOcean', 'error');
        }
    }

    async testAppYaml() {
        const appYamlPath = path.join(process.cwd(), '.do', 'app.yaml');
        if (fs.existsSync(appYamlPath)) {
            this.log('Arquivo .do/app.yaml encontrado', 'success');
            this.results.appYaml = true;
        } else {
            this.log('Arquivo .do/app.yaml não encontrado', 'error');
        }
    }

    async testEnvConfig() {
        const configPath = path.join(process.cwd(), 'digitalocean-env-config.json');
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                this.log('Configuração de ambiente carregada', 'success');
                this.log(`Variáveis configuradas: ${Object.keys(config.environment || {}).length}`, 'info');
                this.results.envConfig = true;
            } catch (error) {
                this.log('Erro ao ler configuração de ambiente', 'error');
            }
        } else {
            this.log('Arquivo de configuração não encontrado', 'warning');
        }
    }

    async testScripts() {
        const scriptsDir = path.join(process.cwd(), 'scripts');
        const requiredScripts = [
            'setup-doctl.js',
            'deploy-digitalocean-cli.js',
            'setup-env-digitalocean.js',
            'monitor-deploy-digitalocean.js'
        ];

        let allFound = true;
        for (const script of requiredScripts) {
            const scriptPath = path.join(scriptsDir, script);
            if (fs.existsSync(scriptPath)) {
                this.log(`Script ${script} encontrado`, 'success');
            } else {
                this.log(`Script ${script} não encontrado`, 'error');
                allFound = false;
            }
        }
        this.results.scripts = allFound;
    }

    async testApps() {
        try {
            const result = execSync('doctl apps list', { encoding: 'utf8' });
            const lines = result.trim().split('\n');
            if (lines.length > 1) {
                this.log(`${lines.length - 1} aplicação(ões) encontrada(s)`, 'success');
                // Mostrar primeira aplicação como exemplo
                if (lines[1]) {
                    const appInfo = lines[1].split(/\s+/);
                    this.log(`Exemplo: ${appInfo[1]} (ID: ${appInfo[0]})`, 'info');
                }
            } else {
                this.log('Nenhuma aplicação encontrada', 'warning');
            }
        } catch (error) {
            this.log('Erro ao listar aplicações', 'error');
        }
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 RELATÓRIO DE TESTE DO SISTEMA');
        console.log('='.repeat(60));
        
        const tests = [
            { name: 'doctl CLI', status: this.results.doctl },
            { name: 'Autenticação DigitalOcean', status: this.results.auth },
            { name: 'Configuração da App (.do/app.yaml)', status: this.results.appYaml },
            { name: 'Configuração de Ambiente', status: this.results.envConfig },
            { name: 'Scripts de Deploy', status: this.results.scripts }
        ];

        tests.forEach(test => {
            const status = test.status ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${test.name}`);
        });

        const passedTests = tests.filter(t => t.status).length;
        const totalTests = tests.length;
        
        console.log('\n' + '-'.repeat(60));
        console.log(`📈 RESULTADO: ${passedTests}/${totalTests} testes passaram`);
        
        if (passedTests === totalTests) {
            console.log('🎉 Sistema pronto para deploy!');
        } else {
            console.log('⚠️ Alguns componentes precisam de atenção.');
        }
        console.log('='.repeat(60));
    }

    async run() {
        console.log('🧪 TESTE DO SISTEMA DE DEPLOY DIGITALOCEAN');
        console.log('FisioFlow AI Studio\n');

        this.log('Iniciando testes do sistema...', 'info');
        
        await this.testDoctl();
        await this.testAuth();
        await this.testAppYaml();
        await this.testEnvConfig();
        await this.testScripts();
        await this.testApps();
        
        this.generateReport();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const tester = new SystemTester();
    tester.run().catch(console.error);
}

module.exports = SystemTester;