// src/app/dashboard/agenda/page.tsx
import React from 'react';
import prisma from '../../../../lib/prisma';
import AgendaClient from '../../../components/agenda/AgendaClient';
import startOfWeek from 'date-fns/startOfWeek';
import endOfWeek from 'date-fns/endOfWeek';
import PageHeader from '@/components/ui/PageHeader';

export default async function AgendaPage() {
    
    // Fetch initial data on the server
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const [therapists, initialAppointments, patients] = await Promise.all([
        prisma.client.user.findMany({ where: { role: 'Fisioterapeuta' } }),
        prisma.client.appointment.findMany({
            where: {
                startTime: { gte: weekStart },
                endTime: { lte: weekEnd },
            },
            include: {
                patient: { select: { name: true, phone: true, medicalAlerts: true } }
            }
        }),
        prisma.client.patient.findMany({ 
            where: { status: 'Active' },
            select: { id: true, name: true, cpf: true }
        })
    ]);

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                title="Agenda da Clínica"
                description="Visualize e gerencie todos os agendamentos da equipe."
            />
            <AgendaClient 
                initialAppointments={JSON.parse(JSON.stringify(initialAppointments))}
                therapists={therapists}
                patients={patients}
            />
        </div>
    );
}