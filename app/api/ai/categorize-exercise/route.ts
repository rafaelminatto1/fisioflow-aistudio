import { NextResponse } from 'next/server';
import { z } from 'zod';

const categorizeRequestSchema = z.object({
  name: z.string(),
  description: z.string(),
  instructions: z.string().optional(),
  bodyParts: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  difficulty: z.string().optional()
});

interface CategoryPrediction {
  category: string;
  subcategory?: string;
  confidence: number;
  reasoning: string;
}

interface ExerciseAnalysis {
  categories: CategoryPrediction[];
  suggestedBodyParts: string[];
  suggestedEquipment: string[];
  estimatedDifficulty: 'iniciante' | 'intermediario' | 'avancado';
  therapeuticGoals: string[];
  contraindications: string[];
  confidence: number;
}

const EXERCISE_CATEGORIES = {
  'fortalecimento': {
    keywords: ['força', 'fortalec', 'resistência', 'tonific', 'musculação', 'peso'],
    subcategories: ['isométrico', 'isotônico', 'pliométrico', 'funcional']
  },
  'alongamento': {
    keywords: ['alonga', 'flexibilidade', 'estica', 'mobilidade', 'amplitude'],
    subcategories: ['estático', 'dinâmico', 'PNF', 'passivo']
  },
  'cardio': {
    keywords: ['cardio', 'aeróbico', 'corrida', 'caminhada', 'bike', 'esteira'],
    subcategories: ['baixa intensidade', 'moderada intensidade', 'alta intensidade']
  },
  'equilibrio': {
    keywords: ['equilíbrio', 'propriocepção', 'estabilidade', 'coordenação'],
    subcategories: ['estático', 'dinâmico', 'reativo']
  },
  'mobilidade': {
    keywords: ['mobilidade', 'movimento', 'articular', 'amplitude', 'ROM'],
    subcategories: ['ativa', 'passiva', 'assistida']
  },
  'respiratorio': {
    keywords: ['respirat', 'pulmonar', 'diafragma', 'expansão', 'ventilação'],
    subcategories: ['inspiratório', 'expiratório', 'misto']
  },
  'neurologico': {
    keywords: ['neuro', 'coordenação', 'motor', 'reflexo', 'sensitivo'],
    subcategories: ['motor fino', 'motor grosso', 'sensorial']
  }
};

const BODY_PARTS_MAPPING = {
  'membros superiores': ['braço', 'antebraço', 'mão', 'ombro', 'punho', 'cotovelo'],
  'membros inferiores': ['perna', 'coxa', 'panturrilha', 'pé', 'quadril', 'joelho', 'tornozelo'],
  'tronco': ['abdomen', 'lombar', 'dorsal', 'core', 'coluna'],
  'pescoço': ['cervical', 'pescoço', 'cabeça'],
  'corpo todo': ['global', 'geral', 'todo', 'completo']
};

const EQUIPMENT_MAPPING = {
  'sem equipamento': ['livre', 'solo', 'próprio peso'],
  'halteres': ['halter', 'peso', 'dumbbell'],
  'elástico': ['elástico', 'band', 'theraband'],
  'bola': ['bola', 'swiss ball', 'pilates ball'],
  'aparelhos': ['máquina', 'aparelho', 'equipamento'],
  'acessórios': ['bastão', 'step', 'cone', 'disco']
};

function analyzeKeywords(text: string, categoryKeywords: string[]): number {
  const normalizedText = text.toLowerCase();
  let score = 0;
  
  for (const keyword of categoryKeywords) {
    if (normalizedText.includes(keyword)) {
      score += 1;
    }
  }
  
  return score / categoryKeywords.length;
}

function extractBodyParts(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const detectedParts: string[] = [];
  
  for (const [bodyPart, keywords] of Object.entries(BODY_PARTS_MAPPING)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        if (!detectedParts.includes(bodyPart)) {
          detectedParts.push(bodyPart);
        }
        break;
      }
    }
  }
  
  return detectedParts;
}

function extractEquipment(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const detectedEquipment: string[] = [];
  
  for (const [equipment, keywords] of Object.entries(EQUIPMENT_MAPPING)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        if (!detectedEquipment.includes(equipment)) {
          detectedEquipment.push(equipment);
        }
        break;
      }
    }
  }
  
  return detectedEquipment.length > 0 ? detectedEquipment : ['sem equipamento'];
}

function estimateDifficulty(text: string, instructions?: string): 'iniciante' | 'intermediario' | 'avancado' {
  const fullText = `${text} ${instructions || ''}`.toLowerCase();
  
  const beginnerKeywords = ['simples', 'básico', 'fácil', 'iniciante', 'leve', 'suave'];
  const advancedKeywords = ['avançado', 'complexo', 'difícil', 'intenso', 'máximo', 'explosivo'];
  
  let beginnerScore = 0;
  let advancedScore = 0;
  
  for (const keyword of beginnerKeywords) {
    if (fullText.includes(keyword)) beginnerScore++;
  }
  
  for (const keyword of advancedKeywords) {
    if (fullText.includes(keyword)) advancedScore++;
  }
  
  if (advancedScore > beginnerScore) return 'avancado';
  if (beginnerScore > 0) return 'iniciante';
  
  // Análise por complexidade do movimento
  const complexityIndicators = ['coordenação', 'equilíbrio', 'múltiplos', 'combinado', 'sequência'];
  let complexityScore = 0;
  
  for (const indicator of complexityIndicators) {
    if (fullText.includes(indicator)) complexityScore++;
  }
  
  return complexityScore >= 2 ? 'avancado' : 'intermediario';
}

