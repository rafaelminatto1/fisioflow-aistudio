const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 Testando conexão com o banco Neon...');
    
    // Teste 1: Conexão básica
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Teste 2: Verificar se as tabelas existem
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📊 Tabelas encontradas no banco:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // Teste 3: Contar registros em algumas tabelas
    const userCount = await prisma.user.count();
    const patientCount = await prisma.patient.count();
    const appointmentCount = await prisma.appointment.count();
    
    console.log('📈 Contagem de registros:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Patients: ${patientCount}`);
    console.log(`   - Appointments: ${appointmentCount}`);
    
    // Teste 4: Verificar versão do PostgreSQL
    const version = await prisma.$queryRaw`SELECT version()`;
    console.log('🐘 Versão do PostgreSQL:', version[0].version);
    
    console.log('\n🎉 Todos os testes passaram! O banco Neon está funcionando perfeitamente.');
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
