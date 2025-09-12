import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const approvalActionSchema = z.object({
  approvalId: z.string(),
  action: z.enum(['approve', 'reject', 'needs_revision']),
  comments: z.string().optional(),
  reviewerId: z.string().optional()
});

const batchApprovalSchema = z.object({
  approvalIds: z.array(z.string()),
  action: z.enum(['approve', 'reject', 'needs_revision']),
  comments: z.string().optional(),
  reviewerId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Check if it's a batch operation
    if (data.approvalIds && Array.isArray(data.approvalIds)) {
      return await handleBatchApproval(data);
    } else {
      return await handleSingleApproval(data);
    }
    
  } catch (error) {
    console.error('Error in exercise approval:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dados de entrada inválidos',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno no sistema de aprovações'
    }, { status: 500 });
  }
}

async function handleSingleApproval(data: any) {
  const validatedData = approvalActionSchema.parse(data);
  const { approvalId, action, comments, reviewerId } = validatedData;
  
  return await prisma.$transaction(async (tx) => {
    // Get the approval record
    const approval = await tx.exercise_approvals.findUnique({
      where: { id: approvalId },
      include: { exercises: true }
    });
    
    if (!approval) {
      throw new Error('Approval not found');
    }
    
    // Update approval record
    const updatedApproval = await tx.exercise_approvals.update({
      where: { id: approvalId },
      data: {
        status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'needs_revision',
        reviewer_id: reviewerId || 'system',
        reviewed_at: new Date(),
        comments: comments
      }
    });
    
    // Update exercise status based on approval action
    let exerciseStatus: 'approved' | 'pending_approval';
    
    switch (action) {
      case 'approve':
        exerciseStatus = 'approved';
        break;
      case 'reject':
      case 'needs_revision':
        exerciseStatus = 'pending_approval';
        break;
      default:
        exerciseStatus = 'pending_approval';
    }
    
    const updatedExercise = await tx.exercises.update({
      where: { id: approval.exercise_id },
      data: {
        status: exerciseStatus,
        updated_at: new Date()
      }
    });
    
    // Create activity log
    await createActivityLog(tx, {
      approvalId,
      exerciseId: approval.exercise_id,
      action,
      reviewerId: reviewerId || 'system',
      comments
    });
    
    return NextResponse.json({
      success: true,
      approval: updatedApproval,
      exercise: updatedExercise,
      message: getSuccessMessage(action)
    });
  });
}

async function handleBatchApproval(data: any) {
  const validatedData = batchApprovalSchema.parse(data);
  const { approvalIds, action, comments, reviewerId } = validatedData;
  
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  return await prisma.$transaction(async (tx) => {
    for (const approvalId of approvalIds) {
      try {
        // Get the approval record
        const approval = await tx.exercise_approvals.findUnique({
          where: { id: approvalId },
          include: { exercises: true }
        });
        
        if (!approval) {
          results.failed++;
          results.errors.push(`Approval ${approvalId} not found`);
          continue;
        }
        
        // Update approval record
        await tx.exercise_approvals.update({
          where: { id: approvalId },
          data: {
            status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'needs_revision',
            reviewer_id: reviewerId || 'system',
            reviewed_at: new Date(),
            comments: comments
          }
        });
        
        // Update exercise status
        let exerciseStatus: 'approved' | 'pending_approval';
        
        switch (action) {
          case 'approve':
            exerciseStatus = 'approved';
            break;
          case 'reject':
          case 'needs_revision':
            exerciseStatus = 'pending_approval';
            break;
          default:
            exerciseStatus = 'pending_approval';
        }
        
        await tx.exercises.update({
          where: { id: approval.exercise_id },
          data: {
            status: exerciseStatus,
            updated_at: new Date()
          }
        });
        
        // Create activity log
        await createActivityLog(tx, {
          approvalId,
          exerciseId: approval.exercise_id,
          action,
          reviewerId: reviewerId || 'system',
          comments
        });
        
        results.successful++;
        
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing ${approvalId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      message: `Batch approval completed: ${results.successful} successful, ${results.failed} failed`
    });
  });
}

async function createActivityLog(tx: any, data: {
  approvalId: string;
  exerciseId: string;
  action: string;
  reviewerId: string;
  comments?: string;
}) {
  // Since we don't have an activity_logs table yet, we'll skip this for now
  // This could be implemented later for audit purposes
  console.log('Activity log:', data);
}

function getSuccessMessage(action: string): string {
  switch (action) {
    case 'approve':
      return 'Exercício aprovado com sucesso';
    case 'reject':
      return 'Exercício rejeitado';
    case 'needs_revision':
      return 'Exercício marcado como precisando revisão';
    default:
      return 'Ação processada com sucesso';
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (action === 'list') {
      const whereClause: any = {};
      
      if (status && ['pending', 'approved', 'rejected', 'needs_revision'].includes(status)) {
        whereClause.status = status;
      }
      
      const approvals = await prisma.exercise_approvals.findMany({
        where: whereClause,
        include: {
          exercises: {
            select: {
              name: true,
              description: true,
              category: true,
              difficulty: true
            }
          },
          reviewer: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { submitted_at: 'desc' },
        take: limit,
        skip: offset
      });
      
      const total = await prisma.exercise_approvals.count({
        where: whereClause
      });
      
      return NextResponse.json({
        success: true,
        approvals,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });
    }
    
    if (action === 'stats') {
      const stats = await prisma.exercise_approvals.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      });
      
      const recentActivity = await prisma.exercise_approvals.count({
        where: {
          reviewed_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });
      
      const avgReviewTime = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - submitted_at))/3600) as avg_hours
        FROM exercise_approvals 
        WHERE reviewed_at IS NOT NULL
      ` as Array<{avg_hours: number}>;
      
      return NextResponse.json({
        success: true,
        stats: {
          byStatus: stats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.id;
            return acc;
          }, {} as Record<string, number>),
          recentActivity,
          avgReviewTimeHours: avgReviewTime[0]?.avg_hours || 0
        }
      });
    }
    
    if (action === 'pending-count') {
      const count = await prisma.exercise_approvals.count({
        where: { status: 'pending' }
      });
      
      return NextResponse.json({
        success: true,
        count
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const approvalId = searchParams.get('approvalId');
    
    if (!approvalId) {
      return NextResponse.json({
        success: false,
        error: 'ID da aprovação é obrigatório'
      }, { status: 400 });
    }
    
    await prisma.exercise_approvals.delete({
      where: { id: approvalId }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Registro de aprovação removido com sucesso'
    });
    
  } catch (error) {
    console.error('Error deleting approval:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao remover registro de aprovação'
    }, { status: 500 });
  }
}