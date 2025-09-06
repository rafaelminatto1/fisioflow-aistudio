const http = require('http');
const https = require('https');
const { URL } = require('url');

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

async function testAuthAPI() {
  console.log('=== TESTE DA API DE AUTENTICAÇÃO ===');
  
  try {
    // 1. Testar se a API de sessão está funcionando
    console.log('\n1. Testando API de sessão...');
    const sessionResponse = await makeRequest('http://localhost:3001/api/auth/session');
    console.log('Status da sessão:', sessionResponse.status);
    
    let sessionData;
    try {
      sessionData = JSON.parse(sessionResponse.data);
      console.log('Dados da sessão:', sessionData);
    } catch (e) {
      console.log('Resposta da sessão (texto):', sessionResponse.data);
    }
    
    // 2. Testar se a API de providers está funcionando
    console.log('\n2. Testando API de providers...');
    const providersResponse = await makeRequest('http://localhost:3001/api/auth/providers');
    console.log('Status dos providers:', providersResponse.status);
    
    let providersData;
    try {
      providersData = JSON.parse(providersResponse.data);
      console.log('Providers disponíveis:', Object.keys(providersData));
    } catch (e) {
      console.log('Resposta dos providers (texto):', providersResponse.data);
    }
    
    // 3. Testar se a API de CSRF está funcionando
    console.log('\n3. Testando API de CSRF...');
    const csrfResponse = await makeRequest('http://localhost:3001/api/auth/csrf');
    console.log('Status do CSRF:', csrfResponse.status);
    
    let csrfData;
    try {
      csrfData = JSON.parse(csrfResponse.data);
      console.log('CSRF Token:', csrfData.csrfToken ? 'Presente' : 'Ausente');
    } catch (e) {
      console.log('Resposta do CSRF (texto):', csrfResponse.data);
      csrfData = { csrfToken: null };
    }
    
    // 4. Tentar fazer login usando a API diretamente
    console.log('\n4. Testando login via API...');
    
    // Usar application/x-www-form-urlencoded como o NextAuth espera
    const loginParams = new URLSearchParams({
      email: 'admin@fisioflow.com',
      password: 'admin123',
      csrfToken: csrfData.csrfToken || '',
      callbackUrl: 'http://localhost:3001/dashboard'
    });
    
    const loginData = loginParams.toString();
    
    const loginResponse = await makeRequest('http://localhost:3001/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData)
      },
      body: loginData
    });
    
    console.log('Status do login:', loginResponse.status);
    console.log('Headers de resposta:', loginResponse.headers);
    console.log('Resposta do login:', loginResponse.data);
    
    if (loginResponse.status === 200) {
      console.log('✅ Login bem-sucedido!');
    } else {
      console.log('❌ Login falhou');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testAuthAPI();