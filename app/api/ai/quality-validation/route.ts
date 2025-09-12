import { NextResponse } from 'next/server';
import { z } from 'zod';

const qualityValidationSchema = z.object({
  exercise: z.object({
    id: z.string().optional(),
    name: z.string(),
    description: z.string(),
    instructions: z.string().optional(),
    category: z.string().optional(),
    body_parts: z.array(z.string()).optional(),
    equipment: z.array(z.string()).optional(),
    difficulty: z.string().optional(),
    contraindications: z.array(z.string()).optional(),
    video_url: z.string().optional(),
    thumbnail_url: z.string().optional()
  }),
  validationLevel: z.enum(['basic', 'standard', 'comprehensive']).default('standard')
});

interface ValidationResult {
  score: number;
  passed: boolean;
  issues: ValidationIssue[];
  recommendations: string[];
  metadata: {
    validationLevel: string;
    timestamp: string;
    version: string;
  };
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  field: string;
  message: string;
  severity: number; // 1-5, 5 being most severe
  suggestion?: string;
}

class ExerciseQualityValidator {
  private minNameLength = 5;
  private maxNameLength = 100;
  private minDescriptionLength = 20;
  private maxDescriptionLength = 1000;
  private minInstructionsLength = 10;
  private maxInstructionsLength = 2000;
  
  private qualityKeywords = {
    positive: ['correto', 'adequado', 'seguro', 'eficaz', 'benéfico', 'recomendado'],
    negative: ['perigoso', 'arriscado', 'inadequado', 'contraindicado', 'prejudicial'],
    technical: ['amplitude', 'articulação', 'músculo', 'movimento', 'postura', 'respiração']
  };
  
  private suspiciousPatterns = [
    /lorem ipsum/i,
    /test\s+exercise/i,
    /exemplo/i,
    /\b(xxx|todo|fixme)\b/i,
    /^\s*$/, // Empty or whitespace only
    /(.)\1{10,}/, // Repeated characters
  ];

