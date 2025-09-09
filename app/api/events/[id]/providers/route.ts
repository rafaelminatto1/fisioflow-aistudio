import { NextResponse } from 'next/server';
import { eventService } from '@/services/eventService';
import { z } from 'zod';

const providerApplicationSchema = z.object({
  name: z.string().min(3, 'O nome é obrigatório'),
  phone: z.string().min(9, 'O telefone é obrigatório'),
  professionalId: z.string().optional(),
  pixKey: z.string().optional(),
  hourlyRate: z.number().optional(),
  availability: z.any().optional(),
});

interface RouteParams {
  params: {
    id: string; // This is the eventId
  };
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const eventId = params.id;
    const body = await req.json();

    const parsedData = providerApplicationSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { message: 'Dados de candidatura inválidos', errors: parsedData.error.errors },
        { status: 400 }
      );
    }

    const providerPayload = {
      ...parsedData.data,
      eventId,
    };

    const newProvider = await eventService.applyAsProvider(providerPayload);
    return NextResponse.json(newProvider, { status: 201 });

  } catch (error) {
    console.error(`Error creating provider application for event ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Erro ao criar candidatura de prestador', error: (error as Error).message },
      { status: 500 }
    );
  }
}
