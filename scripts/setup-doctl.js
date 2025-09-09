#!/usr/bin/env node

/**
 * Script para instalação e configuração automática do DigitalOcean CLI (doctl)
 * Autor: FisioFlow AI Studio
 * Data: 2024
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

class DoctlSetup {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.platform = os.platform();
        this.arch = os.arch();
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

        console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
    }

    async checkDoctlInstalled() {
        try {
            const version = execSync('doctl version', { encoding: 'utf8', stdio: 'pipe' });
            this.log(`doctl já está instalado: ${version.trim()}`, 'success');
            return true;
        } catch (error) {
            this.log('doctl não encontrado. Será necessário instalar.', 'warning');
            return false;
        }
    }

    async installDoctl() {
        this.log('🚀 Iniciando instalação do doctl...', 'info');
        
        try {
            if (this.platform === 'win32') {
                await this.installDoctlWindows();
            } else if (this.platform === 'darwin') {
                await this.installDoctlMacOS();
            } else {
                await this.installDoctlLinux();
            }
            
            this.log('doctl instalado com sucesso!', 'success');
        } catch (error) {
            this.log(`Erro na instalação: ${error.message}`, 'error');
            throw error;
        }
    }

    async installDoctlWindows() {
        this.log('Instalando doctl no Windows...', 'info');
        
        // Verifica se o Chocolatey está disponível
        try {
            execSync('choco --version', { stdio: 'pipe' });
            this.log('Usando Chocolatey para instalar doctl...', 'info');
            execSync('choco install doctl -y', { stdio: 'inherit' });
        } catch (error) {
            // Fallback para instalação manual
            this.log('Chocolatey não encontrado. Fazendo download manual...', 'warning');
            await this.downloadDoctlManually();
        }
    }

    async installDoctlMacOS() {
        this.log('Instalando doctl no macOS...', 'info');
        
        try {
            execSync('brew --version', { stdio: 'pipe' });
            this.log('Usando Homebrew para instalar doctl...', 'info');
            execSync('brew install doctl', { stdio: 'inherit' });
        } catch (error) {
            this.log('Homebrew não encontrado. Fazendo download manual...', 'warning');
            await this.downloadDoctlManually();
        }
    }

    async installDoctlLinux() {
        this.log('Instalando doctl no Linux...', 'info');
        
        try {
            // Tenta usar snap primeiro
            execSync('snap --version', { stdio: 'pipe' });
            this.log('Usando Snap para instalar doctl...', 'info');
            execSync('sudo snap install doctl', { stdio: 'inherit' });
        } catch (error) {
            this.log('Snap não encontrado. Fazendo download manual...', 'warning');
            await this.downloadDoctlManually();
        }
    }

    async downloadDoctlManually() {
        this.log('📥 Fazendo download manual do doctl...', 'info');
        
        const version = '1.104.0'; // Versão mais recente conhecida
        let downloadUrl;
        let fileName;
        
        if (this.platform === 'win32') {
            fileName = `doctl-${version}-windows-amd64.zip`;
            downloadUrl = `https://github.com/digitalocean/doctl/releases/download/v${version}/${fileName}`;
        } else if (this.platform === 'darwin') {
            fileName = `doctl-${version}-darwin-amd64.tar.gz`;
            downloadUrl = `https://github.com/digitalocean/doctl/releases/download/v${version}/${fileName}`;
        } else {
            fileName = `doctl-${version}-linux-amd64.tar.gz`;
            downloadUrl = `https://github.com/digitalocean/doctl/releases/download/v${version}/${fileName}`;
        }
        
        this.log(`Baixando de: ${downloadUrl}`, 'info');
        
        // Usar curl ou wget para download
        try {
            execSync(`curl -L -o ${fileName} ${downloadUrl}`, { stdio: 'inherit' });
        } catch (error) {
            try {
                execSync(`wget -O ${fileName} ${downloadUrl}`, { stdio: 'inherit' });
            } catch (error2) {
                throw new Error('Não foi possível baixar o doctl. Instale curl ou wget.');
            }
        }
        
        // Extrair e instalar
        await this.extractAndInstallDoctl(fileName);
    }

    async extractAndInstallDoctl(fileName) {
        this.log('📦 Extraindo e instalando doctl...', 'info');
        
        try {
            if (fileName.endsWith('.zip')) {
                execSync(`unzip -o ${fileName}`, { stdio: 'inherit' });
            } else {
                execSync(`tar -xzf ${fileName}`, { stdio: 'inherit' });
            }
            
            // Mover para diretório do sistema
            if (this.platform === 'win32') {
                const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
                const doctlDir = path.join(programFiles, 'doctl');
                
                if (!fs.existsSync(doctlDir)) {
                    fs.mkdirSync(doctlDir, { recursive: true });
                }
                
                execSync(`move doctl.exe "${doctlDir}"`, { stdio: 'inherit' });
                
                // Adicionar ao PATH
                this.log('Adicionando doctl ao PATH do sistema...', 'info');
                this.log(`Adicione manualmente ao PATH: ${doctlDir}`, 'warning');
            } else {
                execSync('sudo mv doctl /usr/local/bin/', { stdio: 'inherit' });
                execSync('sudo chmod +x /usr/local/bin/doctl', { stdio: 'inherit' });
            }
            
            // Limpar arquivos temporários
            fs.unlinkSync(fileName);
            
        } catch (error) {
            throw new Error(`Erro ao extrair/instalar: ${error.message}`);
        }
    }

    async authenticateDoctl() {
        this.log('🔐 Configurando autenticação do doctl...', 'info');
        
        const token = await this.question('\n🔑 Digite seu DigitalOcean API Token: ');
        
        if (!token || token.trim().length === 0) {
            throw new Error('Token é obrigatório!');
        }
        
        try {
            execSync(`doctl auth init --access-token ${token.trim()}`, { stdio: 'inherit' });
            this.log('Autenticação configurada com sucesso!', 'success');
            
            // Testar autenticação
            const account = execSync('doctl account get', { encoding: 'utf8' });
            this.log('✅ Teste de autenticação bem-sucedido:', 'success');
            console.log(account);
            
        } catch (error) {
            throw new Error(`Erro na autenticação: ${error.message}`);
        }
    }

    async verifyInstallation() {
        this.log('🔍 Verificando instalação...', 'info');
        
        try {
            const version = execSync('doctl version', { encoding: 'utf8' });
            const account = execSync('doctl account get', { encoding: 'utf8' });
            
            this.log('✅ Instalação verificada com sucesso!', 'success');
            console.log('\n📋 Informações da instalação:');
            console.log('Versão:', version.trim());
            console.log('Conta:', account.trim());
            
            return true;
        } catch (error) {
            this.log(`❌ Erro na verificação: ${error.message}`, 'error');
            return false;
        }
    }

    async run() {
        try {
            console.log('\n🚀 DigitalOcean CLI Setup - FisioFlow AI Studio\n');
            
            // Verificar se já está instalado
            const isInstalled = await this.checkDoctlInstalled();
            
            if (!isInstalled) {
                const shouldInstall = await this.question('\n❓ Deseja instalar o doctl agora? (s/n): ');
                
                if (shouldInstall.toLowerCase() === 's' || shouldInstall.toLowerCase() === 'sim') {
                    await this.installDoctl();
                } else {
                    this.log('Instalação cancelada pelo usuário.', 'warning');
                    return false;
                }
            }
            
            // Configurar autenticação
            const shouldAuth = await this.question('\n❓ Deseja configurar a autenticação agora? (s/n): ');
            
            if (shouldAuth.toLowerCase() === 's' || shouldAuth.toLowerCase() === 'sim') {
                await this.authenticateDoctl();
            }
            
            // Verificar instalação final
            const isWorking = await this.verifyInstallation();
            
            if (isWorking) {
                this.log('\n🎉 Setup do doctl concluído com sucesso!', 'success');
                this.log('Agora você pode usar o script de deploy automatizado.', 'info');
            }
            
            return isWorking;
            
        } catch (error) {
            this.log(`❌ Erro durante o setup: ${error.message}`, 'error');
            return false;
        } finally {
            this.rl.close();
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const setup = new DoctlSetup();
    setup.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = DoctlSetup;