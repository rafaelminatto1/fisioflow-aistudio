// Script para debugar a autenticação
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugAuth() {
  try {
    console.log('=== DEBUG AUTENTICAÇÃO ===');
    
    // 1. Verificar usuário admin
    const user = await prisma.user.findUnique({
      where: { email: 'admin@fisioflow.com' }
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
      hasPasswordHash: !!user.passwordHash
    });
    
    // 2. Testar validação da senha
    if (user.passwordHash) {
      const isValid = await bcrypt.compare('admin123', user.passwordHash);
      console.log('✅ Senha válida:', isValid);
      
      // Testar outras senhas para confirmar
      const wrongPassword = await bcrypt.compare('wrong', user.passwordHash);
      console.log('❌ Senha errada (deve ser false):', wrongPassword);
    } else {
      console.log('❌ Usuário não tem passwordHash!');
    }
    
    // 3. Simular o processo de autenticação do NextAuth
    console.log('\n=== SIMULANDO PROCESSO DE AUTENTICAÇÃO ===');
    
    const credentials = {
      email: 'admin@fisioflow.com',
      password: 'admin123'
    };
    
    console.log('Credenciais:', credentials);
    
    if (!credentials?.email || !credentials?.password) {
      console.log('❌ Credenciais faltando');
      return;
    }
    
    const foundUser = await prisma.user.findUnique({
      where: { email: credentials.email }
    });
    
    if (!foundUser || !foundUser.passwordHash) {
      console.log('❌ Usuário não encontrado ou sem senha');
      return;
    }
    
    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      foundUser.passwordHash
    );
    
    if (!isPasswordValid) {
      console.log('❌ Senha inválida');
      return;
    }
    
    console.log('✅ Autenticação simulada com sucesso!');
    console.log('Retornaria:', {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      role: foundUser.role,
      avatarUrl: foundUser.avatarUrl || undefined
    });
    
  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth();