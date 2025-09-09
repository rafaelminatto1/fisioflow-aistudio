#!/usr/bin/env node

/**
 * Script de Monitoramento de Deploy e Health Checks
 * DigitalOcean App Platform - FisioFlow AI Studio
 * Autor: FisioFlow Team
 * Data: 2024
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const readline = require('readline');

class DigitalOceanMonitor {
    constructor(appName = 'fisioflow-aistudio') {
        this.appName = appName;
        this.appId = null;
        this.deploymentId = null;
        this.appUrl = null;
        this.monitoringActive = false;
        this.healthCheckInterval = null;
        this.deployCheckInterval = null;
        
        // Configurações de monitoramento
        this.config = {
            deployCheckInterval: 10000,  // 10 segundos
            healthCheckInterval: 30000,  // 30 segundos
            maxDeployTime: 1800000,      // 30 minutos
            maxHealthCheckRetries: 5,
            healthCheckTimeout: 10000    // 10 segundos
        };
        
        // Estatísticas
        this.stats = {
            deployStartTime: null,
            deployEndTime: null,
            totalHealthChecks: 0,
            successfulHealthChecks: 0,
            failedHealthChecks: 0,
            deploymentStages: []
        };
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',     // Cyan
            success: '\x1b[32m',  // Green
            warning: '\x1b[33m',  // Yellow
            error: '\x1b[31m',    // Red
            deploy: '\x1b[35m',   // Magenta
            health: '\x1b[34m',   // Blue
            reset: '\x1b[0m'
        };
        
        const prefix = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            deploy: '🚀',
            health: '🏥'
        };

        const timestamp = new Date().toLocaleTimeString();
        console.log(`${colors[type]}[${timestamp}] ${prefix[type]} ${message}${colors.reset}`);
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async checkDoctlAuth() {
        this.log('🔍 Verificando autenticação DigitalOcean...', 'info');
        
        try {
            execSync('doctl account get', { stdio: 'pipe' });
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
            const apps = execSync('doctl apps list --format ID,Name,DefaultIngress --no-header', { encoding: 'utf8' });
            const appLines = apps.trim().split('\n').filter(line => line.trim());
            
            for (const line of appLines) {
                const parts = line.trim().split(/\s+/);
                const [id, name] = parts;
                const url = parts.slice(2).join(' ');
                
                if (name === this.appName) {
                    this.appId = id;
                    this.appUrl = url.startsWith('http') ? url : `https://${url}`;
                    this.log(`Aplicação encontrada: ${name} (${id})`, 'success');
                    this.log(`URL: ${this.appUrl}`, 'info');
                    return true;
                }
            }
            
            this.log('Aplicação não encontrada', 'error');
            return false;
        } catch (error) {
            this.log(`Erro ao procurar aplicação: ${error.message}`, 'error');
            return false;
        }
    }

    async getLatestDeployment() {
        try {
            const deployments = execSync(`doctl apps list-deployments ${this.appId} --format ID,Phase,CreatedAt --no-header`, { encoding: 'utf8' });
            const deploymentLines = deployments.trim().split('\n').filter(line => line.trim());
            
            if (deploymentLines.length > 0) {
                const [id, phase, createdAt] = deploymentLines[0].trim().split(/\s+/);
                return { id, phase, createdAt };
            }
            
            return null;
        } catch (error) {
            this.log(`Erro ao obter deployments: ${error.message}`, 'error');
            return null;
        }
    }

    async getDeploymentDetails(deploymentId) {
        try {
            const details = execSync(`doctl apps get-deployment ${this.appId} ${deploymentId} --format Phase,Progress,CreatedAt,UpdatedAt`, { encoding: 'utf8' });
            const lines = details.trim().split('\n');
            
            if (lines.length >= 2) {
                const [phase, progress, createdAt, updatedAt] = lines[1].split(/\s+/);
                return { phase, progress, createdAt, updatedAt };
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    async getAppLogs(lines = 50) {
        try {
            const logs = execSync(`doctl apps logs ${this.appId} --type run --tail ${lines}`, { encoding: 'utf8' });
            return logs;
        } catch (error) {
            return `Erro ao obter logs: ${error.message}`;
        }
    }

    async performHealthCheck() {
        if (!this.appUrl) {
            this.log('URL da aplicação não disponível', 'warning');
            return false;
        }

        this.stats.totalHealthChecks++;
        
        return new Promise((resolve) => {
            const startTime = Date.now();
            const url = new URL(this.appUrl);
            const client = url.protocol === 'https:' ? https : http;
            
            const req = client.request({
                hostname: url.hostname,
                port: url.port,
                path: '/api/health',
                method: 'GET',
                timeout: this.config.healthCheckTimeout,
                headers: {
                    'User-Agent': 'FisioFlow-Monitor/1.0'
                }
            }, (res) => {
                const responseTime = Date.now() - startTime;
                
                if (res.statusCode === 200) {
                    this.stats.successfulHealthChecks++;
                    this.log(`Health check OK (${responseTime}ms) - Status: ${res.statusCode}`, 'health');
                    resolve(true);
                } else {
                    this.stats.failedHealthChecks++;
                    this.log(`Health check falhou - Status: ${res.statusCode} (${responseTime}ms)`, 'warning');
                    resolve(false);
                }
            });
            
            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                this.stats.failedHealthChecks++;
                this.log(`Health check erro: ${error.message} (${responseTime}ms)`, 'error');
                resolve(false);
            });
            
            req.on('timeout', () => {
                this.stats.failedHealthChecks++;
                this.log(`Health check timeout (${this.config.healthCheckTimeout}ms)`, 'warning');
                req.destroy();
                resolve(false);
            });
            
            req.end();
        });
    }

    async performBasicConnectivityCheck() {
        if (!this.appUrl) {
            return false;
        }

        return new Promise((resolve) => {
            const startTime = Date.now();
            const url = new URL(this.appUrl);
            const client = url.protocol === 'https:' ? https : http;
            
            const req = client.request({
                hostname: url.hostname,
                port: url.port,
                path: '/',
                method: 'HEAD',
                timeout: this.config.healthCheckTimeout
            }, (res) => {
                const responseTime = Date.now() - startTime;
                
                if (res.statusCode < 500) {
                    this.log(`Conectividade OK (${responseTime}ms) - Status: ${res.statusCode}`, 'health');
                    resolve(true);
                } else {
                    this.log(`Conectividade com problemas - Status: ${res.statusCode} (${responseTime}ms)`, 'warning');
                    resolve(false);
                }
            });
            
            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                this.log(`Conectividade erro: ${error.message} (${responseTime}ms)`, 'error');
                resolve(false);
            });
            
            req.on('timeout', () => {
                this.log(`Conectividade timeout (${this.config.healthCheckTimeout}ms)`, 'warning');
                req.destroy();
                resolve(false);
            });
            
            req.end();
        });
    }

    async monitorDeployment(deploymentId) {
        this.deploymentId = deploymentId;
        this.stats.deployStartTime = Date.now();
        this.monitoringActive = true;
        
        this.log(`🚀 Iniciando monitoramento do deployment: ${deploymentId}`, 'deploy');
        
        return new Promise((resolve) => {
            const checkDeployment = async () => {
                if (!this.monitoringActive) {
                    resolve(false);
                    return;
                }
                
                const details = await this.getDeploymentDetails(deploymentId);
                
                if (details) {
                    const { phase, progress } = details;
                    
                    // Registrar estágio se mudou
                    const lastStage = this.stats.deploymentStages[this.stats.deploymentStages.length - 1];
                    if (!lastStage || lastStage.phase !== phase) {
                        this.stats.deploymentStages.push({
                            phase,
                            timestamp: Date.now(),
                            progress
                        });
                        
                        this.log(`Deploy ${phase} - Progresso: ${progress || 'N/A'}`, 'deploy');
                    }
                    
                    // Verificar se terminou
                    if (phase === 'ACTIVE') {
                        this.stats.deployEndTime = Date.now();
                        this.log('🎉 Deploy concluído com sucesso!', 'success');
                        this.monitoringActive = false;
                        resolve(true);
                        return;
                    } else if (phase === 'ERROR' || phase === 'CANCELED') {
                        this.stats.deployEndTime = Date.now();
                        this.log(`❌ Deploy falhou: ${phase}`, 'error');
                        
                        // Mostrar logs de erro
                        this.log('📋 Últimos logs da aplicação:', 'info');
                        const logs = await this.getAppLogs(20);
                        console.log(logs);
                        
                        this.monitoringActive = false;
                        resolve(false);
                        return;
                    }
                }
                
                // Verificar timeout
                const elapsed = Date.now() - this.stats.deployStartTime;
                if (elapsed > this.config.maxDeployTime) {
                    this.log('⏰ Timeout do deployment atingido', 'error');
                    this.monitoringActive = false;
                    resolve(false);
                    return;
                }
                
                // Continuar monitoramento
                setTimeout(checkDeployment, this.config.deployCheckInterval);
            };
            
            checkDeployment();
        });
    }

    async startHealthCheckMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        
        this.log('🏥 Iniciando monitoramento de health checks...', 'health');
        
        // Health check inicial
        await this.sleep(5000); // Aguardar 5 segundos após deploy
        await this.performHealthCheck();
        
        // Health checks periódicos
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthCheck();
        }, this.config.healthCheckInterval);
    }

    async stopHealthCheckMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            this.log('🏥 Monitoramento de health checks parado', 'info');
        }
    }

    async showDeploymentSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMO DO DEPLOYMENT');
        console.log('='.repeat(60));
        
        if (this.stats.deployStartTime && this.stats.deployEndTime) {
            const duration = this.stats.deployEndTime - this.stats.deployStartTime;
            const minutes = Math.floor(duration / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);
            
            console.log(`⏱️  Duração total: ${minutes}m ${seconds}s`);
        }
        
        console.log(`🚀 Estágios do deployment: ${this.stats.deploymentStages.length}`);
        
        if (this.stats.deploymentStages.length > 0) {
            console.log('\n📋 Histórico de estágios:');
            for (const stage of this.stats.deploymentStages) {
                const time = new Date(stage.timestamp).toLocaleTimeString();
                console.log(`  [${time}] ${stage.phase} - ${stage.progress || 'N/A'}`);
            }
        }
        
        console.log(`\n🏥 Health checks realizados: ${this.stats.totalHealthChecks}`);
        console.log(`✅ Sucessos: ${this.stats.successfulHealthChecks}`);
        console.log(`❌ Falhas: ${this.stats.failedHealthChecks}`);
        
        if (this.stats.totalHealthChecks > 0) {
            const successRate = (this.stats.successfulHealthChecks / this.stats.totalHealthChecks * 100).toFixed(1);
            console.log(`📈 Taxa de sucesso: ${successRate}%`);
        }
        
        if (this.appUrl) {
            console.log(`\n🌐 URL da aplicação: ${this.appUrl}`);
            console.log(`🔗 Health check: ${this.appUrl}/api/health`);
        }
        
        console.log('\n' + '='.repeat(60));
    }

    async runFullMonitoring() {
        try {
            console.log('\n🔧 MONITOR DE DEPLOYMENT DIGITALOCEAN');
            console.log('FisioFlow AI Studio - Monitoramento Completo\n');
            
            // 1. Verificar autenticação
            if (!(await this.checkDoctlAuth())) {
                return false;
            }
            
            // 2. Encontrar aplicação
            if (!(await this.findApp())) {
                return false;
            }
            
            // 3. Obter último deployment
            const deployment = await this.getLatestDeployment();
            if (!deployment) {
                this.log('Nenhum deployment encontrado', 'error');
                return false;
            }
            
            this.log(`Último deployment: ${deployment.id} (${deployment.phase})`, 'info');
            
            // 4. Se deployment está em progresso, monitorar
            if (deployment.phase === 'PENDING_DEPLOY' || deployment.phase === 'DEPLOYING') {
                this.log('Deployment em progresso detectado', 'deploy');
                
                // Iniciar health check monitoring em paralelo
                setTimeout(() => this.startHealthCheckMonitoring(), 30000);
                
                // Monitorar deployment
                const success = await this.monitorDeployment(deployment.id);
                
                if (success) {
                    // Aguardar um pouco e fazer health checks finais
                    await this.sleep(10000);
                    
                    this.log('🔍 Executando verificações finais...', 'health');
                    
                    // Teste de conectividade
                    await this.performBasicConnectivityCheck();
                    
                    // Health checks finais
                    for (let i = 0; i < 3; i++) {
                        await this.performHealthCheck();
                        if (i < 2) await this.sleep(5000);
                    }
                }
                
                await this.stopHealthCheckMonitoring();
                
            } else if (deployment.phase === 'ACTIVE') {
                this.log('Aplicação já está ativa', 'success');
                
                // Fazer alguns health checks
                this.log('🔍 Executando health checks...', 'health');
                
                await this.performBasicConnectivityCheck();
                
                for (let i = 0; i < 3; i++) {
                    await this.performHealthCheck();
                    if (i < 2) await this.sleep(5000);
                }
                
            } else {
                this.log(`Deployment em estado: ${deployment.phase}`, 'warning');
                
                // Mostrar logs se houver erro
                if (deployment.phase === 'ERROR') {
                    this.log('📋 Logs da aplicação:', 'info');
                    const logs = await this.getAppLogs(30);
                    console.log(logs);
                }
            }
            
            // 5. Mostrar resumo
            await this.showDeploymentSummary();
            
            return true;
            
        } catch (error) {
            this.log(`❌ Erro durante monitoramento: ${error.message}`, 'error');
            return false;
        }
    }

    async runContinuousMonitoring(duration = 300000) { // 5 minutos por padrão
        console.log('\n🔄 MONITORAMENTO CONTÍNUO');
        console.log(`Duração: ${duration / 60000} minutos\n`);
        
        if (!(await this.checkDoctlAuth()) || !(await this.findApp())) {
            return false;
        }
        
        const startTime = Date.now();
        await this.startHealthCheckMonitoring();
        
        // Monitoramento contínuo
        const monitorInterval = setInterval(async () => {
            const elapsed = Date.now() - startTime;
            
            if (elapsed >= duration) {
                clearInterval(monitorInterval);
                await this.stopHealthCheckMonitoring();
                
                this.log('⏰ Monitoramento contínuo finalizado', 'info');
                await this.showDeploymentSummary();
                return;
            }
            
            // Verificar status da aplicação periodicamente
            const deployment = await this.getLatestDeployment();
            if (deployment && deployment.phase !== 'ACTIVE') {
                this.log(`⚠️ Status da aplicação mudou: ${deployment.phase}`, 'warning');
            }
        }, 60000); // Verificar a cada minuto
        
        return true;
    }
}

// Função para executar via linha de comando
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'monitor';
    const appName = args[1] || 'fisioflow-aistudio';
    
    const monitor = new DigitalOceanMonitor(appName);
    
    switch (command) {
        case 'monitor':
        case 'full':
            await monitor.runFullMonitoring();
            break;
            
        case 'continuous':
            const duration = parseInt(args[2]) || 300000; // 5 minutos padrão
            await monitor.runContinuousMonitoring(duration);
            break;
            
        case 'health':
            if (await monitor.checkDoctlAuth() && await monitor.findApp()) {
                console.log('\n🏥 HEALTH CHECK ÚNICO\n');
                
                await monitor.performBasicConnectivityCheck();
                await monitor.performHealthCheck();
                
                console.log('\n📊 Resultado:');
                console.log(`Total: ${monitor.stats.totalHealthChecks}`);
                console.log(`Sucessos: ${monitor.stats.successfulHealthChecks}`);
                console.log(`Falhas: ${monitor.stats.failedHealthChecks}`);
            }
            break;
            
        case 'logs':
            if (await monitor.checkDoctlAuth() && await monitor.findApp()) {
                const lines = parseInt(args[2]) || 50;
                console.log(`\n📋 ÚLTIMOS ${lines} LOGS\n`);
                const logs = await monitor.getAppLogs(lines);
                console.log(logs);
            }
            break;
            
        default:
            console.log('\n🔧 MONITOR DE DEPLOYMENT DIGITALOCEAN');
            console.log('Uso: node monitor-deploy-digitalocean.js [comando] [app-name] [opções]\n');
            console.log('Comandos disponíveis:');
            console.log('  monitor, full    - Monitoramento completo (padrão)');
            console.log('  continuous [ms]  - Monitoramento contínuo por X milissegundos');
            console.log('  health          - Health check único');
            console.log('  logs [lines]    - Mostrar logs da aplicação');
            console.log('\nExemplos:');
            console.log('  node monitor-deploy-digitalocean.js');
            console.log('  node monitor-deploy-digitalocean.js continuous 600000');
            console.log('  node monitor-deploy-digitalocean.js health');
            console.log('  node monitor-deploy-digitalocean.js logs 100');
            break;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    });
}

module.exports = DigitalOceanMonitor;