  validate(exercise: any, level: string = 'standard'): ValidationResult {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    
    // Basic validation
    this.validateName(exercise, issues, recommendations);
    this.validateDescription(exercise, issues, recommendations);
    this.validateInstructions(exercise, issues, recommendations);
    this.validateBodyParts(exercise, issues, recommendations);
    this.validateEquipment(exercise, issues, recommendations);
    
    if (level === 'standard' || level === 'comprehensive') {
      this.validateCategory(exercise, issues, recommendations);
      this.validateDifficulty(exercise, issues, recommendations);
      this.validateContraindications(exercise, issues, recommendations);
      this.validateContent(exercise, issues, recommendations);
    }
    
    if (level === 'comprehensive') {
      this.validateMedia(exercise, issues, recommendations);
      this.validateSemantics(exercise, issues, recommendations);
      this.validateSafety(exercise, issues, recommendations);
      this.validateCompleteness(exercise, issues, recommendations);
    }
    
    // Calculate overall quality score
    const score = this.calculateQualityScore(issues);
    const passed = score >= 70 && !issues.some(issue => issue.type === 'error');
    
    return {
      score,
      passed,
      issues,
      recommendations,
      metadata: {
        validationLevel: level,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    };
  }

  private validateName(exercise: any, issues: ValidationIssue[], recommendations: string[]) {
    if (!exercise.name || typeof exercise.name !== 'string') {
      issues.push({
        type: 'error',
        category: 'required_field',
        field: 'name',
        message: 'Nome do exercício é obrigatório',
        severity: 5
      });
      return;
    }

    const name = exercise.name.trim();
    
    if (name.length < this.minNameLength) {
      issues.push({
        type: 'error',
        category: 'length',
        field: 'name',
        message: `Nome muito curto (mínimo: ${this.minNameLength} caracteres)`,
        severity: 4,
        suggestion: 'Adicione mais detalhes descritivos ao nome'
      });
    }
    
    if (name.length > this.maxNameLength) {
      issues.push({
        type: 'warning',
        category: 'length',
        field: 'name',
        message: `Nome muito longo (máximo: ${this.maxNameLength} caracteres)`,
        severity: 2,
        suggestion: 'Torne o nome mais conciso'
      });
    }
    
    // Check for suspicious patterns
    this.suspiciousPatterns.forEach(pattern => {
      if (pattern.test(name)) {
        issues.push({
          type: 'error',
          category: 'content_quality',
          field: 'name',
          message: 'Nome contém texto suspeito ou placeholder',
          severity: 4,
          suggestion: 'Substitua por um nome real e descritivo'
        });
      }
    });
    
    // Check for proper capitalization
    if (name !== name.charAt(0).toUpperCase() + name.slice(1)) {
      recommendations.push('Considere capitalizar adequadamente o nome do exercício');
    }
  }

  private validateDescription(exercise: any, issues: ValidationIssue[], recommendations: string[]) {
    if (!exercise.description || typeof exercise.description !== 'string') {
      issues.push({
        type: 'error',
        category: 'required_field',
        field: 'description',
        message: 'Descrição do exercício é obrigatória',
        severity: 5
      });
      return;
    }

    const description = exercise.description.trim();
    
    if (description.length < this.minDescriptionLength) {
      issues.push({
        type: 'error',
        category: 'length',
        field: 'description',
        message: `Descrição muito curta (mínimo: ${this.minDescriptionLength} caracteres)`,
        severity: 4,
        suggestion: 'Adicione mais detalhes sobre o exercício, objetivos e benefícios'
      });
    }
    
    if (description.length > this.maxDescriptionLength) {
      issues.push({
        type: 'warning',
        category: 'length',
        field: 'description',
        message: `Descrição muito longa (máximo: ${this.maxDescriptionLength} caracteres)`,
        severity: 2,
        suggestion: 'Torne a descrição mais concisa'
      });
    }
    
    // Check for suspicious patterns
    this.suspiciousPatterns.forEach(pattern => {
      if (pattern.test(description)) {
        issues.push({
          type: 'error',
          category: 'content_quality',
          field: 'description',
          message: 'Descrição contém texto suspeito ou placeholder',
          severity: 4
        });
      }
    });
  }

  private validateInstructions(exercise: any, issues: ValidationIssue[], recommendations: string[]) {
    if (!exercise.instructions) {
      recommendations.push('Adicione instruções detalhadas para o exercício');
      return;
    }

    const instructions = exercise.instructions.trim();
    
    if (instructions.length < this.minInstructionsLength) {
      issues.push({
        type: 'warning',
        category: 'length',
        field: 'instructions',
        message: `Instruções muito curtas (mínimo recomendado: ${this.minInstructionsLength} caracteres)`,
        severity: 3,
        suggestion: 'Adicione passos detalhados de execução'
      });
    }
    
    if (instructions.length > this.maxInstructionsLength) {
      issues.push({
        type: 'warning',
        category: 'length',
        field: 'instructions',
        message: `Instruções muito longas (máximo recomendado: ${this.maxInstructionsLength} caracteres)`,
        severity: 2
      });
    }
    
    // Check if instructions contain numbered steps or clear structure
    const hasNumberedSteps = /^\s*\d+[\.\)]/m.test(instructions);
    const hasBulletPoints = /^\s*[\-\*\•]/m.test(instructions);
    
    if (!hasNumberedSteps && !hasBulletPoints && instructions.length > 100) {
      recommendations.push('Considere estruturar as instruções em passos numerados ou tópicos');
    }
  }

