import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/financial/receipts/[id] - Buscar recibo específico
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id: params.id },
      include: {
        patient: {
          select: { 
            id: true, 
            name: true, 
            cpf: true, 
            email: true,
            phone: true,
            address: true
          }
        },
        transaction: {
          select: { 
            id: true, 
            type: true, 
            category: true,
            date: true
          }
        },
        issuer: {
          select: { 
            id: true, 
            name: true, 
            email: true 
          }
        }
      }
    });

    if (!receipt) {
      return NextResponse.json(
        { error: 'Recibo não encontrado' },
        { status: 404 }
      );
    }

    // Parse items if exists
    let items = null;
    if (receipt.items) {
      try {
        items = JSON.parse(receipt.items as string);
      } catch (error) {
        console.error('Erro ao fazer parse dos items:', error);
      }
    }

    return NextResponse.json({
      ...receipt,
      items
    });

  } catch (error) {
    console.error('Erro ao buscar recibo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/financial/receipts/[id] - Atualizar recibo
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Apenas admin e fisioterapeutas podem atualizar recibos
    if (session.user.role !== 'Admin' && session.user.role !== 'Fisioterapeuta') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id: params.id }
    });

    if (!receipt) {
      return NextResponse.json(
        { error: 'Recibo não encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { notes, items } = body;

    const updatedReceipt = await prisma.receipt.update({
      where: { id: params.id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(items !== undefined && { items: JSON.stringify(items) }),
        updatedAt: new Date(),
      },
      include: {
        patient: {
          select: { 
            id: true, 
            name: true, 
            cpf: true, 
            email: true,
            phone: true,
            address: true
          }
        },
        transaction: {
          select: { 
            id: true, 
            type: true, 
            category: true,
            date: true
          }
        },
        issuer: {
          select: { 
            id: true, 
            name: true, 
            email: true 
          }
        }
      }
    });

    return NextResponse.json(updatedReceipt);

  } catch (error) {
    console.error('Erro ao atualizar recibo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/financial/receipts/[id] - Deletar recibo
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Apenas admin pode deletar recibos
    if (session.user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem deletar recibos' },
        { status: 403 }
      );
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id: params.id }
    });

    if (!receipt) {
      return NextResponse.json(
        { error: 'Recibo não encontrado' },
        { status: 404 }
      );
    }

    await prisma.receipt.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      message: 'Recibo deletado com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao deletar recibo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}