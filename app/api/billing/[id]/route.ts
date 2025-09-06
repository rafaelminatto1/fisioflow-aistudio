import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BillingSystem } from '@/lib/payment/billing-system';

// Schema para atualização de assinatura
const UpdateSubscriptionSchema = z.object({
  status: z.enum(['active', 'paused', 'cancelled', 'trial']).optional(),
  amount: z.number().positive().optional(),
  planName: z.string().min(1).optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// Schema para atualização de fatura
const UpdateInvoiceSchema = z.object({
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
  amount: z.number().positive().optional(),
  description: z.string().min(1).optional(),
  dueDate: z.string().datetime().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    total: z.number().positive()
  })).optional(),
  metadata: z.record(z.any()).optional()
});

// Instância do sistema de cobrança
const billingSystem = new BillingSystem();

/**
 * GET /api/billing/[id] - Obter assinatura ou fatura específica
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'subscription';
    const id = params.id;

    if (type === 'subscription') {
      // Buscar assinatura
      const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: {
          patient: {
            select: { id: true, name: true, email: true, phone: true }
          },
          invoices: {
            orderBy: { createdAt: 'desc' },
            include: {
              payments: {
                select: { id: true, status: true, amount: true, method: true, createdAt: true }
              }
            }
          }
        }
      });

      if (!subscription) {
        return NextResponse.json(
          { error: 'Assinatura não encontrada' },
          { status: 404 }
        );
      }

      // Verificar permissões
      const isAdmin = session.user.role === 'admin';
      const isDoctor = session.user.role === 'doctor';
      const isOwner = session.user.id === subscription.patientId;

      if (!isAdmin && !isDoctor && !isOwner) {
        return NextResponse.json(
          { error: 'Permissão negada' },
          { status: 403 }
        );
      }

      return NextResponse.json(subscription);
    } else {
      // Buscar fatura
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          patient: {
            select: { id: true, name: true, email: true, phone: true }
          },
          subscription: {
            select: { id: true, planName: true, status: true }
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            include: {
              patient: {
                select: { name: true }
              }
            }
          }
        }
      });

      if (!invoice) {
        return NextResponse.json(
          { error: 'Fatura não encontrada' },
          { status: 404 }
        );
      }

      // Verificar permissões
      const isAdmin = session.user.role === 'admin';
      const isDoctor = session.user.role === 'doctor';
      const isOwner = session.user.id === invoice.patientId;

      if (!isAdmin && !isDoctor && !isOwner) {
        return NextResponse.json(
          { error: 'Permissão negada' },
          { status: 403 }
        );
      }

      return NextResponse.json(invoice);
    }
  } catch (error) {
    console.error('Erro ao buscar dados de cobrança:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/billing/[id] - Atualizar assinatura ou fatura
 */
