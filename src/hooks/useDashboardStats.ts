// hooks/useDashboardStats.ts
import { useMemo } from 'react';
import { Patient, Appointment, AppointmentStatus } from '../../../types';

export interface DashboardStats {
    monthlyRevenue: { value: string; change?: string; changeType?: 'increase' | 'decrease' };
    activePatients: { value: string; subtitle: string; };
    newPatientsThisMonth: { value: string; change?: string; changeType?: 'increase' | 'decrease' };
    avgSatisfaction: { value: string; subtitle: string; };
}

// Helper to calculate percentage change
const calculateChange = (current: number, previous: number): { change?: string; changeType?: 'increase' | 'decrease' } => {
    if (previous === 0) {
        return current > 0 ? { change: '+∞%', changeType: 'increase' } : {};
    }
    const percentageChange = ((current - previous) / previous) * 100;
    if (Math.abs(percentageChange) < 0.1) return {};
    
    return {
        change: `${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(1)}%`,
        changeType: percentageChange >= 0 ? 'increase' : 'decrease',
    };
};

interface UseDashboardStatsProps {
    patients: Patient[];
    appointments: Appointment[];
}

export default function useDashboardStats({ patients, appointments }: UseDashboardStatsProps) {
    const stats: DashboardStats = useMemo(() => {
        // --- Date setup ---
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // --- Calculations for THIS month ---
        const revenueThisMonth = appointments
            .filter(app => app.status === AppointmentStatus.Completed && new Date(app.startTime) >= startOfThisMonth)
            .reduce((sum, app) => sum + app.value, 0);

        // --- Calculations for LAST month (from the provided 60-day appointment data) ---
        const revenueLastMonth = appointments
            .filter(app => {
                const appDate = new Date(app.startTime);
                return app.status === AppointmentStatus.Completed && appDate >= startOfLastMonth && appDate < startOfThisMonth;
            })
            .reduce((sum, app) => sum + app.value, 0);

        const newPatientsThisMonthCount = patients.filter(p => new Date(p.registrationDate) >= startOfThisMonth).length;
        const newPatientsLastMonthCount = patients.filter(p => {
            const regDate = new Date(p.registrationDate);
            return regDate >= startOfLastMonth && regDate < startOfThisMonth;
        }).length;
        
        const activePatientsCount = patients.filter(p => p.status === 'Active').length;
        const revenueChange = calculateChange(revenueThisMonth, revenueLastMonth);
        const newPatientsChange = calculateChange(newPatientsThisMonthCount, newPatientsLastMonthCount);

        return {
            monthlyRevenue: {
                value: `R$ ${revenueThisMonth.toLocaleString('pt-BR')}`,
                ...revenueChange
            },
            activePatients: {
                value: activePatientsCount.toString(),
                subtitle: 'Total em tratamento'
            },
            newPatientsThisMonth: {
                value: newPatientsThisMonthCount.toString(),
                ...newPatientsChange
            },
            avgSatisfaction: { // Still mocked
                value: '9.2/10',
                subtitle: 'Baseado em 48 avaliações'
            }
        };
    }, [patients, appointments]);

    return { stats };
}