  private validateBodyParts(exercise: any, issues: ValidationIssue[], recommendations: string[]) {
    if (!exercise.body_parts || !Array.isArray(exercise.body_parts)) {
      issues.push({
        type: 'warning',
        category: 'missing_field',
        field: 'body_parts',
        message: 'Partes do corpo não especificadas',
        severity: 3,
        suggestion: 'Especifique quais partes do corpo são trabalhadas'
      });
      return;
    }

    if (exercise.body_parts.length === 0) {
      issues.push({
        type: 'warning',
        category: 'empty_field',
        field: 'body_parts',
        message: 'Lista de partes do corpo está vazia',
        severity: 3
      });
    }

    const validBodyParts = [
      'membros superiores', 'membros inferiores', 'tronco', 'pescoço', 'corpo todo',
      'braço', 'antebraço', 'mão', 'ombro', 'punho', 'cotovelo',
      'perna', 'coxa', 'panturrilha', 'pé', 'quadril', 'joelho', 'tornozelo',
      'abdomen', 'lombar', 'dorsal', 'core', 'coluna', 'cervical'
    ];

    exercise.body_parts.forEach((part: string) => {
      if (!validBodyParts.includes(part.toLowerCase())) {
        issues.push({
          type: 'info',
          category: 'invalid_value',
          field: 'body_parts',
          message: `Parte do corpo não reconhecida: "${part}"`,
          severity: 1,
          suggestion: 'Verifique a ortografia ou use termos padrão'
        });
      }
    });
  }

  private validateEquipment(exercise: any, issues: ValidationIssue[], recommendations: string[]) {
    if (!exercise.equipment || !Array.isArray(exercise.equipment)) {
      recommendations.push('Especifique os equipamentos necessários (ou "sem equipamento")');
      return;
    }

    const validEquipment = [
      'sem equipamento', 'halteres', 'elástico', 'bola', 'aparelhos', 'acessórios',
      'halter', 'peso', 'dumbbell', 'band', 'theraband', 'swiss ball', 'pilates ball',
      'máquina', 'aparelho', 'equipamento', 'bastão', 'step', 'cone', 'disco'
    ];

    exercise.equipment.forEach((equip: string) => {
      if (!validEquipment.includes(equip.toLowerCase())) {
        issues.push({
          type: 'info',
          category: 'invalid_value',
          field: 'equipment',
          message: `Equipamento não reconhecido: "${equip}"`,
          severity: 1
        });
      }
    });
  }

  private validateCategory(exercise: any, issues: ValidationIssue[], recommendations: string[]) {
    if (!exercise.category) {
      issues.push({
        type: 'warning',
        category: 'missing_field',
        field: 'category',
        message: 'Categoria não especificada',
        severity: 3
      });
      return;
    }

    const validCategories = [
      'fortalecimento', 'alongamento', 'cardio', 'equilibrio', 'mobilidade',
      'respiratorio', 'neurologico'
    ];

    if (!validCategories.includes(exercise.category.toLowerCase())) {
      issues.push({
        type: 'warning',
        category: 'invalid_value',
        field: 'category',
        message: `Categoria não reconhecida: "${exercise.category}"`,
        severity: 2,
        suggestion: 'Use uma das categorias padrão do sistema'
      });
    }
  }

  private validateDifficulty(exercise: any, issues: ValidationIssue[], recommendations: string[]) {
    if (!exercise.difficulty) {
      recommendations.push('Especifique o nível de dificuldade do exercício');
      return;
    }

    const validDifficulties = ['iniciante', 'intermediario', 'avancado'];
    
    if (!validDifficulties.includes(exercise.difficulty.toLowerCase())) {
      issues.push({
        type: 'warning',
        category: 'invalid_value',
        field: 'difficulty',
        message: `Nível de dificuldade não reconhecido: "${exercise.difficulty}"`,
        severity: 2,
        suggestion: 'Use: iniciante, intermediario ou avancado'
      });
    }
  }

