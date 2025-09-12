import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

interface ContactTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  message: string;
  daysOverdue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock templates - in a real implementation, these would come from database
const mockTemplates: ContactTemplate[] = [
  {
    id: '1',
    name: 'Lembrete Amigável (1-7 dias)',
    type: 'email',
    subject: 'Lembrete: Pagamento em atraso - {nome}',
    message: `Olá {nome},

Esperamos que esteja bem!

Notamos que seu pagamento de {valor} referente ao atendimento do dia {data} está em atraso há {dias} dias.

Sabemos que imprevistos acontecem, por isso gostaríamos de oferecer nossa ajuda para regularizar sua situação.

Por favor, entre em contato conosco para conversarmos sobre as opções de pagamento disponíveis.

Atenciosamente,
Equipe da Clínica`,
    daysOverdue: 7,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Cobrança Formal (8-15 dias)',
    type: 'email',
    subject: 'URGENTE: Pagamento em atraso há {dias} dias - {nome}',
    message: `Prezado(a) {nome},

Seu pagamento de {valor} referente ao atendimento do dia {data} está em atraso há {dias} dias.

É necessário regularizar sua situação imediatamente para evitar:
• Inclusão em órgãos de proteção ao crédito
• Cobrança de juros e multa
• Medidas legais cabíveis

Para evitar essas consequências, entre em contato urgentemente através do telefone {telefone} ou responda este email.

Aguardamos seu contato em até 48 horas.

Atenciosamente,
Setor Financeiro`,
    daysOverdue: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Última Oportunidade (16+ dias)',
    type: 'email',
    subject: 'ÚLTIMA OPORTUNIDADE: Regularize seu pagamento - {nome}',
    message: `{nome},

Este é nosso último contato antes de tomarmos medidas legais.

Seu pagamento de {valor} está em atraso há {dias} dias e todas as tentativas anteriores de contato foram ignoradas.

Você tem até 72 horas para:
1. Quitar o débito integralmente
2. Entrar em contato para negociar um acordo

Após este prazo, seu nome será encaminhado para:
• Órgãos de proteção ao crédito (SPC/Serasa)
• Cobrança judicial
• Protesto em cartório

Não perca esta última oportunidade de resolver amigavelmente.

Contato: {telefone}

Setor Jurídico`,
    daysOverdue: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'WhatsApp Lembrete Amigável',
    type: 'whatsapp',
    message: `Oi {nome}! 😊

Tudo bem? Notamos que seu pagamento de {valor} está em atraso há {dias} dias.

Podemos conversar sobre as opções de pagamento? Estamos aqui para ajudar! 💙

Responda quando puder! 📱`,
    daysOverdue: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'WhatsApp Cobrança',
    type: 'whatsapp',
    message: `{nome}, seu pagamento de {valor} está {dias} dias em atraso.

Precisamos regularizar urgentemente. Pode me ligar no {telefone}?

Obrigado! 🙏`,
    daysOverdue: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    name: 'SMS Lembrete',
    type: 'sms',
    message: `{nome}, lembrete: pagamento de {valor} em atraso há {dias} dias. Entre em contato: {telefone}`,
    daysOverdue: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '7',
    name: 'SMS Urgente',
    type: 'sms',
    message: `URGENTE {nome}: Pagamento {valor} atrasado {dias} dias. Regularize em 48h ou nome vai para SPC/Serasa. Tel: {telefone}`,
    daysOverdue: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '8',
    name: 'Proposta de Desconto',
    type: 'email',
    subject: '🎯 OFERTA ESPECIAL: 15% de desconto para quitar hoje - {nome}',
    message: `{nome},

Temos uma proposta especial para você!

💰 DESCONTO DE 15% para pagamento à vista
📅 Válido apenas hoje
💳 Valor original: {valor}
✅ Valor com desconto: {valor_desconto}

Esta é uma oportunidade única de regularizar sua situação com economia.

Para aproveitar, entre em contato até às 18h de hoje:
📞 {telefone}
📧 Responda este email

Não perca esta chance!

Equipe Financeira`,
    daysOverdue: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const active = searchParams.get('active');
    const daysOverdue = searchParams.get('daysOverdue');

    let filteredTemplates = [...mockTemplates];

    // Filter by type
    if (type && ['email', 'sms', 'whatsapp'].includes(type)) {
      filteredTemplates = filteredTemplates.filter(t => t.type === type);
    }

    // Filter by active status
    if (active !== null) {
      const isActive = active === 'true';
      filteredTemplates = filteredTemplates.filter(t => t.isActive === isActive);
    }

    // Filter by days overdue (find templates suitable for the given days)
    if (daysOverdue) {
      const days = parseInt(daysOverdue);
      if (!isNaN(days)) {
        filteredTemplates = filteredTemplates.filter(t => days >= t.daysOverdue);
        // Sort by most appropriate (closest to the days overdue)
        filteredTemplates.sort((a, b) => {
          const diffA = Math.abs(days - a.daysOverdue);
          const diffB = Math.abs(days - b.daysOverdue);
          return diffA - diffB;
        });
      }
    }

    // Sort by days overdue if no specific filter
    if (!daysOverdue) {
      filteredTemplates.sort((a, b) => a.daysOverdue - b.daysOverdue);
    }

    return NextResponse.json({
      success: true,
      templates: filteredTemplates,
      total: filteredTemplates.length
    });

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
    const { name, type, subject, message, daysOverdue, isActive = true } = body;

    // Validation
    if (!name || !type || !message || daysOverdue === undefined) {
      return NextResponse.json(
        { error: 'Nome, tipo, mensagem e dias de atraso são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['email', 'sms', 'whatsapp'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo deve ser: email, sms ou whatsapp' },
        { status: 400 }
      );
    }

    if (type === 'email' && !subject) {
      return NextResponse.json(
        { error: 'Assunto é obrigatório para templates de email' },
        { status: 400 }
      );
    }

    if (daysOverdue < 0 || daysOverdue > 365) {
      return NextResponse.json(
        { error: 'Dias de atraso deve estar entre 0 e 365' },
        { status: 400 }
      );
    }

    // Create new template
    const newTemplate: ContactTemplate = {
      id: (mockTemplates.length + 1).toString(),
      name,
      type,
      subject: type === 'email' ? subject : undefined,
      message,
      daysOverdue,
      isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In a real implementation, you would save to database
    mockTemplates.push(newTemplate);

    return NextResponse.json({
      success: true,
      template: newTemplate,
      message: 'Template criado com sucesso'
    }, { status: 201 });

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
    const { id, name, type, subject, message, daysOverdue, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do template é obrigatório' },
        { status: 400 }
      );
    }

    // Find template
    const templateIndex = mockTemplates.findIndex(t => t.id === id);
    if (templateIndex === -1) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      );
    }

    // Update template
    const updatedTemplate = {
      ...mockTemplates[templateIndex],
      ...(name && { name }),
      ...(type && { type }),
      ...(subject !== undefined && { subject }),
      ...(message && { message }),
      ...(daysOverdue !== undefined && { daysOverdue }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date().toISOString()
    };

    mockTemplates[templateIndex] = updatedTemplate;

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
      message: 'Template atualizado com sucesso'
    });

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

    // Find template
    const templateIndex = mockTemplates.findIndex(t => t.id === id);
    if (templateIndex === -1) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      );
    }

    // Remove template
    const deletedTemplate = mockTemplates.splice(templateIndex, 1)[0];

    return NextResponse.json({
      success: true,
      template: deletedTemplate,
      message: 'Template excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir template:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}