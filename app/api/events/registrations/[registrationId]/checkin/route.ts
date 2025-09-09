import { NextResponse } from 'next/server';
import { eventService } from '@/services/eventService';
import { z } from 'zod';

const checkInSchema = z.object({
  checkInMethod: z.enum(['qr', 'manual']),
  checkInLocation: z.string().min(1, "Localização do check-in é obrigatória"),
  checkedInById: z.string(), // TODO: Get this from authenticated session
});

interface RouteParams {
  params: {
    registrationId: string;
  };
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { registrationId } = params;
    const body = await req.json();

    const parsedData = checkInSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { message: 'Dados de check-in inválidos', errors: parsedData.error.errors },
        { status: 400 }
      );
    }

    const { checkInMethod, checkedInById, checkInLocation } = parsedData.data;

    const updatedRegistration = await eventService.checkInParticipant(
      registrationId,
      checkInMethod,
      checkedInById,
      checkInLocation
    );

    return NextResponse.json(updatedRegistration);

  } catch (error) {
    console.error(`Error checking in registration ${params.registrationId}:`, error);
    const errorMessage = (error as Error).message;
    const status = errorMessage.includes('já fez check-in') ? 409 : 500; // Conflict

    return NextResponse.json(
      { message: 'Erro ao fazer check-in', error: errorMessage },
      { status }
    );
  }
}
