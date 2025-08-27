// src/app/api/pacientes/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term');

  if (!term || term.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const patients = await prisma.client.patient.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { cpf: { contains: term } },
        ],
      },
      select: {
        id: true,
        name: true,
        cpf: true,
        phone: true,
        email: true,
        status: true,
      },
      take: 10,
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('[API_PACIENTES_SEARCH_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
