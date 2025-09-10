const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🔍 Testando conexão com o banco de dados...');
  
  try {
    // Test 1: Verificar conexão
    console.log('\n1. Testando conexão...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Test 2: Contar usuários
    console.log('\n2. Contando usuários...');
    const userCount = await prisma.user.count();
    console.log(`✅ Total de usuários: ${userCount}`);
    
    // Test 3: Listar usuários
    console.log('\n3. Listando usuários...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    console.log('✅ Usuários encontrados:');
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });
    
    // Test 4: Contar pacientes
    console.log('\n4. Contando pacientes...');
    const patientCount = await prisma.patient.count();
    console.log(`✅ Total de pacientes: ${patientCount}`);
    
    // Test 5: Listar pacientes
    console.log('\n5. Listando pacientes...');
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        status: true
      }
    });
    console.log('✅ Pacientes encontrados:');
    patients.forEach(patient => {
      console.log(`   - ${patient.name} (${patient.email}) - ${patient.status}`);
    });
    
    // Test 6: Contar agendamentos
    console.log('\n6. Contando agendamentos...');
    const appointmentCount = await prisma.appointment.count();
    console.log(`✅ Total de agendamentos: ${appointmentCount}`);
    
    // Test 7: Testar operação de escrita (criar e deletar um paciente de teste)
    console.log('\n7. Testando operação de escrita...');
    const testPatient = await prisma.patient.create({
      data: {
        name: 'Teste Database',
        cpf: '000.000.000-00',
        email: 'teste@database.com',
        status: 'Active'
      }
    });
    console.log(`✅ Paciente de teste criado: ${testPatient.name}`);
    
    // Deletar o paciente de teste
    await prisma.patient.delete({
      where: { id: testPatient.id }
    });
    console.log('✅ Paciente de teste removido com sucesso!');
    
    console.log('\n🎉 Todos os testes passaram! O banco de dados está funcionando corretamente.');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexão com o banco encerrada.');
  }
}

testDatabase();