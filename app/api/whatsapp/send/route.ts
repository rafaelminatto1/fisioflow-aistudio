import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, message, messageType = 'manual' } = body;
    
    // Validações
    if (!patientId || !message) {
      return NextResponse.json(
        { error: 'ID do paciente e mensagem são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Buscar dados do paciente
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });
    
    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }
    
    if (!patient.phone) {
      return NextResponse.json(
        { error: 'Paciente não possui telefone cadastrado' },
        { status: 400 }
      );
    }
    
    // Verificar configurações do WhatsApp
    const whatsappUrl = process.env.WHATSAPP_API_URL;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    if (!whatsappUrl || !accessToken || !phoneNumberId) {
      return NextResponse.json(
        { error: 'Configurações do WhatsApp não encontradas' },
        { status: 500 }
      );
    }
    
    // Formatar número de telefone (remover caracteres especiais)
    const formattedPhone = patient.phone.replace(/\D/g, '');
    
    // Preparar dados para envio
    const whatsappData = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: {
        body: message
      }
    };
    
    // Enviar mensagem via WhatsApp Business API
    const whatsappResponse = await fetch(`${whatsappUrl}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(whatsappData)
    });
    
    const whatsappResult = await whatsappResponse.json();
    
    if (!whatsappResponse.ok) {
      console.error('Erro na API do WhatsApp:', whatsappResult);
      
      // Registrar erro no log
      await prisma.whatsappLog.create({
        data: {
          patientId,
          message,
          messageType,
          status: 'failed',
          error: JSON.stringify(whatsappResult),
          sentAt: new Date()
        }
      });
      
      return NextResponse.json(
        { error: 'Falha ao enviar mensagem WhatsApp' },
        { status: 500 }
      );
    }
    
    // Registrar sucesso no log
    const logEntry = await prisma.whatsappLog.create({
      data: {
        patientId,
        message,
        messageType,
        status: 'sent',
        whatsappMessageId: whatsappResult.messages?.[0]?.id,
        sentAt: new Date()
      }
    });
    
    return NextResponse.json({
      message: 'Mensagem enviada com sucesso',
      whatsappMessageId: whatsappResult.messages?.[0]?.id,
      logId: logEntry.id
    });
    
  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    
    // Tentar registrar erro no log
    try {
      const { patientId, message, messageType = 'manual' } = await request.json();
      await prisma.whatsappLog.create({
        data: {
          patientId,
          message,
          messageType,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          sentAt: new Date()
        }
      });
    } catch (logError) {
      console.error('Erro ao registrar log:', logError);
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}