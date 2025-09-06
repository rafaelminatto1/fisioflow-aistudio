const http = require('http');
const https = require('https');
const { URL } = require('url');
const { URLSearchParams } = require('url');

let sessionCookies = '';

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
      headers: options.headers || {}
    };
    
    // Incluir cookies se disponíveis
    if (sessionCookies && !requestOptions.headers.Cookie) {
      requestOptions.headers.Cookie = sessionCookies;
    }
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Capturar cookies de resposta
        if (res.headers['set-cookie']) {
          sessionCookies = res.headers['set-cookie'].join('; ');
        }
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
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

async function testProtectedAccess() {
  console.log('=== TESTE DE ACESSO PROTEGIDO ===\n');
  
  try {
    // 1. Obter CSRF token
    console.log('1. Obtendo CSRF token...');
    const csrfResponse = await makeRequest('http://localhost:3001/api/auth/csrf');
    const csrfData = JSON.parse(csrfResponse.data);
    console.log('CSRF Token obtido\n');
    
    // 2. Fazer login
    console.log('2. Fazendo login...');
    const loginData = new URLSearchParams({
      email: 'admin@fisioflow.com',
      password: 'admin123',
      csrfToken: csrfData.csrfToken,
      callbackUrl: 'http://localhost:3001/dashboard'
    });
    
    const loginResponse = await makeRequest('http://localhost:3001/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': loginData.toString().length
      },
      body: loginData.toString()
    });
    
    console.log(`Status do login: ${loginResponse.status}`);
    if (loginResponse.headers.location) {
      console.log(`Redirecionamento: ${loginResponse.headers.location}`);
    }
    
    if (loginResponse.status === 302 && loginResponse.headers.location.includes('dashboard')) {
      console.log('✅ Login bem-sucedido!\n');
    } else {
      console.log('❌ Login falhou\n');
      return;
    }
    
    // 3. Testar API de sessão após login
    console.log('3. Verificando sessão após login...');
    const sessionResponse = await makeRequest('http://localhost:3001/api/auth/session');
    console.log(`Status da sessão: ${sessionResponse.status}`);
    
    if (sessionResponse.data && sessionResponse.data !== 'null') {
      const sessionData = JSON.parse(sessionResponse.data);
      console.log('✅ Sessão ativa!');
      console.log(`Usuário: ${sessionData.user?.email || 'N/A'}`);
      console.log(`Role: ${sessionData.user?.role || 'N/A'}`);
    } else {
      console.log('❌ Nenhuma sessão ativa');
    }
    
    // 4. Testar acesso ao dashboard
    console.log('\n4. Testando acesso ao dashboard...');
    const dashboardResponse = await makeRequest('http://localhost:3001/dashboard');
    console.log(`Status do dashboard: ${dashboardResponse.status}`);
    
    if (dashboardResponse.status === 200) {
      console.log('✅ Acesso ao dashboard permitido!');
      // Verificar se não há redirecionamento para login
      if (dashboardResponse.data.includes('login') && !dashboardResponse.data.includes('dashboard')) {
        console.log('⚠️  Mas parece que foi redirecionado para login');
      }
    } else if (dashboardResponse.status === 302) {
      console.log(`⚠️  Redirecionamento: ${dashboardResponse.headers.location}`);
    } else {
      console.log('❌ Acesso negado ao dashboard');
    }
    
  } catch (error) {
    console.error('Erro durante o teste:', error.message);
  }
}

testProtectedAccess();