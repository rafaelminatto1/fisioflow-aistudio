import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { addMinutes, isAfter, isBefore } from 'date-fns';

// Schemas de validação
const createTeleconsultaSchema = z.object({
  patientId: z.string(),
  scheduledFor: z.string().datetime(),
  duration: z.number().min(15).max(180).default(30),
  type: z.enum(['consultation', 'followup', 'emergency']).default('consultation'),
  notes: z.string().optional(),
  recordingEnabled: z.boolean().default(true)
});

const updateTeleconsultaSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  recordingUrl: z.string().url().optional(),
  recordingSize: z.number().optional(),
  connectionQuality: z.object({
    averageLatency: z.number(),
    packetLoss: z.number(),
    jitter: z.number(),
    bandwidth: z.number()
  }).optional(),
  participantStats: z.object({
    doctorJoinTime: z.string().datetime().optional(),
    patientJoinTime: z.string().datetime().optional(),
    totalDuration: z.number().optional(),
    disconnections: z.number().optional()
  }).optional()
});

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  patientId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  type: z.enum(['consultation', 'followup', 'emergency']).optional()
});

// GET - Listar teleconsultas
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const where: any = {};

    // Filtros
    if (query.status) {
      where.status = query.status;
    }

    if (query.patientId) {
      where.patientId = query.patientId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.dateFrom || query.dateTo) {
      where.scheduledFor = {};
      if (query.dateFrom) {
        where.scheduledFor.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.scheduledFor.lte = new Date(query.dateTo);
      }
    }

    // Paginação
    const skip = (query.page - 1) * query.limit;

    const [teleconsultas, total] = await Promise.all([
      prisma.teleconsulta.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
              specialization: true,
              avatar: true
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: {
          scheduledFor: 'desc'
        },
        skip,
        take: query.limit
      }),
      prisma.teleconsulta.count({ where })
    ]);

    // Calcular estatísticas
    const stats = await prisma.teleconsulta.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      where: {
        scheduledFor: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      }
    });

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      teleconsultas,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      },
      stats: statusStats
    });

  } catch (error) {
    console.error('Erro ao buscar teleconsultas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova teleconsulta
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTeleconsultaSchema.parse(body);

    // Verificar se o paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar conflitos de horário
    const scheduledTime = new Date(data.scheduledFor);
    const endTime = addMinutes(scheduledTime, data.duration);

    const conflictingConsultation = await prisma.teleconsulta.findFirst({
      where: {
        doctorId: session.user.id,
        status: {
          in: ['scheduled', 'in_progress']
        },
        OR: [
          {
            scheduledFor: {
              lte: scheduledTime
            },
            endTime: {
              gt: scheduledTime
            }
          },
          {
            scheduledFor: {
              lt: endTime
            },
            endTime: {
              gte: endTime
            }
          },
          {
            scheduledFor: {
              gte: scheduledTime
            },
            endTime: {
              lte: endTime
            }
          }
        ]
      }
    });

    if (conflictingConsultation) {
      return NextResponse.json(
        { error: 'Já existe uma consulta agendada para este horário' },
        { status: 409 }
      );
    }

    // Criar teleconsulta
    const teleconsulta = await prisma.teleconsulta.create({
      data: {
        patientId: data.patientId,
        doctorId: session.user.id,
        scheduledFor: scheduledTime,
        endTime,
        duration: data.duration,
        type: data.type,
        notes: data.notes,
        recordingEnabled: data.recordingEnabled,
        status: 'scheduled',
        roomId: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialization: true,
            avatar: true
          }
        }
      }
    });

    // Criar notificação para o paciente
    await prisma.notification.create({
      data: {
        userId: data.patientId,
        title: 'Nova Teleconsulta Agendada',
        message: `Sua teleconsulta foi agendada para ${scheduledTime.toLocaleString('pt-BR')}`,
        type: 'teleconsulta',
        relatedId: teleconsulta.id
      }
    });

    return NextResponse.json(teleconsulta, { status: 201 });

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

