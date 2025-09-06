import { z } from 'zod';
import { PaymentGateway, PaymentMethod, CreatePaymentData } from './payment-gateway';
import { prisma } from '@/lib/prisma';
import { addDays, addMonths, addWeeks, isBefore, isAfter, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Schemas de validação
const BillingFrequencySchema = z.enum(['weekly', 'monthly', 'quarterly', 'yearly', 'custom']);

const CreateSubscriptionSchema = z.object({
  patientId: z.string(),
  planId: z.string(),
  amount: z.number().positive(),
  description: z.string().min(1),
  frequency: BillingFrequencySchema,
  customDays: z.number().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  maxCharges: z.number().optional(),
  paymentMethod: z.enum(['pix', 'credit_card', 'debit_card', 'bank_slip']),
  autoRetry: z.boolean().default(true),
  maxRetries: z.number().min(0).max(5).default(3),
  retryInterval: z.number().min(1).max(30).default(7), // dias
  metadata: z.record(z.any()).optional()
});

const CreateInvoiceSchema = z.object({
  patientId: z.string(),
  subscriptionId: z.string().optional(),
  amount: z.number().positive(),
  description: z.string().min(1),
  dueDate: z.date(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    total: z.number().positive()
  })),
  paymentMethod: z.enum(['pix', 'credit_card', 'debit_card', 'bank_slip']).optional(),
  autoCharge: z.boolean().default(false),
  metadata: z.record(z.any()).optional()
});

export type BillingFrequency = z.infer<typeof BillingFrequencySchema>;
export type CreateSubscriptionData = z.infer<typeof CreateSubscriptionSchema>;
export type CreateInvoiceData = z.infer<typeof CreateInvoiceSchema>;

export interface SubscriptionResponse {
  id: string;
  patientId: string;
  planId: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  amount: number;
  description: string;
  frequency: BillingFrequency;
  customDays?: number;
  startDate: Date;
  endDate?: Date;
  nextChargeDate: Date;
  maxCharges?: number;
  chargesCount: number;
  paymentMethod: PaymentMethod;
  autoRetry: boolean;
  maxRetries: number;
  retryInterval: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceResponse {
  id: string;
  patientId: string;
  subscriptionId?: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  description: string;
  dueDate: Date;
  paidAt?: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  paymentId?: string;
  paymentMethod?: PaymentMethod;
  autoCharge: boolean;
  retryCount: number;
  lastRetryAt?: Date;
  nextRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  pendingInvoices: number;
  overdueInvoices: number;
  successRate: number;
  averageTicket: number;
  churnRate: number;
}

export class BillingSystem {
  private paymentGateway: PaymentGateway;

  constructor(paymentGateway: PaymentGateway) {
    this.paymentGateway = paymentGateway;
  }

  /**
   * Criar assinatura
   */
  async createSubscription(data: CreateSubscriptionData): Promise<SubscriptionResponse> {
    const validatedData = CreateSubscriptionSchema.parse(data);

    // Verificar se o paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId }
    });

    if (!patient) {
      throw new Error('Paciente não encontrado');
    }

    // Verificar se o plano existe
    const plan = await prisma.treatmentPlan.findUnique({
      where: { id: validatedData.planId }
    });

    if (!plan) {
      throw new Error('Plano de tratamento não encontrado');
    }

    // Calcular próxima data de cobrança
    const nextChargeDate = this.calculateNextChargeDate(
      validatedData.startDate,
      validatedData.frequency,
      validatedData.customDays
    );

