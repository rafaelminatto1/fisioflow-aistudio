import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes
  await prisma.communicationLog.deleteMany();
  await prisma.soapNote.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.metricResult.deleteMany();
  await prisma.painPoint.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ Dados existentes removidos');

  // Criar usuários padrão
  const adminPassword = await bcrypt.hash('admin123', 12);
  const therapistPassword = await bcrypt.hash('fisio123', 12);
  const educatorPassword = await bcrypt.hash('edu123', 12);

  const admin = await prisma.user.create({
    data: {
      id: 'user_admin',
      name: 'Admin FisioFlow',
      email: 'admin@fisioflow.com',
      passwordHash: adminPassword,
      role: 'Admin',
      avatarUrl: 'https://i.pravatar.cc/150?u=admin',
    },
  });

  const therapist1 = await prisma.user.create({
    data: {
      id: 'user_therapist_1',
      name: 'Dr. Roberto Silva',
      email: 'roberto@fisioflow.com',
      passwordHash: therapistPassword,
      role: 'Fisioterapeuta',
      avatarUrl: 'https://i.pravatar.cc/150?u=roberto',
    },
  });

  const therapist2 = await prisma.user.create({
    data: {
      id: 'user_therapist_2',
      name: 'Dra. Camila Santos',
      email: 'camila@fisioflow.com',
      passwordHash: therapistPassword,
      role: 'Fisioterapeuta',
      avatarUrl: 'https://i.pravatar.cc/150?u=camila',
    },
  });

  const educator = await prisma.user.create({
    data: {
      id: 'user_educator_1',
      name: 'Dra. Juliana Costa',
      email: 'juliana@fisioflow.com',
      passwordHash: educatorPassword,
      role: 'EducadorFisico',
      avatarUrl: 'https://i.pravatar.cc/150?u=juliana',
    },
  });

  console.log('👥 Usuários criados:');
  console.log(`   Admin: ${admin.email} / admin123`);
  console.log(`   Fisioterapeuta 1: ${therapist1.email} / fisio123`);
  console.log(`   Fisioterapeuta 2: ${therapist2.email} / fisio123`);
  console.log(`   Educador Físico: ${educator.email} / edu123`);

  // Criar pacientes de exemplo
  const patient1 = await prisma.patient.create({
    data: {
      id: 'patient_1',
      name: 'Ana Beatriz Costa',
      cpf: '123.456.789-01',
      email: 'ana.costa@example.com',
      phone: '(11) 98765-4321',
      birthDate: new Date('1988-05-15'),
      address: {
        street: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zip: '01234-567'
      },
      emergencyContact: {
        name: 'Carlos Costa',
        phone: '(11) 91234-5678'
      },
      status: 'Active',
      lastVisit: new Date('2024-07-03'),
      allergies: 'Alergia a Dipirona',
      medicalAlerts: 'Paciente com histórico de hipertensão. Monitorar pressão arterial.',
      consentGiven: true,
      whatsappConsent: 'opt_in',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      id: 'patient_2',
      name: 'Bruno Gomes',
      cpf: '234.567.890-12',
      email: 'bruno.gomes@example.com',
      phone: '(21) 99876-5432',
      birthDate: new Date('1995-11-22'),
      address: {
        street: 'Avenida Copacabana, 456',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zip: '22345-678'
      },
      emergencyContact: {
        name: 'Fernanda Lima',
        phone: '(21) 98765-4321'
      },
      status: 'Active',
      lastVisit: new Date('2024-07-01'),
      consentGiven: true,
      whatsappConsent: 'opt_in',
    },
  });

  console.log('🏥 Pacientes criados:');
  console.log(`   ${patient1.name} - ${patient1.email}`);
  console.log(`   ${patient2.name} - ${patient2.email}`);

  // Criar alguns agendamentos de exemplo
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const appointment1 = await prisma.appointment.create({
    data: {
      id: 'appointment_1',
      patientId: patient1.id,
      therapistId: therapist1.id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1 hora depois
      type: 'Sessao',
      status: 'Agendado',
      value: 120.00,
      observations: 'Primeira sessão pós-cirúrgica',
    },
  });

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 0, 0, 0);

  const appointment2 = await prisma.appointment.create({
    data: {
      id: 'appointment_2',
      patientId: patient2.id,
      therapistId: therapist2.id,
      startTime: nextWeek,
      endTime: new Date(nextWeek.getTime() + 60 * 60 * 1000),
      type: 'Avaliacao',
      status: 'Agendado',
      value: 150.00,
      observations: 'Avaliação inicial',
    },
  });

  console.log('📅 Agendamentos criados:');
  console.log(`   ${appointment1.id} - ${patient1.name} com ${therapist1.name}`);
  console.log(`   ${appointment2.id} - ${patient2.name} com ${therapist2.name}`);

  // Criar pontos de dor de exemplo
  await prisma.painPoint.create({
    data: {
      patientId: patient1.id,
      xPosition: 58.5,
      yPosition: 68.0,
      intensity: 7,
      type: 'aguda',
      description: 'Dor ao subir escadas, bem na frente do joelho',
      bodyPart: 'front',
    },
  });

  await prisma.painPoint.create({
    data: {
      patientId: patient1.id,
      xPosition: 35.0,
      yPosition: 35.0,
      intensity: 4,
      type: 'cansaco',
      description: 'Cansaço no ombro esquerdo no final do dia',
      bodyPart: 'back',
    },
  });

  console.log('🎯 Pontos de dor criados para Ana Beatriz');

  // Criar métricas de exemplo
  await prisma.metricResult.create({
    data: {
      patientId: patient1.id,
      metricName: 'ADM de Flexão de Joelho D',
      value: 85.0,
      unit: 'graus',
    },
  });

  await prisma.metricResult.create({
    data: {
      patientId: patient1.id,
      metricName: 'Perimetria Coxa D (15cm)',
      value: 42.5,
      unit: 'cm',
    },
  });

  console.log('📊 Métricas criadas para Ana Beatriz');

  console.log('\n✅ Seed concluído com sucesso!');
  console.log('\n🔑 Credenciais de acesso:');
  console.log('   Admin: admin@fisioflow.com / admin123');
  console.log('   Fisioterapeuta: roberto@fisioflow.com / fisio123');
  console.log('   Fisioterapeuta: camila@fisioflow.com / fisio123');
  console.log('   Educador Físico: juliana@fisioflow.com / edu123');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });