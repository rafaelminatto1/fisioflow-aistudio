// Script final para testar login com NextAuth
const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('=== TESTE FINAL DE LOGIN ===');
    
    const baseUrl = 'http://localhost:3001';
    
    // Teste 1: Verificar se a API de sessão funciona
    console.log('\n1. Testando API de sessão...');
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`);
    console.log('Status da sessão:', sessionResponse.status);
    const sessionData = await sessionResponse.json();
    console.log('Dados da sessão:', sessionData);
    
    // Teste 2: Tentar fazer login via signIn do NextAuth
    console.log('\n2. Testando signIn...');
    const signInResponse = await fetch(`${baseUrl}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@fisioflow.com',
        password: 'admin123',
        redirect: false
      })
    });
    
    console.log('Status do signIn:', signInResponse.status);
    console.log('Headers do signIn:', Object.fromEntries(signInResponse.headers));
    
    if (signInResponse.status === 200) {
      const signInData = await signInResponse.text();
      console.log('Resposta do signIn:', signInData);
    } else {
      console.log('Redirecionamento ou erro:', signInResponse.url);
    }
    
    // Teste 3: Verificar providers
    console.log('\n3. Testando providers...');
    const providersResponse = await fetch(`${baseUrl}/api/auth/providers`);
    console.log('Status dos providers:', providersResponse.status);
    const providersData = await providersResponse.json();
    console.log('Providers disponíveis:', providersData);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testLogin();