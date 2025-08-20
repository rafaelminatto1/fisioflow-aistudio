// src/app/dashboard/page.tsx
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { subDays, startOfDay, isToday } from 'date-fns';

import PageHeader from '@/components/PageHeader';
import KPICards from '@/components/dashboard/KPICards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import PatientFlowChart from '@/components/dashboard/PatientFlowChart';
import TeamProductivityChart from '@/components/dashboard/TeamProductivityChart';
import AppointmentHeatmap from '@/components/dashboard/AppointmentHeatmap';
import TodaysAppointments from '@/components/dashboard/glance/TodaysAppointments';
import PendingTasks from '@/components/dashboard/glance/PendingTasks';
import RecentActivity from '@/components/dashboard/glance/RecentActivity';
import { Activity, Users } from 'lucide-react';
import { AppointmentTypeColors, Patient, Therapist, Appointment } from '@/types';

// Helper function to calculate stats. In a real app, this might be more complex.
const calculateDashboardStats = (patients: Patient[], appointments: Appointment[]) => {
    const activePatients = patients.filter(p => p.status === 'Active').length;
    const monthlyRevenue = appointments
        .filter(a => a.paymentStatus === 'paid' && new Date(a.startTime) > subDays(new Date(), 30))
        .reduce((sum, a) => sum + a.value, 0);
    const appointmentsToday = appointments.filter(a => isToday(new Date(a.startTime))).length;
    const newPatientsThisMonth = patients.filter(p => new Date(p.registrationDate) > subDays(new Date(), 30)).length;

    return {
        totalPatients: patients.length,
        activePatients,
        monthlyRevenue,
        appointmentsToday,
        newPatientsThisMonth,
        avgAppointmentsPerDay: Math.round(appointments.length / 30),
    };
};

export default async function DashboardPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }
    
    if ((user as any).role === 'PACIENTE') redirect('/portal/dashboard');
    if ((user as any).role === 'PARCEIRO') redirect('/partner/dashboard');

    // --- Server-Side Data Fetching ---
    const thirtyDaysAgo = subDays(new Date(), 30);
    const today = startOfDay(new Date());

    const [patients, appointments, therapists] = await Promise.all([
        prisma.patient.findMany({
            select: { id: true, name: true, cpf: true, status: true, registrationDate: true, lastVisit: true, medicalAlerts: true, phone: true }
        }),
        prisma.appointment.findMany({
            where: { startTime: { gte: thirtyDaysAgo } },
            select: { id: true, patientId: true, therapistId: true, startTime: true, endTime: true, type: true, status: true, value: true, paymentStatus: true, patientName: true, patientAvatarUrl: true }
        }),
        prisma.therapist.findMany({
            select: { id: true, name: true, color: true, avatarUrl: true }
        })
    ]);

    // --- Server-Side Data Processing ---
    const stats = calculateDashboardStats(patients as any, appointments as any);

    const therapistMap = new Map(therapists.map(t => [t.id, t]));
    const patientMap = new Map(patients.map(p => [p.id, p]));

    const enrichedTodaysAppointments = appointments
        .filter(app => isToday(new Date(app.startTime)))
        .map(app => ({
            ...app,
            therapistColor: therapistMap.get(app.therapistId)?.color || 'slate',
            typeColor: AppointmentTypeColors[app.type] || 'slate',
            patientPhone: patientMap.get(app.patientId)?.phone || '',
            patientMedicalAlerts: patientMap.get(app.patientId)?.medicalAlerts,
        }));

    return (
        <>
            <PageHeader
                title="Dashboard Administrativo"
                subtitle="Visão 360° do negócio com métricas financeiras, operacionais e clínicas."
            />

            <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Resumo do Dia</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <TodaysAppointments appointments={enrichedTodaysAppointments} />
                    <PendingTasks />
                    <RecentActivity />
                </div>
            </div>

            <KPICards stats={stats} isLoading={false} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <RevenueChart appointments={appointments as any} />
                <PatientFlowChart patients={patients as any} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-teal-500" /> Mapa de Calor de Agendamentos
                    </h3>
                    <AppointmentHeatmap appointments={appointments as any} />
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-teal-500" /> Produtividade da Equipe
                    </h3>
                    <TeamProductivityChart appointments={appointments as any} therapists={therapists} />
                </div>
            </div>
        </>
    );
}