  private validateContraindications(exercise: any, issues: ValidationIssue[], recommendations: string[]) {
    if (exercise.contraindications && Array.isArray(exercise.contraindications)) {
      if (exercise.contraindications.length === 0) {
        recommendations.push('Considere adicionar contraindicações se aplicável');
      }
      
      // Check for common contraindication patterns
      const commonContraindications = [
        'lesão aguda', 'dor intensa', 'instabilidade articular', 'hipertensão não controlada',
        'gravidez', 'pós-cirúrgico imediato'
      ];
      
      exercise.contraindications.forEach((contra: string) => {
        if (contra.length < 5) {
          issues.push({
            type: 'info',
            category: 'content_quality',
            field: 'contraindications',
            message: 'Contraindicação muito vaga ou curta',
            severity: 1,
            suggestion: 'Seja mais específico sobre as contraindicações'
          });
        }
      });
    }
  }

  private validateContent(exercise: any, issues: ValidationIssue[], recommendations: string[]) {
    const fullText = `${exercise.name} ${exercise.description} ${exercise.instructions || ''}`.toLowerCase();
    
    // Check for technical quality indicators
    let technicalScore = 0;
    this.qualityKeywords.technical.forEach(keyword => {
      if (fullText.includes(keyword)) technicalScore++;
    });
    
    if (technicalScore === 0) {
      issues.push({
        type: 'warning',
        category: 'content_quality',
        field: 'general',
        message: 'Conteúdo pode carecer de termos técnicos adequados',
        severity: 2,
        suggestion: 'Inclua terminologia anatômica e técnica apropriada'
      });
    }
    
    // Check for positive/negative language balance
    let positiveCount = 0;
    let negativeCount = 0;
    
    this.qualityKeywords.positive.forEach(keyword => {
      if (fullText.includes(keyword)) positiveCount++;
    });
    
    this.qualityKeywords.negative.forEach(keyword => {
      if (fullText.includes(keyword)) negativeCount++;
    });
    
    if (negativeCount > positiveCount * 2) {
      issues.push({
        type: 'info',
        category: 'content_tone',
        field: 'general',
        message: 'Conteúdo pode ter tom excessivamente negativo',
        severity: 1,
        suggestion: 'Equilibre com aspectos positivos e benefícios'
      });
    }
  }

  private validateMedia(exercise: any, issues: ValidationIssue[], recommendations: string[]) {
    if (!exercise.video_url && !exercise.thumbnail_url) {
      recommendations.push('Considere adicionar vídeo demonstrativo ou imagem');
    }
    
    if (exercise.video_url) {
      if (!this.isValidUrl(exercise.video_url)) {
        issues.push({
          type: 'error',
          category: 'invalid_url',
          field: 'video_url',
          message: 'URL do vídeo inválida',
          severity: 3
        });
      }
    }
    
    if (exercise.thumbnail_url) {
      if (!this.isValidUrl(exercise.thumbnail_url)) {
        issues.push({
          type: 'error',
          category: 'invalid_url',
          field: 'thumbnail_url',
          message: 'URL da imagem inválida',
          severity: 3
        });
      }
    }
  }

  private validateSemantics(exercise: any, issues: ValidationIssue[], recommendations: string[]) {
    const name = exercise.name?.toLowerCase() || '';
    const description = exercise.description?.toLowerCase() || '';
    
    // Check for semantic consistency between name and description
    const nameWords = name.split(' ').filter((word: string) => word.length > 3);
    const descriptionWords = description.split(' ');
    
    let overlap = 0;
    nameWords.forEach((word: string) => {
      if (descriptionWords.some((descWord: string) => descWord.includes(word) || word.includes(descWord))) {
        overlap++;
      }
    });
    
    if (nameWords.length > 0 && overlap / nameWords.length < 0.3) {
      issues.push({
        type: 'warning',
        category: 'semantic_consistency',
        field: 'general',
        message: 'Nome e descrição podem não estar semanticamente alinhados',
        severity: 2,
        suggestion: 'Verifique se a descrição corresponde ao nome do exercício'
      });
    }
  }

