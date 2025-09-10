import { NextResponse } from 'next/server';
import { eventService } from '@/services/eventService';
import { z } from 'zod';

const registrationSchema = z.object({
  fullName: z.string().min(3, 'O nome completo é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  address: z.string().optional(),
  instagram: z.string().optional(),
});

interface RouteParams {
  params: {
    id: string; // This is the eventId
  };
}

export async function GET(req: Request, { params }: RouteParams) {
    try {
        const eventId = params.id;
        const registrations = await eventService.getRegistrationsByEventId(eventId);
        return NextResponse.json(registrations);
    } catch (error) {
        console.error(`Error fetching registrations for event ${params.id}:`, error);
        return NextResponse.json(
            { message: 'Erro ao buscar inscrições', error: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const eventId = params.id;
    const body = await req.json();

    const parsedData = registrationSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { message: 'Dados de inscrição inválidos', errors: parsedData.error.errors },
        { status: 400 }
      );
    }

    const { birthDate, ...restData } = parsedData.data;
    
    const registrationPayload = {
      ...restData,
      eventId,
      birthDate: birthDate ? new Date(birthDate) : undefined,
    };

    const newRegistration = await eventService.registerParticipant(registrationPayload);
    return NextResponse.json(newRegistration, { status: 201 });

  } catch (error) {
    console.error(`Error creating registration for event ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Erro ao criar inscrição', error: (error as Error).message },
      { status: 500 }
    );
  }
}
