import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Schema de validação para mensagens
const createMessageSchema = z.object({
  content: z.string().min(1).max(1000),
  type: z.enum(['text', 'image', 'file', 'system']).default('text'),
  metadata: z.object({
    fileName: z.string().optional(),
    fileSize: z.number().optional(),
    mimeType: z.string().optional(),
    duration: z.number().optional(),
    dimensions: z.object({
      width: z.number(),
      height: z.number()
    }).optional()
  }).optional()
});

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('50'),
  type: z.enum(['text', 'image', 'file', 'system']).optional(),
  search: z.string().optional()
});

// GET - Buscar mensagens da teleconsulta
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const teleconsultaId = params.id;
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // Verificar se o usuário tem acesso à teleconsulta
    const teleconsulta = await prisma.teleconsulta.findUnique({
      where: { id: teleconsultaId },
      select: {
        id: true,
        doctorId: true,
        patientId: true,
        status: true
      }
    });

    if (!teleconsulta) {
      return NextResponse.json(
        { error: 'Teleconsulta não encontrada' },
        { status: 404 }
      );
    }

    if (teleconsulta.doctorId !== session.user.id && 
        teleconsulta.patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar esta teleconsulta' },
        { status: 403 }
      );
    }

    // Construir filtros
    const where: any = {
      teleconsultaId
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.search) {
      where.content = {
        contains: query.search,
        mode: 'insensitive'
      };
    }

    // Paginação
    const skip = (query.page - 1) * query.limit;

    const [messages, total] = await Promise.all([
      prisma.teleconsultaMessage.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        skip,
        take: query.limit
      }),
      prisma.teleconsultaMessage.count({ where })
    ]);

    // Marcar mensagens como lidas
    await prisma.teleconsultaMessage.updateMany({
      where: {
        teleconsultaId,
        senderId: { not: session.user.id },
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    return NextResponse.json({
      messages,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      },
      teleconsulta: {
        id: teleconsulta.id,
        status: teleconsulta.status
      }
    });

  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Enviar nova mensagem
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const teleconsultaId = params.id;

    // Verificar se o usuário tem acesso à teleconsulta
    const teleconsulta = await prisma.teleconsulta.findUnique({
      where: { id: teleconsultaId },
      select: {
        id: true,
        doctorId: true,
        patientId: true,
        status: true
      }
    });

    if (!teleconsulta) {
      return NextResponse.json(
        { error: 'Teleconsulta não encontrada' },
        { status: 404 }
      );
    }

    if (teleconsulta.doctorId !== session.user.id && 
        teleconsulta.patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para enviar mensagens nesta teleconsulta' },
        { status: 403 }
      );
    }

    // Verificar se a teleconsulta permite mensagens
    if (teleconsulta.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Não é possível enviar mensagens em uma teleconsulta cancelada' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = createMessageSchema.parse(body);

    // Criar mensagem
    const message = await prisma.teleconsultaMessage.create({
      data: {
        teleconsultaId,
        senderId: session.user.id,
        content: data.content,
        type: data.type,
        metadata: data.metadata
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        }
      }
    });

    // Criar notificação para o outro participante
    const recipientId = teleconsulta.doctorId === session.user.id 
      ? teleconsulta.patientId 
      : teleconsulta.doctorId;

    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: 'Nova mensagem na teleconsulta',
        message: data.type === 'text' 
          ? data.content.substring(0, 100) + (data.content.length > 100 ? '...' : '')
          : `${data.type === 'image' ? 'Imagem' : 'Arquivo'} enviado`,
        type: 'message',
        relatedId: teleconsultaId
      }
    });

    return NextResponse.json(message, { status: 201 });

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

// PUT - Marcar mensagens como lidas
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const teleconsultaId = params.id;

    // Verificar acesso
    const teleconsulta = await prisma.teleconsulta.findUnique({
      where: { id: teleconsultaId },
      select: {
        doctorId: true,
        patientId: true
      }
    });

    if (!teleconsulta) {
      return NextResponse.json(
        { error: 'Teleconsulta não encontrada' },
        { status: 404 }
      );
    }

    if (teleconsulta.doctorId !== session.user.id && 
        teleconsulta.patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      );
    }

    // Marcar mensagens como lidas
    const result = await prisma.teleconsultaMessage.updateMany({
      where: {
        teleconsultaId,
        senderId: { not: session.user.id },
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Mensagens marcadas como lidas',
      count: result.count
    });

  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar mensagem
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { error: 'ID da mensagem é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a mensagem existe e pertence ao usuário
    const message = await prisma.teleconsultaMessage.findUnique({
      where: { id: messageId },
      include: {
        teleconsulta: {
          select: {
            doctorId: true,
            patientId: true
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissão (só o remetente ou admin pode deletar)
    if (message.senderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para deletar esta mensagem' },
        { status: 403 }
      );
    }

    // Verificar se não passou muito tempo (ex: 5 minutos)
    const now = new Date();
    const messageTime = new Date(message.createdAt);
    const timeDiff = now.getTime() - messageTime.getTime();
    const minutesPassed = timeDiff / (1000 * 60);

    if (minutesPassed > 5) {
      return NextResponse.json(
        { error: 'Não é possível deletar mensagens após 5 minutos' },
        { status: 400 }
      );
    }

    // Deletar mensagem
    await prisma.teleconsultaMessage.delete({
      where: { id: messageId }
    });

    return NextResponse.json({
      message: 'Mensagem deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}