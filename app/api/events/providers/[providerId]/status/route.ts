import { NextResponse } from 'next/server';
import { eventService } from '@/services/eventService';
import { z } from 'zod';
import { EventProviderStatus } from '@/types';

const updateStatusSchema = z.object({
  status: z.nativeEnum(EventProviderStatus),
  paymentDetails: z.object({
    paymentAmount: z.number(),
    paymentReceipt: z.string().url(),
  }).optional(),
});

interface RouteParams {
  params: {
    providerId: string;
  };
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { providerId } = params;
    const body = await req.json();

    const parsedData = updateStatusSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { message: 'Dados de atualização inválidos', errors: parsedData.error.errors },
        { status: 400 }
      );
    }

    const { status, paymentDetails } = parsedData.data;

    if (status === 'paid' && !paymentDetails) {
        return NextResponse.json(
            { message: 'Detalhes de pagamento são obrigatórios para o status "pago"' },
            { status: 400 }
        );
    }

    const updatedProvider = await eventService.updateProviderStatus(
      providerId,
      status,
      paymentDetails
    );

    return NextResponse.json(updatedProvider);

  } catch (error) {
    console.error(`Error updating provider status ${params.providerId}:`, error);
    return NextResponse.json(
      { message: 'Erro ao atualizar status do prestador', error: (error as Error).message },
      { status: 500 }
    );
  }
}
