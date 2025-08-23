
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import KPICards from '../components/dashboard/KPICards';
import RevenueChart from '../components/dashboard/RevenueChart';
import PatientFlowChart from '../components/dashboard/PatientFlowChart';
import TeamProductivityChart from '../components/dashboard/TeamProductivityChart';
import AppointmentHeatmap from '../components/dashboard/AppointmentHeatmap';
import { Activity, Users } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import TodaysAppointments from '../components/dashboard/glance/TodaysAppointments';
import PendingTasks from '../components/dashboard/glance/PendingTasks';
import RecentActivity from '../components/dashboard/glance/RecentActivity';
import useDashboardStats from '../hooks/useDashboardStats';
import { Patient, AppointmentTypeColors } from '../types';
import * as patientService from '../services/patientService';
import { eventService } from '../services/eventService';

const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear();
};

const DashboardPage: React.FC = () => {
    const { therapists, appointments, isLoading: isContextLoading } = useData();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoadingPatients, setIsLoadingPatients] = useState(true);

    const fetchPatients = useCallback(async () => {
        setIsLoadingPatients(true);
        try {
            // This page needs all patients for its stats, so it fetches them directly.
            const data = await patientService.getAllPatients();
            setPatients(data);
        } catch (error) {
            console.error("Failed to fetch patients for dashboard", error);
        } finally {
            setIsLoadingPatients(false);
        }
    }, []);

    useEffect(() => {
        fetchPatients();
        
        eventService.on('patients:changed', fetchPatients);
        
        return () => {
            eventService.off('patients:changed', fetchPatients);
        };
    }, [fetchPatients]);

    const isLoading = isContextLoading || isLoadingPatients;
    
    // Filter appointments for charts (last 30 days)
    const recentAppointments = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return appointments.filter(app => new Date(app.startTime) >= thirtyDaysAgo);
    }, [appointments]);

    const enrichedTodaysAppointments = useMemo(() => {
        const todays = appointments.filter(app => isToday(new Date(app.startTime)));

        const therapistMap = new Map(therapists.map(t => [t.id, t]));
        const patientMap = new Map(patients.map(p => [p.id, p]));

        return todays.map(app => {
            const patient = patientMap.get(app.patientId);
            return {
                ...app,
                therapistColor: therapistMap.get(app.therapistId)?.color || 'slate',
                typeColor: AppointmentTypeColors[app.type] || 'slate',
                patientPhone: patient?.phone || '',
                patientMedicalAlerts: patient?.medicalAlerts,
            };
        });
    }, [appointments, patients, therapists]);

    const { stats } = useDashboardStats({ patients, appointments });

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

            <KPICards stats={stats} isLoading={isLoading} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <RevenueChart appointments={recentAppointments} />
                <PatientFlowChart patients={patients} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-teal-500" /> Mapa de Calor de Agendamentos
                    </h3>
                    <AppointmentHeatmap appointments={recentAppointments} />
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-teal-500" /> Produtividade da Equipe
                    </h3>
                    <TeamProductivityChart appointments={recentAppointments} therapists={therapists} />
                </div>
            </div>
        </>
    );
};

export default DashboardPage;