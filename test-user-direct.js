// Script para testar diretamente o usuário no banco
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testUserDirect() {
  try {
    console.log('=== TESTE DIRETO DO USUÁRIO NO BANCO ===');
    
    // Buscar o usuário admin
    console.log('1. Buscando usuário admin...');
    const user = await prisma.user.findUnique({
      where: {
        email: 'admin@fisioflow.com'
      }
    });
    
    if (!user) {
      console.log('❌ Usuário admin não encontrado!');
      return;
    }
    
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasPassword: !!user.passwordHash,
      createdAt: user.createdAt
    });
    
    // Testar a senha
    console.log('\n2. Testando senha...');
    if (!user.passwordHash) {
      console.log('❌ Usuário não tem senha definida!');
      return;
    }
    
    const isPasswordValid = await bcrypt.compare('admin123', user.passwordHash);
    console.log('Resultado da validação:', isPasswordValid ? '✅ Senha correta' : '❌ Senha incorreta');
    
    // Testar hash da senha
    console.log('\n3. Informações do hash:');
    console.log('Hash armazenado:', user.passwordHash);
    console.log('Comprimento do hash:', user.passwordHash.length);
    console.log('Começa com $2a$ ou $2b$:', user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$'));
    
    // Criar um novo hash para comparar
    console.log('\n4. Criando novo hash para comparação...');
    const newHash = await bcrypt.hash('admin123', 12);
    console.log('Novo hash:', newHash);
    const newHashValid = await bcrypt.compare('admin123', newHash);
    console.log('Novo hash válido:', newHashValid ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserDirect();