// src/app/dashboard/agenda/page.tsx
import React from 'react';
import prisma from '@/lib/prisma';
import AgendaClient from '@/components/agenda/AgendaClient';
import { startOfWeek } from 'date-fns/startOfWeek';
import { endOfWeek } from 'date-fns/endOfWeek';
import PageHeader from '@/components/ui/PageHeader';

export default async function AgendaPage() {
    
    // Fetch initial data on the server
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const [therapists, initialAppointments, patients] = await Promise.all([
        prisma.therapist.findMany(),
        prisma.appointment.findMany({
            where: {
                startTime: { gte: weekStart },
                endTime: { lte: weekEnd },
                deletedAt: null,
            },
            include: {
                patient: { select: { name: true, avatarUrl: true, phone: true, medicalAlerts: true } }
            }
        }),
        prisma.patient.findMany({ 
            where: { status: 'Active' },
            select: { id: true, name: true, cpf: true, avatarUrl: true }
        })
    ]);

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                title="Agenda da Clínica"
                subtitle="Visualize e gerencie todos os agendamentos da equipe."
            />
            <AgendaClient 
                initialAppointments={JSON.parse(JSON.stringify(initialAppointments))}
                therapists={therapists}
                patients={patients}
            />
        </div>
    );
}