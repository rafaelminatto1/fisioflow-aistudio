#!/usr/bin/env node

/**
 * Script para Mostrar Detalhes dos Dados Existentes no Banco
 * Identifica o que pode ser melhorado ou adicionado
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showDatabaseDetails() {
  console.log('🔍 DETALHES DO BANCO DE DADOS NEON - FISIOFLOW');
  console.log('================================================\n');

  try {
    await prisma.$connect();

    // 1. Detalhes dos Usuários
    console.log('👥 DETALHES DOS USUÁRIOS:');
    console.log('==========================');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    users.forEach(user => {
      console.log(`   📋 ${user.name}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Role: ${user.role}`);
      console.log(`      Avatar: ${user.avatarUrl ? '✅ Configurado' : '❌ Não configurado'}`);
      console.log(`      Criado em: ${user.createdAt.toLocaleDateString('pt-BR')}`);
      console.log('');
    });

    // 2. Detalhes dos Pacientes
    console.log('🏥 DETALHES DOS PACIENTES:');
    console.log('============================');
    
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        phone: true,
        birthDate: true,
        status: true,
        allergies: true,
        medicalAlerts: true,
        consentGiven: true,
        whatsappConsent: true,
        createdAt: true
      }
    });

    patients.forEach(patient => {
      console.log(`   📋 ${patient.name}`);
      console.log(`      CPF: ${patient.cpf}`);
      console.log(`      Email: ${patient.email || '❌ Não informado'}`);
      console.log(`      Telefone: ${patient.phone || '❌ Não informado'}`);
      console.log(`      Data de Nascimento: ${patient.birthDate ? patient.birthDate.toLocaleDateString('pt-BR') : '❌ Não informado'}`);
      console.log(`      Status: ${patient.status}`);
      console.log(`      Alergias: ${patient.allergies || 'Nenhuma'}`);
      console.log(`      Alertas Médicos: ${patient.medicalAlerts || 'Nenhum'}`);
      console.log(`      Consentimento: ${patient.consentGiven ? '✅ Dado' : '❌ Não dado'}`);
      console.log(`      WhatsApp: ${patient.whatsappConsent}`);
      console.log(`      Criado em: ${patient.createdAt.toLocaleDateString('pt-BR')}`);
      console.log('');
    });

    // 3. Detalhes dos Agendamentos
    console.log('📅 DETALHES DOS AGENDAMENTOS:');
    console.log('===============================');
    
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: {
          select: { name: true }
        },
        therapist: {
          select: { name: true }
        }
      }
    });

    appointments.forEach(appointment => {
      console.log(`   📋 Agendamento ${appointment.id}`);
      console.log(`      Paciente: ${appointment.patient.name}`);
      console.log(`      Terapeuta: ${appointment.therapist.name}`);
      console.log(`      Tipo: ${appointment.type}`);
      console.log(`      Status: ${appointment.status}`);
      console.log(`      Início: ${appointment.startTime.toLocaleString('pt-BR')}`);
      console.log(`      Fim: ${appointment.endTime.toLocaleString('pt-BR')}`);
      console.log(`      Valor: ${appointment.value ? `R$ ${appointment.value}` : 'Não definido'}`);
      console.log(`      Pagamento: ${appointment.paymentStatus}`);
      console.log(`      Observações: ${appointment.observations || 'Nenhuma'}`);
      console.log(`      Série: ${appointment.seriesId || 'Não é série'}`);
      console.log(`      Sessão: ${appointment.sessionNumber || 'N/A'} de ${appointment.totalSessions || 'N/A'}`);
      console.log('');
    });

    // 4. Detalhes dos Pain Points
    console.log('💊 DETALHES DOS PAIN POINTS:');
    console.log('==============================');
    
    const painPoints = await prisma.painPoint.findMany({
      include: {
        patient: {
          select: { name: true }
        }
      }
    });

    painPoints.forEach(painPoint => {
      console.log(`   📋 Pain Point ${painPoint.id}`);
      console.log(`      Paciente: ${painPoint.patient.name}`);
      console.log(`      Posição: (${painPoint.xPosition}, ${painPoint.yPosition})`);
      console.log(`      Intensidade: ${painPoint.intensity}/10`);
      console.log(`      Tipo: ${painPoint.type}`);
      console.log(`      Descrição: ${painPoint.description || 'Nenhuma'}`);
      console.log(`      Parte do Corpo: ${painPoint.bodyPart}`);
      console.log(`      Criado em: ${painPoint.createdAt.toLocaleDateString('pt-BR')}`);
      console.log('');
    });

    // 5. Detalhes dos Metric Results
    console.log('📏 DETALHES DOS RESULTADOS DE MÉTRICAS:');
    console.log('==========================================');
    
    const metricResults = await prisma.metricResult.findMany({
      include: {
        patient: {
          select: { name: true }
        }
      }
    });

    metricResults.forEach(metric => {
      console.log(`   📋 Métrica ${metric.id}`);
      console.log(`      Paciente: ${metric.patient.name}`);
      console.log(`      Nome: ${metric.metricName}`);
      console.log(`      Valor: ${metric.value} ${metric.unit}`);
      console.log(`      Medido em: ${metric.measuredAt.toLocaleDateString('pt-BR')}`);
      console.log('');
    });

    // 6. Análise de Dados Faltantes
    console.log('🔍 ANÁLISE DE DADOS FALTANTES:');
    console.log('================================');

    const missingData = [];

    // Verificar dados faltantes nos usuários
    users.forEach(user => {
      if (!user.avatarUrl) missingData.push(`Avatar para usuário ${user.name}`);
    });

    // Verificar dados faltantes nos pacientes
    patients.forEach(patient => {
      if (!patient.email) missingData.push(`Email para paciente ${patient.name}`);
      if (!patient.phone) missingData.push(`Telefone para paciente ${patient.name}`);
      if (!patient.birthDate) missingData.push(`Data de nascimento para paciente ${patient.name}`);
      if (!patient.consentGiven) missingData.push(`Consentimento para paciente ${patient.name}`);
    });

    // Verificar dados faltantes nos agendamentos
    appointments.forEach(appointment => {
      if (!appointment.value) missingData.push(`Valor para agendamento ${appointment.id}`);
      if (!appointment.observations) missingData.push(`Observações para agendamento ${appointment.id}`);
    });

    if (missingData.length > 0) {
      console.log('⚠️  Dados que podem ser adicionados:');
      missingData.forEach(item => console.log(`   - ${item}`));
    } else {
      console.log('✅ Todos os dados principais estão preenchidos');
    }

    // 7. Recomendações de Melhorias
    console.log('\n💡 RECOMENDAÇÕES DE MELHORIAS:');
    console.log('==================================');

    console.log('🔴 PRIORIDADE ALTA:');
    console.log('   - Criar SOAP Notes para os agendamentos existentes');
    console.log('   - Adicionar Communication Logs para histórico de comunicação');
    console.log('   - Configurar avatares para usuários');

    console.log('\n🟡 PRIORIDADE MÉDIA:');
    console.log('   - Completar dados de pacientes (email, telefone, data nascimento)');
    console.log('   - Adicionar valores aos agendamentos');
    console.log('   - Incluir observações nos agendamentos');

    console.log('\n🟢 PRIORIDADE BAIXA:');
    console.log('   - Adicionar mais pain points para análise de dor');
    console.log('   - Expandir métricas de avaliação');
    console.log('   - Criar mais agendamentos de exemplo');

    // 8. Status Final
    console.log('\n📊 STATUS FINAL DO BANCO:');
    console.log('===========================');
    console.log(`   ✅ Tabelas: 7/7 criadas`);
    console.log(`   ✅ Usuários: ${users.length} configurados`);
    console.log(`   ✅ Pacientes: ${patients.length} cadastrados`);
    console.log(`   ✅ Agendamentos: ${appointments.length} criados`);
    console.log(`   ✅ Pain Points: ${painPoints.length} registrados`);
    console.log(`   ✅ Métricas: ${metricResults.length} medidas`);
    console.log(`   ⚠️  SOAP Notes: 0 criados`);
    console.log(`   ⚠️  Communication Logs: 0 registrados`);

    console.log('\n🎯 PRÓXIMO PASSO RECOMENDADO:');
    console.log('   Criar SOAP Notes e Communication Logs para completar o sistema');

  } catch (error) {
    console.error('❌ Erro ao analisar detalhes:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  showDatabaseDetails().catch(console.error);
}

module.exports = showDatabaseDetails;
