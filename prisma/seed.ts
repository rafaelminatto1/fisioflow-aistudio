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

  await seedClinicalData();

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
        zip: '01234-567',
      },
      emergencyContact: {
        name: 'Carlos Costa',
        phone: '(11) 91234-5678',
      },
      status: 'Active',
      lastVisit: new Date('2024-07-03'),
      allergies: 'Alergia a Dipirona',
      medicalAlerts:
        'Paciente com histórico de hipertensão. Monitorar pressão arterial.',
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
        zip: '22345-678',
      },
      emergencyContact: {
        name: 'Fernanda Lima',
        phone: '(21) 98765-4321',
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
      value: 120.0,
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
      value: 150.0,
      observations: 'Avaliação inicial',
    },
  });

  console.log('📅 Agendamentos criados:');
  console.log(
    `   ${appointment1.id} - ${patient1.name} com ${therapist1.name}`
  );
  console.log(
    `   ${appointment2.id} - ${patient2.name} com ${therapist2.name}`
  );

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

async function seedClinicalData() {
  console.log('🧬 Começando a popular com dados clínicos...');

  // Limpar dados clínicos existentes para evitar duplicatas
  await prisma.treatmentProtocolExercise.deleteMany();
  await prisma.treatmentProtocol.deleteMany();
  await prisma.pathology.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.standardizedAssessment.deleteMany();

  console.log('🗑️ Dados clínicos antigos removidos.');

  // --- PATOLOGIAS ---
  const lombalgia = await prisma.pathology.create({
    data: {
      name: 'Lombalgia Mecânica Comum',
      description: 'Dor na região lombar, geralmente causada por sobrecarga, má postura ou fraqueza muscular.',
      symptoms: ['Dor na parte inferior das costas', 'Rigidez', 'Espasmos musculares'],
      causes: ['Má postura', 'Levantamento de peso incorreto', 'Sedentarismo', 'Fraqueza do core'],
      icd10Code: 'M54.5',
    },
  });

  const hernaDisco = await prisma.pathology.create({
    data: {
      name: 'Hérnia de Disco Lombar',
      description: 'Deslocamento do disco intervertebral, que pode comprimir nervos e causar dor irradiada.',
      symptoms: ['Dor lombar', 'Dor ciática (irradia para a perna)', 'Formigamento ou fraqueza na perna'],
      causes: ['Desgaste do disco (envelhecimento)', 'Trauma ou lesão', 'Fatores genéticos'],
      icd10Code: 'M51.2',
    },
  });

  const entorseTornozelo = await prisma.pathology.create({
    data: {
      name: 'Entorse de Tornozelo (Grau II)',
      description: 'Lesão dos ligamentos do tornozelo devido a um movimento de inversão forçada.',
      symptoms: ['Dor intensa no tornozelo', 'Inchaço (edema)', 'Equimose (roxo)', 'Dificuldade para andar'],
      causes: ['Pisada em falso', 'Trauma esportivo', 'Instabilidade crônica do tornozelo'],
      icd10Code: 'S93.4',
    },
  });

  const manguitoRotador = await prisma.pathology.create({
    data: {
      name: 'Síndrome do Manguito Rotador',
      description: 'Dor e fraqueza no ombro, geralmente por inflamação ou lesão nos tendões do manguito rotador.',
      symptoms: ['Dor no ombro (piora à noite ou com movimentos de elevação)', 'Fraqueza no braço', 'Arco doloroso'],
      causes: ['Movimentos repetitivos acima da cabeça', 'Envelhecimento', 'Trauma'],
      icd10Code: 'M75.1',
    },
  });

  console.log('🩹 Patologias criadas:', { lombalgia, hernaDisco, entorseTornozelo, manguitoRotador });

  // --- EXERCÍCIOS ---
  const ponteGluteos = await prisma.exercise.create({
    data: {
      name: 'Ponte de Glúteos',
      description: 'Fortalece os músculos dos glúteos e isquiotibiais, estabilizando a pelve e a coluna lombar.',
      category: 'Fortalecimento',
      subcategory: 'Core e Quadril',
      bodyParts: ['Glúteos', 'Isquiotibiais', 'Core'],
      difficulty: 1,
      equipment: ['Nenhum'],
      instructions: [
        'Deite-se de costas com os joelhos dobrados e os pés apoiados no chão, na largura do quadril.',
        'Mantenha os braços ao lado do corpo.',
        'Contraia os glúteos e o abdômen e eleve o quadril até que o corpo forme uma linha reta dos ombros aos joelhos.',
        'Sustente por 3-5 segundos e desça lentamente.',
      ],
      indications: ['Lombalgia', 'Fraqueza de glúteos', 'Instabilidade pélvica'],
      contraindications: ['Fase aguda de lesão lombar grave', 'Dor intensa durante o movimento'],
      status: 'approved',
    },
  });

  const pranchaFrontal = await prisma.exercise.create({
    data: {
      name: 'Prancha Frontal Isométrica',
      description: 'Exercício isométrico para fortalecimento profundo do core (abdominais, lombar, oblíquos).',
      category: 'Fortalecimento',
      subcategory: 'Core',
      bodyParts: ['Abdômen', 'Lombar', 'Ombros'],
      difficulty: 2,
      equipment: ['Nenhum'],
      instructions: [
        'Apoie os antebraços e as pontas dos pés no chão.',
        'Mantenha o corpo reto como uma prancha, alinhando cabeça, tronco e pernas.',
        'Contraia o abdômen e os glúteos para não deixar o quadril cair.',
        'Sustente a posição pelo tempo determinado.',
      ],
      indications: ['Fortalecimento do core', 'Prevenção de lombalgia', 'Melhora da postura'],
      contraindications: ['Hipertensão não controlada', 'Hérnia abdominal', 'Dor no ombro'],
      status: 'approved',
    },
  });

  const alongamentoGatoCamelo = await prisma.exercise.create({
    data: {
      name: 'Alongamento Gato-Camelo',
      description: 'Mobiliza a coluna torácica e lombar, aliviando a rigidez e melhorando a flexibilidade.',
      category: 'Mobilidade',
      subcategory: 'Coluna',
      bodyParts: ['Coluna Torácica', 'Coluna Lombar'],
      difficulty: 1,
      equipment: ['Nenhum'],
      instructions: [
        'Fique na posição de quatro apoios (mãos e joelhos no chão).',
        'Inspire enquanto arqueia as costas para baixo, olhando para cima (posição da vaca/camelo).',
        'Expire enquanto arredonda as costas para cima, olhando para o umbigo (posição do gato).',
        'Alterne os movimentos de forma lenta e controlada.',
      ],
      indications: ['Rigidez na coluna', 'Lombalgia crônica', 'Melhora da consciência corporal'],
      contraindications: ['Instabilidade vertebral', 'Dor aguda intensa'],
      status: 'approved',
    },
  });

  const dorsiflexaoTornozelo = await prisma.exercise.create({
    data: {
      name: 'Dorsiflexão Ativa do Tornozelo',
      description: 'Melhora a amplitude de movimento do tornozelo, essencial para a marcha e agachamento.',
      category: 'Mobilidade',
      subcategory: 'Tornozelo e Pé',
      bodyParts: ['Tornozelo'],
      difficulty: 1,
      equipment: ['Nenhum'],
      instructions: [
        'Sente-se com a perna esticada.',
        'Puxe a ponta do pé em direção ao corpo o máximo que conseguir, sem sentir dor.',
        'Mantenha por 2-3 segundos e retorne à posição inicial.',
        'Pode-se usar uma faixa elástica para auxiliar no movimento.',
      ],
      indications: ['Pós-entorse de tornozelo', 'Rigidez articular', 'Prevenção de lesões'],
      contraindications: ['Fratura não consolidada', 'Dor aguda'],
      status: 'approved',
    },
  });

  const rotacaoExternaOmbro = await prisma.exercise.create({
    data: {
      name: 'Rotação Externa de Ombro com Faixa Elástica',
      description: 'Fortalece os músculos do manguito rotador, melhorando a estabilidade do ombro.',
      category: 'Fortalecimento',
      subcategory: 'Ombro',
      bodyParts: ['Ombro', 'Manguito Rotador'],
      difficulty: 2,
      equipment: ['Faixa Elástica'],
      instructions: [
        'Prenda uma faixa elástica na altura do cotovelo.',
        'Segure a outra ponta com a mão do lado a ser trabalhado, com o cotovelo dobrado a 90 graus e colado ao corpo.',
        'Gire o antebraço para fora, esticando a faixa, sem afastar o cotovelo do tronco.',
        'Retorne à posição inicial de forma controlada.',
      ],
      indications: ['Síndrome do Manguito Rotador', 'Instabilidade de ombro', 'Prevenção de lesões em arremessadores'],
      contraindications: ['Fase aguda de bursite', 'Lesão grave que necessite de cirurgia'],
      status: 'approved',
    },
  });

  console.log('🤸 Exercícios criados:', { ponteGluteos, pranchaFrontal, alongamentoGatoCamelo, dorsiflexaoTornozelo, rotacaoExternaOmbro });

  // --- PROTOCOLOS DE TRATAMENTO ---
  const protocoloLombalgia = await prisma.treatmentProtocol.create({
    data: {
      name: 'Protocolo para Lombalgia Mecânica - Fase Inicial',
      description: 'Foco em alívio da dor, melhora da mobilidade e ativação do core.',
      pathologyId: lombalgia.id,
      frequency: '3x por semana',
      duration: '4 semanas',
      objectives: ['Reduzir a dor e o espasmo muscular', 'Restaurar a mobilidade da coluna lombar', 'Iniciar o fortalecimento do core'],
      contraindications: ['Sinais de alerta (red flags) como perda de força súbita ou alterações de esfíncteres.'],
      createdBy: 'user_admin',
      exercises: {
        create: [
          {
            exerciseId: alongamentoGatoCamelo.id,
            order: 1,
            sets: 2,
            repetitions: '15',
            restTime: '30s',
            notes: 'Focar na respiração e no movimento suave.',
          },
          {
            exerciseId: ponteGluteos.id,
            order: 2,
            sets: 3,
            repetitions: '12',
            restTime: '45s',
            notes: 'Contrair bem os glúteos no topo do movimento.',
          },
          {
            exerciseId: pranchaFrontal.id,
            order: 3,
            sets: 3,
            repetitions: '30s',
            restTime: '60s',
            progressionCriteria: 'Aumentar 5s a cada semana se não houver dor.',
          },
        ],
      },
    },
  });

  const protocoloManguito = await prisma.treatmentProtocol.create({
    data: {
      name: 'Protocolo para Síndrome do Manguito Rotador - Fase Intermediária',
      description: 'Foco no fortalecimento dos estabilizadores do ombro e melhora da função.',
      pathologyId: manguitoRotador.id,
      frequency: '2-3x por semana',
      duration: '6 semanas',
      objectives: ['Fortalecer manguito rotador e músculos da escápula', 'Melhorar o arco de movimento sem dor', 'Melhorar a função do ombro em atividades diárias'],
      contraindications: ['Dor acima de 5/10 durante os exercícios', 'Sinais de lesão aguda'],
      createdBy: 'user_admin',
      exercises: {
        create: [
          {
            exerciseId: rotacaoExternaOmbro.id,
            order: 1,
            sets: 3,
            repetitions: '15',
            restTime: '45s',
            resistanceLevel: 'Faixa elástica leve (amarela)',
            progressionCriteria: 'Progredir para faixa média (verde) quando completar as 3 séries sem dificuldade.',
          },
        ],
      },
    },
  });

  console.log('📝 Protocolos de tratamento criados:', { protocoloLombalgia, protocoloManguito });

  // --- AVALIAÇÕES PADRONIZADAS ---
  const nps = await prisma.standardizedAssessment.create({
    data: {
      name: 'Net Promoter Score (NPS)',
      description: 'Mede a lealdade e a satisfação do cliente com uma única pergunta.',
      type: 'QUESTIONNAIRE',
      category: 'Satisfação do Cliente',
      jsonFields: {
        question: 'Em uma escala de 0 a 10, o quanto você recomendaria nossa clínica a um amigo ou familiar?',
        scale: { min: 0, max: 10 },
        labels: { min: 'Nada provável', max: 'Extremamente provável' },
      },
      scoringRules: {
        promoters: { min: 9, max: 10 },
        passives: { min: 7, max: 8 },
        detractors: { min: 0, max: 6 },
        formula: '((promoters - detractors) / total_responses) * 100',
      },
      isActive: true,
    },
  });

  const rolandMorris = await prisma.standardizedAssessment.create({
    data: {
      name: 'Questionário de Incapacidade Roland-Morris',
      description: 'Avalia a incapacidade física causada pela dor lombar.',
      type: 'QUESTIONNAIRE',
      category: 'Incapacidade Funcional',
      jsonFields: {
        instructions: 'Por favor, marque as frases que descrevem sua condição hoje.',
        questions: [
          'Fico em casa a maior parte do tempo por causa das minhas costas.',
          'Mudo de posição com frequência para tentar aliviar a dor nas costas.',
          'Ando mais devagar que o normal por causa das minhas costas.',
          'Por causa das minhas costas, não estou fazendo nenhuma das tarefas que costumo fazer em casa.',
          'Por causa das minhas costas, eu uso o corrimão para subir escadas.',
          'Por causa das minhas costas, eu me deito mais vezes para descansar.',
          'Por causa das minhas costas, eu preciso me segurar em alguma coisa para me levantar de uma cadeira.',
          'Por causa das minhas costas, tento que outras pessoas façam as coisas por mim.',
          'Visto-me mais devagar que o normal por causa das minhas costas.',
          'Só consigo ficar em pé por curtos períodos de tempo por causa das minhas costas.',
          'Tento não me curvar ou ajoelhar por causa das minhas costas.',
          'Tenho dificuldade em me levantar de uma cadeira por causa das minhas costas.',
          'Minhas costas doem quase o tempo todo.',
          'Tenho dificuldade em virar na cama por causa das minhas costas.',
          'Meu apetite não é muito bom por causa da dor nas costas.',
          'Tenho problemas para calçar minhas meias (ou meias-calças) por causa da dor nas costas.',
          'Só ando distâncias curtas por causa da minha dor nas costas.',
          'Durmo menos bem por causa das minhas costas.',
          'Com a ajuda de analgésicos, consigo me vestir sem ajuda.',
          'Sento-me a maior parte do dia por causa das minhas costas.',
          'Evito trabalhos pesados em casa por causa das minhas costas.',
          'Por causa da minha dor nas costas, fico mais irritado e mal-humorado com as pessoas do que o normal.',
          'Subo escadas mais devagar que o normal por causa das minhas costas.',
          'Fico na cama mais do que o habitual por causa das minhas costas.',
        ],
      },
      scoringRules: {
        description: 'A pontuação é o número total de itens marcados. Varia de 0 (sem incapacidade) a 24 (incapacidade máxima).',
        interpretation: {
          '0-4': 'Incapacidade mínima',
          '5-10': 'Incapacidade moderada',
          '11-19': 'Incapacidade grave',
          '20-24': 'Incapacidade muito grave',
        },
      },
      isActive: true,
    },
  });

  console.log('📋 Avaliações padronizadas criadas:', { nps, rolandMorris });
  console.log('✅ Dados clínicos populados com sucesso!');
}


main()
  .catch(e => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
