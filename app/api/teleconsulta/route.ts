import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';

// Schema para nova teleconsulta
const CreateTeleconsultaSchema = z.object({
  patientId: z.string().min(1),
  professionalId: z.string().min(1),
  scheduledFor: z.string().datetime(),
  duration: z.number().positive().default(60),
  type: z.enum(['video', 'audio']).default('video'),
  description: z.string().optional()
});

const TeleconsultaQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 20, 100) : 20),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  patientId: z.string().optional(),
  professionalId: z.string().optional()
});

/**
 * GET /api/teleconsulta - Listar teleconsultas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filters = TeleconsultaQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    // TODO: Implement teleconsulta model in Prisma schema
    return NextResponse.json({
      teleconsultas: [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: 0,
        pages: 0
      },
      message: 'Funcionalidade não implementada - modelo teleconsulta não existe no schema'
    });

  } catch (error) {
    console.error('Erro ao buscar teleconsultas:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teleconsulta - Criar nova teleconsulta
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Apenas admin e profissionais podem criar teleconsultas
    if (session.user.role !== 'Admin' && session.user.role !== 'Fisioterapeuta') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = CreateTeleconsultaSchema.parse(body);

    // TODO: Implement teleconsulta creation when model exists
    return NextResponse.json({
      id: 'mock-teleconsulta-id',
      patientId: validatedData.patientId,
      professionalId: validatedData.professionalId,
      scheduledFor: validatedData.scheduledFor,
      duration: validatedData.duration,
      type: validatedData.type,
      description: validatedData.description,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      message: 'Mock teleconsulta - modelo não implementado'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar teleconsulta:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}