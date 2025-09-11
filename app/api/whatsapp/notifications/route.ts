import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.whatsappNotificationSettings.findFirst();
    
    if (!settings) {
      // Retorna configurações padrão se não existir
      const defaultSettings = {
        appointmentReminder: true,
        appointmentConfirmation: true,
        exerciseReminder: false,
        followUpReminder: false,
        reminderHours: 24,
        followUpDays: 7
      };
      
      return NextResponse.json(defaultSettings);
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações de notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      appointmentReminder,
      appointmentConfirmation,
      exerciseReminder,
      followUpReminder,
      reminderHours,
      followUpDays
    } = body;
    
    // Validações
    if (typeof appointmentReminder !== 'boolean' ||
        typeof appointmentConfirmation !== 'boolean' ||
        typeof exerciseReminder !== 'boolean' ||
        typeof followUpReminder !== 'boolean') {
      return NextResponse.json(
        { error: 'Valores booleanos inválidos' },
        { status: 400 }
      );
    }
    
    if (reminderHours < 1 || reminderHours > 168) {
      return NextResponse.json(
        { error: 'Horas de lembrete devem estar entre 1 e 168' },
        { status: 400 }
      );
    }
    
    if (followUpDays < 1 || followUpDays > 30) {
      return NextResponse.json(
        { error: 'Dias de follow-up devem estar entre 1 e 30' },
        { status: 400 }
      );
    }
    
    // Upsert das configurações
    const settings = await prisma.whatsappNotificationSettings.upsert({
      where: { id: 1 }, // Assumindo que sempre haverá apenas um registro
      update: {
        appointmentReminder,
        appointmentConfirmation,
        exerciseReminder,
        followUpReminder,
        reminderHours,
        followUpDays,
        updatedAt: new Date()
      },
      create: {
        id: 1,
        appointmentReminder,
        appointmentConfirmation,
        exerciseReminder,
        followUpReminder,
        reminderHours,
        followUpDays
      }
    });
    
    return NextResponse.json({
      message: 'Configurações salvas com sucesso',
      settings
    });
  } catch (error) {
    console.error('Erro ao salvar configurações de notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}