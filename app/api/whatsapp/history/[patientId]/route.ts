import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { patientId } = params;

    if (!patientId) {
      return NextResponse.json(
        { error: 'ID do paciente é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, name: true }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Buscar histórico de mensagens WhatsApp
    const messages = await prisma.whatsappLog.findMany({
      where: { patientId },
      orderBy: { sentAt: 'desc' },
      select: {
        id: true,
        patientId: true,
        messageType: true,
        content: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        readAt: true,
        errorMessage: true,
      }
    });

    return NextResponse.json({
      success: true,
      messages,
      patient: {
        id: patient.id,
        name: patient.name
      }
    });

  } catch (error) {
    console.error('Error fetching WhatsApp history:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}