function identifyTherapeuticGoals(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const goals: string[] = [];
  
  const goalKeywords = {
    'fortalecimento muscular': ['força', 'fortalec', 'tonific', 'resistência muscular'],
    'flexibilidade': ['alonga', 'flexibilidade', 'amplitude', 'mobilidade'],
    'coordenação motora': ['coordenação', 'motor', 'equilíbrio', 'propriocepção'],
    'condicionamento cardiorrespiratório': ['cardio', 'aeróbico', 'resistência cardio', 'fôlego'],
    'reabilitação': ['reabilitação', 'recuperação', 'lesão', 'dor'],
    'prevenção': ['preventivo', 'prevenção', 'manutenção', 'profilaxia']
  };
  
  for (const [goal, keywords] of Object.entries(goalKeywords)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        if (!goals.includes(goal)) {
          goals.push(goal);
        }
        break;
      }
    }
  }
  
  return goals;
}

function identifyContraindications(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const contraindications: string[] = [];
  
  const contraindicationKeywords = {
    'lesão aguda': ['lesão aguda', 'inflamação', 'trauma recente'],
    'dor intensa': ['dor intensa', 'dor severa', 'muito doloroso'],
    'instabilidade articular': ['instabilidade', 'luxação', 'subluxação'],
    'hipertensão não controlada': ['pressão alta', 'hipertensão', 'cardiopatia'],
    'gravidez': ['gestante', 'grávida', 'gestação'],
    'pós-cirúrgico imediato': ['pós-operatório', 'cirurgia recente', 'pós-cirúrgico']
  };
  
  for (const [contraindication, keywords] of Object.entries(contraindicationKeywords)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        if (!contraindications.includes(contraindication)) {
          contraindications.push(contraindication);
        }
        break;
      }
    }
  }
  
  return contraindications;
}

function categorizeExercise(data: any): ExerciseAnalysis {
  const fullText = `${data.name} ${data.description} ${data.instructions || ''}`;
  const categories: CategoryPrediction[] = [];
  
  // Análise de categorias
  for (const [category, config] of Object.entries(EXERCISE_CATEGORIES)) {
    const confidence = analyzeKeywords(fullText, config.keywords);
    
    if (confidence > 0) {
      // Determinar subcategoria
      let bestSubcategory = '';
      let bestSubcategoryScore = 0;
      
      for (const subcategory of config.subcategories) {
        const subcategoryScore = analyzeKeywords(fullText, [subcategory]);
        if (subcategoryScore > bestSubcategoryScore) {
          bestSubcategoryScore = subcategoryScore;
          bestSubcategory = subcategory;
        }
      }
      
      categories.push({
        category,
        subcategory: bestSubcategoryScore > 0 ? bestSubcategory : undefined,
        confidence: Math.min(confidence * 100, 95), // Max 95% confidence
        reasoning: `Detectadas palavras-chave relacionadas a ${category}: ${config.keywords.filter(k => fullText.toLowerCase().includes(k)).join(', ')}`
      });
    }
  }
  
  // Ordenar por confiança
  categories.sort((a, b) => b.confidence - a.confidence);
  
  // Análise de outras características
  const suggestedBodyParts = data.bodyParts && data.bodyParts.length > 0 
    ? data.bodyParts 
    : extractBodyParts(fullText);
    
  const suggestedEquipment = data.equipment && data.equipment.length > 0
    ? data.equipment
    : extractEquipment(fullText);
    
  const estimatedDifficulty = data.difficulty || estimateDifficulty(fullText, data.instructions);
  
  const therapeuticGoals = identifyTherapeuticGoals(fullText);
  const contraindications = identifyContraindications(fullText);
  
  // Calcular confiança geral
  const overallConfidence = categories.length > 0 
    ? categories[0].confidence * 0.6 + (categories.length > 1 ? categories[1].confidence * 0.3 : 0) + 10
    : 50;
  
  return {
    categories: categories.slice(0, 3), // Top 3 categorias
    suggestedBodyParts,
    suggestedEquipment,
    estimatedDifficulty,
    therapeuticGoals,
    contraindications,
    confidence: Math.min(overallConfidence, 95)
  };
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validar entrada
    const validatedData = categorizeRequestSchema.parse(data);
    
    // Realizar análise de categorização
    const analysis = categorizeExercise(validatedData);
    
    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        processedAt: new Date().toISOString(),
        algorithm: 'keyword-based-ml',
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error in exercise categorization:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dados de entrada inválidos',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno no sistema de categorização'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'categories') {
    return NextResponse.json({
      success: true,
      categories: Object.keys(EXERCISE_CATEGORIES),
      bodyParts: Object.keys(BODY_PARTS_MAPPING),
      equipment: Object.keys(EQUIPMENT_MAPPING),
      difficulties: ['iniciante', 'intermediario', 'avancado']
    });
  }
  
  if (action === 'stats') {
    return NextResponse.json({
      success: true,
      stats: {
        categoriesCount: Object.keys(EXERCISE_CATEGORIES).length,
        bodyPartsCount: Object.keys(BODY_PARTS_MAPPING).length,
        equipmentCount: Object.keys(EQUIPMENT_MAPPING).length,
        lastUpdated: new Date().toISOString()
      }
    });
  }
  
  return NextResponse.json({
    success: false,
    error: 'Ação não reconhecida'
  }, { status: 400 });
}