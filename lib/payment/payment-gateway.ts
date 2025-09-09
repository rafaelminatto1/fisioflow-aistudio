import { z } from 'zod';
import { PixProvider, PixPaymentData, PixPaymentResponse } from './pix-provider';
import prisma from '@/lib/prisma';
import { addDays, addMinutes, isBefore } from 'date-fns';

// Schemas de validação
const PaymentMethodSchema = z.enum(['pix', 'credit_card', 'debit_card', 'bank_slip']);

const CreatePaymentSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  method: PaymentMethodSchema,
  patientId: z.string(),
  consultationId: z.string().optional(),
  appointmentId: z.string().optional(),
  dueDate: z.date().optional(),
  installments: z.number().min(1).max(12).default(1),
  metadata: z.record(z.any()).optional()
});

const CreditCardDataSchema = z.object({
  holderName: z.string().min(1),
  number: z.string().min(13).max(19),
  expiryMonth: z.number().min(1).max(12),
  expiryYear: z.number().min(new Date().getFullYear()),
  cvv: z.string().min(3).max(4),
  holderDocument: z.string().min(11).max(14)
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type CreatePaymentData = z.infer<typeof CreatePaymentSchema>;
export type CreditCardData = z.infer<typeof CreditCardDataSchema>;

export interface PaymentResponse {
  id: string;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'expired';
  method: PaymentMethod;
  amount: number;
  description: string;
  createdAt: Date;
  expiresAt?: Date;
  paidAt?: Date;
  failureReason?: string;
  
  // Dados específicos do método
  pixData?: {
    qrCode: string;
    qrCodeImage: string;
    pixCopyPaste: string;
  };
  
  cardData?: {
    lastFourDigits: string;
    brand: string;
    authorizationCode?: string;
  };
  
  bankSlipData?: {
    barcode: string;
    digitableLine: string;
    url: string;
  };
}

export interface PaymentConfig {
  pix: {
    enabled: boolean;
    merchantId: string;
    merchantName: string;
    merchantCity: string;
    pixKey: string;
    apiUrl: string;
    apiKey: string;
    webhookUrl?: string;
  };
  
  creditCard: {
    enabled: boolean;
    acquirer: 'stone' | 'cielo' | 'rede' | 'pagseguro';
    merchantId: string;
    apiKey: string;
    apiUrl: string;
    maxInstallments: number;
    minInstallmentAmount: number;
  };
  
  bankSlip: {
    enabled: boolean;
    bankCode: string;
    agency: string;
    account: string;
    apiUrl: string;
    apiKey: string;
    defaultDueDays: number;
  };
}

export class PaymentGateway {
  private config: PaymentConfig;
  private pixProvider?: PixProvider;

  constructor(config: PaymentConfig) {
    this.config = config;
    
    if (config.pix.enabled) {
      this.pixProvider = new PixProvider({
        merchantId: config.pix.merchantId,
        merchantName: config.pix.merchantName,
        merchantCity: config.pix.merchantCity,
        pixKey: config.pix.pixKey,
        apiUrl: config.pix.apiUrl,
        apiKey: config.pix.apiKey,
        webhookUrl: config.pix.webhookUrl
      });
    }
  }

  /**
   * Criar pagamento
   */
  async createPayment(
    data: CreatePaymentData,
    cardData?: CreditCardData
  ): Promise<PaymentResponse> {
    const validatedData = CreatePaymentSchema.parse(data);
    
    // Verificar se o método está habilitado
    if (!this.isMethodEnabled(validatedData.method)) {
      throw new Error(`Método de pagamento ${validatedData.method} não está habilitado`);
    }

    // Buscar dados do paciente
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
      select: { id: true, name: true, email: true, document: true }
    });

    if (!patient) {
      throw new Error('Paciente não encontrado');
    }

    try {
      let paymentResponse: PaymentResponse;
      
      switch (validatedData.method) {
        case 'pix':
          paymentResponse = await this.createPixPayment(validatedData, patient);
          break;
          
        case 'credit_card':
          if (!cardData) {
            throw new Error('Dados do cartão são obrigatórios para pagamento com cartão de crédito');
          }
          paymentResponse = await this.createCreditCardPayment(validatedData, patient, cardData);
          break;
          
        case 'debit_card':
          if (!cardData) {
            throw new Error('Dados do cartão são obrigatórios para pagamento com cartão de débito');
          }
          paymentResponse = await this.createDebitCardPayment(validatedData, patient, cardData);
          break;
          
        case 'bank_slip':
          paymentResponse = await this.createBankSlipPayment(validatedData, patient);
          break;
          
        default:
          throw new Error(`Método de pagamento ${validatedData.method} não implementado`);
      }

      // Salvar no banco de dados
      await this.savePaymentToDatabase(paymentResponse, validatedData);
      
      return paymentResponse;
      
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      throw new Error(`Falha ao processar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Consultar status do pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentResponse | null> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          patient: {
            select: { name: true, email: true }
          }
        }
      });

      if (!payment) {
        return null;
      }

      // Atualizar status se necessário
      let updatedStatus = payment.status;
      
      if (payment.method === 'pix' && payment.status === 'pending' && this.pixProvider) {
        try {
          const pixStatus = await this.pixProvider.getPaymentStatus(payment.externalId || payment.id);
          if (pixStatus && pixStatus.status !== payment.status) {
            updatedStatus = pixStatus.status;
            
            await prisma.payment.update({
              where: { id: paymentId },
              data: {
                status: updatedStatus,
                paidAt: pixStatus.paidAt,
                updatedAt: new Date()
              }
            });
          }
        } catch (error) {
          console.error('Erro ao consultar status PIX:', error);
        }
      }

      return {
        id: payment.id,
        status: updatedStatus as PaymentResponse['status'],
        method: payment.method as PaymentMethod,
        amount: payment.amount,
        description: payment.description,
        createdAt: payment.createdAt,
        expiresAt: payment.expiresAt || undefined,
        paidAt: payment.paidAt || undefined,
        failureReason: payment.failureReason || undefined,
        pixData: payment.pixData ? JSON.parse(payment.pixData) : undefined,
        cardData: payment.cardData ? JSON.parse(payment.cardData) : undefined,
        bankSlipData: payment.bankSlipData ? JSON.parse(payment.bankSlipData) : undefined
      };
      
    } catch (error) {
      console.error('Erro ao consultar pagamento:', error);
      throw error;
    }
  }

  /**
   * Cancelar pagamento
   */
  async cancelPayment(paymentId: string, reason?: string): Promise<boolean> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        throw new Error('Pagamento não encontrado');
      }

      if (payment.status === 'paid') {
        throw new Error('Não é possível cancelar um pagamento já pago');
      }

      if (payment.status === 'cancelled') {
        return true; // Já cancelado
      }

      // Cancelar no provedor se necessário
      if (payment.method === 'pix' && this.pixProvider && payment.externalId) {
        await this.pixProvider.cancelPayment(payment.externalId);
      }

      // Atualizar no banco
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'cancelled',
          failureReason: reason || 'Cancelado pelo usuário',
          updatedAt: new Date()
        }
      });

      return true;
      
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error);
      throw error;
    }
  }

  /**
   * Processar webhook
   */
  async processWebhook(method: PaymentMethod, payload: any, signature?: string): Promise<void> {
    try {
      if (method === 'pix' && this.pixProvider) {
        // Validar assinatura se fornecida
        if (signature && !this.pixProvider.validateWebhook(signature, JSON.stringify(payload))) {
          throw new Error('Assinatura do webhook inválida');
        }

        const webhookData = this.pixProvider.processWebhook(payload);
        
        // Atualizar pagamento no banco
        await prisma.payment.updateMany({
          where: {
            externalId: webhookData.txId,
            method: 'pix'
          },
          data: {
            status: webhookData.status,
            paidAt: webhookData.paidAt ? new Date(webhookData.paidAt) : null,
            updatedAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  /**
   * Listar pagamentos
   */
  async listPayments(filters: {
    patientId?: string;
    status?: string;
    method?: PaymentMethod;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, ...where } = filters;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          ...where,
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate
          }
        },
        include: {
          patient: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payment.count({
        where: {
          ...where,
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate
          }
        }
      })
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Criar pagamento PIX
   */
  private async createPixPayment(
    data: CreatePaymentData,
    patient: { name: string; email: string; document: string }
  ): Promise<PaymentResponse> {
    if (!this.pixProvider) {
      throw new Error('Provedor PIX não configurado');
    }

    const pixData: PixPaymentData = {
      amount: data.amount,
      description: data.description,
      payerName: patient.name,
      payerDocument: patient.document,
      payerEmail: patient.email,
      expirationMinutes: 30,
      additionalInfo: data.metadata
    };

    const pixResponse = await this.pixProvider.createPayment(pixData);

    return {
      id: pixResponse.id,
      status: 'pending',
      method: 'pix',
      amount: data.amount,
      description: data.description,
      createdAt: new Date(),
      expiresAt: pixResponse.expiresAt,
      pixData: {
        qrCode: pixResponse.qrCode,
        qrCodeImage: pixResponse.qrCodeImage,
        pixCopyPaste: pixResponse.pixCopyPaste
      }
    };
  }

  /**
   * Criar pagamento com cartão de crédito
   */
  private async createCreditCardPayment(
    data: CreatePaymentData,
    patient: { name: string; email: string; document: string },
    cardData: CreditCardData
  ): Promise<PaymentResponse> {
    // Validar dados do cartão
    const validatedCardData = CreditCardDataSchema.parse(cardData);
    
    // Simular processamento (implementar integração real)
    const success = Math.random() > 0.1; // 90% de sucesso
    
    if (!success) {
      throw new Error('Cartão recusado pela operadora');
    }

    return {
      id: `cc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'paid', // Cartão de crédito é processado imediatamente
      method: 'credit_card',
      amount: data.amount,
      description: data.description,
      createdAt: new Date(),
      paidAt: new Date(),
      cardData: {
        lastFourDigits: validatedCardData.number.slice(-4),
        brand: this.detectCardBrand(validatedCardData.number),
        authorizationCode: `AUTH${Date.now()}`
      }
    };
  }

  /**
   * Criar pagamento com cartão de débito
   */
  private async createDebitCardPayment(
    data: CreatePaymentData,
    patient: { name: string; email: string; document: string },
    cardData: CreditCardData
  ): Promise<PaymentResponse> {
    // Similar ao cartão de crédito, mas sem parcelamento
    if (data.installments > 1) {
      throw new Error('Cartão de débito não permite parcelamento');
    }

    return this.createCreditCardPayment(data, patient, cardData);
  }

  /**
   * Criar boleto bancário
   */
  private async createBankSlipPayment(
    data: CreatePaymentData,
    patient: { name: string; email: string; document: string }
  ): Promise<PaymentResponse> {
    const dueDate = data.dueDate || addDays(new Date(), this.config.bankSlip.defaultDueDays);
    
    // Simular geração de boleto
    const boletoId = `BB${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    return {
      id: boletoId,
      status: 'pending',
      method: 'bank_slip',
      amount: data.amount,
      description: data.description,
      createdAt: new Date(),
      expiresAt: dueDate,
      bankSlipData: {
        barcode: `${this.config.bankSlip.bankCode}${Date.now()}`,
        digitableLine: `${this.config.bankSlip.bankCode}.${Date.now().toString().substr(-5)} ${Date.now().toString().substr(-5)}.${Date.now().toString().substr(-6)} ${Date.now().toString().substr(-1)} ${Date.now()}`,
        url: `/api/payments/${boletoId}/bank-slip.pdf`
      }
    };
  }

  /**
   * Salvar pagamento no banco de dados
   */
  private async savePaymentToDatabase(
    payment: PaymentResponse,
    originalData: CreatePaymentData
  ): Promise<void> {
    await prisma.payment.create({
      data: {
        id: payment.id,
        patientId: originalData.patientId,
        consultationId: originalData.consultationId,
        appointmentId: originalData.appointmentId,
        amount: payment.amount,
        description: payment.description,
        method: payment.method,
        status: payment.status,
        installments: originalData.installments,
        externalId: payment.id,
        expiresAt: payment.expiresAt,
        paidAt: payment.paidAt,
        pixData: payment.pixData ? JSON.stringify(payment.pixData) : null,
        cardData: payment.cardData ? JSON.stringify(payment.cardData) : null,
        bankSlipData: payment.bankSlipData ? JSON.stringify(payment.bankSlipData) : null,
        metadata: originalData.metadata ? JSON.stringify(originalData.metadata) : null,
        createdAt: payment.createdAt,
        updatedAt: payment.createdAt
      }
    });
  }

  /**
   * Verificar se método está habilitado
   */
  private isMethodEnabled(method: PaymentMethod): boolean {
    switch (method) {
      case 'pix':
        return this.config.pix.enabled;
      case 'credit_card':
      case 'debit_card':
        return this.config.creditCard.enabled;
      case 'bank_slip':
        return this.config.bankSlip.enabled;
      default:
        return false;
    }
  }

  /**
   * Detectar bandeira do cartão
   */
  private detectCardBrand(number: string): string {
    const cleanNumber = number.replace(/\D/g, '');
    
    if (/^4/.test(cleanNumber)) return 'Visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'Mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'American Express';
    if (/^6/.test(cleanNumber)) return 'Discover';
    if (/^35(2[89]|[3-8][0-9])/.test(cleanNumber)) return 'JCB';
    if (/^30[0-5]/.test(cleanNumber)) return 'Diners Club';
    
    return 'Desconhecida';
  }

  /**
   * Calcular taxa de juros para parcelamento
   */
  static calculateInstallmentAmount(amount: number, installments: number, interestRate: number = 0): number {
    if (installments === 1 || interestRate === 0) {
      return amount / installments;
    }
    
    const monthlyRate = interestRate / 100;
    const installmentAmount = amount * (monthlyRate * Math.pow(1 + monthlyRate, installments)) / 
                             (Math.pow(1 + monthlyRate, installments) - 1);
    
    return Math.round(installmentAmount * 100) / 100;
  }
}