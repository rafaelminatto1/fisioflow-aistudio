const puppeteer = require('puppeteer');

async function testLogin() {
  let browser;
  try {
    console.log('=== TESTE DE LOGIN NO NAVEGADOR ===');
    
    browser = await puppeteer.launch({ 
      headless: false, // Mostrar o navegador
      devtools: true,  // Abrir DevTools
      slowMo: 1000     // Atrasar ações para visualizar
    });
    
    const page = await browser.newPage();
    
    // Interceptar logs do console
    page.on('console', msg => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
    });
    
    // Interceptar erros
    page.on('pageerror', error => {
      console.error(`[BROWSER ERROR] ${error.message}`);
    });
    
    // Interceptar requisições de rede
    page.on('response', response => {
      if (response.url().includes('/api/auth/')) {
        console.log(`[NETWORK] ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('1. Navegando para a página de login...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2' });
    
    console.log('2. Aguardando formulário carregar...');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    
    console.log('3. Preenchendo credenciais...');
    await page.type('input[name="email"]', 'admin@fisioflow.com');
    await page.type('input[name="password"]', 'admin123');
    
    console.log('4. Submetendo formulário...');
    await page.click('button[type="submit"]');
    
    console.log('5. Aguardando resposta...');
    await page.waitForTimeout(5000); // Aguardar 5 segundos
    
    const currentUrl = page.url();
    console.log('URL atual:', currentUrl);
    
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin')) {
      console.log('✅ LOGIN BEM-SUCEDIDO! Redirecionado para:', currentUrl);
    } else if (currentUrl.includes('/login')) {
      console.log('❌ LOGIN FALHOU - ainda na página de login');
      
      // Verificar se há mensagem de erro
      try {
        const errorElement = await page.$('.error, .alert, [role="alert"]');
        if (errorElement) {
          const errorText = await page.evaluate(el => el.textContent, errorElement);
          console.log('Mensagem de erro:', errorText);
        }
      } catch (e) {
        console.log('Nenhuma mensagem de erro encontrada');
      }
    } else {
      console.log('🤔 Redirecionado para URL inesperada:', currentUrl);
    }
    
    // Aguardar um pouco mais para ver o resultado
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testLogin();