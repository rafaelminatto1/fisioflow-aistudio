import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Schema para atualização de pagamento
const UpdatePaymentSchema = z.object({
  status: z.enum(['pending', 'paid']).optional()
});

/**
 * GET /api/payments/[id] - Obter detalhes de pagamento específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        patient: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões
    if (session.user.role !== 'Admin' && session.user.role !== 'Fisioterapeuta') {
      // Paciente só pode ver seus próprios pagamentos
      if (session.user.id !== payment.patientId) {
        return NextResponse.json(
          { error: 'Permissão negada' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/payments/[id] - Atualizar pagamento
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Apenas admin e médicos podem atualizar pagamentos
    if (session.user.role !== 'Admin' && session.user.role !== 'Fisioterapeuta') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = UpdatePaymentSchema.parse(body);

    // Verificar se pagamento existe
    const existingPayment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar pagamento
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: validatedData.status || existingPayment.status,
        paidAt: validatedData.status === 'paid' ? new Date() : null,
        updatedAt: new Date()
      },
      include: {
        patient: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(updatedPayment);

  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    
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

/**
 * DELETE /api/payments/[id] - Deletar pagamento
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Apenas admin pode deletar
    if (session.user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Verificar se pagamento existe
    const payment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Deletar pagamento
    await prisma.payment.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Pagamento deletado com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}