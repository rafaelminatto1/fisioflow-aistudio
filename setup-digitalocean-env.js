#!/usr/bin/env node

/**
 * Script para configurar variáveis de ambiente para DigitalOcean App Platform
 * Gera valores seguros e exibe instruções de configuração
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateSecureSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

function generateStatusToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

function main() {
  log('\n🚀 CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE - DIGITALOCEAN', 'cyan');
  log('=' .repeat(60), 'cyan');

  // Gerar valores seguros
  const nextAuthSecret = generateSecureSecret(32);
  const encryptionKey = generateEncryptionKey();
  const statusToken = generateStatusToken();

  // Ler configuração atual se existir
  let currentEnv = {};
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          currentEnv[key.trim()] = valueParts.join('=').trim().replace(/"/g, '');
        }
      });
      log('✅ Arquivo .env.local encontrado e carregado', 'green');
    } catch (error) {
      log('⚠️  Erro ao ler .env.local, usando valores padrão', 'yellow');
    }
  }

  log('\n📋 VARIÁVEIS OBRIGATÓRIAS PARA DIGITALOCEAN:', 'bright');
  log('-'.repeat(50), 'blue');

  const requiredVars = [
    {
      key: 'NODE_ENV',
      value: 'production',
      description: 'Ambiente de execução',
      type: 'Plain Text'
    },
    {
      key: 'NEXT_TELEMETRY_DISABLED',
      value: '1',
      description: 'Desabilita telemetria do Next.js',
      type: 'Plain Text'
    },
    {
      key: 'PORT',
      value: '3000',
      description: 'Porta da aplicação',
      type: 'Plain Text'
    },
    {
      key: 'NEXTAUTH_SECRET',
      value: nextAuthSecret,
      description: 'Secret para NextAuth (CRÍTICO)',
      type: 'Encrypted'
    },
    {
      key: 'NEXTAUTH_URL',
      value: '${APP_URL}',
      description: 'URL da aplicação (automático)',
      type: 'Plain Text'
    },
    {
      key: 'DATABASE_URL',
      value: currentEnv.DATABASE_URL || 'postgresql://user:pass@host:5432/db?sslmode=require',
      description: 'URL do banco de dados Neon',
      type: 'Encrypted'
    }
  ];

  // Exibir variáveis obrigatórias
  requiredVars.forEach((envVar, index) => {
    log(`\n${index + 1}. ${envVar.key}`, 'yellow');
    log(`   Valor: ${envVar.value}`, 'white');
    log(`   Tipo: ${envVar.type}`, 'blue');
    log(`   Descrição: ${envVar.description}`, 'magenta');
  });

  log('\n🔐 VARIÁVEIS OPCIONAIS (APIs):', 'bright');
  log('-'.repeat(50), 'blue');

  const optionalVars = [
    {
      key: 'OPENAI_API_KEY',
      value: currentEnv.OPENAI_API_KEY || 'sk-...',
      description: 'API Key do OpenAI (se usar IA)',
      type: 'Encrypted'
    },
    {
      key: 'ANTHROPIC_API_KEY',
      value: currentEnv.ANTHROPIC_API_KEY || 'sk-ant-...',
      description: 'API Key do Anthropic Claude',
      type: 'Encrypted'
    },
    {
      key: 'GEMINI_API_KEY',
      value: currentEnv.GEMINI_API_KEY || 'AI...',
      description: 'API Key do Google Gemini',
      type: 'Encrypted'
    },
    {
      key: 'ENCRYPTION_KEY',
      value: encryptionKey,
      description: 'Chave de criptografia interna',
      type: 'Encrypted'
    },
    {
      key: 'STATUS_CHECK_TOKEN',
      value: statusToken,
      description: 'Token para verificações de status',
      type: 'Encrypted'
    }
  ];

  optionalVars.forEach((envVar, index) => {
    log(`\n${index + 1}. ${envVar.key}`, 'yellow');
    log(`   Valor: ${envVar.value}`, 'white');
    log(`   Tipo: ${envVar.type}`, 'blue');
    log(`   Descrição: ${envVar.description}`, 'magenta');
  });

  log('\n📝 INSTRUÇÕES DE CONFIGURAÇÃO:', 'bright');
  log('=' .repeat(60), 'cyan');

  log('\n1. Acesse o painel DigitalOcean:', 'green');
  log('   https://cloud.digitalocean.com/apps', 'blue');

  log('\n2. Vá para sua aplicação → Settings → Environment Variables', 'green');

  log('\n3. Configure as variáveis OBRIGATÓRIAS:', 'green');
  log('   ⚠️  Use tipo "Encrypted" para dados sensíveis', 'yellow');
  log('   ⚠️  Use tipo "Plain Text" para configurações simples', 'yellow');

  log('\n4. Variáveis críticas que DEVEM ser configuradas:', 'red');
  log('   • NEXTAUTH_SECRET (gerado acima)', 'red');
  log('   • DATABASE_URL (do seu banco Neon)', 'red');

  log('\n🔧 COMANDOS ÚTEIS:', 'bright');
  log('-'.repeat(30), 'blue');

  log('\n# Verificar variáveis atuais:', 'green');
  log('doctl apps get [APP-ID] --format json | jq ".spec.services[0].envs"', 'white');

  log('\n# Atualizar app.yaml e fazer redeploy:', 'green');
  log('doctl apps update [APP-ID] --spec .do/app.yaml', 'white');

  log('\n# Ver logs em tempo real:', 'green');
  log('doctl apps logs [APP-ID] --follow', 'white');

  // Salvar configuração para referência
  const configOutput = {
    timestamp: new Date().toISOString(),
    required: requiredVars,
    optional: optionalVars,
    instructions: [
      'Configure as variáveis no painel DigitalOcean',
      'Use tipo "Encrypted" para dados sensíveis',
      'Teste o deploy após configuração',
      'Monitore logs para verificar funcionamento'
    ]
  };

  const configPath = path.join(process.cwd(), 'digitalocean-env-config.json');
  fs.writeFileSync(configPath, JSON.stringify(configOutput, null, 2));

  log('\n💾 CONFIGURAÇÃO SALVA:', 'bright');
  log(`   Arquivo: ${configPath}`, 'blue');
  log('   Use este arquivo como referência', 'magenta');

  log('\n⚠️  IMPORTANTE:', 'red');
  log('• NUNCA commite secrets no repositório', 'red');
  log('• Use sempre tipo "Encrypted" para API keys', 'red');
  log('• Teste a aplicação após configurar', 'red');
  log('• Monitore logs para verificar erros', 'red');

  log('\n✅ Configuração concluída! Agora configure no painel DigitalOcean.', 'green');
  log('\n🚀 Após configurar, faça o deploy da aplicação!', 'cyan');
}

if (require.main === module) {
  main();
}

module.exports = {
  generateSecureSecret,
  generateEncryptionKey,
  generateStatusToken
};