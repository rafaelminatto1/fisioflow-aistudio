import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const batchCategorizeSchema = z.object({
  exercises: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    description: z.string(),
    instructions: z.string().optional(),
    body_parts: z.array(z.string()).optional(),
    equipment: z.array(z.string()).optional(),
    difficulty: z.string().optional()
  })),
  options: z.object({
    updateDatabase: z.boolean().default(false),
    autoApprove: z.boolean().default(false),
    confidenceThreshold: z.number().min(0).max(100).default(70)
  }).optional()
});

interface BatchResult {
  exerciseId?: string;
  exerciseName: string;
  analysis: any;
  updated: boolean;
  approved: boolean;
  errors?: string[];
}

async function categorizeExercise(exercise: any): Promise<any> {
  // Reutilizar a lógica do endpoint de categorização individual
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/categorize-exercise`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
      bodyParts: exercise.body_parts,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty
    })
  });
  
  if (!response.ok) {
    throw new Error(`Categorization failed: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.analysis;
}

async function updateExerciseInDatabase(exerciseId: string, analysis: any): Promise<boolean> {
  try {
    const updateData: any = {};
    
    // Atualizar categorias principais
    if (analysis.categories && analysis.categories.length > 0) {
      updateData.category = analysis.categories[0].category;
      if (analysis.categories[0].subcategory) {
        updateData.subcategory = analysis.categories[0].subcategory;
      }
    }
    
    // Atualizar partes do corpo
    if (analysis.suggestedBodyParts && analysis.suggestedBodyParts.length > 0) {
      updateData.body_parts = analysis.suggestedBodyParts.join(',');
    }
    
    // Atualizar equipamentos
    if (analysis.suggestedEquipment && analysis.suggestedEquipment.length > 0) {
      updateData.equipment = analysis.suggestedEquipment.join(',');
    }
    
    // Atualizar dificuldade
    if (analysis.estimatedDifficulty) {
      updateData.difficulty = analysis.estimatedDifficulty;
    }
    
    // Atualizar objetivos terapêuticos
    if (analysis.therapeuticGoals && analysis.therapeuticGoals.length > 0) {
      updateData.therapeutic_goals = analysis.therapeuticGoals.join(',');
    }
    
    // Atualizar contraindicações
    if (analysis.contraindications && analysis.contraindications.length > 0) {
      updateData.contraindications = analysis.contraindications.join(',');
    }
    
    // Adicionar metadados de IA
    updateData.ai_categorized = true;
    updateData.ai_confidence = analysis.confidence;
    updateData.ai_categorized_at = new Date();
    
    await prisma.exercises.update({
      where: { id: exerciseId },
      data: updateData
    });
    
    return true;
  } catch (error) {
    console.error('Error updating exercise in database:', error);
    return false;
  }
}

async function createApprovalRecord(exerciseId: string, analysis: any): Promise<void> {
  try {
    await prisma.exercise_approvals.create({
      data: {
        id: `approval_${exerciseId}_${Date.now()}`,
        exercise_id: exerciseId,
        status: 'pending',
        ai_analysis: JSON.stringify(analysis),
        submitted_by: 'ai_system',
        submitted_at: new Date(),
        metadata: JSON.stringify({
          confidence: analysis.confidence,
          categories: analysis.categories,
          version: '1.0'
        })
      }
    });
  } catch (error) {
    console.error('Error creating approval record:', error);
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const validatedData = batchCategorizeSchema.parse(data);
    
    const { exercises, options } = validatedData;
    const {
      updateDatabase = false,
      autoApprove = false,
      confidenceThreshold = 70
    } = options || {};
    
    const results: BatchResult[] = [];
    const startTime = Date.now();
    
    console.log(`Starting batch categorization of ${exercises.length} exercises...`);
    
    // Processar exercícios em lotes para evitar sobrecarga
    const batchSize = 10;
    for (let i = 0; i < exercises.length; i += batchSize) {
      const batch = exercises.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (exercise) => {
        const result: BatchResult = {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          analysis: null,
          updated: false,
          approved: false,
          errors: []
        };
        
        try {
          // Categorizar exercício
          const analysis = await categorizeExercise(exercise);
          result.analysis = analysis;
          
          // Verificar se atende ao threshold de confiança
          if (analysis.confidence < confidenceThreshold) {
            result.errors?.push(`Confiança baixa: ${analysis.confidence}% (mínimo: ${confidenceThreshold}%)`);
          }
          
          // Atualizar no banco de dados se solicitado
          if (updateDatabase && exercise.id) {
            const updated = await updateExerciseInDatabase(exercise.id, analysis);
            result.updated = updated;
            
            if (!updated) {
              result.errors?.push('Falha ao atualizar no banco de dados');
            }
          }
          
          // Criar registro de aprovação se necessário
          if (updateDatabase && exercise.id && !autoApprove) {
            await createApprovalRecord(exercise.id, analysis);
          }
          
          // Auto-aprovar se configurado e confiança suficiente
          if (autoApprove && analysis.confidence >= confidenceThreshold) {
            result.approved = true;
          }
          
        } catch (error) {
          console.error(`Error processing exercise ${exercise.name}:`, error);
          result.errors?.push(error instanceof Error ? error.message : 'Erro desconhecido');
        }
        
        return result;
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((promiseResult, index) => {
        if (promiseResult.status === 'fulfilled') {
          results.push(promiseResult.value);
        } else {
          results.push({
            exerciseId: batch[index].id,
            exerciseName: batch[index].name,
            analysis: null,
            updated: false,
            approved: false,
            errors: [`Falha no processamento: ${promiseResult.reason}`]
          });
        }
      });
      
      // Pequena pausa entre lotes
      if (i + batchSize < exercises.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Estatísticas do processamento
    const stats = {
      total: exercises.length,
      successful: results.filter(r => r.analysis && r.errors?.length === 0).length,
      failed: results.filter(r => !r.analysis || (r.errors && r.errors.length > 0)).length,
      updated: results.filter(r => r.updated).length,
      approved: results.filter(r => r.approved).length,
      averageConfidence: results
        .filter(r => r.analysis?.confidence)
        .reduce((acc, r) => acc + r.analysis.confidence, 0) / 
        Math.max(results.filter(r => r.analysis?.confidence).length, 1),
      processingTimeMs: processingTime,
      averageTimePerExercise: processingTime / exercises.length
    };
    
    console.log('Batch categorization completed:', stats);
    
    return NextResponse.json({
      success: true,
      results,
      stats,
      metadata: {
        processedAt: new Date().toISOString(),
        options: options,
        batchSize,
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error in batch categorization:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dados de entrada inválidos',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno no sistema de categorização em lote'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'pending-approvals') {
      const pendingApprovals = await prisma.exercise_approvals.findMany({
        where: { status: 'pending' },
        include: {
          exercises: {
            select: {
              name: true,
              description: true
            }
          }
        },
        orderBy: { submitted_at: 'desc' },
        take: 100
      });
      
      return NextResponse.json({
        success: true,
        approvals: pendingApprovals
      });
    }
    
    if (action === 'stats') {
      const stats = await prisma.exercises.aggregate({
        _count: {
          id: true
        },
        where: {
          ai_categorized: true
        }
      });
      
      const recentCategorizations = await prisma.exercises.count({
        where: {
          ai_categorized: true,
          ai_categorized_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });
      
      return NextResponse.json({
        success: true,
        stats: {
          totalCategorized: stats._count.id,
          recentCategorizations,
          lastUpdated: new Date().toISOString()
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Ação não reconhecida'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error in GET request:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}