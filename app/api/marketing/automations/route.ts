import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type AutomationType = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH_NOTIFICATION' | 'BIRTHDAY' | 'APPOINTMENT_REMINDER' | 'FOLLOW_UP' | 'INACTIVITY_REMINDER' | 'NPS';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as AutomationType | null;
    const enabled = searchParams.get('enabled');

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (enabled !== null) {
      where.enabled = enabled === 'true';
    }

    const automations = await prisma.marketingAutomation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ automations });
  } catch (error) {
    console.error('Error fetching marketing automations:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar automações de marketing' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, description, templateMessage, trigger, enabled = true } = body;

    // Validate required fields
    if (!type || !name || !templateMessage) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: type, name, templateMessage' },
        { status: 400 }
      );
    }

    // Validate automation type
    if (!['EMAIL', 'SMS', 'WHATSAPP', 'PUSH_NOTIFICATION'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de automação inválido' },
        { status: 400 }
      );
    }

    // Validate trigger based on automation type
    const validatedTrigger = validateTrigger(type, trigger);
    if (!validatedTrigger.valid) {
      return NextResponse.json(
        { error: validatedTrigger.error },
        { status: 400 }
      );
    }

    const automation = await prisma.marketingAutomation.create({
      data: {
        type,
        name,
        description: description || null,
        templateMessage,
        trigger: trigger || {},
        enabled,
      },
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error('Error creating marketing automation:', error);
    return NextResponse.json(
      { error: 'Erro ao criar automação de marketing' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type, name, description, templateMessage, trigger, enabled } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da automação é obrigatório' },
        { status: 400 }
      );
    }

    // Validate trigger if provided
    if (trigger && type) {
      const validatedTrigger = validateTrigger(type, trigger);
      if (!validatedTrigger.valid) {
        return NextResponse.json(
          { error: validatedTrigger.error },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    
    if (type) updateData.type = type;
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (templateMessage) updateData.templateMessage = templateMessage;
    if (trigger) updateData.trigger = trigger;
    if (enabled !== undefined) updateData.enabled = enabled;

    const updatedAutomation = await prisma.marketingAutomation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedAutomation);
  } catch (error) {
    console.error('Error updating marketing automation:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar automação de marketing' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da automação é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.marketingAutomation.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Automação deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting marketing automation:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar automação de marketing' },
      { status: 500 }
    );
  }
}

// Validate trigger configuration based on automation type
function validateTrigger(type: AutomationType, trigger: any): { valid: boolean; error?: string } {
  if (!trigger) return { valid: true };

  switch (type) {
    case 'BIRTHDAY':
      // Birthday automation doesn't need specific trigger validation
      return { valid: true };
      
    case 'INACTIVITY_REMINDER':
      if (trigger.days_inactive && (typeof trigger.days_inactive !== 'number' || trigger.days_inactive < 1)) {
        return { valid: false, error: 'days_inactive deve ser um número positivo' };
      }
      return { valid: true };
      
    case 'NPS':
      if (trigger.session_count && (typeof trigger.session_count !== 'number' || trigger.session_count < 1)) {
        return { valid: false, error: 'session_count deve ser um número positivo' };
      }
      return { valid: true };
      
    case 'APPOINTMENT_REMINDER':
      if (trigger.hours_before && (typeof trigger.hours_before !== 'number' || trigger.hours_before < 1)) {
        return { valid: false, error: 'hours_before deve ser um número positivo' };
      }
      return { valid: true };
      
    case 'FOLLOW_UP':
      if (trigger.days_after && (typeof trigger.days_after !== 'number' || trigger.days_after < 1)) {
        return { valid: false, error: 'days_after deve ser um número positivo' };
      }
      return { valid: true };
      
    default:
      return { valid: true };
  }
}