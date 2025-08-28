#!/usr/bin/env node

/**
 * Sistema de Alertas FisioFlow
 * Gerencia notificações e alertas sobre problemas do sistema
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const DiagnosticFramework = require('./diagnostic-framework');

class AlertSystem {
  constructor() {
    this.diagnostic = new DiagnosticFramework();
    this.alertHistory = [];
    this.alertRules = [];
    this.notificationChannels = new Map();
    this.logPath = path.join(__dirname, '..', 'logs', 'alerts.log');
    this.configPath = path.join(__dirname, '..', 'config', 'alert-config.json');
    
    this.initializeAlertRules();
    this.loadConfiguration();
  }

  // Inicializar regras de alerta
  initializeAlertRules() {
    this.alertRules = [
      {
        id: 'critical-errors',
        name: 'Erros Críticos',
        condition: (report) => report.summary.critical > 0,
        severity: 'critical',
        cooldown: 5 * 60 * 1000, // 5 minutos
        channels: ['console', 'email', 'file'],
        template: 'critical-error'
      },
      {
        id: 'high-priority-issues',
        name: 'Problemas de Alta Prioridade',
        condition: (report) => report.summary.high >= 3,
        severity: 'high',
        cooldown: 15 * 60 * 1000, // 15 minutos
        channels: ['console', 'email'],
        template: 'high-priority'
      },
      {
        id: 'database-connection-failure',
        name: 'Falha na Conexão com Banco',
        condition: (report) => report.issues.some(issue => 
          issue.category === 'database' && issue.severity === 'critical'
        ),
        severity: 'critical',
        cooldown: 2 * 60 * 1000, // 2 minutos
        channels: ['console', 'email', 'webhook'],
        template: 'database-failure'
      },
      {
        id: 'build-failures',
        name: 'Falhas de Build',
        condition: (report) => report.issues.some(issue => 
          issue.category === 'build' && issue.severity === 'high'
        ),
        severity: 'high',
        cooldown: 10 * 60 * 1000, // 10 minutos
        channels: ['console', 'email'],
        template: 'build-failure'
      },
      {
        id: 'dependency-vulnerabilities',
        name: 'Vulnerabilidades de Dependências',
        condition: (report) => report.issues.some(issue => 
          issue.category === 'dependencies' && 
          (issue.severity === 'critical' || issue.severity === 'high')
        ),
        severity: 'medium',
        cooldown: 60 * 60 * 1000, // 1 hora
        channels: ['console', 'email'],
        template: 'vulnerability'
      },
      {
        id: 'performance-degradation',
        name: 'Degradação de Performance',
        condition: (report) => report.issues.some(issue => 
          issue.category === 'performance' && issue.severity === 'medium'
        ),
        severity: 'medium',
        cooldown: 30 * 60 * 1000, // 30 minutos
        channels: ['console'],
        template: 'performance'
      },
      {
        id: 'disk-space-warning',
        name: 'Aviso de Espaço em Disco',
        condition: (report) => report.issues.some(issue => 
          issue.category === 'system' && issue.description.includes('disk space')
        ),
        severity: 'medium',
        cooldown: 60 * 60 * 1000, // 1 hora
        channels: ['console', 'email'],
        template: 'disk-space'
      },
      {
        id: 'environment-config-issues',
        name: 'Problemas de Configuração',
        condition: (report) => report.issues.some(issue => 
          issue.category === 'environment' && issue.severity === 'high'
        ),
        severity: 'high',
        cooldown: 15 * 60 * 1000, // 15 minutos
        channels: ['console', 'email'],
        template: 'config-issue'
      }
    ];
  }

  // Carregar configuração
  loadConfiguration() {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.setupNotificationChannels(config);
      } else {
        this.createDefaultConfiguration();
      }
    } catch (error) {
      this.log(`Erro ao carregar configuração: ${error.message}`);
      this.createDefaultConfiguration();
    }
  }

  // Criar configuração padrão
  createDefaultConfiguration() {
    const defaultConfig = {
      email: {
        enabled: false,
        smtp: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: '',
            pass: ''
          }
        },
        from: '',
        to: [],
        subject: '[FisioFlow] Alerta do Sistema'
      },
      webhook: {
        enabled: false,
        url: '',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      slack: {
        enabled: false,
        webhookUrl: '',
        channel: '#alerts',
        username: 'FisioFlow Bot'
      },
      discord: {
        enabled: false,
        webhookUrl: ''
      },
      console: {
        enabled: true,
        colors: true
      },
      file: {
        enabled: true,
        path: this.logPath
      }
    };

    // Criar diretório de configuração
    fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
    fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    
    this.setupNotificationChannels(defaultConfig);
  }

  // Configurar canais de notificação
  setupNotificationChannels(config) {
    // Console
    if (config.console?.enabled) {
      this.notificationChannels.set('console', {
        type: 'console',
        config: config.console,
        send: this.sendConsoleAlert.bind(this)
      });
    }

    // Email
    if (config.email?.enabled && config.email.smtp.auth.user) {
      const transporter = nodemailer.createTransporter(config.email.smtp);
      this.notificationChannels.set('email', {
        type: 'email',
        config: config.email,
        transporter,
        send: this.sendEmailAlert.bind(this)
      });
    }

    // Webhook
    if (config.webhook?.enabled && config.webhook.url) {
      this.notificationChannels.set('webhook', {
        type: 'webhook',
        config: config.webhook,
        send: this.sendWebhookAlert.bind(this)
      });
    }

    // Slack
    if (config.slack?.enabled && config.slack.webhookUrl) {
      this.notificationChannels.set('slack', {
        type: 'slack',
        config: config.slack,
        send: this.sendSlackAlert.bind(this)
      });
    }

    // Discord
    if (config.discord?.enabled && config.discord.webhookUrl) {
      this.notificationChannels.set('discord', {
        type: 'discord',
        config: config.discord,
        send: this.sendDiscordAlert.bind(this)
      });
    }

    // File
    if (config.file?.enabled) {
      this.notificationChannels.set('file', {
        type: 'file',
        config: config.file,
        send: this.sendFileAlert.bind(this)
      });
    }
  }

  // Processar relatório de diagnóstico
  async processReport(report) {
    const triggeredRules = [];

    for (const rule of this.alertRules) {
      if (rule.condition(report)) {
        if (this.shouldTriggerAlert(rule)) {
          triggeredRules.push(rule);
          await this.triggerAlert(rule, report);
        }
      }
    }

    return {
      triggeredRules: triggeredRules.length,
      rules: triggeredRules.map(r => r.name)
    };
  }

  // Verificar se deve disparar alerta (cooldown)
  shouldTriggerAlert(rule) {
    const lastAlert = this.alertHistory
      .filter(alert => alert.ruleId === rule.id)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!lastAlert) return true;

    const timeSinceLastAlert = Date.now() - lastAlert.timestamp;
    return timeSinceLastAlert >= rule.cooldown;
  }

  // Disparar alerta
  async triggerAlert(rule, report) {
    const alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      timestamp: Date.now(),
      report: this.summarizeReport(report),
      channels: rule.channels
    };

    this.alertHistory.push(alert);
    this.log(`Alerta disparado: ${rule.name} (${rule.severity})`);

    // Enviar para canais configurados
    for (const channelName of rule.channels) {
      const channel = this.notificationChannels.get(channelName);
      if (channel) {
        try {
          await channel.send(alert, rule.template);
        } catch (error) {
          this.log(`Erro ao enviar alerta para ${channelName}: ${error.message}`);
        }
      }
    }

    // Limpar histórico antigo
    this.cleanupAlertHistory();
  }

  // Gerar ID único para alerta
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Resumir relatório para alerta
  summarizeReport(report) {
    return {
      summary: report.summary,
      criticalIssues: report.issues.filter(i => i.severity === 'critical'),
      highIssues: report.issues.filter(i => i.severity === 'high'),
      timestamp: report.timestamp
    };
  }

  // Implementações dos canais de notificação

  async sendConsoleAlert(alert, template) {
    const colors = {
      critical: '\x1b[31m', // Vermelho
      high: '\x1b[33m',     // Amarelo
      medium: '\x1b[36m',   // Ciano
      low: '\x1b[32m',      // Verde
      reset: '\x1b[0m'
    };

    const color = colors[alert.severity] || colors.reset;
    const icon = this.getSeverityIcon(alert.severity);
    
    console.log(`\n${color}${icon} ALERTA ${alert.severity.toUpperCase()}: ${alert.ruleName}${colors.reset}`);
    console.log(`⏰ ${new Date(alert.timestamp).toLocaleString()}`);
    
    if (alert.report.criticalIssues.length > 0) {
      console.log(`\n🚨 Problemas Críticos (${alert.report.criticalIssues.length}):`);
      alert.report.criticalIssues.forEach(issue => {
        console.log(`   • ${issue.description}`);
      });
    }
    
    if (alert.report.highIssues.length > 0) {
      console.log(`\n⚠️  Problemas de Alta Prioridade (${alert.report.highIssues.length}):`);
      alert.report.highIssues.forEach(issue => {
        console.log(`   • ${issue.description}`);
      });
    }
    
    console.log(`\n📊 Resumo: ${alert.report.summary.critical} críticos, ${alert.report.summary.high} altos, ${alert.report.summary.medium} médios`);
    console.log(`${colors.reset}`);
  }

  async sendEmailAlert(alert, template) {
    const channel = this.notificationChannels.get('email');
    if (!channel) return;

    const subject = `${channel.config.subject} - ${alert.ruleName}`;
    const html = this.generateEmailTemplate(alert, template);
    
    const mailOptions = {
      from: channel.config.from,
      to: channel.config.to,
      subject,
      html
    };

    await channel.transporter.sendMail(mailOptions);
    this.log(`Email enviado para: ${channel.config.to.join(', ')}`);
  }

  async sendWebhookAlert(alert, template) {
    const channel = this.notificationChannels.get('webhook');
    if (!channel) return;

    const payload = {
      alert: {
        id: alert.id,
        rule: alert.ruleName,
        severity: alert.severity,
        timestamp: alert.timestamp,
        summary: alert.report.summary
      },
      issues: {
        critical: alert.report.criticalIssues,
        high: alert.report.highIssues
      },
      system: 'FisioFlow'
    };

    const response = await fetch(channel.config.url, {
      method: channel.config.method,
      headers: channel.config.headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    this.log(`Webhook enviado para: ${channel.config.url}`);
  }

  async sendSlackAlert(alert, template) {
    const channel = this.notificationChannels.get('slack');
    if (!channel) return;

    const color = {
      critical: 'danger',
      high: 'warning',
      medium: 'good',
      low: 'good'
    }[alert.severity] || 'good';

    const payload = {
      channel: channel.config.channel,
      username: channel.config.username,
      icon_emoji: ':warning:',
      attachments: [{
        color,
        title: `🚨 ${alert.ruleName}`,
        text: `Severidade: ${alert.severity.toUpperCase()}`,
        fields: [
          {
            title: 'Problemas Críticos',
            value: alert.report.summary.critical.toString(),
            short: true
          },
          {
            title: 'Problemas Altos',
            value: alert.report.summary.high.toString(),
            short: true
          },
          {
            title: 'Timestamp',
            value: new Date(alert.timestamp).toLocaleString(),
            short: false
          }
        ],
        footer: 'FisioFlow Alert System',
        ts: Math.floor(alert.timestamp / 1000)
      }]
    };

    const response = await fetch(channel.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status}`);
    }

    this.log('Alerta enviado para Slack');
  }

  async sendDiscordAlert(alert, template) {
    const channel = this.notificationChannels.get('discord');
    if (!channel) return;

    const color = {
      critical: 0xFF0000, // Vermelho
      high: 0xFFA500,     // Laranja
      medium: 0xFFFF00,   // Amarelo
      low: 0x00FF00       // Verde
    }[alert.severity] || 0x00FF00;

    const payload = {
      embeds: [{
        title: `🚨 ${alert.ruleName}`,
        description: `Alerta de severidade **${alert.severity.toUpperCase()}** detectado`,
        color,
        fields: [
          {
            name: 'Problemas Críticos',
            value: alert.report.summary.critical.toString(),
            inline: true
          },
          {
            name: 'Problemas Altos',
            value: alert.report.summary.high.toString(),
            inline: true
          },
          {
            name: 'Timestamp',
            value: new Date(alert.timestamp).toLocaleString(),
            inline: false
          }
        ],
        footer: {
          text: 'FisioFlow Alert System'
        },
        timestamp: new Date(alert.timestamp).toISOString()
      }]
    };

    const response = await fetch(channel.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }

    this.log('Alerta enviado para Discord');
  }

  async sendFileAlert(alert, template) {
    const channel = this.notificationChannels.get('file');
    if (!channel) return;

    const alertText = this.formatAlertForFile(alert);
    
    // Criar diretório se não existir
    fs.mkdirSync(path.dirname(channel.config.path), { recursive: true });
    
    fs.appendFileSync(channel.config.path, alertText + '\n');
    this.log(`Alerta salvo em arquivo: ${channel.config.path}`);
  }

  // Utilitários

  getSeverityIcon(severity) {
    const icons = {
      critical: '🚨',
      high: '⚠️',
      medium: '⚡',
      low: 'ℹ️'
    };
    return icons[severity] || 'ℹ️';
  }

  generateEmailTemplate(alert, template) {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
          <div style="border-left: 4px solid ${this.getSeverityColor(alert.severity)}; padding-left: 20px;">
            <h2 style="color: ${this.getSeverityColor(alert.severity)};">
              ${this.getSeverityIcon(alert.severity)} ${alert.ruleName}
            </h2>
            <p><strong>Severidade:</strong> ${alert.severity.toUpperCase()}</p>
            <p><strong>Timestamp:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
            
            <h3>Resumo dos Problemas:</h3>
            <ul>
              <li>Críticos: ${alert.report.summary.critical}</li>
              <li>Altos: ${alert.report.summary.high}</li>
              <li>Médios: ${alert.report.summary.medium}</li>
              <li>Baixos: ${alert.report.summary.low}</li>
            </ul>
            
            ${alert.report.criticalIssues.length > 0 ? `
              <h3>Problemas Críticos:</h3>
              <ul>
                ${alert.report.criticalIssues.map(issue => `<li>${issue.description}</li>`).join('')}
              </ul>
            ` : ''}
            
            ${alert.report.highIssues.length > 0 ? `
              <h3>Problemas de Alta Prioridade:</h3>
              <ul>
                ${alert.report.highIssues.map(issue => `<li>${issue.description}</li>`).join('')}
              </ul>
            ` : ''}
            
            <hr>
            <p style="color: #666; font-size: 12px;">
              Este alerta foi gerado automaticamente pelo Sistema de Alertas FisioFlow.<br>
              ID do Alerta: ${alert.id}
            </p>
          </div>
        </body>
      </html>
    `;
  }

  getSeverityColor(severity) {
    const colors = {
      critical: '#FF0000',
      high: '#FFA500',
      medium: '#FFFF00',
      low: '#00FF00'
    };
    return colors[severity] || '#00FF00';
  }

  formatAlertForFile(alert) {
    const separator = '='.repeat(80);
    const timestamp = new Date(alert.timestamp).toISOString();
    
    let text = `\n${separator}\n`;
    text += `ALERTA: ${alert.ruleName}\n`;
    text += `SEVERIDADE: ${alert.severity.toUpperCase()}\n`;
    text += `TIMESTAMP: ${timestamp}\n`;
    text += `ID: ${alert.id}\n`;
    text += `${separator}\n`;
    
    text += `\nRESUMO DOS PROBLEMAS:\n`;
    text += `- Críticos: ${alert.report.summary.critical}\n`;
    text += `- Altos: ${alert.report.summary.high}\n`;
    text += `- Médios: ${alert.report.summary.medium}\n`;
    text += `- Baixos: ${alert.report.summary.low}\n`;
    
    if (alert.report.criticalIssues.length > 0) {
      text += `\nPROBLEMAS CRÍTICOS:\n`;
      alert.report.criticalIssues.forEach((issue, index) => {
        text += `${index + 1}. ${issue.description}\n`;
      });
    }
    
    if (alert.report.highIssues.length > 0) {
      text += `\nPROBLEMAS DE ALTA PRIORIDADE:\n`;
      alert.report.highIssues.forEach((issue, index) => {
        text += `${index + 1}. ${issue.description}\n`;
      });
    }
    
    text += `\n${separator}\n`;
    
    return text;
  }

  // Limpeza do histórico
  cleanupAlertHistory() {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
    const cutoff = Date.now() - maxAge;
    
    this.alertHistory = this.alertHistory.filter(alert => alert.timestamp > cutoff);
  }

  // Logging
  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    try {
      fs.mkdirSync(path.dirname(this.logPath), { recursive: true });
      fs.appendFileSync(this.logPath, logMessage + '\n');
    } catch (error) {
      console.error('Erro ao escrever log:', error.message);
    }
  }

  // Métodos públicos

  // Testar canal de notificação
  async testChannel(channelName) {
    const channel = this.notificationChannels.get(channelName);
    if (!channel) {
      throw new Error(`Canal ${channelName} não encontrado`);
    }

    const testAlert = {
      id: 'test_alert',
      ruleId: 'test',
      ruleName: 'Teste do Sistema de Alertas',
      severity: 'medium',
      timestamp: Date.now(),
      report: {
        summary: { critical: 0, high: 0, medium: 1, low: 0 },
        criticalIssues: [],
        highIssues: []
      }
    };

    await channel.send(testAlert, 'test');
    this.log(`Teste do canal ${channelName} executado com sucesso`);
  }

  // Obter estatísticas
  getStatistics() {
    const last24h = Date.now() - (24 * 60 * 60 * 1000);
    const recentAlerts = this.alertHistory.filter(alert => alert.timestamp > last24h);
    
    const severityCount = recentAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      totalAlerts: this.alertHistory.length,
      last24h: recentAlerts.length,
      severityBreakdown: severityCount,
      activeChannels: Array.from(this.notificationChannels.keys()),
      alertRules: this.alertRules.length
    };
  }

  // Obter configuração atual
  getConfiguration() {
    try {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    } catch (error) {
      return null;
    }
  }

  // Atualizar configuração
  updateConfiguration(newConfig) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(newConfig, null, 2));
      this.setupNotificationChannels(newConfig);
      this.log('Configuração atualizada com sucesso');
      return true;
    } catch (error) {
      this.log(`Erro ao atualizar configuração: ${error.message}`);
      return false;
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const alertSystem = new AlertSystem();
  
  // Exemplo de uso
  console.log('🚨 Sistema de Alertas FisioFlow');
  console.log('Configuração carregada:', alertSystem.getConfiguration() ? 'Sim' : 'Não');
  console.log('Canais ativos:', Array.from(alertSystem.notificationChannels.keys()).join(', '));
  console.log('Regras de alerta:', alertSystem.alertRules.length);
}

module.exports = AlertSystem;