import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';

// Schema para mensagem
const MessageSchema = z.object({
  content: z.string().min(1),
  type: z.enum(['text', 'image', 'file']).default('text')
});

/**
 * GET /api/teleconsulta/[id]/messages - Obter mensagens da teleconsulta
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // TODO: Implement teleconsulta and messages models in Prisma schema
    return NextResponse.json({
      messages: [],
      teleconsultaId: params.id,
      message: 'Funcionalidade não implementada - modelo teleconsulta não existe no schema'
    });

  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teleconsulta/[id]/messages - Enviar mensagem na teleconsulta
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = MessageSchema.parse(body);

    // TODO: Implement message creation when teleconsulta model exists
    return NextResponse.json({
      id: 'mock-message-id',
      teleconsultaId: params.id,
      senderId: session.user.id,
      content: validatedData.content,
      type: validatedData.type,
      createdAt: new Date().toISOString(),
      message: 'Mock message - teleconsulta model não implementado'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    
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