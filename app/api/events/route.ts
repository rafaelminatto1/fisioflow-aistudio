import { NextResponse } from 'next/server';
import { eventService } from '@/services/eventService';
import { z } from 'zod';

// Zod schema for event creation validation
const eventSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  eventType: z.enum(['corrida', 'workshop', 'palestra', 'campanha', 'atendimento']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  location: z.string().optional(),
  address: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  isFree: z.boolean().default(true),
  price: z.number().optional(),
  status: z.enum(['draft', 'published', 'active', 'completed', 'cancelled']).default('draft'),
  organizerId: z.string(), // TODO: Get this from authenticated session
  requiresRegistration: z.boolean().default(true),
  allowsProviders: z.boolean().default(false),
  whatsappGroup: z.string().url().optional(),
  defaultMessage: z.string().optional(),
  providerRate: z.number().optional(),
  bannerUrl: z.string().url().optional(),
  images: z.any().optional(),
});

export async function GET() {
  try {
    const events = await eventService.getEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar eventos', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsedData = eventSchema.safeParse({
        ...body,
        // Convert date strings to Date objects for the service if needed
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
    });

    if (!parsedData.success) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: parsedData.error.errors },
        { status: 400 }
      );
    }

    // In a real app, organizerId would come from the authenticated user's session
    // For now, it must be provided in the request body.
    const newEvent = await eventService.saveEvent(parsedData.data);
    return NextResponse.json(newEvent, { status: 201 });

  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { message: 'Erro ao criar evento', error: (error as Error).message },
      { status: 500 }
    );
  }
}
