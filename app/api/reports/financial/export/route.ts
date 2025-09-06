import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths, subYears } from 'date-fns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Schema para parâmetros de exportação
const ExportParamsSchema = z.object({
  type: z.enum(['overview', 'revenue', 'payments', 'subscriptions', 'invoices']),
  format: z.enum(['csv', 'xlsx']).default('csv'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'thisYear', 'lastYear', 'custom']).optional(),
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  paymentMethod: z.enum(['pix', 'credit_card', 'debit_card', 'bank_slip']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'cancelled', 'expired']).optional()
});

/**
 * GET /api/reports/financial/export - Exportar relatórios financeiros
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

    // Apenas admin e médicos podem exportar relatórios financeiros
    if (session.user.role !== 'admin' && session.user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const params = ExportParamsSchema.parse({
      type: searchParams.get('type'),
      format: searchParams.get('format'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      period: searchParams.get('period'),
      patientId: searchParams.get('patientId'),
      doctorId: searchParams.get('doctorId'),
      paymentMethod: searchParams.get('paymentMethod'),
      paymentStatus: searchParams.get('paymentStatus')
    });

    // Determinar período de datas
    const { startDate, endDate } = getDateRange(params.period, params.startDate, params.endDate);

    let csvData: string;
    let filename: string;

    switch (params.type) {
      case 'overview':
        csvData = await generateOverviewCSV(startDate, endDate, params);
        filename = `relatorio-visao-geral-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      
      case 'revenue':
        csvData = await generateRevenueCSV(startDate, endDate, params);
        filename = `relatorio-receita-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      
      case 'payments':
        csvData = await generatePaymentsCSV(startDate, endDate, params);
        filename = `relatorio-pagamentos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      
      case 'subscriptions':
        csvData = await generateSubscriptionsCSV(startDate, endDate, params);
        filename = `relatorio-assinaturas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      
      case 'invoices':
        csvData = await generateInvoicesCSV(startDate, endDate, params);
        filename = `relatorio-faturas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      
      default:
        return NextResponse.json(
          { error: 'Tipo de relatório não reconhecido' },
          { status: 400 }
        );
    }

    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    
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
 * Determinar período de datas baseado nos filtros
 */
function getDateRange(period?: string, startDateStr?: string, endDateStr?: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  
  if (period === 'custom' && startDateStr && endDateStr) {
    return {
      startDate: new Date(startDateStr),
      endDate: new Date(endDateStr)
    };
  }

  switch (period) {
    case 'today':
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now)
      };
    
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday)
      };
    
    case 'last7days':
      return {
        startDate: startOfDay(subDays(now, 7)),
        endDate: endOfDay(now)
      };
    
    case 'last30days':
      return {
        startDate: startOfDay(subDays(now, 30)),
        endDate: endOfDay(now)
      };
    
    case 'thisMonth':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now)
      };
    
    case 'lastMonth':
      const lastMonth = subMonths(now, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth)
      };
    
    case 'thisYear':
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now)
      };
    
    case 'lastYear':
      const lastYear = subYears(now, 1);
      return {
        startDate: startOfYear(lastYear),
        endDate: endOfYear(lastYear)
      };
    
    default:
      // Padrão: últimos 30 dias
      return {
        startDate: startOfDay(subDays(now, 30)),
        endDate: endOfDay(now)
      };
  }
}

/**
 * Converter array para CSV
 */
