import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Note: For a complete implementation, you would need to install and import:
// - jsPDF for PDF generation
// - xlsx for Excel generation
// For now, we'll create a basic structure that can be extended

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exportFormat = searchParams.get('format') || 'pdf';
    const period = searchParams.get('period') || 'thisMonth';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    // Determine date range based on period
    if (period === 'custom' && startDateParam && endDateParam) {
      startDate = startOfDay(new Date(startDateParam));
      endDate = endOfDay(new Date(endDateParam));
    } else {
      switch (period) {
        case 'thisMonth':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'lastMonth':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          startDate = startOfMonth(lastMonth);
          endDate = endOfMonth(lastMonth);
          break;
        case 'thisYear':
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        case 'lastYear':
          const lastYear = new Date(now.getFullYear() - 1, 0, 1);
          startDate = startOfYear(lastYear);
          endDate = endOfYear(lastYear);
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
      }
    }

    // Get data for export
    const [revenueData, expenseData, appointmentData] = await Promise.all([
      prisma.financialTransaction.findMany({
        where: {
          userId: session.user.id,
          type: 'INCOME',
          date: { gte: startDate, lte: endDate }
        },
        include: {
          appointment: {
            include: { patient: true }
          }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.financialTransaction.findMany({
        where: {
          userId: session.user.id,
          type: 'EXPENSE',
          date: { gte: startDate, lte: endDate }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.appointment.findMany({
        where: {
          userId: session.user.id,
          date: { gte: startDate, lte: endDate }
        },
        include: { patient: true },
        orderBy: { date: 'desc' }
      })
    ]);

    // Calculate summary data
    const totalRevenue = revenueData.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseData.reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const totalAppointments = appointmentData.length;
    const completedAppointments = appointmentData.filter(a => a.status === 'COMPLETED').length;

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    const formatDate = (date: Date) => {
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    };

    const periodLabel = `${formatDate(startDate)} - ${formatDate(endDate)}`;

    if (exportFormat === 'excel') {
      // For Excel export, we'll create a CSV format that can be opened in Excel
      // In a real implementation, you would use the 'xlsx' library
      
      const csvContent = [
        // Header
        `Relatório Financeiro - ${periodLabel}`,
        '',
        'RESUMO EXECUTIVO',
        `Receita Total,${formatCurrency(totalRevenue)}`,
        `Despesas Totais,${formatCurrency(totalExpenses)}`,
        `Lucro Líquido,${formatCurrency(netProfit)}`,
        `Total de Consultas,${totalAppointments}`,
        `Consultas Realizadas,${completedAppointments}`,
        '',
        'RECEITAS DETALHADAS',
        'Data,Paciente,Descrição,Valor,Forma de Pagamento',
        ...revenueData.map(t => 
          `${formatDate(t.date)},${t.appointment?.patient?.name || 'N/A'},${t.description || 'Consulta'},${formatCurrency(t.amount)},${t.paymentMethod || 'N/A'}`
        ),
        '',
        'DESPESAS DETALHADAS',
        'Data,Descrição,Categoria,Valor',
        ...expenseData.map(t => 
          `${formatDate(t.date)},${t.description || 'N/A'},${t.category || 'Outros'},${formatCurrency(t.amount)}`
        ),
        '',
        'CONSULTAS DETALHADAS',
        'Data,Paciente,Status,Valor',
        ...appointmentData.map(a => 
          `${formatDate(a.date)},${a.patient.name},${a.status},${a.price ? formatCurrency(a.price) : 'N/A'}`
        )
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorio-financeiro-${format(now, 'yyyy-MM-dd')}.csv"`
        }
      });
    } else {
      // For PDF export, we'll create an HTML version that can be printed as PDF
      // In a real implementation, you would use libraries like jsPDF or Puppeteer
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório Financeiro</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
            .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .summary-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; }
            .summary-card h3 { margin: 0 0 10px 0; color: #007bff; }
            .summary-card .value { font-size: 24px; font-weight: bold; color: #333; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #007bff; border-bottom: 1px solid #dee2e6; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
            th { background-color: #f8f9fa; font-weight: bold; color: #495057; }
            .positive { color: #28a745; }
            .negative { color: #dc3545; }
            .footer { margin-top: 40px; text-align: center; color: #6c757d; font-size: 12px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório Financeiro</h1>
            <p>Período: ${periodLabel}</p>
            <p>Gerado em: ${formatDate(now)}</p>
          </div>

          <div class="summary">
            <div class="summary-card">
              <h3>Receita Total</h3>
              <div class="value positive">${formatCurrency(totalRevenue)}</div>
            </div>
            <div class="summary-card">
              <h3>Despesas Totais</h3>
              <div class="value negative">${formatCurrency(totalExpenses)}</div>
            </div>
            <div class="summary-card">
              <h3>Lucro Líquido</h3>
              <div class="value ${netProfit >= 0 ? 'positive' : 'negative'}">${formatCurrency(netProfit)}</div>
            </div>
            <div class="summary-card">
              <h3>Consultas Realizadas</h3>
              <div class="value">${completedAppointments}/${totalAppointments}</div>
            </div>
          </div>

          <div class="section">
            <h2>Receitas Detalhadas</h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Paciente</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Forma de Pagamento</th>
                </tr>
              </thead>
              <tbody>
                ${revenueData.map(t => `
                  <tr>
                    <td>${formatDate(t.date)}</td>
                    <td>${t.appointment?.patient?.name || 'N/A'}</td>
                    <td>${t.description || 'Consulta'}</td>
                    <td class="positive">${formatCurrency(t.amount)}</td>
                    <td>${t.paymentMethod || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Despesas Detalhadas</h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                ${expenseData.map(t => `
                  <tr>
                    <td>${formatDate(t.date)}</td>
                    <td>${t.description || 'N/A'}</td>
                    <td>${t.category || 'Outros'}</td>
                    <td class="negative">${formatCurrency(t.amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Consultas do Período</h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Paciente</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                ${appointmentData.map(a => `
                  <tr>
                    <td>${formatDate(a.date)}</td>
                    <td>${a.patient.name}</td>
                    <td>${a.status === 'COMPLETED' ? 'Realizada' : a.status === 'CANCELLED' ? 'Cancelada' : a.status}</td>
                    <td>${a.price ? formatCurrency(a.price) : 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Relatório gerado automaticamente pelo sistema FisioFlow</p>
          </div>
        </body>
        </html>
      `;

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorio-financeiro-${format(now, 'yyyy-MM-dd')}.html"`
        }
      });
    }
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}