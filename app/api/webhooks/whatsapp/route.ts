// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { whatsappBusinessService } from '../../../../services/whatsappBusinessService';

// GET request for webhook verification
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (!mode || !token || !challenge) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const verificationResult = await whatsappBusinessService.verifyWebhook(
      mode,
      token,
      challenge
    );

    if (verificationResult) {
      return new NextResponse(verificationResult, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 403 }
    );
  } catch (error) {
    console.error('WhatsApp webhook verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST request for receiving webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the webhook for debugging
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2));
    
    // Handle the webhook
    await whatsappBusinessService.handleWebhook(body);
    
    // WhatsApp expects a 200 OK response
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('WhatsApp webhook processing error:', error);
    
    // Still return 200 to avoid WhatsApp retrying
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}