import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createPatientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional().nullable(),
  emergency_contact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional().nullable(),
  allergies: z.string().optional().nullable(),
  medical_alerts: z.string().optional().nullable(),
  consent_given: z.boolean().default(false),
  whatsapp_consent: z.enum(['opt_in', 'opt_out']).default('opt_out'),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Discharged']).optional(),
  sortBy: z.enum(['name', 'created_at', 'last_visit']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// GET /api/patients - List patients with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    const { page, limit, search, status, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.patients.count({ where });

    // Get patients
    const patients = await prisma.patients.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: limit,
      include: {
        appointments: {
          select: {
            id: true,
            start_time: true,
            status: true,
          },
          orderBy: { start_time: 'desc' },
          take: 1, // Only latest appointment
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    // Transform data for response
    const transformedPatients = patients.map(patient => ({
      id: patient.id,
      name: patient.name,
      cpf: patient.cpf,
      email: patient.email,
      phone: patient.phone,
      birth_date: patient.birth_date,
      address: patient.address,
      emergency_contact: patient.emergency_contact,
      status: patient.status,
      last_visit: patient.last_visit,
      allergies: patient.allergies,
      medical_alerts: patient.medical_alerts,
      consent_given: patient.consent_given,
      whatsapp_consent: patient.whatsapp_consent,
      created_at: patient.created_at,
      updated_at: patient.updated_at,
      totalAppointments: patient._count.appointments,
      lastAppointment: patient.appointments[0] || null,
      // Calculate age
      age: patient.birth_date ? 
        new Date().getFullYear() - patient.birth_date.getFullYear() : null,
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      data: transformedPatients,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// POST /api/patients - Create new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPatientSchema.parse(body);

    // Check if CPF already exists
    const existingPatient = await prisma.patients.findUnique({
      where: { cpf: validatedData.cpf },
    });

    if (existingPatient) {
      return NextResponse.json(
        { success: false, error: 'CPF já cadastrado' },
        { status: 409 }
      );
    }

    // Generate unique ID
    const patientId = `patient_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const patient = await prisma.patients.create({
      data: {
        id: patientId,
        name: validatedData.name,
        cpf: validatedData.cpf,
        email: validatedData.email,
        phone: validatedData.phone,
        birth_date: validatedData.birth_date,
        address: validatedData.address,
        emergency_contact: validatedData.emergency_contact,
        allergies: validatedData.allergies,
        medical_alerts: validatedData.medical_alerts,
        consent_given: validatedData.consent_given,
        whatsapp_consent: validatedData.whatsapp_consent,
        updated_at: new Date(),
      },
      include: {
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...patient,
        totalAppointments: patient._count.appointments,
        age: patient.birth_date ? 
          new Date().getFullYear() - patient.birth_date.getFullYear() : null,
      },
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Erro ao criar paciente' },
      { status: 500 }
    );
  }
}