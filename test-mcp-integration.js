// test-mcp-integration.js
// Teste simples para verificar a configuração MCP

const fs = require('fs');
const path = require('path');

function testMCPConfiguration() {
  console.log('🧪 Iniciando teste de configuração MCP...');

  const results = {
    configFile: false,
    envVariables: false,
    mcpService: false,
    aiProviders: false,
    premiumManager: false,
  };

  try {
    // Teste 1: Verificar se o arquivo de configuração MCP existe
    console.log('\n1. Verificando arquivo mcp.config.json...');
    const configPath = path.join(__dirname, 'mcp.config.json');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      console.log(
        `   ✅ Arquivo encontrado com ${Object.keys(config.providers).length} provedores`
      );
      results.configFile = true;
    } else {
      console.log('   ❌ Arquivo mcp.config.json não encontrado');
    }

    // Teste 2: Verificar variáveis de ambiente
    console.log('\n2. Verificando variáveis de ambiente...');
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const hasGemini = envContent.includes('GEMINI_API_KEY');
      const hasOpenAI = envContent.includes('OPENAI_API_KEY');
      const hasClaude = envContent.includes('ANTHROPIC_API_KEY');
      const hasMCP = envContent.includes('MCP_ENABLED');

      console.log(`   Gemini API Key: ${hasGemini ? '✅' : '❌'}`);
      console.log(`   OpenAI API Key: ${hasOpenAI ? '✅' : '❌'}`);
      console.log(`   Claude API Key: ${hasClaude ? '✅' : '❌'}`);
      console.log(`   MCP Enabled: ${hasMCP ? '✅' : '❌'}`);

      results.envVariables = hasGemini && hasOpenAI && hasClaude && hasMCP;
    } else {
      console.log('   ❌ Arquivo .env não encontrado');
    }

    // Teste 3: Verificar se o mcpService foi criado
    console.log('\n3. Verificando mcpService.ts...');
    const mcpServicePath = path.join(
      __dirname,
      'services',
      'ai-economica',
      'mcpService.ts'
    );
    if (fs.existsSync(mcpServicePath)) {
      const serviceContent = fs.readFileSync(mcpServicePath, 'utf-8');
      const hasClass = serviceContent.includes('class MCPService');
      const hasExport = serviceContent.includes('export const mcpService');
      console.log(`   Classe MCPService: ${hasClass ? '✅' : '❌'}`);
      console.log(`   Export mcpService: ${hasExport ? '✅' : '❌'}`);
      results.mcpService = hasClass && hasExport;
    } else {
      console.log('   ❌ Arquivo mcpService.ts não encontrado');
    }

    // Teste 4: Verificar se aiProviders foi atualizado
    console.log('\n4. Verificando aiProviders.ts...');
    const aiProvidersPath = path.join(
      __dirname,
      'services',
      'ai-economica',
      'aiProviders.ts'
    );
    if (fs.existsSync(aiProvidersPath)) {
      const providersContent = fs.readFileSync(aiProvidersPath, 'utf-8');
      const hasMCPEnabled = providersContent.includes('mcpEnabled');
      const hasApiKeyEnvVar = providersContent.includes('apiKeyEnvVar');
      console.log(`   MCP Enabled property: ${hasMCPEnabled ? '✅' : '❌'}`);
      console.log(`   API Key Env Var: ${hasApiKeyEnvVar ? '✅' : '❌'}`);
      results.aiProviders = hasMCPEnabled && hasApiKeyEnvVar;
    } else {
      console.log('   ❌ Arquivo aiProviders.ts não encontrado');
    }

    // Teste 5: Verificar se premiumAccountManager foi atualizado
    console.log('\n5. Verificando premiumAccountManager.ts...');
    const premiumManagerPath = path.join(
      __dirname,
      'services',
      'ai-economica',
      'premiumAccountManager.ts'
    );
    if (fs.existsSync(premiumManagerPath)) {
      const managerContent = fs.readFileSync(premiumManagerPath, 'utf-8');
      const hasMCPImport = managerContent.includes('import { mcpService }');
      const hasMCPMethods = managerContent.includes('getMCPStatus');
      console.log(`   MCP Import: ${hasMCPImport ? '✅' : '❌'}`);
      console.log(`   MCP Methods: ${hasMCPMethods ? '✅' : '❌'}`);
      results.premiumManager = hasMCPImport && hasMCPMethods;
    } else {
      console.log('   ❌ Arquivo premiumAccountManager.ts não encontrado');
    }

    // Resumo dos resultados
    console.log('\n📊 Resumo dos testes:');
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;

    Object.entries(results).forEach(([test, passed]) => {
      console.log(`   ${test}: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);
    });

    console.log(`\n🎯 Resultado: ${passedTests}/${totalTests} testes passaram`);

    if (passedTests === totalTests) {
      console.log('\n🎉 Todos os testes de configuração MCP passaram!');
      return true;
    } else {
      console.log('\n⚠️  Alguns testes falharam. Verifique a configuração.');
      return false;
    }
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    return false;
  }
}

// Executar o teste
if (require.main === module) {
  const success = testMCPConfiguration();
  console.log('\n🏁 Teste finalizado.');
  process.exit(success ? 0 : 1);
}

module.exports = { testMCPConfiguration };
