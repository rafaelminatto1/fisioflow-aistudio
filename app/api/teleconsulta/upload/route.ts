import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';

// Schema para upload
const UploadSchema = z.object({
  teleconsultaId: z.string().min(1),
  type: z.enum(['image', 'document', 'video']),
  fileName: z.string().min(1)
});

/**
 * POST /api/teleconsulta/upload - Upload de arquivos para teleconsulta
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // TODO: Implement file upload when teleconsulta model exists
    return NextResponse.json({
      message: 'Funcionalidade de upload não implementada - modelo teleconsulta não existe',
      uploadId: 'mock-upload-id'
    }, { status: 501 });

  } catch (error) {
    console.error('Erro no upload:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}