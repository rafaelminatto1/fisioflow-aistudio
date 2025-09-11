import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, message } = body;
    
    // Validações
    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Número de telefone e mensagem são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar configurações do WhatsApp
    const whatsappUrl = process.env.WHATSAPP_API_URL;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    if (!whatsappUrl || !accessToken || !phoneNumberId) {
      return NextResponse.json(
        { error: 'Configurações do WhatsApp não encontradas. Verifique as variáveis de ambiente.' },
        { status: 500 }
      );
    }
    
    // Formatar número de telefone (remover caracteres especiais)
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    
    // Validar formato do número
    if (formattedPhone.length < 10 || formattedPhone.length > 15) {
      return NextResponse.json(
        { error: 'Formato de telefone inválido' },
        { status: 400 }
      );
    }
    
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
      
      let errorMessage = 'Falha ao enviar mensagem de teste';
      
      // Tratar erros específicos da API do WhatsApp
      if (whatsappResult.error) {
        const { code, message: apiMessage } = whatsappResult.error;
        
        switch (code) {
          case 100:
            errorMessage = 'Token de acesso inválido';
            break;
          case 131026:
            errorMessage = 'Número de telefone inválido';
            break;
          case 131047:
            errorMessage = 'Número não está registrado no WhatsApp';
            break;
          case 131051:
            errorMessage = 'Usuário não pode receber mensagens';
            break;
          default:
            errorMessage = apiMessage || errorMessage;
        }
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: whatsappResult
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      message: 'Mensagem de teste enviada com sucesso!',
      whatsappMessageId: whatsappResult.messages?.[0]?.id,
      details: whatsappResult
    });
    
  } catch (error) {
    console.error('Erro ao enviar mensagem de teste:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Verificar se as configurações estão presentes
    const whatsappUrl = process.env.WHATSAPP_API_URL;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    const webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    
    const config = {
      hasApiUrl: !!whatsappUrl,
      hasAccessToken: !!accessToken,
      hasPhoneNumberId: !!phoneNumberId,
      hasBusinessAccountId: !!businessAccountId,
      hasWebhookToken: !!webhookVerifyToken,
      apiUrl: whatsappUrl ? whatsappUrl.substring(0, 30) + '...' : null,
      phoneNumberId: phoneNumberId || null
    };
    
    const isConfigured = config.hasApiUrl && config.hasAccessToken && config.hasPhoneNumberId;
    
    return NextResponse.json({
      configured: isConfigured,
      config
    });
    
  } catch (error) {
    console.error('Erro ao verificar configuração:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}