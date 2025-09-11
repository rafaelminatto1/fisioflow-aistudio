// app/api/whatsapp/config/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { whatsappBusinessService } from '../../../../services/whatsappBusinessService';

// GET - Check WhatsApp configuration status
export async function GET() {
  try {
    const isConfigured = whatsappBusinessService.isConfigured();
    const config = whatsappBusinessService.getConfig();
    
    return NextResponse.json({
      configured: isConfigured,
      config,
      status: isConfigured ? 'ready' : 'needs_configuration'
    });
  } catch (error) {
    console.error('Error checking WhatsApp config:', error);
    return NextResponse.json(
      { error: 'Failed to check configuration' },
      { status: 500 }
    );
  }
}