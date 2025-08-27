// src/app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AppointmentTypeColors } from '@/types';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!startDate || !endDate) {
        return new NextResponse('Missing startDate or endDate', { status: 400 });
    }

    try {
        const appointments = await prisma.client.appointment.findMany({
            where: {
                startTime: { gte: new Date(startDate) },
                endTime: { lte: new Date(endDate) },
            },
            include: {
                patient: {
                    select: { name: true, phone: true, medicalAlerts: true }
                },
                therapist: {
                    select: { name: true }
                }
            }
        });

        // The data needs to be massaged to match the EnrichedAppointment type on the client
        const enrichedAppointments = appointments.map((app: any) => ({
            ...app,
            // Prisma returns Date objects, no need to parse on server
            patientName: app.patient.name,
            patientAvatarUrl: null, // Field doesn't exist in Patient model
            patientPhone: app.patient.phone,
            patientMedicalAlerts: app.patient.medicalAlerts,
            therapistColor: 'teal', // Default color since field doesn't exist in User model
            therapistName: app.therapist.name,
            typeColor: AppointmentTypeColors[app.type as keyof typeof AppointmentTypeColors] || 'slate',
        }));

        return NextResponse.json(enrichedAppointments);
    } catch (error) {
        console.error('[API_APPOINTMENTS_GET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
