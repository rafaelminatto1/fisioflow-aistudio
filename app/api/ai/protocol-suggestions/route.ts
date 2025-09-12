import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ProtocolSuggestion {
  protocolId: string;
  protocolName: string;
  pathology: string;
  confidenceScore: number;
  reasoning: string;
  adaptations?: string[];
  exercises?: {
    exerciseId: string;
    exerciseName: string;
    order: number;
    sets?: number;
    repetitions?: string;
    modifications?: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, pathologyName, symptoms, patientAge, patientCondition, additionalInfo } = body;

    if (!patientId || !pathologyName) {
      return NextResponse.json(
        { error: 'PatientId e pathologyName são obrigatórios' },
        { status: 400 }
      );
    }

    // Get patient information
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      include: {
        appointments: {
          orderBy: { start_time: 'desc' },
          take: 10,
          include: {
            soap_notes: true,
          },
        },
        assessment_results: {
          orderBy: { evaluated_at: 'desc' },
          take: 5,

        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Find matching pathology and protocols
    const pathology = await prisma.pathologies.findFirst({
      where: {
        name: {
          contains: pathologyName,
          mode: 'insensitive',
        },
      },
      include: {
        treatment_protocols: {
          where: { is_active: true },
          include: {
            treatment_protocol_exercises: {
              include: {
                exercises: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!pathology || pathology.treatment_protocols.length === 0) {
      // If no specific protocols found, use AI to generate suggestions
      const aiSuggestion = await generateAISuggestion({
        pathologyName,
        symptoms: symptoms || [],
        patientAge,
        patientCondition,
        additionalInfo,
        patient,
      });

      return NextResponse.json({
        suggestions: [aiSuggestion],
        source: 'ai_generated',
      });
    }

    // Analyze and rank existing protocols
    const suggestions = await analyzeProtocols(pathology.treatment_protocols, {
      patient,
      symptoms: symptoms || [],
      patientAge,
      patientCondition,
      additionalInfo,
    });

    return NextResponse.json({
      suggestions,
      source: 'database',
      pathology: {
        id: pathology.id,
        name: pathology.name,
        description: pathology.description,
      },
    });
  } catch (error) {
    console.error('Error generating protocol suggestions:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar sugestões de protocolo' },
      { status: 500 }
    );
  }
}

async function analyzeProtocols(protocols: any[], context: any): Promise<ProtocolSuggestion[]> {
  const suggestions: ProtocolSuggestion[] = [];

  for (const protocol of protocols) {
    const confidenceScore = calculateConfidenceScore(protocol, context);
    const reasoning = generateReasoning(protocol, context, confidenceScore);
    const adaptations = generateAdaptations(protocol, context);

    const suggestion: ProtocolSuggestion = {
      protocolId: protocol.id,
      protocolName: protocol.name,
      pathology: protocol.pathology?.name || 'Unknown',
      confidenceScore,
      reasoning,
      adaptations,
      exercises: protocol.treatment_protocol_exercises?.map((pe: any) => ({
        exerciseId: pe.exercises.id,
        exerciseName: pe.exercises.name,
        order: pe.order,
        sets: pe.sets,
        repetitions: pe.repetitions,
        modifications: generateExerciseModifications(pe.exercises, context),
      })) || [],
    };

    suggestions.push(suggestion);
  }

  // Sort by confidence score (highest first)
  return suggestions.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

function calculateConfidenceScore(protocol: any, context: any): number {
  let score = 0.7; // Base score

  // Age appropriateness
  if (context.patientAge) {
    const age = context.patientAge;
    
    // Adjust score based on age appropriateness of exercises
    if (protocol.treatment_protocol_exercises) {
      const ageAppropriateExercises = protocol.treatment_protocol_exercises.filter((pe: any) => {
        const exercise = pe.exercises;
        
        // Young adults (18-35): higher intensity exercises
        if (age >= 18 && age <= 35 && exercise.difficulty >= 3) {
          return true;
        }
        
        // Middle-aged (36-64): moderate exercises
        if (age >= 36 && age <= 64 && exercise.difficulty >= 2 && exercise.difficulty <= 4) {
          return true;
        }
        
        // Seniors (65+): lower intensity exercises
        if (age >= 65 && exercise.difficulty <= 3) {
          return true;
        }
        
        return false;
      });
      
      const ageScore = ageAppropriateExercises.length / protocol.treatment_protocol_exercises.length;
      score += (ageScore - 0.5) * 0.2; // Adjust by up to ±0.1
    }
  }

  // Symptom matching
  if (context.symptoms && context.symptoms.length > 0 && protocol.pathology?.symptoms) {
    const matchingSymptoms = context.symptoms.filter((symptom: string) =>
      protocol.pathology.symptoms.some((pathologySymptom: string) =>
        pathologySymptom.toLowerCase().includes(symptom.toLowerCase()) ||
        symptom.toLowerCase().includes(pathologySymptom.toLowerCase())
      )
    );
    
    const symptomScore = matchingSymptoms.length / context.symptoms.length;
    score += (symptomScore - 0.5) * 0.2; // Adjust by up to ±0.1
  }

  // Patient condition considerations
  if (context.patientCondition) {
    if (context.patientCondition.includes('acute') || context.patientCondition.includes('aguda')) {
      // Prefer shorter duration, lower intensity protocols for acute conditions
      if (protocol.duration && protocol.duration.includes('6')) score += 0.1;
      if (protocol.frequency && protocol.frequency.includes('2x')) score += 0.1;
    }
    
    if (context.patientCondition.includes('chronic') || context.patientCondition.includes('crônica')) {
      // Prefer longer duration protocols for chronic conditions
      if (protocol.duration && (protocol.duration.includes('12') || protocol.duration.includes('16'))) score += 0.1;
    }
  }

  // Assessment results consideration
  if (context.patient?.assessmentResults?.length > 0) {
    const latestAssessment = context.patient.assessmentResults[0];
    
    // Adjust based on functional capacity
    if (latestAssessment.score) {
      const normalizedScore = latestAssessment.score / 100; // Assuming scores are out of 100
      
      // Higher functional capacity = can handle more intensive protocols
      if (normalizedScore > 0.7) score += 0.1;
      if (normalizedScore < 0.4) score -= 0.1;
    }
  }

  // Ensure score is within bounds
  return Math.max(0.1, Math.min(1.0, score));
}

function generateReasoning(protocol: any, context: any, confidenceScore: number): string {
  const reasons = [];

  if (confidenceScore > 0.8) {
    reasons.push('Alta compatibilidade com o perfil do paciente');
  } else if (confidenceScore > 0.6) {
    reasons.push('Boa compatibilidade com o perfil do paciente');
  } else {
    reasons.push('Compatibilidade moderada com o perfil do paciente');
  }

  if (context.patientAge) {
    const age = context.patientAge;
    if (age >= 65) {
      reasons.push('Protocolo adaptado para pacientes idosos');
    } else if (age <= 35) {
      reasons.push('Protocolo adequado para pacientes jovens');
    }
  }

  if (protocol.exercises?.length > 0) {
    reasons.push(`Inclui ${protocol.exercises.length} exercícios específicos`);
  }

  if (protocol.frequency) {
    reasons.push(`Frequência recomendada: ${protocol.frequency}`);
  }

  if (protocol.duration) {
    reasons.push(`Duração estimada: ${protocol.duration}`);
  }

  return reasons.join('. ');
}

function generateAdaptations(protocol: any, context: any): string[] {
  const adaptations = [];

  if (context.patientAge && context.patientAge >= 65) {
    adaptations.push('Reduzir intensidade dos exercícios em 20-30%');
    adaptations.push('Incluir períodos de descanso mais longos entre séries');
    adaptations.push('Monitorar sinais vitais durante exercícios cardiovasculares');
  }

  if (context.patientAge && context.patientAge <= 25) {
    adaptations.push('Pode aumentar progressivamente a intensidade');
    adaptations.push('Incluir exercícios de prevenção de lesões');
  }

  if (context.patientCondition && context.patientCondition.includes('acute')) {
    adaptations.push('Iniciar com exercícios de baixa intensidade');
    adaptations.push('Avaliar dor antes de cada sessão');
    adaptations.push('Progredir gradualmente conforme tolerância');
  }

  if (context.symptoms && context.symptoms.includes('dor')) {
    adaptations.push('Interromper exercícios se dor aumentar');
    adaptations.push('Aplicar gelo após exercícios se necessário');
  }

  // Assessment-based adaptations
  if (context.patient?.assessmentResults?.length > 0) {
    const latestAssessment = context.patient.assessmentResults[0];
    
    if (latestAssessment.assessment?.name.includes('Berg') && latestAssessment.score < 45) {
      adaptations.push('Incluir exercícios de equilíbrio com apoio');
      adaptations.push('Supervisão constante durante exercícios em pé');
    }
    
    if (latestAssessment.assessment?.name.includes('TUG') && latestAssessment.score > 14) {
      adaptations.push('Exercícios de fortalecimento de MMII prioritários');
      adaptations.push('Treino de marcha em ambiente seguro');
    }
  }

  return adaptations;
}

function generateExerciseModifications(exercise: any, context: any): string {
  const modifications = [];

  if (context.patientAge && context.patientAge >= 65) {
    modifications.push('versão de baixo impacto');
  }

  if (exercise.difficulty >= 4 && context.patientCondition?.includes('acute')) {
    modifications.push('reduzir amplitude de movimento');
    modifications.push('diminuir número de repetições');
  }

  if (exercise.equipment?.includes('peso') && context.patientAge >= 65) {
    modifications.push('usar pesos mais leves');
    modifications.push('focar na técnica correta');
  }

  return modifications.join(', ');
}

async function generateAISuggestion(context: any): Promise<ProtocolSuggestion> {
  try {
    // Initialize Google Gemini (if API key is available)
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return createFallbackSuggestion(context);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
Como fisioterapeuta especializado, sugira um protocolo de tratamento para:

Patologia: ${context.pathologyName}
Sintomas: ${context.symptoms.join(', ') || 'Não especificados'}
Idade do paciente: ${context.patientAge || 'Não especificada'}
Condição: ${context.patientCondition || 'Não especificada'}
Informações adicionais: ${context.additionalInfo || 'Nenhuma'}

Histórico recente do paciente:
${context.patient?.appointments?.slice(0, 3).map((apt: any) => 
  apt.soapNotes?.map((note: any) => `${note.subjective || ''} ${note.objective || ''}`).join(' ')
).join('\n') || 'Sem histórico disponível'}

Por favor, forneça:
1. Nome do protocolo sugerido
2. Frequência recomendada
3. Duração estimada
4. 3-5 exercícios principais com repetições
5. Adaptações especiais para este paciente
6. Justificativa para a escolha

Seja específico e baseado em evidências científicas atuais.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      protocolId: 'ai_generated',
      protocolName: 'Protocolo Sugerido pela IA',
      pathology: context.pathologyName,
      confidenceScore: 0.75,
      reasoning: text,
      adaptations: ['Protocolo personalizado gerado por IA baseado no perfil específico do paciente'],
    };
  } catch (error) {
    console.error('Error generating AI suggestion:', error);
    return createFallbackSuggestion(context);
  }
}

function createFallbackSuggestion(context: any): ProtocolSuggestion {
  return {
    protocolId: 'fallback',
    protocolName: `Protocolo Básico para ${context.pathologyName}`,
    pathology: context.pathologyName,
    confidenceScore: 0.6,
    reasoning: 'Protocolo básico baseado em diretrizes gerais para a patologia identificada. Recomenda-se avaliação detalhada para personalização.',
    adaptations: [
      'Avaliar tolerância do paciente antes de iniciar',
      'Ajustar intensidade conforme resposta ao tratamento',
      'Monitorar sintomas durante as sessões',
    ],
    exercises: [
      {
        exerciseId: 'basic_1',
        exerciseName: 'Exercícios de mobilização',
        order: 1,
        sets: 2,
        repetitions: '10-15',
        modifications: 'Conforme tolerância do paciente',
      },
      {
        exerciseId: 'basic_2',
        exerciseName: 'Fortalecimento progressivo',
        order: 2,
        sets: 2,
        repetitions: '8-12',
        modifications: 'Iniciar com baixa resistência',
      },
    ],
  };
}