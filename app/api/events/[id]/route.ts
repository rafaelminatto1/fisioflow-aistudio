import { NextResponse } from 'next/server';
import { eventService } from '@/services/eventService';
import { z } from 'zod';

const eventUpdateSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres').optional(),
  description: z.string().optional().nullable(),
  eventType: z.enum(['corrida', 'workshop', 'palestra', 'campanha', 'atendimento']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  location: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
  isFree: z.boolean().optional(),
  price: z.number().optional().nullable(),
  status: z.enum(['draft', 'published', 'active', 'completed', 'cancelled']).optional(),
  requiresRegistration: z.boolean().optional(),
  allowsProviders: z.boolean().optional(),
  whatsappGroup: z.string().url().optional().nullable(),
  defaultMessage: z.string().optional().nullable(),
  providerRate: z.number().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  images: z.any().optional().nullable(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const event = await eventService.getEventById(id);

    if (!event) {
      return NextResponse.json({ message: 'Evento não encontrado' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error(`Error fetching event ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Erro ao buscar evento', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await req.json();

    const parsedData = eventUpdateSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: parsedData.error.errors },
        { status: 400 }
      );
    }

    const eventToUpdate = {
        ...parsedData.data,
        id,
        // Ensure dates are converted if they exist
        ...(parsedData.data.startDate && { startDate: new Date(parsedData.data.startDate) }),
        ...(parsedData.data.endDate && { endDate: new Date(parsedData.data.endDate) }),
    };

    // The saveEvent method in our service handles both create and update.
    const updatedEvent = await eventService.saveEvent(eventToUpdate as any);

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error(`Error updating event ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Erro ao atualizar evento', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const { id } = params;

        // Soft delete: instead of deleting, we change the status to 'cancelled'.
        const event = await eventService.getEventById(id);
        if (!event) {
            return NextResponse.json({ message: 'Evento não encontrado' }, { status: 404 });
        }

        const cancelledEvent = await eventService.saveEvent({
            ...event,
            id,
            status: 'cancelled' as any,
        });

        return NextResponse.json({ message: 'Evento cancelado com sucesso', event: cancelledEvent });

    } catch (error) {
        console.error(`Error cancelling event ${params.id}:`, error);
        return NextResponse.json(
            { message: 'Erro ao cancelar evento', error: (error as Error).message },
            { status: 500 }
        );
    }
}
