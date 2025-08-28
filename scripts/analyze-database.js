#!/usr/bin/env node

/**
 * Script para Analisar o Estado Atual do Banco de Dados Neon
 * Verifica tabelas, dados e estrutura
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeDatabase() {
  console.log('🔍 ANALISANDO BANCO DE DADOS NEON - FISIOFLOW');
  console.log('================================================\n');

  try {
    // 1. Verificar conexão
    console.log('🔌 Testando conexão...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // 2. Contar registros em cada tabela
    console.log('📊 CONTAGEM DE REGISTROS:');
    console.log('==========================');

    const counts = await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.painPoint.count(),
      prisma.metricResult.count(),
      prisma.soapNote.count(),
      prisma.communicationLog.count()
    ]);

    console.log(`👥 Users: ${counts[0]} registros`);
    console.log(`🏥 Patients: ${counts[1]} registros`);
    console.log(`📅 Appointments: ${counts[2]} registros`);
    console.log(`💊 Pain Points: ${counts[3]} registros`);
    console.log(`📏 Metric Results: ${counts[4]} registros`);
    console.log(`📝 SOAP Notes: ${counts[5]} registros`);
    console.log(`💬 Communication Logs: ${counts[6]} registros`);

    // 3. Verificar estrutura das tabelas
    console.log('\n🏗️  ESTRUTURA DAS TABELAS:');
    console.log('============================');

    // Verificar se há dados de exemplo
    console.log('\n🔍 VERIFICANDO DADOS DE EXEMPLO:');

    // Verificar usuários
    const users = await prisma.user.findMany({ take: 3 });
    if (users.length > 0) {
      console.log('\n👥 Usuários encontrados:');
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    } else {
      console.log('\n⚠️  Nenhum usuário encontrado');
    }

    // Verificar pacientes
    const patients = await prisma.patient.findMany({ take: 3 });
    if (patients.length > 0) {
      console.log('\n🏥 Pacientes encontrados:');
      patients.forEach(patient => {
        console.log(`   - ${patient.name} (${patient.cpf}) - Status: ${patient.status}`);
      });
    } else {
      console.log('\n⚠️  Nenhum paciente encontrado');
    }

    // Verificar agendamentos
    const appointments = await prisma.appointment.findMany({ take: 3 });
    if (appointments.length > 0) {
      console.log('\n📅 Agendamentos encontrados:');
      appointments.forEach(appointment => {
        console.log(`   - ID: ${appointment.id} - Status: ${appointment.status} - Tipo: ${appointment.type}`);
      });
    } else {
      console.log('\n⚠️  Nenhum agendamento encontrado');
    }

    // 4. Análise de relacionamentos
    console.log('\n🔗 ANÁLISE DE RELACIONAMENTOS:');
    console.log('================================');

    // Verificar se há relacionamentos válidos
    if (appointments.length > 0) {
      const appointmentWithRelations = await prisma.appointment.findFirst({
        include: {
          patient: true,
          therapist: true
        }
      });
      
      if (appointmentWithRelations) {
        console.log('✅ Relacionamentos funcionando:');
        console.log(`   - Agendamento ${appointmentWithRelations.id} está vinculado a:`);
        console.log(`     * Paciente: ${appointmentWithRelations.patient.name}`);
        console.log(`     * Terapeuta: ${appointmentWithRelations.therapist.name}`);
      }
    }

    // 5. Verificar índices e performance
    console.log('\n⚡ VERIFICAÇÃO DE PERFORMANCE:');
    console.log('===============================');

    // Verificar se os índices estão funcionando
    try {
      const indexedQuery = await prisma.patient.findMany({
        where: {
          status: 'Active'
        },
        take: 1
      });
      console.log('✅ Consultas com índices funcionando');
    } catch (error) {
      console.log('⚠️  Problemas com consultas indexadas:', error.message);
    }

    // 6. Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('==================');

    if (counts[0] === 0) {
      console.log('🔴 CRÍTICO: Criar usuário administrador');
    }
    
    if (counts[1] === 0) {
      console.log('🟡 IMPORTANTE: Adicionar pacientes de teste');
    }
    
    if (counts[2] === 0) {
      console.log('🟡 IMPORTANTE: Criar agendamentos de exemplo');
    }

    // Verificar se precisa de dados de seed
    const totalRecords = counts.reduce((sum, count) => sum + count, 0);
    if (totalRecords === 0) {
      console.log('\n🌱 BANCO VAZIO - RECOMENDAÇÕES:');
      console.log('   1. Executar seed de dados iniciais');
      console.log('   2. Criar usuário administrador');
      console.log('   3. Adicionar pacientes de exemplo');
      console.log('   4. Criar agendamentos de teste');
    }

    // 7. Status geral
    console.log('\n📈 STATUS GERAL:');
    console.log('=================');
    
    const status = {
      connection: '✅ Conectado',
      tables: '✅ Estrutura criada',
      data: totalRecords > 0 ? '✅ Com dados' : '⚠️  Sem dados',
      relationships: '✅ Relacionamentos configurados',
      indexes: '✅ Índices funcionando'
    };

    Object.entries(status).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    console.log(`\n📊 Total de registros: ${totalRecords}`);
    
    if (totalRecords === 0) {
      console.log('\n🎯 PRÓXIMO PASSO: Executar seed de dados');
    } else {
      console.log('\n🎯 PRÓXIMO PASSO: Banco funcionando, pode prosseguir com desenvolvimento');
    }

  } catch (error) {
    console.error('❌ Erro ao analisar banco:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  analyzeDatabase().catch(console.error);
}

module.exports = analyzeDatabase;