    try {
      const subscription = await prisma.subscription.create({
        data: {
          patientId: validatedData.patientId,
          planId: validatedData.planId,
          status: 'active',
          amount: validatedData.amount,
          description: validatedData.description,
          frequency: validatedData.frequency,
          customDays: validatedData.customDays,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          nextChargeDate,
          maxCharges: validatedData.maxCharges,
          chargesCount: 0,
          paymentMethod: validatedData.paymentMethod,
          autoRetry: validatedData.autoRetry,
          maxRetries: validatedData.maxRetries,
          retryInterval: validatedData.retryInterval,
          metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return this.mapSubscriptionToResponse(subscription);
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      throw new Error('Falha ao criar assinatura');
    }
  }

  /**
   * Criar fatura
   */
  async createInvoice(data: CreateInvoiceData): Promise<InvoiceResponse> {
    const validatedData = CreateInvoiceSchema.parse(data);

    // Verificar se o paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId }
    });

    if (!patient) {
      throw new Error('Paciente não encontrado');
    }

    try {
      const invoice = await prisma.invoice.create({
        data: {
          patientId: validatedData.patientId,
          subscriptionId: validatedData.subscriptionId,
          status: 'pending',
          amount: validatedData.amount,
          description: validatedData.description,
          dueDate: validatedData.dueDate,
          items: JSON.stringify(validatedData.items),
          paymentMethod: validatedData.paymentMethod,
          autoCharge: validatedData.autoCharge,
          retryCount: 0,
          metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const invoiceResponse = this.mapInvoiceToResponse(invoice);

      // Se auto cobrança estiver habilitada, processar pagamento
      if (validatedData.autoCharge && validatedData.paymentMethod) {
        await this.processInvoicePayment(invoiceResponse.id);
      }

      return invoiceResponse;
    } catch (error) {
      console.error('Erro ao criar fatura:', error);
      throw new Error('Falha ao criar fatura');
    }
  }

  /**
   * Processar cobranças automáticas
   */
  async processAutomaticCharges(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // Buscar assinaturas ativas que precisam ser cobradas
      const subscriptions = await prisma.subscription.findMany({
        where: {
          status: 'active',
          nextChargeDate: {
            lte: new Date()
          }
        },
        include: {
          patient: true
        }
      });

      for (const subscription of subscriptions) {
        results.processed++;

        try {
          // Verificar se atingiu o limite de cobranças
          if (subscription.maxCharges && subscription.chargesCount >= subscription.maxCharges) {
            await this.updateSubscriptionStatus(subscription.id, 'expired');
            continue;
          }

          // Verificar se passou da data de término
          if (subscription.endDate && isAfter(new Date(), subscription.endDate)) {
            await this.updateSubscriptionStatus(subscription.id, 'expired');
            continue;
          }

          // Criar fatura para a cobrança
          const invoice = await this.createInvoice({
            patientId: subscription.patientId,
            subscriptionId: subscription.id,
            amount: subscription.amount,
            description: `${subscription.description} - ${format(new Date(), 'MMMM yyyy', { locale: ptBR })}`,
            dueDate: new Date(),
            items: [{
              description: subscription.description,
              quantity: 1,
              unitPrice: subscription.amount,
              total: subscription.amount
            }],
            paymentMethod: subscription.paymentMethod as PaymentMethod,
            autoCharge: true
          });

          // Processar pagamento
          await this.processInvoicePayment(invoice.id);

          // Atualizar assinatura
          const nextChargeDate = this.calculateNextChargeDate(
            subscription.nextChargeDate,
            subscription.frequency as BillingFrequency,
            subscription.customDays
          );

          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              chargesCount: subscription.chargesCount + 1,
              nextChargeDate,
              updatedAt: new Date()
            }
          });

          results.successful++;
        } catch (error) {
          results.failed++;
          const errorMessage = `Erro na assinatura ${subscription.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          results.errors.push(errorMessage);
          console.error(errorMessage);
        }
      }

      // Processar tentativas de cobrança de faturas em atraso
      await this.processRetryCharges(results);

    } catch (error) {
      console.error('Erro no processamento automático:', error);
      results.errors.push(`Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return results;
  }

  /**
   * Processar pagamento de fatura
   */
  async processInvoicePayment(invoiceId: string): Promise<boolean> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          patient: true
        }
      });

      if (!invoice) {
        throw new Error('Fatura não encontrada');
      }

      if (invoice.status === 'paid') {
        return true; // Já paga
      }

      if (!invoice.paymentMethod) {
        throw new Error('Método de pagamento não definido');
      }

      // Criar pagamento
      const paymentData: CreatePaymentData = {
        amount: invoice.amount,
        description: invoice.description,
        method: invoice.paymentMethod as PaymentMethod,
        patientId: invoice.patientId,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscriptionId
        }
      };

      const payment = await this.paymentGateway.createPayment(paymentData);

      // Atualizar fatura
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paymentId: payment.id,
          status: payment.status === 'paid' ? 'paid' : 'pending',
          paidAt: payment.paidAt,
          updatedAt: new Date()
        }
      });

      return payment.status === 'paid';
    } catch (error) {
      console.error('Erro ao processar pagamento da fatura:', error);
      
      // Atualizar contador de tentativas
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      throw error;
    }
  }

  /**
   * Processar tentativas de cobrança
   */
  private async processRetryCharges(results: {
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }): Promise<void> {
    // Buscar faturas em atraso que podem ser tentadas novamente
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'pending',
        dueDate: {
          lt: new Date()
        },
        autoCharge: true,
        retryCount: {
          lt: 3 // máximo de tentativas
        },
        OR: [
          { lastRetryAt: null },
          {
            lastRetryAt: {
              lt: addDays(new Date(), -7) // última tentativa há mais de 7 dias
            }
          }
        ]
      },
      include: {
        subscription: true
      }
    });

    for (const invoice of overdueInvoices) {
      try {
        results.processed++;
        
        // Verificar se a assinatura ainda permite tentativas
        if (invoice.subscription && !invoice.subscription.autoRetry) {
          continue;
        }

        await this.processInvoicePayment(invoice.id);
        results.successful++;
      } catch (error) {
        results.failed++;
        
        // Marcar fatura como vencida se excedeu tentativas
        if (invoice.retryCount >= 2) {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'overdue',
              updatedAt: new Date()
            }
          });
        }
        
        const errorMessage = `Erro na tentativa de cobrança da fatura ${invoice.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        results.errors.push(errorMessage);
      }
    }
  }

  /**
   * Obter estatísticas de cobrança
   */
  async getBillingStats(startDate?: Date, endDate?: Date): Promise<BillingStats> {
    const start = startDate || addMonths(new Date(), -1);
    const end = endDate || new Date();

    const [payments, subscriptions, invoices] = await Promise.all([
      prisma.payment.findMany({
        where: {
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.subscription.findMany({
        where: {
          status: 'active'
        }
      }),
      prisma.invoice.findMany({
        where: {
          createdAt: { gte: start, lte: end }
        }
      })
    ]);

    const totalRevenue = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const monthlyRevenue = payments
      .filter(p => p.status === 'paid' && p.createdAt >= addMonths(new Date(), -1))
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingInvoices = invoices.filter(i => i.status === 'pending').length;
    const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;

    const totalAttempts = payments.length;
    const successfulPayments = payments.filter(p => p.status === 'paid').length;
    const successRate = totalAttempts > 0 ? (successfulPayments / totalAttempts) * 100 : 0;

    const averageTicket = successfulPayments > 0 ? totalRevenue / successfulPayments : 0;

    // Calcular churn rate (simplificado)
    const cancelledSubscriptions = await prisma.subscription.count({
      where: {
        status: 'cancelled',
        updatedAt: { gte: start, lte: end }
      }
    });
    
    const totalSubscriptionsInPeriod = subscriptions.length + cancelledSubscriptions;
    const churnRate = totalSubscriptionsInPeriod > 0 ? (cancelledSubscriptions / totalSubscriptionsInPeriod) * 100 : 0;

    return {
      totalRevenue,
      monthlyRevenue,
      activeSubscriptions: subscriptions.length,
      pendingInvoices,
      overdueInvoices,
      successRate,
      averageTicket,
      churnRate
    };
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<boolean> {
    try {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'cancelled',
          metadata: reason ? JSON.stringify({ cancellationReason: reason }) : undefined,
          updatedAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      throw error;
    }
  }

  /**
   * Pausar assinatura
   */
  async pauseSubscription(subscriptionId: string, resumeDate?: Date): Promise<boolean> {
    try {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'paused',
          nextChargeDate: resumeDate || addMonths(new Date(), 1),
          updatedAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Erro ao pausar assinatura:', error);
      throw error;
    }
  }

  /**
   * Reativar assinatura
   */
  async resumeSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription) {
        throw new Error('Assinatura não encontrada');
      }

      const nextChargeDate = this.calculateNextChargeDate(
        new Date(),
        subscription.frequency as BillingFrequency,
        subscription.customDays
      );

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'active',
          nextChargeDate,
          updatedAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Erro ao reativar assinatura:', error);
      throw error;
    }
  }

  /**
   * Calcular próxima data de cobrança
   */
  private calculateNextChargeDate(
    currentDate: Date,
    frequency: BillingFrequency,
    customDays?: number
  ): Date {
    switch (frequency) {
      case 'weekly':
        return addWeeks(currentDate, 1);
      case 'monthly':
        return addMonths(currentDate, 1);
      case 'quarterly':
        return addMonths(currentDate, 3);
      case 'yearly':
        return addMonths(currentDate, 12);
      case 'custom':
        return addDays(currentDate, customDays || 30);
      default:
        return addMonths(currentDate, 1);
    }
  }

  /**
   * Atualizar status da assinatura
   */
  private async updateSubscriptionStatus(
    subscriptionId: string,
    status: 'active' | 'paused' | 'cancelled' | 'expired'
  ): Promise<void> {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Mapear assinatura para resposta
   */
  private mapSubscriptionToResponse(subscription: any): SubscriptionResponse {
    return {
      id: subscription.id,
      patientId: subscription.patientId,
      planId: subscription.planId,
      status: subscription.status,
      amount: subscription.amount,
      description: subscription.description,
      frequency: subscription.frequency,
      customDays: subscription.customDays,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      nextChargeDate: subscription.nextChargeDate,
      maxCharges: subscription.maxCharges,
      chargesCount: subscription.chargesCount,
      paymentMethod: subscription.paymentMethod,
      autoRetry: subscription.autoRetry,
      maxRetries: subscription.maxRetries,
      retryInterval: subscription.retryInterval,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt
    };
  }

  /**
   * Mapear fatura para resposta
   */
  private mapInvoiceToResponse(invoice: any): InvoiceResponse {
    return {
      id: invoice.id,
      patientId: invoice.patientId,
      subscriptionId: invoice.subscriptionId,
      status: invoice.status,
      amount: invoice.amount,
      description: invoice.description,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      items: invoice.items ? JSON.parse(invoice.items) : [],
      paymentId: invoice.paymentId,
      paymentMethod: invoice.paymentMethod,
      autoCharge: invoice.autoCharge,
      retryCount: invoice.retryCount,
      lastRetryAt: invoice.lastRetryAt,
      nextRetryAt: invoice.nextRetryAt,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    };
  }
}