export async function PUT(
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

    // Apenas admin e médicos podem atualizar
    if (session.user.role !== 'admin' && session.user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'subscription';
    const id = params.id;
    const body = await request.json();

    if (type === 'subscription') {
      // Atualizar assinatura
      const data = UpdateSubscriptionSchema.parse(body);

      const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: {
          patient: {
            select: { id: true, name: true }
          }
        }
      });

      if (!subscription) {
        return NextResponse.json(
          { error: 'Assinatura não encontrada' },
          { status: 404 }
        );
      }

      const updatedSubscription = await prisma.subscription.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          patient: {
            select: { id: true, name: true, email: true }
          },
          invoices: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      // Log da atividade
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'subscription_updated',
          entityType: 'subscription',
          entityId: id,
          details: {
            previousData: {
              status: subscription.status,
              amount: subscription.amount,
              planName: subscription.planName
            },
            newData: data,
            patientId: subscription.patientId
          },
          createdAt: new Date()
        }
      });

      // Criar notificação se o status mudou
      if (data.status && data.status !== subscription.status) {
        let notificationMessage = '';
        switch (data.status) {
          case 'active':
            notificationMessage = 'Sua assinatura foi ativada.';
            break;
          case 'paused':
            notificationMessage = 'Sua assinatura foi pausada.';
            break;
          case 'cancelled':
            notificationMessage = 'Sua assinatura foi cancelada.';
            break;
          case 'trial':
            notificationMessage = 'Sua assinatura está em período de teste.';
            break;
        }

        await prisma.notification.create({
          data: {
            userId: subscription.patientId,
            type: 'subscription_status_changed',
            title: 'Status da Assinatura Alterado',
            message: notificationMessage,
            data: {
              subscriptionId: id,
              previousStatus: subscription.status,
              newStatus: data.status
            },
            createdAt: new Date()
          }
        });
      }

      return NextResponse.json(updatedSubscription);
    } else {
      // Atualizar fatura
      const data = UpdateInvoiceSchema.parse(body);

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          patient: {
            select: { id: true, name: true }
          }
        }
      });

      if (!invoice) {
        return NextResponse.json(
          { error: 'Fatura não encontrada' },
          { status: 404 }
        );
      }

      const updateData: any = {
        ...data,
        updatedAt: new Date()
      };

      if (data.dueDate) {
        updateData.dueDate = new Date(data.dueDate);
      }

      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: updateData,
        include: {
          patient: {
            select: { id: true, name: true, email: true }
          },
          subscription: {
            select: { id: true, planName: true, status: true }
          },
          payments: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      // Log da atividade
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'invoice_updated',
          entityType: 'invoice',
          entityId: id,
          details: {
            previousData: {
              status: invoice.status,
              amount: invoice.amount,
              dueDate: invoice.dueDate
            },
            newData: data,
            patientId: invoice.patientId
          },
          createdAt: new Date()
        }
      });

      // Criar notificação se o status mudou
      if (data.status && data.status !== invoice.status) {
        let notificationMessage = '';
        switch (data.status) {
          case 'paid':
            notificationMessage = 'Sua fatura foi marcada como paga.';
            break;
          case 'overdue':
            notificationMessage = 'Sua fatura está em atraso.';
            break;
          case 'cancelled':
            notificationMessage = 'Sua fatura foi cancelada.';
            break;
          case 'pending':
            notificationMessage = 'Sua fatura está pendente de pagamento.';
            break;
        }

        await prisma.notification.create({
          data: {
            userId: invoice.patientId,
            type: 'invoice_status_changed',
            title: 'Status da Fatura Alterado',
            message: notificationMessage,
            data: {
              invoiceId: id,
              previousStatus: invoice.status,
              newStatus: data.status,
              amount: invoice.amount
            },
            createdAt: new Date()
          }
        });
      }

      return NextResponse.json(updatedInvoice);
    }
  } catch (error) {
    console.error('Erro ao atualizar dados de cobrança:', error);
    
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

/**
 * PATCH /api/billing/[id] - Operações específicas
 */
export async function PATCH(
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const type = searchParams.get('type') || 'subscription';
    const id = params.id;

    if (type === 'subscription') {
      const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: {
          patient: {
            select: { id: true, name: true }
          }
        }
      });

      if (!subscription) {
        return NextResponse.json(
          { error: 'Assinatura não encontrada' },
          { status: 404 }
        );
      }

      // Verificar permissões
      const isAdmin = session.user.role === 'admin';
      const isDoctor = session.user.role === 'doctor';
      const isOwner = session.user.id === subscription.patientId;

      switch (action) {
        case 'pause':
          if (!isAdmin && !isDoctor && !isOwner) {
            return NextResponse.json(
              { error: 'Permissão negada' },
              { status: 403 }
            );
          }

          const pausedSubscription = await billingSystem.pauseSubscription(id);

          await prisma.activityLog.create({
            data: {
              userId: session.user.id,
              action: 'subscription_paused',
              entityType: 'subscription',
              entityId: id,
              details: { patientId: subscription.patientId },
              createdAt: new Date()
            }
          });

          return NextResponse.json(pausedSubscription);

        case 'resume':
          if (!isAdmin && !isDoctor && !isOwner) {
            return NextResponse.json(
              { error: 'Permissão negada' },
              { status: 403 }
            );
          }

          const resumedSubscription = await billingSystem.resumeSubscription(id);

          await prisma.activityLog.create({
            data: {
              userId: session.user.id,
              action: 'subscription_resumed',
              entityType: 'subscription',
              entityId: id,
              details: { patientId: subscription.patientId },
              createdAt: new Date()
            }
          });

          return NextResponse.json(resumedSubscription);

        case 'generate_invoice':
          if (!isAdmin && !isDoctor) {
            return NextResponse.json(
              { error: 'Permissão negada' },
              { status: 403 }
            );
          }

          const invoice = await billingSystem.generateInvoiceForSubscription(id);

          await prisma.activityLog.create({
            data: {
              userId: session.user.id,
              action: 'invoice_generated',
              entityType: 'invoice',
              entityId: invoice.id,
              details: {
                subscriptionId: id,
                patientId: subscription.patientId,
                amount: invoice.amount
              },
              createdAt: new Date()
            }
          });

          return NextResponse.json(invoice);

        default:
          return NextResponse.json(
            { error: 'Ação não reconhecida' },
            { status: 400 }
          );
      }
    } else {
      // Operações em faturas
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          patient: {
            select: { id: true, name: true }
          }
        }
      });

      if (!invoice) {
        return NextResponse.json(
          { error: 'Fatura não encontrada' },
          { status: 404 }
        );
      }

      switch (action) {
        case 'send_reminder':
          if (session.user.role !== 'admin' && session.user.role !== 'doctor') {
            return NextResponse.json(
              { error: 'Permissão negada' },
              { status: 403 }
            );
          }

          // Criar notificação de lembrete
          await prisma.notification.create({
            data: {
              userId: invoice.patientId,
              type: 'invoice_reminder',
              title: 'Lembrete de Fatura',
              message: `Lembrete: Você possui uma fatura de R$ ${invoice.amount.toFixed(2)} com vencimento em ${invoice.dueDate.toLocaleDateString('pt-BR')}.`,
              data: {
                invoiceId: id,
                amount: invoice.amount,
                dueDate: invoice.dueDate
              },
              createdAt: new Date()
            }
          });

          await prisma.activityLog.create({
            data: {
              userId: session.user.id,
              action: 'invoice_reminder_sent',
              entityType: 'invoice',
              entityId: id,
              details: { patientId: invoice.patientId },
              createdAt: new Date()
            }
          });

          return NextResponse.json({ message: 'Lembrete enviado com sucesso' });

        case 'mark_paid':
          if (session.user.role !== 'admin' && session.user.role !== 'doctor') {
            return NextResponse.json(
              { error: 'Permissão negada' },
              { status: 403 }
            );
          }

          const paidInvoice = await prisma.invoice.update({
            where: { id },
            data: {
              status: 'paid',
              paidAt: new Date(),
              updatedAt: new Date()
            }
          });

          await prisma.activityLog.create({
            data: {
              userId: session.user.id,
              action: 'invoice_marked_paid',
              entityType: 'invoice',
              entityId: id,
              details: { patientId: invoice.patientId },
              createdAt: new Date()
            }
          });

          return NextResponse.json(paidInvoice);

        default:
          return NextResponse.json(
            { error: 'Ação não reconhecida' },
            { status: 400 }
          );
      }
    }
  } catch (error) {
    console.error('Erro ao executar operação:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/billing/[id] - Deletar assinatura ou fatura
 */
export async function DELETE(
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

    // Apenas admin pode deletar
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'subscription';
    const id = params.id;

    if (type === 'subscription') {
      // Deletar assinatura
      const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: {
          invoices: true,
          patient: {
            select: { id: true, name: true }
          }
        }
      });

      if (!subscription) {
        return NextResponse.json(
          { error: 'Assinatura não encontrada' },
          { status: 404 }
        );
      }

      // Verificar se há faturas pendentes
      const pendingInvoices = subscription.invoices.filter(
        invoice => invoice.status === 'pending' || invoice.status === 'overdue'
      );

      if (pendingInvoices.length > 0) {
        return NextResponse.json(
          { error: 'Não é possível deletar assinatura com faturas pendentes' },
          { status: 400 }
        );
      }

      await prisma.subscription.delete({
        where: { id }
      });

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'subscription_deleted',
          entityType: 'subscription',
          entityId: id,
          details: {
            patientId: subscription.patientId,
            planName: subscription.planName
          },
          createdAt: new Date()
        }
      });

      return NextResponse.json({ message: 'Assinatura deletada com sucesso' });
    } else {
      // Deletar fatura
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          payments: true,
          patient: {
            select: { id: true, name: true }
          }
        }
      });

      if (!invoice) {
        return NextResponse.json(
          { error: 'Fatura não encontrada' },
          { status: 404 }
        );
      }

      // Verificar se há pagamentos associados
      if (invoice.payments.length > 0) {
        return NextResponse.json(
          { error: 'Não é possível deletar fatura com pagamentos associados' },
          { status: 400 }
        );
      }

      await prisma.invoice.delete({
        where: { id }
      });

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'invoice_deleted',
          entityType: 'invoice',
          entityId: id,
          details: {
            patientId: invoice.patientId,
            amount: invoice.amount
          },
          createdAt: new Date()
        }
      });

      return NextResponse.json({ message: 'Fatura deletada com sucesso' });
    }
  } catch (error) {
    console.error('Erro ao deletar:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}