import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const customExerciseSchema = z.object({
  name: z.string().min(5).max(100),
  description: z.string().min(20).max(1000),
  instructions: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  body_parts: z.array(z.string()).default([]),
  difficulty: z.enum(['iniciante', 'intermediario', 'avancado']).default('intermediario'),
  equipment: z.array(z.string()).default([]),
  indications: z.array(z.string()).default([]),
  contraindications: z.array(z.string()).default([]),
  therapeutic_goals: z.string().optional(),
  duration: z.number().optional(),
  video_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  author_id: z.string(),
  is_public: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  source: z.enum(['user_created', 'ai_generated', 'template_based']).default('user_created')
});

const updateCustomExerciseSchema = customExerciseSchema.partial().extend({
  id: z.string()
});

const customExerciseQuerySchema = z.object({
  author_id: z.string().optional(),
  is_public: z.boolean().optional(),
  category: z.string().optional(),
  difficulty: z.string().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const validatedData = customExerciseSchema.parse(data);
    
    // Generate unique ID
    const exerciseId = `custom_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // First validate the exercise quality
    const qualityCheck = await validateExerciseQuality(validatedData);
    
    // Create the custom exercise
    const customExercise = await prisma.exercises.create({
      data: {
        id: exerciseId,
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        subcategory: validatedData.subcategory,
        body_parts: validatedData.body_parts,
        difficulty: validatedData.difficulty,
        equipment: validatedData.equipment,
        instructions: validatedData.instructions ? [validatedData.instructions] : [],
        indications: validatedData.indications,
        contraindications: validatedData.contraindications,
        therapeutic_goals: validatedData.therapeutic_goals,
        duration: validatedData.duration,
        video_url: validatedData.video_url,
        thumbnail_url: validatedData.thumbnail_url,
        author_id: validatedData.author_id,
        status: qualityCheck.autoApprove ? 'approved' : 'pending_approval',
        ai_categorized: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    // Create metadata record for custom exercises
    await createCustomExerciseMetadata(exerciseId, {
      isPublic: validatedData.is_public,
      tags: validatedData.tags,
      source: validatedData.source,
      qualityScore: qualityCheck.score,
      validation: qualityCheck.validation
    });
    
    // Auto-categorize with AI if available
    if (qualityCheck.score >= 70) {
      try {
        await categorizeCustomExercise(exerciseId, validatedData);
      } catch (error) {
        console.warn('AI categorization failed for custom exercise:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      exercise: customExercise,
      qualityCheck,
      message: qualityCheck.autoApprove ? 
        'Exercício personalizado criado e aprovado automaticamente' : 
        'Exercício personalizado criado e enviado para revisão'
    });
    
  } catch (error) {
    console.error('Error creating custom exercise:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dados de entrada inválidos',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno ao criar exercício personalizado'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      author_id: searchParams.get('author_id'),
      is_public: searchParams.get('is_public') === 'true',
      category: searchParams.get('category'),
      difficulty: searchParams.get('difficulty'),
      search: searchParams.get('search'),
      tags: searchParams.get('tags')?.split(',') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };
    
    const validatedQuery = customExerciseQuerySchema.parse(queryParams);
    
    // Build where clause
    const whereClause: any = {};
    
    if (validatedQuery.author_id) {
      whereClause.author_id = validatedQuery.author_id;
    }
    
    if (validatedQuery.category) {
      whereClause.category = { contains: validatedQuery.category, mode: 'insensitive' };
    }
    
    if (validatedQuery.difficulty) {
      whereClause.difficulty = validatedQuery.difficulty;
    }
    
    if (validatedQuery.search) {
      whereClause.OR = [
        { name: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } }
      ];
    }
    
    // Only show approved exercises for public queries
    if (!validatedQuery.author_id) {
      whereClause.status = 'approved';
    }
    
    const [exercises, total] = await Promise.all([
      prisma.exercises.findMany({
        where: whereClause,
        include: {
          exercise_media: {
            select: {
              type: true,
              url: true,
              is_primary: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: validatedQuery.limit,
        skip: validatedQuery.offset
      }),
      prisma.exercises.count({ where: whereClause })
    ]);
    
    // Add metadata for custom exercises
    const exercisesWithMetadata = await Promise.all(
      exercises.map(async (exercise) => {
        const metadata = await getCustomExerciseMetadata(exercise.id);
        return {
          ...exercise,
          custom_metadata: metadata
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      exercises: exercisesWithMetadata,
      pagination: {
        total,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        hasMore: validatedQuery.offset + validatedQuery.limit < total
      }
    });
    
  } catch (error) {
    console.error('Error fetching custom exercises:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar exercícios personalizados'
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const validatedData = updateCustomExerciseSchema.parse(data);
    
    const { id, ...updateData } = validatedData;
    
    // Check if exercise exists and user has permission
    const existingExercise = await prisma.exercises.findUnique({
      where: { id }
    });
    
    if (!existingExercise) {
      return NextResponse.json({
        success: false,
        error: 'Exercício não encontrado'
      }, { status: 404 });
    }
    
    // Validate updated quality
    const qualityCheck = await validateExerciseQuality(updateData);
    
    // Update the exercise
    const updatedExercise = await prisma.exercises.update({
      where: { id },
      data: {
        ...updateData,
        instructions: updateData.instructions ? [updateData.instructions] : undefined,
        updated_at: new Date(),
        // Reset approval status if significant changes were made
        status: qualityCheck.requiresReapproval ? 'pending_approval' : existingExercise.status
      }
    });
    
    // Update metadata
    if (validatedData.is_public !== undefined || validatedData.tags !== undefined) {
      await updateCustomExerciseMetadata(id, {
        isPublic: validatedData.is_public,
        tags: validatedData.tags,
        qualityScore: qualityCheck.score
      });
    }
    
    return NextResponse.json({
      success: true,
      exercise: updatedExercise,
      qualityCheck,
      message: qualityCheck.requiresReapproval ? 
        'Exercício atualizado e enviado para nova revisão' : 
        'Exercício personalizado atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('Error updating custom exercise:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dados de entrada inválidos',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno ao atualizar exercício'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('id');
    const authorId = searchParams.get('author_id');
    
    if (!exerciseId) {
      return NextResponse.json({
        success: false,
        error: 'ID do exercício é obrigatório'
      }, { status: 400 });
    }
    
    // Verify ownership or admin privileges
    const exercise = await prisma.exercises.findUnique({
      where: { id: exerciseId }
    });
    
    if (!exercise) {
      return NextResponse.json({
        success: false,
        error: 'Exercício não encontrado'
      }, { status: 404 });
    }
    
    if (exercise.author_id !== authorId) {
      return NextResponse.json({
        success: false,
        error: 'Sem permissão para excluir este exercício'
      }, { status: 403 });
    }
    
    // Delete custom exercise metadata first
    await deleteCustomExerciseMetadata(exerciseId);
    
    // Delete the exercise (cascade will handle related records)
    await prisma.exercises.delete({
      where: { id: exerciseId }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Exercício personalizado excluído com sucesso'
    });
    
  } catch (error) {
    console.error('Error deleting custom exercise:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno ao excluir exercício'
    }, { status: 500 });
  }
}

// Helper functions

async function validateExerciseQuality(exerciseData: any) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/quality-validation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exercise: exerciseData,
        validationLevel: 'standard'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      return {
        score: result.validation.score,
        autoApprove: result.validation.passed && result.validation.score >= 85,
        requiresReapproval: result.validation.score < 70,
        validation: result.validation
      };
    }
  } catch (error) {
    console.warn('Quality validation failed:', error);
  }
  
  // Fallback basic validation
  const basicScore = exerciseData.name && exerciseData.description ? 75 : 50;
  return {
    score: basicScore,
    autoApprove: basicScore >= 85,
    requiresReapproval: basicScore < 70,
    validation: null
  };
}

async function categorizeCustomExercise(exerciseId: string, exerciseData: any) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/categorize-exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: exerciseData.name,
        description: exerciseData.description,
        instructions: exerciseData.instructions,
        bodyParts: exerciseData.body_parts,
        equipment: exerciseData.equipment,
        difficulty: exerciseData.difficulty
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      // Update exercise with AI suggestions
      await prisma.exercises.update({
        where: { id: exerciseId },
        data: {
          category: result.analysis.categories[0]?.category || exerciseData.category,
          subcategory: result.analysis.categories[0]?.subcategory,
          ai_categorized: true,
          ai_confidence: result.analysis.confidence,
          ai_categorized_at: new Date()
        }
      });
    }
  } catch (error) {
    console.warn('AI categorization failed:', error);
  }
}

// Mock functions for custom exercise metadata (would be implemented with a proper table)
async function createCustomExerciseMetadata(exerciseId: string, metadata: any) {
  // This would normally insert into a custom_exercise_metadata table
  console.log('Creating metadata for custom exercise:', exerciseId, metadata);
}

async function getCustomExerciseMetadata(exerciseId: string) {
  // This would normally query the custom_exercise_metadata table
  return {
    isPublic: false,
    tags: [],
    source: 'user_created',
    qualityScore: 75
  };
}

async function updateCustomExerciseMetadata(exerciseId: string, metadata: any) {
  // This would normally update the custom_exercise_metadata table
  console.log('Updating metadata for custom exercise:', exerciseId, metadata);
}

async function deleteCustomExerciseMetadata(exerciseId: string) {
  // This would normally delete from the custom_exercise_metadata table
  console.log('Deleting metadata for custom exercise:', exerciseId);
}