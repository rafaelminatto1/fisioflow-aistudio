// Script para testar o login via formulário da aplicação
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function testLoginForm() {
  try {
    console.log('=== TESTE LOGIN VIA FORMULÁRIO ===');
    
    // Primeiro, acessar a página de login
    console.log('1. Acessando página de login...');
    const loginPageCommand = `curl -c cookies.txt http://localhost:3001/login`;
    const { stdout: loginPage } = await execPromise(loginPageCommand);
    
    // Extrair o token CSRF da página
    const csrfMatch = loginPage.match(/name="csrfToken"\s+value="([^"]+)"/);
    if (!csrfMatch) {
      console.error('❌ Não foi possível encontrar o token CSRF na página');
      return;
    }
    
    const csrfToken = csrfMatch[1];
    console.log('Token CSRF encontrado:', csrfToken);
    
    // Fazer o login via POST para a action do formulário
    console.log('2. Enviando formulário de login...');
    const loginCommand = `curl -b cookies.txt -c cookies.txt -X POST http://localhost:3001/api/auth/callback/credentials -H "Content-Type: application/x-www-form-urlencoded" -d "email=admin@fisioflow.com&password=admin123&csrfToken=${csrfToken}&callbackUrl=http://localhost:3001/dashboard" -v`;
    
    console.log('Executando login:', loginCommand);
    
    const { stdout, stderr } = await execPromise(loginCommand);
    
    console.log('Saída do login:', stdout);
    if (stderr) {
      console.log('Debug do login:', stderr);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar login:', error.message);
    if (error.stdout) console.log('Stdout:', error.stdout);
    if (error.stderr) console.log('Stderr:', error.stderr);
  }
}

testLoginForm();