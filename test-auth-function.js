// Script para testar a função authorize do NextAuth diretamente
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Simular a função authorize do NextAuth
async function testAuthorizeFunction(credentials) {
  try {
    console.log('=== TESTANDO FUNÇÃO AUTHORIZE ===');
    console.log('Credenciais recebidas:', {
      email: credentials.email,
      password: credentials.password ? '[SENHA FORNECIDA]' : '[SEM SENHA]'
    });

    if (!credentials?.email || !credentials?.password) {
      console.log('❌ Credenciais incompletas');
      return null;
    }

    console.log('\n1. Buscando usuário no banco...');
    const user = await prisma.user.findUnique({
      where: {
        email: credentials.email,
      },
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return null;
    }

    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasPasswordHash: !!user.passwordHash
    });

    if (!user.passwordHash) {
      console.log('❌ Usuário não tem senha definida');
      return null;
    }

    console.log('\n2. Verificando senha...');
    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.passwordHash
    );

    console.log('Senha válida:', isPasswordValid ? '✅ SIM' : '❌ NÃO');

    if (!isPasswordValid) {
      console.log('❌ Senha inválida');
      return null;
    }

    console.log('\n✅ AUTENTICAÇÃO BEM-SUCEDIDA!');
    const result = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    
    console.log('Retornando usuário:', result);
    return result;

  } catch (error) {
    console.error('❌ Erro na função authorize:', error);
    return null;
  }
}

async function runTest() {
  try {
    // Testar com credenciais corretas
    console.log('\n=== TESTE 1: CREDENCIAIS CORRETAS ===');
    const result1 = await testAuthorizeFunction({
      email: 'admin@fisioflow.com',
      password: 'admin123'
    });
    
    console.log('\nResultado do teste 1:', result1 ? '✅ SUCESSO' : '❌ FALHOU');
    
    // Testar com senha incorreta
    console.log('\n\n=== TESTE 2: SENHA INCORRETA ===');
    const result2 = await testAuthorizeFunction({
      email: 'admin@fisioflow.com',
      password: 'senhaerrada'
    });
    
    console.log('\nResultado do teste 2:', result2 ? '❌ DEVERIA FALHAR' : '✅ FALHOU CORRETAMENTE');
    
    // Testar com email inexistente
    console.log('\n\n=== TESTE 3: EMAIL INEXISTENTE ===');
    const result3 = await testAuthorizeFunction({
      email: 'inexistente@teste.com',
      password: 'admin123'
    });
    
    console.log('\nResultado do teste 3:', result3 ? '❌ DEVERIA FALHAR' : '✅ FALHOU CORRETAMENTE');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();