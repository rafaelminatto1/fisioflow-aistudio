// Script para criar usuário admin diretamente no banco
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('=== CRIANDO USUÁRIO ADMIN ===');
    
    // Primeiro, verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@fisioflow.com' }
    });
    
    if (existingUser) {
      console.log('Usuário admin já existe. Atualizando senha...');
      
      // Atualizar a senha
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const updatedUser = await prisma.user.update({
        where: { email: 'admin@fisioflow.com' },
        data: {
          passwordHash: hashedPassword,
          name: 'Administrador',
          role: 'Admin'
        }
      });
      
      console.log('✅ Usuário admin atualizado:', {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        hasPassword: !!updatedUser.passwordHash
      });
    } else {
      console.log('Criando novo usuário admin...');
      
      // Criar novo usuário
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const newUser = await prisma.user.create({
        data: {
          email: 'admin@fisioflow.com',
          name: 'Administrador',
          passwordHash: hashedPassword,
          role: 'Admin'
        }
      });
      
      console.log('✅ Usuário admin criado:', {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        hasPassword: !!newUser.passwordHash
      });
    }
    
    // Testar a senha
    console.log('\n=== TESTANDO SENHA ===');
    const user = await prisma.user.findUnique({
      where: { email: 'admin@fisioflow.com' }
    });
    
    const isPasswordValid = await bcrypt.compare('admin123', user.passwordHash);
    console.log('Senha válida:', isPasswordValid ? '✅ SIM' : '❌ NÃO');
    
    if (!isPasswordValid) {
      console.error('❌ ERRO: A senha não está funcionando corretamente!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();