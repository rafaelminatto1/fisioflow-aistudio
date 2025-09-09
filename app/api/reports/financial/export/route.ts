import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

// Schema para validação dos parâmetros de exportação
const ExportParamsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  patientId: z.string().optional(),
  status: z.enum(['pending', 'paid']).optional(),
  method: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'insurance']).optional(),
  format: z.enum(['csv', 'excel']).default('csv')
});

// Função para formatar moeda para CSV
const formatCurrencyForCSV = (amount: number): string => {
  return amount.toFixed(2).replace('.', ',');
};

// Função para formatar data para CSV
const formatDateForCSV = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

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
    if (session.user.role !== 'Admin' && session.user.role !== 'Fisioterapeuta') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = ExportParamsSchema.parse(Object.fromEntries(searchParams.entries()));

    // Construir filtros
    const where: any = {};

    if (params.patientId) {
      where.patientId = params.patientId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.method) {
      where.method = params.method;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = startOfDay(new Date(params.startDate));
      }
      if (params.endDate) {
        where.createdAt.lte = endOfDay(new Date(params.endDate));
      }
    }

    // Buscar dados de pagamentos
    const payments = await prisma.payment.findMany({
      where,
      include: {
        patient: {
          select: { name: true, email: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Preparar dados para exportação
    const exportData = payments.map(payment => ({
      'ID': payment.id,
      'Data': formatDateForCSV(payment.createdAt),
      'Paciente': payment.patient.name,
      'Email': payment.patient.email || '',
      'Telefone': payment.patient.phone || '',
      'Valor': formatCurrencyForCSV(Number(payment.amount)),
      'Método': payment.method,
      'Status': payment.status,
      'Descrição': payment.description || '',
      'Data Vencimento': payment.dueDate ? formatDateForCSV(payment.dueDate) : '',
      'Data Pagamento': payment.paidAt ? formatDateForCSV(payment.paidAt) : '',
      'Atualização': formatDateForCSV(payment.updatedAt)
    }));

    if (params.format === 'csv') {
      // Gerar CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Para outros formatos, retornar JSON por enquanto
    return NextResponse.json({
      data: exportData,
      total: payments.length,
      filters: params
    });

  } catch (error) {
    console.error('Erro ao exportar relatório financeiro:', error);

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