// Script para testar login usando o endpoint correto do NextAuth
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function testLogin() {
  try {
    console.log('=== TESTE DE LOGIN NEXTAUTH ===');
    
    // 1. Obter CSRF token
    console.log('1. Obtendo CSRF token...');
    const csrfCommand = `curl -s http://localhost:3001/api/auth/csrf`;
    const { stdout: csrfResponse } = await execPromise(csrfCommand);
    console.log('Resposta CSRF:', csrfResponse);
    
    const csrfData = JSON.parse(csrfResponse);
    const csrfToken = csrfData.csrfToken;
    console.log('Token CSRF obtido:', csrfToken.substring(0, 20) + '...');
    
    // 2. Fazer login usando o endpoint correto
    console.log('\n2. Fazendo login...');
    // Tentar diferentes formatos do CSRF token
    const loginCommand = `curl -X POST "http://localhost:3001/api/auth/signin/credentials" -H "Content-Type: application/x-www-form-urlencoded" -H "X-CSRF-Token: ${csrfToken}" -d "email=admin@fisioflow.com&password=admin123&csrfToken=${csrfToken}&callbackUrl=http://localhost:3001/dashboard&json=true" -v -c cookies.txt -b cookies.txt`;
    
    console.log('Executando login...');
    
    const { stdout, stderr } = await execPromise(loginCommand);
    
    console.log('\n=== RESULTADO DO LOGIN ===');
    console.log('Saída:', stdout);
    
    if (stderr.includes('302')) {
      console.log('✅ Redirecionamento detectado (possível sucesso)');
    } else if (stderr.includes('400')) {
      console.log('❌ Bad Request - verificar logs do servidor');
    } else {
      console.log('ℹ️ Resposta inesperada - verificar logs');
    }
    
    console.log('\n=== DEBUG CURL ===');
    console.log(stderr);
    
  } catch (error) {
    console.error('❌ Erro ao testar login:', error.message);
    if (error.stdout) console.log('Stdout:', error.stdout);
    if (error.stderr) console.log('Stderr:', error.stderr);
  }
}

testLogin();