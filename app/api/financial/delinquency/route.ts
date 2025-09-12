import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';
import { whatsappService } from '@/lib/whatsapp';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const severity = searchParams.get('severity'); // 'low', 'medium', 'high'
    const status = searchParams.get('status'); // 'pending', 'contacted', 'resolved'

    const skip = (page - 1) * limit;
    const today = new Date();

    // Construir filtros para inadimplência
    const where: any = {
      user_id: session.user.id,
      type: 'INCOME',
      // Apenas transações em atraso
      date: {
        lt: today
      },
      // Filtros opcionais
      ...(status && {
        // Implementar filtro por status de contato
      })
    };

    if (search) {
      where.AND = [
        where.OR ? { OR: where.OR } : {},
        {
          OR: [
            { description: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
            {
              patient: {
                name: { contains: search, mode: 'insensitive' }
              }
            }
          ]
        }
      ];
      delete where.OR;
    }

    // Buscar inadimplências
    const [delinquencies, totalCount] = await Promise.all([
      prisma.financial_transactions.findMany({
        where,
        include: {
          patients: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },

          receipts: {
            where: {
              service_date: {
                lt: today
              }
            }
          }
        },
        orderBy: [
          { date: 'asc' },
          { created_at: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.financial_transactions.count({ where })
    ]);

    // Calcular severidade e dias de atraso
    const enrichedDelinquencies = delinquencies.map(delinquency => {
      const dueDate = delinquency.date || delinquency.created_at;
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let severityLevel = 'low';
      if (daysOverdue > 60) severityLevel = 'high';
      else if (daysOverdue > 30) severityLevel = 'medium';

      return {
        ...delinquency,
        daysOverdue,
        severity: severityLevel,
        overdueSince: dueDate
      };
    });

    // Filtrar por severidade se especificado
    const filteredDelinquencies = severity 
      ? enrichedDelinquencies.filter(d => d.severity === severity)
      : enrichedDelinquencies;

    // Calcular estatísticas
    const stats = await calculateDelinquencyStats(session.user.id);

    return NextResponse.json({
      delinquencies: filteredDelinquencies,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar inadimplências:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      action, // 'contact', 'resolve', 'schedule_followup'
      transactionIds,
      method, // 'email', 'whatsapp', 'phone'
      message,
      followupDate,
      notes
    } = body;

    // Validações
    if (!action || !transactionIds || !Array.isArray(transactionIds)) {
      return NextResponse.json(
        { error: 'Ação e IDs das transações são obrigatórios' },
        { status: 400 }
      );
    }

    const results = [];

    for (const transactionId of transactionIds) {
      try {
        // Verificar se a transação existe e pertence ao usuário
        const transaction = await prisma.financial_transactions.findFirst({
          where: {
            id: transactionId,
            user_id: session.user.id
          },
          include: {
            patients: true
          }
        });

        if (!transaction) {
          results.push({
            transactionId,
            success: false,
            error: 'Transação não encontrada'
          });
          continue;
        }

        let result = { transactionId, success: true };

        switch (action) {
          case 'contact':
            result = await handleContactAction(transaction, method, message);
            break;
          case 'resolve':
            result = await handleResolveAction(transaction, notes);
            break;
          case 'schedule_followup':
            // Funcionalidade de follow-up não implementada
            result = {
              transactionId,
              success: false
            };
            break;
          default:
            result = {
              transactionId,
              success: false
            };
        }

        // Log da ação (simplificado)
        console.log(`Ação ${action} executada para transação ${transactionId} por usuário ${session.user.id}`);

        results.push(result);
      } catch (error) {
        console.error(`Erro ao processar transação ${transactionId}:`, error);
        results.push({
          transactionId,
          success: false
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return NextResponse.json({
      success: successCount === totalCount,
      results,
      summary: {
        total: totalCount,
        success: successCount,
        failed: totalCount - successCount
      }
    });
  } catch (error) {
    console.error('Erro ao processar ação de inadimplência:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para calcular estatísticas de inadimplência
async function calculateDelinquencyStats(userId: string) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [totalOverdue, recentOverdue, mediumOverdue, severeOverdue, totalAmount] = await Promise.all([
    // Total de inadimplentes
    prisma.financial_transactions.count({
      where: {
        user_id: userId,
        type: 'INCOME',
        date: { lt: today }
      }
    }),
    // Inadimplentes recentes (até 30 dias)
    prisma.financial_transactions.count({
      where: {
        user_id: userId,
        type: 'INCOME',
        date: { lt: today, gte: thirtyDaysAgo }
      }
    }),
    // Inadimplentes médios (30-60 dias)
    prisma.financial_transactions.count({
      where: {
        user_id: userId,
        type: 'INCOME',
        date: { lt: thirtyDaysAgo, gte: sixtyDaysAgo }
      }
    }),
    // Inadimplentes severos (mais de 60 dias)
    prisma.financial_transactions.count({
      where: {
        user_id: userId,
        type: 'INCOME',
        date: { lt: sixtyDaysAgo }
      }
    }),
    // Valor total em atraso
    prisma.financial_transactions.aggregate({
      where: {
        user_id: userId,
        type: 'INCOME',
        date: { lt: today }
      },
      _sum: {
        amount: true
      }
    })
  ]);

  return {
    totalOverdue,
    recentOverdue,
    mediumOverdue,
    severeOverdue,
    totalAmount: totalAmount._sum.amount || 0,
    averageAmount: totalOverdue > 0 ? Number(totalAmount._sum.amount || 0) / totalOverdue : 0
  };
}

// Função para lidar com ação de contato
async function handleContactAction(transaction: any, method: string, message: string) {
  try {
    const patient = transaction.patients;
    const amount = transaction.amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    let defaultMessage = `
Olá ${patient.name},

Esperamos que esteja bem! Gostaríamos de lembrá-lo sobre o pagamento pendente:

💰 Valor: ${amount}
📝 Descrição: ${transaction.description}
📅 Data: ${new Date(transaction.date).toLocaleDateString('pt-BR')}

Por favor, entre em contato conosco para regularizar a situação.

Atenciosamente,
Equipe FisioFlow
    `;

    const finalMessage = message || defaultMessage;

    if (method === 'email') {
      if (!patient.email) {
        throw new Error('Paciente não possui email cadastrado');
      }
      
      await emailService.sendEmail({
        to: patient.email,
        subject: 'Lembrete de Pagamento - FisioFlow',
        html: finalMessage.replace(/\n/g, '<br>'),
        text: finalMessage
      });
    } else if (method === 'whatsapp') {
      if (!patient.phone) {
        throw new Error('Paciente não possui telefone cadastrado');
      }
      
      await whatsappService.sendCustomMessage(
        patient.phone,
        finalMessage
      );
    }

    return {
      transactionId: transaction.id,
      success: true,
      message: `Contato enviado via ${method}`
    };
  } catch (error) {
    return {
      transactionId: transaction.id,
      success: false
    };
  }
}

// Função para lidar com ação de resolução
async function handleResolveAction(transaction: any, notes: string) {
  try {
    await prisma.financial_transactions.update({
      where: { id: transaction.id },
      data: {
        description: `${transaction.description} - RESOLVIDO: ${notes || 'Pagamento confirmado'}`
      }
    });

    return {
      transactionId: transaction.id,
      success: true,
      message: 'Inadimplência resolvida'
    };
  } catch (error) {
    return {
      transactionId: transaction.id,
      success: false
    };
  }
}