function arrayToCSV(data: any[], headers: string[]): string {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escapar aspas duplas e envolver em aspas se necessário
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Formatar valor monetário para CSV
 */
function formatCurrencyForCSV(value: number): string {
  return (value / 100).toFixed(2).replace('.', ',');
}

/**
 * Formatar data para CSV
 */
function formatDateForCSV(date: Date): string {
  return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

/**
 * Gerar CSV de visão geral
 */
async function generateOverviewCSV(startDate: Date, endDate: Date, params: any): Promise<string> {
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  };

  if (params.patientId) where.patientId = params.patientId;
  if (params.paymentMethod) where.method = params.paymentMethod;
  if (params.paymentStatus) where.status = params.paymentStatus;

  // Buscar dados de pagamentos
  const payments = await prisma.payment.findMany({
    where,
    include: {
      patient: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const csvData = payments.map(payment => ({
    'ID': payment.id,
    'Data': formatDateForCSV(payment.createdAt),
    'Paciente': payment.patient?.name || 'N/A',
    'Email': payment.patient?.email || 'N/A',
    'Valor': formatCurrencyForCSV(payment.amount),
    'Método': payment.method,
    'Status': payment.status,
    'Descrição': payment.description || '',
    'Referência Externa': payment.externalReference || ''
  }));

  const headers = ['ID', 'Data', 'Paciente', 'Email', 'Valor', 'Método', 'Status', 'Descrição', 'Referência Externa'];
  
  return arrayToCSV(csvData, headers);
}

/**
 * Gerar CSV de receita
 */
async function generateRevenueCSV(startDate: Date, endDate: Date, params: any): Promise<string> {
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    },
    status: 'paid'
  };

  if (params.patientId) where.patientId = params.patientId;
  if (params.paymentMethod) where.method = params.paymentMethod;

  // Buscar pagamentos pagos
  const payments = await prisma.payment.findMany({
    where,
    include: {
      patient: {
        select: { name: true, email: true }
      },
      consultation: {
        select: { type: true }
      },
      appointment: {
        select: { date: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const csvData = payments.map(payment => ({
    'ID': payment.id,
    'Data Pagamento': formatDateForCSV(payment.createdAt),
    'Data Processamento': payment.paidAt ? formatDateForCSV(payment.paidAt) : '',
    'Paciente': payment.patient?.name || 'N/A',
    'Email': payment.patient?.email || 'N/A',
    'Valor': formatCurrencyForCSV(payment.amount),
    'Método': payment.method,
    'Tipo Consulta': payment.consultation?.type || 'N/A',
    'Data Consulta': payment.appointment?.date ? formatDateForCSV(payment.appointment.date) : 'N/A',
    'Descrição': payment.description || '',
    'Taxa': payment.fee ? formatCurrencyForCSV(payment.fee) : '0,00',
    'Valor Líquido': formatCurrencyForCSV(payment.amount - (payment.fee || 0))
  }));

  const headers = [
    'ID', 'Data Pagamento', 'Data Processamento', 'Paciente', 'Email', 
    'Valor', 'Método', 'Tipo Consulta', 'Data Consulta', 'Descrição', 
    'Taxa', 'Valor Líquido'
  ];
  
  return arrayToCSV(csvData, headers);
}

/**
 * Gerar CSV de pagamentos
 */
async function generatePaymentsCSV(startDate: Date, endDate: Date, params: any): Promise<string> {
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  };

  if (params.patientId) where.patientId = params.patientId;
  if (params.paymentMethod) where.method = params.paymentMethod;
  if (params.paymentStatus) where.status = params.paymentStatus;

  const payments = await prisma.payment.findMany({
    where,
    include: {
      patient: {
        select: { name: true, email: true, phone: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const csvData = payments.map(payment => ({
    'ID': payment.id,
    'Data Criação': formatDateForCSV(payment.createdAt),
    'Data Atualização': formatDateForCSV(payment.updatedAt),
    'Data Pagamento': payment.paidAt ? formatDateForCSV(payment.paidAt) : '',
    'Data Vencimento': payment.dueDate ? formatDateForCSV(payment.dueDate) : '',
    'Paciente': payment.patient?.name || 'N/A',
    'Email': payment.patient?.email || 'N/A',
    'Telefone': payment.patient?.phone || 'N/A',
    'Valor': formatCurrencyForCSV(payment.amount),
    'Método': payment.method,
    'Status': payment.status,
    'Descrição': payment.description || '',
    'Referência Externa': payment.externalReference || '',
    'Motivo Falha': payment.failureReason || '',
    'Tentativas': payment.attempts || 0
  }));

  const headers = [
    'ID', 'Data Criação', 'Data Atualização', 'Data Pagamento', 'Data Vencimento',
    'Paciente', 'Email', 'Telefone', 'Valor', 'Método', 'Status', 
    'Descrição', 'Referência Externa', 'Motivo Falha', 'Tentativas'
  ];
  
  return arrayToCSV(csvData, headers);
}

/**
 * Gerar CSV de assinaturas
 */
async function generateSubscriptionsCSV(startDate: Date, endDate: Date, params: any): Promise<string> {
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  };

  if (params.patientId) where.patientId = params.patientId;

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: {
      patient: {
        select: { name: true, email: true, phone: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const csvData = subscriptions.map(subscription => ({
    'ID': subscription.id,
    'Data Criação': formatDateForCSV(subscription.createdAt),
    'Data Atualização': formatDateForCSV(subscription.updatedAt),
    'Data Início': formatDateForCSV(subscription.startDate),
    'Data Fim': subscription.endDate ? formatDateForCSV(subscription.endDate) : '',
    'Próxima Cobrança': subscription.nextBillingDate ? formatDateForCSV(subscription.nextBillingDate) : '',
    'Paciente': subscription.patient?.name || 'N/A',
    'Email': subscription.patient?.email || 'N/A',
    'Telefone': subscription.patient?.phone || 'N/A',
    'Plano ID': subscription.planId,
    'Nome do Plano': subscription.planName,
    'Valor': formatCurrencyForCSV(subscription.amount),
    'Intervalo': subscription.interval,
    'Status': subscription.status,
    'Tentativas Falha': subscription.failedAttempts || 0
  }));

  const headers = [
    'ID', 'Data Criação', 'Data Atualização', 'Data Início', 'Data Fim',
    'Próxima Cobrança', 'Paciente', 'Email', 'Telefone', 'Plano ID',
    'Nome do Plano', 'Valor', 'Intervalo', 'Status', 'Tentativas Falha'
  ];
  
  return arrayToCSV(csvData, headers);
}

/**
 * Gerar CSV de faturas
 */
async function generateInvoicesCSV(startDate: Date, endDate: Date, params: any): Promise<string> {
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  };

  if (params.patientId) where.patientId = params.patientId;

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      patient: {
        select: { name: true, email: true, phone: true }
      },
      subscription: {
        select: { planName: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const csvData = invoices.map(invoice => ({
    'ID': invoice.id,
    'Número': invoice.number,
    'Data Criação': formatDateForCSV(invoice.createdAt),
    'Data Vencimento': formatDateForCSV(invoice.dueDate),
    'Data Pagamento': invoice.paidAt ? formatDateForCSV(invoice.paidAt) : '',
    'Paciente': invoice.patient?.name || 'N/A',
    'Email': invoice.patient?.email || 'N/A',
    'Telefone': invoice.patient?.phone || 'N/A',
    'Plano': invoice.subscription?.planName || 'N/A',
    'Valor': formatCurrencyForCSV(invoice.amount),
    'Status': invoice.status,
    'Descrição': invoice.description || '',
    'Tentativas Envio': invoice.remindersSent || 0
  }));

  const headers = [
    'ID', 'Número', 'Data Criação', 'Data Vencimento', 'Data Pagamento',
    'Paciente', 'Email', 'Telefone', 'Plano', 'Valor', 'Status',
    'Descrição', 'Tentativas Envio'
  ];
  
  return arrayToCSV(csvData, headers);
}