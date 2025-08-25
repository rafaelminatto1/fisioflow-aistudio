// app/api/pacientes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cachedPrisma } from '@/lib/prisma';
import redisPromise from '@/lib/redis';
import { patientFormSchema } from '@/lib/validations/patient';
import { z } from 'zod';

const CACHE_KEY_PREFIX = 'patients_list:';
const CACHE_TTL_SECONDS = 5 * 60; // 5 minutos

/**
 * GET: Rota para buscar pacientes com paginação e filtros.
 * Utiliza cache com Redis para otimizar performance.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const take = 20;
  const cursor = searchParams.get('cursor') || undefined;
  const searchTerm = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';
  
  const cacheKey = `${CACHE_KEY_PREFIX}cursor=${cursor}&q=${searchTerm}&status=${status}`;

  try {
    // 1. Tenta buscar do cache
    const redis = await redisPromise;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }
    
    // 2. Se não houver cache, busca no banco
    const where: any = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { cpf: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    if (status && status !== 'All') {
      where.status = status;
    }

    const patients = await cachedPrisma.client.patient.findMany({
      take: take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: where,
      select: {
        id: true,
        name: true,
        cpf: true,
        phone: true,
        status: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    const nextCursor = patients.length === take ? patients[patients.length - 1].id : null;
    
    const responseData = {
      items: patients,
      nextCursor,
    };
    
    // 3. Salva o resultado no cache antes de retornar
    await redis.set(cacheKey, JSON.stringify(responseData), { EX: CACHE_TTL_SECONDS });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[API_PACIENTES_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * POST: Rota para criar um novo paciente.
 * Invalida o cache após a criação.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = patientFormSchema.parse(body);

    const newPatient = await cachedPrisma.client.patient.create({
      data: {
        name: validatedData.name,
        cpf: validatedData.cpf,
        birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
        phone: validatedData.phone,
        email: validatedData.email,
        address: validatedData.addressZip || validatedData.addressStreet || validatedData.addressNumber || validatedData.addressCity || validatedData.addressState ? {
          zip: validatedData.addressZip,
          street: validatedData.addressStreet,
          number: validatedData.addressNumber,
          city: validatedData.addressCity,
          state: validatedData.addressState,
        } : undefined,
        emergencyContact: validatedData.emergencyContactName || validatedData.emergencyContactPhone ? {
          name: validatedData.emergencyContactName,
          phone: validatedData.emergencyContactPhone,
        } : undefined,
        allergies: validatedData.allergies,
        medicalAlerts: validatedData.medicalAlerts,
        consentGiven: validatedData.consentGiven,
        whatsappConsent: validatedData.whatsappConsent,
      },
    });

    // Invalida todo o cache de lista de pacientes (abordagem simples)
    const redis = await redisPromise;
    // Como não temos keys() na interface, vamos usar flushAll() ou implementar uma estratégia diferente
    // Por enquanto, vamos limpar todo o cache para simplicidade
    await redis.flushAll();
    
    return NextResponse.json(newPatient, { status: 201 });
  } catch (error) {
    console.error('[API_PACIENTES_POST]', error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}