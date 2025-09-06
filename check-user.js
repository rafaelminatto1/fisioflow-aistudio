const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    console.log('🔍 Verificando usuário admin no banco de dados...');
    
    // Buscar o usuário admin
    const adminUser = await prisma.user.findUnique({
      where: {
        email: 'admin@fisioflow.com'
      }
    });
    
    if (!adminUser) {
      console.log('❌ Usuário admin não encontrado no banco de dados!');
      return;
    }
    
    console.log('✅ Usuário admin encontrado:');
    console.log('ID:', adminUser.id);
    console.log('Email:', adminUser.email);
    console.log('Nome:', adminUser.name);
    console.log('Tipo:', adminUser.userType);
    console.log('Senha hash:', adminUser.passwordHash);
    console.log('Criado em:', adminUser.createdAt);
    
    // Testar a validação da senha
    console.log('\n🔐 Testando validação da senha...');
    const isValidPassword = await bcrypt.compare('admin123', adminUser.passwordHash);
    console.log('Senha "admin123" é válida:', isValidPassword);
    
    // Testar outras senhas para comparação
    const testPasswords = ['admin', '123456', 'password', 'Admin123'];
    for (const testPassword of testPasswords) {
      const isValid = await bcrypt.compare(testPassword, adminUser.passwordHash);
      console.log(`Senha "${testPassword}" é válida:`, isValid);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();