// PUT - Atualizar teleconsulta
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da teleconsulta é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = updateTeleconsultaSchema.parse(body);

    // Verificar se a teleconsulta existe
    const existingTeleconsulta = await prisma.teleconsulta.findUnique({
      where: { id }
    });

    if (!existingTeleconsulta) {
      return NextResponse.json(
        { error: 'Teleconsulta não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (existingTeleconsulta.doctorId !== session.user.id && 
        existingTeleconsulta.patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para atualizar esta teleconsulta' },
        { status: 403 }
      );
    }

    // Preparar dados de atualização
    const updateData: any = {};

    if (data.status) {
      updateData.status = data.status;
      
      // Auto-definir timestamps baseado no status
      if (data.status === 'in_progress' && !existingTeleconsulta.startedAt) {
        updateData.startedAt = new Date();
      }
      
      if (data.status === 'completed' && !existingTeleconsulta.endedAt) {
        updateData.endedAt = new Date();
      }
    }

    if (data.startedAt) {
      updateData.startedAt = new Date(data.startedAt);
    }

    if (data.endedAt) {
      updateData.endedAt = new Date(data.endedAt);
    }

    if (data.notes) {
      updateData.notes = data.notes;
    }

    if (data.recordingUrl) {
      updateData.recordingUrl = data.recordingUrl;
    }

    if (data.recordingSize) {
      updateData.recordingSize = data.recordingSize;
    }

    if (data.connectionQuality) {
      updateData.connectionQuality = data.connectionQuality;
    }

    if (data.participantStats) {
      updateData.participantStats = data.participantStats;
    }

    // Atualizar teleconsulta
    const teleconsulta = await prisma.teleconsulta.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialization: true,
            avatar: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    });

    // Criar notificação se necessário
    if (data.status === 'completed') {
      await prisma.notification.create({
        data: {
          userId: teleconsulta.patientId,
          title: 'Teleconsulta Finalizada',
          message: 'Sua teleconsulta foi finalizada. Você pode acessar o relatório na área do paciente.',
          type: 'teleconsulta',
          relatedId: teleconsulta.id
        }
      });
    }

    return NextResponse.json(teleconsulta);

  } catch (error) {
    console.error('Erro ao atualizar teleconsulta:', error);
    
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

// DELETE - Cancelar teleconsulta
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da teleconsulta é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a teleconsulta existe
    const teleconsulta = await prisma.teleconsulta.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true
      }
    });

    if (!teleconsulta) {
      return NextResponse.json(
        { error: 'Teleconsulta não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (teleconsulta.doctorId !== session.user.id && 
        teleconsulta.patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para cancelar esta teleconsulta' },
        { status: 403 }
      );
    }

    // Verificar se pode ser cancelada
    if (teleconsulta.status === 'completed') {
      return NextResponse.json(
        { error: 'Não é possível cancelar uma teleconsulta já finalizada' },
        { status: 400 }
      );
    }

    if (teleconsulta.status === 'in_progress') {
      return NextResponse.json(
        { error: 'Não é possível cancelar uma teleconsulta em andamento' },
        { status: 400 }
      );
    }

    // Verificar se não é muito próximo do horário
    const now = new Date();
    const scheduledTime = new Date(teleconsulta.scheduledFor);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    const hoursUntilConsultation = timeDiff / (1000 * 60 * 60);

    if (hoursUntilConsultation < 2) {
      return NextResponse.json(
        { error: 'Não é possível cancelar com menos de 2 horas de antecedência' },
        { status: 400 }
      );
    }

    // Cancelar teleconsulta
    const cancelledTeleconsulta = await prisma.teleconsulta.update({
      where: { id },
      data: {
        status: 'cancelled',
        endedAt: new Date()
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialization: true
          }
        }
      }
    });

    // Criar notificações
    const notificationMessage = `Teleconsulta agendada para ${scheduledTime.toLocaleString('pt-BR')} foi cancelada`;
    
    await Promise.all([
      prisma.notification.create({
        data: {
          userId: teleconsulta.patientId,
          title: 'Teleconsulta Cancelada',
          message: notificationMessage,
          type: 'teleconsulta',
          relatedId: teleconsulta.id
        }
      }),
      prisma.notification.create({
        data: {
          userId: teleconsulta.doctorId,
          title: 'Teleconsulta Cancelada',
          message: notificationMessage,
          type: 'teleconsulta',
          relatedId: teleconsulta.id
        }
      })
    ]);

    return NextResponse.json({
      message: 'Teleconsulta cancelada com sucesso',
      teleconsulta: cancelledTeleconsulta
    });

  } catch (error) {
    console.error('Erro ao cancelar teleconsulta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}