  private validateSafety(exercise: any, issues: ValidationIssue[], recommendations: string[]) {
    const fullText = `${exercise.name} ${exercise.description} ${exercise.instructions || ''}`.toLowerCase();
    
    const safetyKeywords = ['cuidado', 'atenção', 'segurança', 'postura', 'respiração', 'controle'];
    const riskKeywords = ['forçar', 'máximo', 'extremo', 'doloroso'];
    
    let safetyScore = 0;
    let riskScore = 0;
    
    safetyKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) safetyScore++;
    });
    
    riskKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) riskScore++;
    });
    
    if (riskScore > safetyScore && riskScore > 1) {
      issues.push({
        type: 'warning',
        category: 'safety_concern',
        field: 'general',
        message: 'Exercício pode apresentar linguagem que indica riscos',
        severity: 3,
        suggestion: 'Adicione orientações de segurança e precauções'
      });
    }
    
    if (safetyScore === 0 && exercise.difficulty === 'avancado') {
      recommendations.push('Exercícios avançados devem incluir orientações de segurança');
    }
  }

  private validateCompleteness(exercise: any, issues: ValidationIssue[], recommendations: string[]) {
    const requiredFields = ['name', 'description'];
    const recommendedFields = ['instructions', 'body_parts', 'equipment', 'category', 'difficulty'];
    
    let completenessScore = 0;
    const totalFields = requiredFields.length + recommendedFields.length;
    
    requiredFields.forEach(field => {
      if (exercise[field] && exercise[field].toString().trim()) {
        completenessScore += 2; // Required fields worth more
      }
    });
    
    recommendedFields.forEach(field => {
      if (exercise[field] && (Array.isArray(exercise[field]) ? exercise[field].length > 0 : exercise[field].toString().trim())) {
        completenessScore += 1;
      }
    });
    
    const completenessPercentage = (completenessScore / (requiredFields.length * 2 + recommendedFields.length)) * 100;
    
    if (completenessPercentage < 70) {
      issues.push({
        type: 'warning',
        category: 'completeness',
        field: 'general',
        message: `Exercício ${completenessPercentage.toFixed(0)}% completo`,
        severity: 2,
        suggestion: 'Preencha mais campos para melhorar a qualidade'
      });
    }
  }

  private calculateQualityScore(issues: ValidationIssue[]): number {
    let score = 100;
    
    issues.forEach(issue => {
      let deduction = 0;
      
      switch (issue.type) {
        case 'error':
          deduction = issue.severity * 4; // Errors are heavily penalized
          break;
        case 'warning':
          deduction = issue.severity * 2;
          break;
        case 'info':
          deduction = issue.severity * 1;
          break;
      }
      
      score -= deduction;
    });
    
    return Math.max(0, Math.min(100, score));
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const validatedData = qualityValidationSchema.parse(data);
    
    const validator = new ExerciseQualityValidator();
    const result = validator.validate(validatedData.exercise, validatedData.validationLevel);
    
    return NextResponse.json({
      success: true,
      validation: result
    });
    
  } catch (error) {
    console.error('Error in quality validation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dados de entrada inválidos',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno no sistema de validação'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'criteria') {
    return NextResponse.json({
      success: true,
      criteria: {
        validationLevels: [
          { value: 'basic', label: 'Básico', description: 'Validação de campos obrigatórios' },
          { value: 'standard', label: 'Padrão', description: 'Validação completa de qualidade' },
          { value: 'comprehensive', label: 'Abrangente', description: 'Validação detalhada incluindo segurança e semântica' }
        ],
        categories: [
          'required_field', 'length', 'content_quality', 'invalid_value', 'semantic_consistency',
          'safety_concern', 'completeness', 'invalid_url', 'content_tone'
        ],
        severityLevels: [
          { level: 1, label: 'Muito Baixo', color: 'blue' },
          { level: 2, label: 'Baixo', color: 'green' },
          { level: 3, label: 'Médio', color: 'yellow' },
          { level: 4, label: 'Alto', color: 'orange' },
          { level: 5, label: 'Crítico', color: 'red' }
        ],
        passingScore: 70
      }
    });
  }
  
  return NextResponse.json({
    success: false,
    error: 'Ação não reconhecida'
  }, { status: 400 });
}