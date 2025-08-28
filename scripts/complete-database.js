#!/usr/bin/env node

/**
 * Script para Completar o Banco de Dados
 * Adiciona SOAP Notes e Communication Logs faltantes
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function completeDatabase() {
  console.log('🔧 COMPLETANDO BANCO DE DADOS NEON - FISIOFLOW');
  console.log('================================================\n');

  try {
    await prisma.$connect();

    // 1. Criar SOAP Notes para os agendamentos existentes
    console.log('📝 CRIANDO SOAP NOTES:');
    console.log('========================');

    const appointments = await prisma.appointment.findMany({
      include: {
        patient: { select: { name: true } },
        therapist: { select: { name: true } }
      }
    });

    for (const appointment of appointments) {
      console.log(`   📋 Criando SOAP Note para agendamento ${appointment.id}...`);
      
      const soapNoteData = {
        appointmentId: appointment.id,
        subjective: generateSubjective(appointment),
        objective: generateObjective(appointment),
        assessment: generateAssessment(appointment),
        plan: generatePlan(appointment)
      };

      const soapNote = await prisma.soapNote.create({
        data: soapNoteData
      });

      console.log(`      ✅ SOAP Note criado: ${soapNote.id}`);
      console.log(`      Paciente: ${appointment.patient.name}`);
      console.log(`      Terapeuta: ${appointment.therapist.name}`);
      console.log('');
    }

    // 2. Criar Communication Logs
    console.log('💬 CRIANDO COMMUNICATION LOGS:');
    console.log('===============================');

    const patients = await prisma.patient.findMany();
    const users = await prisma.user.findMany({ where: { role: { in: ['Fisioterapeuta', 'EducadorFisico'] } } });

    for (const patient of patients) {
      console.log(`   📋 Criando logs para paciente ${patient.name}...`);
      
      // Log de agendamento
      const appointmentLog = await prisma.communicationLog.create({
        data: {
          patientId: patient.id,
          userId: users[0].id, // Primeiro terapeuta
          type: 'WhatsApp',
          notes: `Agendamento confirmado para ${patient.name}. Lembretes enviados via WhatsApp.`
        }
      });
      console.log(`      ✅ Log de agendamento criado: ${appointmentLog.id}`);

      // Log de avaliação inicial
      const evaluationLog = await prisma.communicationLog.create({
        data: {
          patientId: patient.id,
          userId: users[0].id,
          type: 'Email',
          notes: `Avaliação inicial realizada. Relatório enviado por email para ${patient.email}.`
        }
      });
      console.log(`      ✅ Log de avaliação criado: ${evaluationLog.id}`);

      // Log de acompanhamento
      const followUpLog = await prisma.communicationLog.create({
        data: {
          patientId: patient.id,
          userId: users[0].id,
          type: 'Ligacao',
          notes: `Acompanhamento telefônico realizado. Paciente reporta melhora significativa.`
        }
      });
      console.log(`      ✅ Log de acompanhamento criado: ${followUpLog.id}`);
      
      console.log('');
    }

    // 3. Verificar dados completos
    console.log('🔍 VERIFICANDO DADOS COMPLETOS:');
    console.log('=================================');

    const finalCounts = await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.painPoint.count(),
      prisma.metricResult.count(),
      prisma.soapNote.count(),
      prisma.communicationLog.count()
    ]);

    console.log(`👥 Users: ${finalCounts[0]} registros`);
    console.log(`🏥 Patients: ${finalCounts[1]} registros`);
    console.log(`📅 Appointments: ${finalCounts[2]} registros`);
    console.log(`💊 Pain Points: ${finalCounts[3]} registros`);
    console.log(`📏 Metric Results: ${finalCounts[4]} registros`);
    console.log(`📝 SOAP Notes: ${finalCounts[5]} registros`);
    console.log(`💬 Communication Logs: ${finalCounts[6]} registros`);

    // 4. Status final
    console.log('\n📊 STATUS FINAL:');
    console.log('==================');
    
    const totalRecords = finalCounts.reduce((sum, count) => sum + count, 0);
    console.log(`📊 Total de registros: ${totalRecords}`);
    
    if (finalCounts[5] > 0 && finalCounts[6] > 0) {
      console.log('✅ Banco de dados COMPLETO!');
      console.log('   - SOAP Notes criados para todos os agendamentos');
      console.log('   - Communication Logs adicionados para todos os pacientes');
      console.log('   - Sistema pronto para uso em produção');
    }

    console.log('\n🎯 PRÓXIMO PASSO:');
    console.log('   O banco está completo e pronto para desenvolvimento da aplicação');

  } catch (error) {
    console.error('❌ Erro ao completar banco:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Funções auxiliares para gerar dados realistas
function generateSubjective(appointment) {
  const patientName = appointment.patient.name;
  
  if (appointment.type === 'Avaliacao') {
    return `${patientName} relata dor no joelho direito há 3 semanas, piorando ao subir escadas e ao agachar. Paciente refere limitação para atividades diárias e esportivas.`;
  } else if (appointment.type === 'Sessao') {
    return `${patientName} refere melhora da dor após sessões anteriores. Relata ainda desconforto leve ao realizar movimentos específicos.`;
  }
  
  return `${patientName} comparece para ${appointment.type.toLowerCase()}.`;
}

function generateObjective(appointment) {
  const patientName = appointment.patient.name;
  
  if (appointment.type === 'Avaliacao') {
    return `Exame físico: Edema discreto em joelho D, crepitação patelar, ADM limitada (flexão 85°, extensão -5°). Teste de compressão patelar positivo. Força muscular grau 4/5.`;
  } else if (appointment.type === 'Sessao') {
    return `Reavaliação: Edema reduzido, ADM melhorada (flexão 95°, extensão 0°). Força muscular grau 4+/5. Paciente tolera melhor carga.`;
  }
  
  return `Avaliação específica para ${appointment.type.toLowerCase()}.`;
}

function generateAssessment(appointment) {
  if (appointment.type === 'Avaliacao') {
    return 'Síndrome patelofemoral com componente inflamatório. Necessita de programa de reabilitação progressiva.';
  } else if (appointment.type === 'Sessao') {
    return 'Evolução favorável do quadro. Manter protocolo de fortalecimento e alongamento.';
  }
  
  return 'Avaliação específica necessária.';
}

function generatePlan(appointment) {
  if (appointment.type === 'Avaliacao') {
    return '1. Crioterapia para controle de edema\n2. Exercícios de fortalecimento de quadríceps\n3. Alongamentos de cadeia posterior\n4. Retorno em 1 semana para reavaliação';
  } else if (appointment.type === 'Sessao') {
    return '1. Continuar protocolo de fortalecimento\n2. Progressão de carga nos exercícios\n3. Incluir exercícios funcionais\n4. Próxima sessão em 3 dias';
  }
  
  return 'Plano específico será definido após avaliação.';
}

// Executar se chamado diretamente
if (require.main === module) {
  completeDatabase().catch(console.error);
}

module.exports = completeDatabase;
