import { z } from 'zod';
import { format, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Schemas de validação
const PixPaymentSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(140),
  payerName: z.string().min(1),
  payerDocument: z.string().min(11).max(14),
  payerEmail: z.string().email().optional(),
  expirationMinutes: z.number().min(5).max(1440).default(30),
  additionalInfo: z.record(z.string()).optional()
});

const PixConfigSchema = z.object({
  merchantId: z.string(),
  merchantName: z.string(),
  merchantCity: z.string(),
  pixKey: z.string(),
  apiUrl: z.string().url(),
  apiKey: z.string(),
  webhookUrl: z.string().url().optional()
});

export type PixPaymentData = z.infer<typeof PixPaymentSchema>;
export type PixConfig = z.infer<typeof PixConfigSchema>;

export interface PixPaymentResponse {
  id: string;
  qrCode: string;
  qrCodeImage: string;
  pixCopyPaste: string;
  amount: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  expiresAt: Date;
  createdAt: Date;
  paidAt?: Date;
  txId?: string;
}

export interface PixWebhookData {
  id: string;
  txId: string;
  amount: number;
  status: 'paid' | 'cancelled' | 'expired';
  paidAt?: string;
  payerDocument?: string;
  payerName?: string;
}

export class PixProvider {
  private config: PixConfig;

  constructor(config: PixConfig) {
    this.config = PixConfigSchema.parse(config);
  }

  /**
   * Criar cobrança PIX
   */
  async createPayment(data: PixPaymentData): Promise<PixPaymentResponse> {
    const validatedData = PixPaymentSchema.parse(data);
    
    try {
      const payload = {
        calendario: {
          expiracao: validatedData.expirationMinutes * 60 // em segundos
        },
        devedor: {
          cpf: validatedData.payerDocument.replace(/\D/g, ''),
          nome: validatedData.payerName
        },
        valor: {
          original: validatedData.amount.toFixed(2)
        },
        chave: this.config.pixKey,
        solicitacaoPagador: validatedData.description,
        infoAdicionais: validatedData.additionalInfo ? 
          Object.entries(validatedData.additionalInfo).map(([nome, valor]) => ({ nome, valor })) : 
          undefined
      };

      const response = await fetch(`${this.config.apiUrl}/v2/cob`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro ao criar cobrança PIX: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      
      // Gerar QR Code
      const qrCodeData = await this.generateQRCode(result.txid);
      
      return {
        id: result.txid,
        qrCode: qrCodeData.qrcode,
        qrCodeImage: qrCodeData.imagemQrcode,
        pixCopyPaste: qrCodeData.qrcode,
        amount: validatedData.amount,
        status: 'pending',
        expiresAt: addMinutes(new Date(), validatedData.expirationMinutes),
        createdAt: new Date(),
        txId: result.txid
      };
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      throw new Error(`Falha ao criar pagamento PIX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Consultar status do pagamento
   */
  async getPaymentStatus(txId: string): Promise<PixPaymentResponse | null> {
    try {
      const response = await fetch(`${this.config.apiUrl}/v2/cob/${txId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Erro ao consultar pagamento: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        id: result.txid,
        qrCode: result.pixCopiaECola || '',
        qrCodeImage: '',
        pixCopyPaste: result.pixCopiaECola || '',
        amount: parseFloat(result.valor.original),
        status: this.mapStatus(result.status),
        expiresAt: new Date(result.calendario.criacao + result.calendario.expiracao * 1000),
        createdAt: new Date(result.calendario.criacao),
        paidAt: result.pix?.[0]?.horario ? new Date(result.pix[0].horario) : undefined,
        txId: result.txid
      };
    } catch (error) {
      console.error('Erro ao consultar status do pagamento:', error);
      throw error;
    }
  }

  /**
   * Cancelar cobrança PIX
   */
  async cancelPayment(txId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/v2/cob/${txId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'REMOVIDA_PELO_USUARIO_RECEBEDOR'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error);
      return false;
    }
  }

  /**
   * Gerar QR Code para cobrança
   */
  private async generateQRCode(txId: string): Promise<{ qrcode: string; imagemQrcode: string }> {
    try {
      const response = await fetch(`${this.config.apiUrl}/v2/loc/${txId}/qrcode`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao gerar QR Code: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      throw error;
    }
  }

  /**
   * Mapear status da API para status interno
   */
  private mapStatus(apiStatus: string): 'pending' | 'paid' | 'expired' | 'cancelled' {
    switch (apiStatus) {
      case 'ATIVA':
        return 'pending';
      case 'CONCLUIDA':
        return 'paid';
      case 'REMOVIDA_PELO_USUARIO_RECEBEDOR':
      case 'REMOVIDA_PELO_PSP':
        return 'cancelled';
      default:
        return 'expired';
    }
  }

  /**
   * Validar webhook
   */
  validateWebhook(signature: string, payload: string): boolean {
    // Implementar validação de assinatura do webhook
    // Isso depende do provedor PIX específico
    return true; // Placeholder
  }

  /**
   * Processar webhook
   */
  processWebhook(data: any): PixWebhookData {
    return {
      id: data.txid,
      txId: data.txid,
      amount: parseFloat(data.valor),
      status: this.mapStatus(data.status),
      paidAt: data.pix?.[0]?.horario,
      payerDocument: data.pix?.[0]?.pagador?.cpf || data.pix?.[0]?.pagador?.cnpj,
      payerName: data.pix?.[0]?.pagador?.nome
    };
  }

  /**
   * Gerar chave PIX aleatória
   */
  static generateRandomKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validar documento (CPF/CNPJ)
   */
  static validateDocument(document: string): boolean {
    const cleanDoc = document.replace(/\D/g, '');
    
    if (cleanDoc.length === 11) {
      return this.validateCPF(cleanDoc);
    } else if (cleanDoc.length === 14) {
      return this.validateCNPJ(cleanDoc);
    }
    
    return false;
  }

  /**
   * Validar CPF
   */
  private static validateCPF(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    
    return remainder === parseInt(cpf.charAt(10));
  }

  /**
   * Validar CNPJ
   */
  private static validateCNPJ(cnpj: string): boolean {
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cnpj.charAt(12))) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return digit2 === parseInt(cnpj.charAt(13));
  }

  /**
   * Formatar valor monetário
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  /**
   * Formatar documento
   */
  static formatDocument(document: string): string {
    const cleanDoc = document.replace(/\D/g, '');
    
    if (cleanDoc.length === 11) {
      return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (cleanDoc.length === 14) {
      return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return document;
  }
}