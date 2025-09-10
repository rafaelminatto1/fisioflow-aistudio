#!/usr/bin/env node

/**
 * Script para debugar problema de autenticação em produção
 * Testa especificamente o endpoint /api/auth/session que está retornando 500
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://fisioflow-uaphq.ondigitalocean.app';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'FisioFlow-Debug/1.0',
        'Accept': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testAuthEndpoints() {
  console.log('🔍 Testando endpoints de autenticação em produção...');
  console.log(`URL: ${PRODUCTION_URL}`);
  console.log('=' .repeat(60));

  // 1. Testar endpoint de sessão (que está falhando)
  console.log('\n1. Testando /api/auth/session');
  try {
    const sessionResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/session`);
    console.log(`   Status: ${sessionResponse.status}`);
    console.log(`   Headers:`, JSON.stringify(sessionResponse.headers, null, 2));
    
    if (sessionResponse.status === 500) {
      console.log('   ❌ ERRO 500 - Problema no servidor');
      console.log('   Body:', sessionResponse.body);
    } else {
      console.log('   ✅ Endpoint funcionando');
      console.log('   Body:', sessionResponse.body);
    }
  } catch (error) {
    console.log('   ❌ Erro na requisição:', error.message);
  }

  // 2. Testar endpoint de providers
  console.log('\n2. Testando /api/auth/providers');
  try {
    const providersResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/providers`);
    console.log(`   Status: ${providersResponse.status}`);
    if (providersResponse.status === 200) {
      console.log('   ✅ Providers endpoint funcionando');
    } else {
      console.log('   ❌ Problema no providers endpoint');
      console.log('   Body:', providersResponse.body);
    }
  } catch (error) {
    console.log('   ❌ Erro na requisição:', error.message);
  }

  // 3. Testar endpoint de CSRF
  console.log('\n3. Testando /api/auth/csrf');
  try {
    const csrfResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/csrf`);
    console.log(`   Status: ${csrfResponse.status}`);
    if (csrfResponse.status === 200) {
      console.log('   ✅ CSRF endpoint funcionando');
    } else {
      console.log('   ❌ Problema no CSRF endpoint');
      console.log('   Body:', csrfResponse.body);
    }
  } catch (error) {
    console.log('   ❌ Erro na requisição:', error.message);
  }

  // 4. Testar health check
  console.log('\n4. Testando /api/health');
  try {
    const healthResponse = await makeRequest(`${PRODUCTION_URL}/api/health`);
    console.log(`   Status: ${healthResponse.status}`);
    if (healthResponse.status === 200) {
      console.log('   ✅ Health check funcionando');
      console.log('   Body:', healthResponse.body);
    } else {
      console.log('   ❌ Problema no health check');
      console.log('   Body:', healthResponse.body);
    }
  } catch (error) {
    console.log('   ❌ Erro na requisição:', error.message);
  }

  // 5. Testar página de login
  console.log('\n5. Testando página de login');
  try {
    const loginResponse = await makeRequest(`${PRODUCTION_URL}/login`);
    console.log(`   Status: ${loginResponse.status}`);
    if (loginResponse.status === 200) {
      console.log('   ✅ Página de login carregando');
    } else {
      console.log('   ❌ Problema na página de login');
    }
  } catch (error) {
    console.log('   ❌ Erro na requisição:', error.message);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🔧 DIAGNÓSTICO:');
  console.log('\nProblemas identificados:');
  console.log('1. Erro 500 em /api/auth/session indica problema no NextAuth');
  console.log('2. Possíveis causas:');
  console.log('   - REDIS_URL não configurado (rate limiting falhando)');
  console.log('   - NEXTAUTH_SECRET inválido');
  console.log('   - Problema na conexão com banco de dados');
  console.log('   - Configuração de cookies em produção');
  console.log('\n💡 SOLUÇÕES RECOMENDADAS:');
  console.log('1. Configurar REDIS_URL no Digital Ocean ou desabilitar rate limiting');
  console.log('2. Verificar se NEXTAUTH_SECRET tem pelo menos 32 caracteres');
  console.log('3. Testar conexão com banco de dados');
  console.log('4. Verificar logs da aplicação no Digital Ocean');
}

if (require.main === module) {
  testAuthEndpoints().catch(console.error);
}

module.exports = { testAuthEndpoints };