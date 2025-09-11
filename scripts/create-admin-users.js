// scripts/create-admin-users.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUsers() {
  try {
    console.log('🔄 Criando usuários administrativos...');

    // Hash das senhas
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const fisioPasswordHash = await bcrypt.hash('fisio123', 12);

    // Criar usuário Admin
    const admin = await prisma.user.upsert({
      where: { email: 'admin@fisioflow.com' },
      update: {
        passwordHash: adminPasswordHash,
      },
      create: {
        name: 'Administrador FisioFlow',
        email: 'admin@fisioflow.com',
        passwordHash: adminPasswordHash,
        role: 'Admin',
        avatarUrl: null,
      },
    });

    console.log('✅ Usuário Admin criado:', admin.email);

    // Criar usuário Fisioterapeuta
    const fisio = await prisma.user.upsert({
      where: { email: 'fisio@fisioflow.com' },
      update: {
        passwordHash: fisioPasswordHash,
      },
      create: {
        name: 'Dr. João Santos',
        email: 'fisio@fisioflow.com',
        passwordHash: fisioPasswordHash,
        role: 'Fisioterapeuta',
        avatarUrl: null,
      },
    });

    console.log('✅ Usuário Fisioterapeuta criado:', fisio.email);

    // Criar alguns pacientes de exemplo
    const paciente1 = await prisma.patient.upsert({
      where: { cpf: '12345678900' },
      update: {},
      create: {
        name: 'Maria Silva',
        cpf: '12345678900',
        email: 'maria@email.com',
        phone: '11999991234',
        birthDate: new Date('1985-05-15'),
        status: 'Active',
        whatsappConsent: 'opt_in',
        consentGiven: true,
        address: {
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          zip: '01234-567'
        },
        emergencyContact: {
          name: 'João Silva',
          phone: '11999994321'
        }
      },
    });

    console.log('✅ Paciente de exemplo criado:', paciente1.name);

    const paciente2 = await prisma.patient.upsert({
      where: { cpf: '98765432100' },
      update: {},
      create: {
        name: 'Carlos Oliveira',
        cpf: '98765432100',
        email: 'carlos@email.com',
        phone: '11999995678',
        birthDate: new Date('1990-08-22'),
        status: 'Active',
        whatsappConsent: 'opt_in',
        consentGiven: true,
        allergies: 'Nenhuma alergia conhecida',
        medicalAlerts: 'Hipertensão controlada'
      },
    });

    console.log('✅ Paciente de exemplo criado:', paciente2.name);

    // Criar alguns agendamentos de exemplo
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(10, 0, 0, 0);

    const appointment1 = await prisma.appointment.create({
      data: {
        patientId: paciente1.id,
        therapistId: fisio.id,
        startTime: tomorrow,
        endTime: endTime,
        type: 'Avaliacao',
        status: 'Agendado',
        value: 120.00,
        paymentStatus: 'pending',
        observations: 'Primeira consulta - avaliação completa'
      },
    });

    console.log('✅ Agendamento de exemplo criado para:', paciente1.name);

    // Criar alguns exercícios de exemplo
    const exercises = [
      {
        name: 'Flexão de Quadril em Decúbito Dorsal',
        description: 'Exercício para fortalecimento do músculo flexor do quadril',
        category: 'Fortalecimento',
        subcategory: 'Quadril',
        bodyParts: ['quadril', 'core'],
        difficulty: 2,
        equipment: ['colchonete'],
        instructions: [
          'Deite-se de costas com os joelhos flexionados',
          'Eleve um joelho em direção ao peito',
          'Mantenha por 5 segundos e retorne à posição inicial',
          'Repita com a outra perna'
        ],
        duration: 15,
        indications: ['dor lombar', 'fraqueza do quadril'],
        contraindications: ['lesão aguda do quadril'],
        status: 'approved'
      },
      {
        name: 'Ponte Simples',
        description: 'Exercício para fortalecimento dos glúteos e posterior de coxa',
        category: 'Fortalecimento',
        subcategory: 'Glúteo',
        bodyParts: ['gluteo', 'posterior_coxa'],
        difficulty: 1,
        equipment: ['colchonete'],
        instructions: [
          'Deite-se de costas com joelhos flexionados',
          'Eleve o quadril formando uma linha reta',
          'Contraia os glúteos no topo do movimento',
          'Desça lentamente'
        ],
        duration: 10,
        indications: ['fraqueza glútea', 'dor lombar'],
        contraindications: ['lesão aguda lombar'],
        status: 'approved'
      }
    ];

    for (const exercise of exercises) {
      const created = await prisma.exercise.upsert({
        where: { name: exercise.name },
        update: exercise,
        create: exercise,
      });
      console.log('✅ Exercício criado:', created.name);
    }

    console.log('\n🎉 Setup completo! Usuários criados:');
    console.log('📧 Admin: admin@fisioflow.com | Senha: admin123');
    console.log('📧 Fisioterapeuta: fisio@fisioflow.com | Senha: fisio123');
    console.log('\n💡 Use essas credenciais para fazer login no sistema.');

  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
if (require.main === module) {
  createAdminUsers()
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no script:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUsers };