import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar templates do usuário
    const templates = await prisma.receiptTemplate.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Se não houver templates, criar o template padrão
    if (templates.length === 0) {
      const defaultTemplate = await createDefaultTemplate(session.user.id);
      return NextResponse.json([defaultTemplate]);
    }

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
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
      name,
      content,
      styles,
      isDefault = false
    } = body;

    // Validações
    if (!name || !content) {
      return NextResponse.json(
        { error: 'Nome e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }

    // Se for template padrão, remover flag de outros templates
    if (isDefault) {
      await prisma.receiptTemplate.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    // Criar template
    const template = await prisma.receiptTemplate.create({
      data: {
        name,
        content,
        styles: styles || {},
        isDefault,
        userId: session.user.id
      }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar template:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name,
      content,
      styles,
      isDefault
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do template é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o template existe e pertence ao usuário
    const existingTemplate = await prisma.receiptTemplate.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      );
    }

    // Se for template padrão, remover flag de outros templates
    if (isDefault) {
      await prisma.receiptTemplate.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
          id: { not: id }
        },
        data: {
          isDefault: false
        }
      });
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (content !== undefined) updateData.content = content;
    if (styles !== undefined) updateData.styles = styles;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    // Atualizar template
    const template = await prisma.receiptTemplate.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do template é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o template existe e pertence ao usuário
    const existingTemplate = await prisma.receiptTemplate.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      );
    }

    // Não permitir deletar template padrão se for o único
    if (existingTemplate.isDefault) {
      const templateCount = await prisma.receiptTemplate.count({
        where: {
          userId: session.user.id
        }
      });

      if (templateCount === 1) {
        return NextResponse.json(
          { error: 'Não é possível deletar o único template' },
          { status: 400 }
        );
      }
    }

    // Deletar template
    await prisma.receiptTemplate.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Template deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar template:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para criar template padrão
async function createDefaultTemplate(userId: string) {
  const defaultContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Recibo - {{number}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #333; }
        .receipt-info { margin: 20px 0; }
        .receipt-number { font-size: 18px; font-weight: bold; }
        .patient-info { margin: 20px 0; padding: 15px; background: #f5f5f5; }
        .amount-section { margin: 30px 0; text-align: center; }
        .amount { font-size: 28px; font-weight: bold; color: #2563eb; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{clinicName}}</div>
        <div>{{clinicAddress}}</div>
        <div>{{clinicPhone}} | {{clinicEmail}}</div>
    </div>
    
    <div class="receipt-info">
        <div class="receipt-number">Recibo Nº: {{number}}</div>
        <div>Data de Emissão: {{issueDate}}</div>
        {{#if dueDate}}<div>Data de Vencimento: {{dueDate}}</div>{{/if}}
    </div>
    
    <div class="patient-info">
        <h3>Dados do Paciente</h3>
        <div><strong>Nome:</strong> {{patient.name}}</div>
        <div><strong>Telefone:</strong> {{patient.phone}}</div>
        {{#if patient.email}}<div><strong>Email:</strong> {{patient.email}}</div>{{/if}}
    </div>
    
    <div class="service-info">
        <h3>Serviço Prestado</h3>
        <div><strong>Descrição:</strong> {{description}}</div>
        {{#if appointment}}
        <div><strong>Serviço:</strong> {{appointment.service}}</div>
        <div><strong>Data do Atendimento:</strong> {{appointment.date}}</div>
        {{/if}}
        <div><strong>Forma de Pagamento:</strong> {{paymentMethod}}</div>
    </div>
    
    <div class="amount-section">
        <div>Valor Total</div>
        <div class="amount">R$ {{amount}}</div>
    </div>
    
    {{#if notes}}
    <div class="notes">
        <h3>Observações</h3>
        <div>{{notes}}</div>
    </div>
    {{/if}}
    
    <div class="footer">
        <div>Este recibo foi gerado automaticamente pelo sistema FisioFlow</div>
        <div>Data de geração: {{generatedAt}}</div>
    </div>
</body>
</html>
  `;

  const defaultStyles = {
    primaryColor: '#2563eb',
    secondaryColor: '#f5f5f5',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px'
  };

  return await prisma.receiptTemplate.create({
    data: {
      name: 'Template Padrão',
      content: defaultContent.trim(),
      styles: defaultStyles,
      isDefault: true,
      userId
    }
  });
}