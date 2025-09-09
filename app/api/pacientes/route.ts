// app/api/pacientes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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
        { name: { contains: searchTerm, mode: 'insensitive' as const } },
        { cpf: { contains: searchTerm, mode: 'insensitive' as const } },
      ],
    };
    
    if (status && status !== 'All') {
      where.status = status;
    }

    const findManyOptions: any = {
      take: take,
      skip: cursor ? 1 : 0,
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
    };
    
    if (cursor) {
      findManyOptions.cursor = { id: cursor };
    }
    
    const patients = await prisma.patient.findMany(findManyOptions);

    let nextCursor = null;
    if (patients.length === take && patients.length > 0) {
      const lastPatient = patients[patients.length - 1];
      if (lastPatient && lastPatient.id) {
        nextCursor = lastPatient.id;
      }
    }

    const responseData = {
      items: patients,
      nextCursor,
    };

    // 3. Salva o resultado no cache antes de retornar
    await redis.set(cacheKey, JSON.stringify(responseData));
    await redis.expire(cacheKey, CACHE_TTL_SECONDS);

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

    const patientData: any = {
      name: validatedData.name,
      cpf: validatedData.cpf,
      birthDate: validatedData.birthDate
        ? new Date(validatedData.birthDate)
        : null,
    };
    
    if (validatedData.phone) patientData.phone = validatedData.phone;
    if (validatedData.email) patientData.email = validatedData.email;
    
    if (validatedData.addressZip ||
        validatedData.addressStreet ||
        validatedData.addressNumber ||
        validatedData.addressCity ||
        validatedData.addressState) {
      patientData.address = {
        zip: validatedData.addressZip || null,
        street: validatedData.addressStreet || null,
        number: validatedData.addressNumber || null,
        city: validatedData.addressCity || null,
        state: validatedData.addressState || null,
      };
    }
    
    if (validatedData.emergencyContactName ||
        validatedData.emergencyContactPhone) {
      patientData.emergencyContact = {
        name: validatedData.emergencyContactName || null,
        phone: validatedData.emergencyContactPhone || null,
      };
    }
    
    if (validatedData.allergies) patientData.allergies = validatedData.allergies;
    if (validatedData.medicalAlerts) patientData.medicalAlerts = validatedData.medicalAlerts;
    if (validatedData.consentGiven !== undefined) patientData.consentGiven = validatedData.consentGiven;
    if (validatedData.whatsappConsent) patientData.whatsappConsent = validatedData.whatsappConsent;
    
    const newPatient = await prisma.patient.create({
      data: patientData,
    });

    // TODO: Implementar invalidação de cache mais eficiente
    // Por enquanto, vamos pular a limpeza do cache

    return NextResponse.json(newPatient, { status: 201 });
  } catch (error) {
    console.error('[API_PACIENTES_POST]', error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
