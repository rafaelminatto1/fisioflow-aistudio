import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { query, toolType } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Como um assistente de fisioterapia especializado em ${toolType || 'diagnóstico'}, responda a seguinte pergunta: ${query}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      response: text,
      provider: 'gemini',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Query Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process AI query',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Query endpoint is active',
    supportedProviders: ['gemini', 'openai'],
    endpoints: {
      query: 'POST /api/ai/query',
      predictNoShow: 'POST /api/ai/predict-noshow',
      protocolSuggestions: 'POST /api/ai/protocol-suggestions'
    }
  });
}