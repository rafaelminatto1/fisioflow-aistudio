import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import html2pdf from 'html2pdf.js';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/financial/receipts/[id]/pdf - Gerar PDF do recibo
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id: params.id },
      include: {
        patient: {
          select: { 
            id: true, 
            name: true, 
            cpf: true, 
            email: true,
            phone: true,
            address: true
          }
        },
        transaction: {
          select: { 
            id: true, 
            type: true, 
            category: true,
            date: true
          }
        },
        issuer: {
          select: { 
            id: true, 
            name: true, 
            email: true 
          }
        }
      }
    });

    if (!receipt) {
      return NextResponse.json(
        { error: 'Recibo não encontrado' },
        { status: 404 }
      );
    }

    // Parse items if exists
    let items: any[] = [];
    if (receipt.items) {
      try {
        items = JSON.parse(receipt.items as string);
      } catch (error) {
        console.error('Erro ao fazer parse dos items:', error);
      }
    }

    // Generate HTML content for the receipt
    const htmlContent = generateReceiptHTML(receipt, items);

    // Return HTML for client-side PDF generation
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="recibo-${receipt.receiptNumber}.html"`
      }
    });

  } catch (error) {
    console.error('Erro ao gerar recibo em PDF:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function generateReceiptHTML(receipt: any, items: any[]): string {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recibo - ${receipt.receiptNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }
        .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            background: white;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        .clinic-info {
            color: #6b7280;
            font-size: 14px;
        }
        .receipt-number {
            background: #3b82f6;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            display: inline-block;
            font-weight: bold;
            margin-top: 20px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-item {
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            color: #6b7280;
            font-size: 14px;
        }
        .info-value {
            color: #111827;
            margin-top: 2px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .items-table th,
        .items-table td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
        }
        .items-table th {
            background-color: #f9fafb;
            font-weight: bold;
            color: #374151;
        }
        .items-table .text-right {
            text-align: right;
        }
        .total-section {
            margin-top: 30px;
            padding: 20px;
            background-color: #f0f9ff;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        .total-amount {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            text-align: right;
        }
        .payment-info {
            margin-top: 20px;
            padding: 15px;
            background-color: #f3f4f6;
            border-radius: 6px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .signature-section {
            margin-top: 60px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
        }
        .signature-box {
            text-align: center;
            border-top: 1px solid #374151;
            padding-top: 10px;
        }
        @media print {
            body { margin: 0; }
            .receipt-container { border: none; }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <div class="logo">FisioFlow</div>
            <div class="clinic-info">
                Sistema de Gestão de Fisioterapia<br>
                contato@fisioflow.com.br
            </div>
            <div class="receipt-number">
                ${receipt.receiptNumber}
            </div>
        </div>

        <div class="section">
            <div class="section-title">Dados do Paciente</div>
            <div class="info-grid">
                <div>
                    <div class="info-item">
                        <div class="info-label">Nome Completo</div>
                        <div class="info-value">${receipt.patient.name}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">CPF</div>
                        <div class="info-value">${receipt.patient.cpf ? formatCPF(receipt.patient.cpf) : 'Não informado'}</div>
                    </div>
                </div>
                <div>
                    <div class="info-item">
                        <div class="info-label">E-mail</div>
                        <div class="info-value">${receipt.patient.email || 'Não informado'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Telefone</div>
                        <div class="info-value">${receipt.patient.phone || 'Não informado'}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Informações do Serviço</div>
            <div class="info-grid">
                <div>
                    <div class="info-item">
                        <div class="info-label">Descrição</div>
                        <div class="info-value">${receipt.description}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Data do Serviço</div>
                        <div class="info-value">${formatDate(receipt.serviceDate)}</div>
                    </div>
                </div>
                <div>
                    <div class="info-item">
                        <div class="info-label">Método de Pagamento</div>
                        <div class="info-value">${getPaymentMethodLabel(receipt.paymentMethod)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Data de Emissão</div>
                        <div class="info-value">${formatDate(receipt.createdAt)}</div>
                    </div>
                </div>
            </div>
        </div>

        ${items.length > 0 ? `
        <div class="section">
            <div class="section-title">Itens do Serviço</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th class="text-right">Qtd.</th>
                        <th class="text-right">Valor Unit.</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                    <tr>
                        <td>${item.description}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                        <td class="text-right">${formatCurrency(item.total)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="total-section">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 16px; color: #374151;">Valor Total do Serviço</div>
                </div>
                <div class="total-amount">
                    ${formatCurrency(receipt.amount)}
                </div>
            </div>
        </div>

        ${receipt.notes ? `
        <div class="payment-info">
            <strong>Observações:</strong><br>
            ${receipt.notes}
        </div>
        ` : ''}

        <div class="signature-section">
            <div class="signature-box">
                <div>Assinatura do Profissional</div>
                <div style="margin-top: 5px; font-size: 12px; color: #6b7280;">
                    ${receipt.issuer.name}
                </div>
            </div>
            <div class="signature-box">
                <div>Assinatura do Paciente</div>
            </div>
        </div>

        <div class="footer">
            Recibo gerado automaticamente pelo sistema FisioFlow<br>
            Data de geração: ${formatDate(new Date())}<br>
            Este documento comprova o pagamento do serviço prestado
        </div>
    </div>
</body>
</html>`;
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Dinheiro',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    pix: 'PIX',
    bank_transfer: 'Transferência Bancária',
    insurance: 'Convênio',
  };
  
  return labels[method] || method;
}