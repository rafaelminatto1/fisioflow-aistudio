import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';
import sharp from 'sharp';

// Configurações de upload
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
];

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'teleconsulta');

// Schema de validação
const uploadSchema = z.object({
  teleconsultaId: z.string(),
  type: z.enum(['image', 'file']),
  compress: z.boolean().default(true)
});

// Função para garantir que o diretório existe
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Função para gerar nome único do arquivo
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${random}.${extension}`;
}

// Função para validar tipo de arquivo
function validateFileType(file: File, type: 'image' | 'file'): boolean {
  if (type === 'image') {
    return ALLOWED_IMAGE_TYPES.includes(file.type);
  }
  return ALLOWED_FILE_TYPES.includes(file.type);
}

// Função para validar tamanho do arquivo
function validateFileSize(file: File, type: 'image' | 'file'): boolean {
  const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
  return file.size <= maxSize;
}

// Função para processar imagem
async function processImage(
  buffer: Buffer,
  fileName: string,
  compress: boolean = true
): Promise<{ fileName: string; size: number; dimensions?: { width: number; height: number } }> {
  let processedBuffer = buffer;
  let dimensions: { width: number; height: number } | undefined;

  if (compress) {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    dimensions = {
      width: metadata.width || 0,
      height: metadata.height || 0
    };

    // Redimensionar se muito grande
    if (metadata.width && metadata.width > 1920) {
      image.resize(1920, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    // Comprimir baseado no formato
    if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
      processedBuffer = await image.jpeg({ quality: 85 }).toBuffer();
    } else if (fileName.toLowerCase().endsWith('.png')) {
      processedBuffer = await image.png({ compressionLevel: 8 }).toBuffer();
    } else if (fileName.toLowerCase().endsWith('.webp')) {
      processedBuffer = await image.webp({ quality: 85 }).toBuffer();
    }
  }

  const filePath = join(UPLOAD_DIR, fileName);
  await writeFile(filePath, processedBuffer);

  return {
    fileName,
    size: processedBuffer.length,
    dimensions
  };
}

// POST - Upload de arquivo
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Garantir que o diretório existe
    await ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const teleconsultaId = formData.get('teleconsultaId') as string;
    const type = formData.get('type') as 'image' | 'file';
    const compress = formData.get('compress') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }

    // Validar dados
    const validatedData = uploadSchema.parse({
      teleconsultaId,
      type,
      compress
    });

    // Validar tipo de arquivo
    if (!validateFileType(file, validatedData.type)) {
      const allowedTypes = validatedData.type === 'image' 
        ? ALLOWED_IMAGE_TYPES.join(', ')
        : ALLOWED_FILE_TYPES.join(', ');
      
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes}` },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo
    if (!validateFileSize(file, validatedData.type)) {
      const maxSize = validatedData.type === 'image' ? '5MB' : '10MB';
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${maxSize}` },
        { status: 400 }
      );
    }

    // Verificar se o usuário tem acesso à teleconsulta
    const { prisma } = await import('@/lib/prisma');
    const teleconsulta = await prisma.teleconsulta.findUnique({
      where: { id: validatedData.teleconsultaId },
      select: {
        id: true,
        doctorId: true,
        patientId: true,
        status: true
      }
    });

    if (!teleconsulta) {
      return NextResponse.json(
        { error: 'Teleconsulta não encontrada' },
        { status: 404 }
      );
    }

    if (teleconsulta.doctorId !== session.user.id && 
        teleconsulta.patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para fazer upload nesta teleconsulta' },
        { status: 403 }
      );
    }

    if (teleconsulta.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Não é possível fazer upload em uma teleconsulta cancelada' },
        { status: 400 }
      );
    }

    // Processar arquivo
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = generateFileName(file.name);
    
    let fileInfo: {
      fileName: string;
      size: number;
      dimensions?: { width: number; height: number };
    };

    if (validatedData.type === 'image') {
      fileInfo = await processImage(buffer, fileName, validatedData.compress);
    } else {
      const filePath = join(UPLOAD_DIR, fileName);
      await writeFile(filePath, buffer);
      fileInfo = {
        fileName,
        size: buffer.length
      };
    }

    // Criar registro no banco
    const uploadRecord = await prisma.teleconsultaUpload.create({
      data: {
        teleconsultaId: validatedData.teleconsultaId,
        uploaderId: session.user.id,
        fileName: fileInfo.fileName,
        originalName: file.name,
        mimeType: file.type,
        size: fileInfo.size,
        type: validatedData.type,
        url: `/uploads/teleconsulta/${fileInfo.fileName}`,
        metadata: {
          dimensions: fileInfo.dimensions,
          compressed: validatedData.compress && validatedData.type === 'image'
        }
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Criar mensagem no chat
    await prisma.teleconsultaMessage.create({
      data: {
        teleconsultaId: validatedData.teleconsultaId,
        senderId: session.user.id,
        content: validatedData.type === 'image' 
          ? `Imagem enviada: ${file.name}`
          : `Arquivo enviado: ${file.name}`,
        type: validatedData.type,
        metadata: {
          fileName: file.name,
          fileSize: fileInfo.size,
          mimeType: file.type,
          uploadId: uploadRecord.id,
          url: uploadRecord.url,
          dimensions: fileInfo.dimensions
        }
      }
    });

    // Criar notificação
    const recipientId = teleconsulta.doctorId === session.user.id 
      ? teleconsulta.patientId 
      : teleconsulta.doctorId;

    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: `${validatedData.type === 'image' ? 'Imagem' : 'Arquivo'} enviado`,
        message: `${file.name} foi enviado na teleconsulta`,
        type: 'file_upload',
        relatedId: validatedData.teleconsultaId
      }
    });

    return NextResponse.json({
      upload: uploadRecord,
      message: 'Arquivo enviado com sucesso'
    }, { status: 201 });

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

// GET - Listar uploads da teleconsulta
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teleconsultaId = searchParams.get('teleconsultaId');
    const type = searchParams.get('type') as 'image' | 'file' | null;

    if (!teleconsultaId) {
      return NextResponse.json(
        { error: 'ID da teleconsulta é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar acesso
    const { prisma } = await import('@/lib/prisma');
    const teleconsulta = await prisma.teleconsulta.findUnique({
      where: { id: teleconsultaId },
      select: {
        doctorId: true,
        patientId: true
      }
    });

    if (!teleconsulta) {
      return NextResponse.json(
        { error: 'Teleconsulta não encontrada' },
        { status: 404 }
      );
    }

    if (teleconsulta.doctorId !== session.user.id && 
        teleconsulta.patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      );
    }

    // Buscar uploads
    const where: any = {
      teleconsultaId
    };

    if (type) {
      where.type = type;
    }

    const uploads = await prisma.teleconsultaUpload.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calcular estatísticas
    const stats = {
      total: uploads.length,
      totalSize: uploads.reduce((sum, upload) => sum + upload.size, 0),
      byType: uploads.reduce((acc, upload) => {
        acc[upload.type] = (acc[upload.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      uploads,
      stats
    });

  } catch (error) {
    console.error('Erro ao buscar uploads:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar upload
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');

    if (!uploadId) {
      return NextResponse.json(
        { error: 'ID do upload é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o upload existe
    const { prisma } = await import('@/lib/prisma');
    const upload = await prisma.teleconsultaUpload.findUnique({
      where: { id: uploadId },
      include: {
        teleconsulta: {
          select: {
            doctorId: true,
            patientId: true
          }
        }
      }
    });

    if (!upload) {
      return NextResponse.json(
        { error: 'Upload não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissão (só o uploader pode deletar)
    if (upload.uploaderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para deletar este arquivo' },
        { status: 403 }
      );
    }

    // Deletar arquivo físico
    const filePath = join(UPLOAD_DIR, upload.fileName);
    try {
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
    } catch (error) {
      console.warn('Arquivo físico não encontrado:', filePath);
    }

    // Deletar registro do banco
    await prisma.teleconsultaUpload.delete({
      where: { id: uploadId }
    });

    return NextResponse.json({
      message: 'Arquivo deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar upload:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}