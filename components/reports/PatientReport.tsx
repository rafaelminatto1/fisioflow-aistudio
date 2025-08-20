
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Patient } from '../../types';
import StatCard from '../dashboard/StatCard';
import { Users, UserPlus, UserCheck, UserX } from 'lucide-react';

interface PatientReportProps {
    patients: Patient[];
}

const COLORS = {
    Active: '#10b981', // green-500
    Inactive: '#f59e0b', // amber-500
    Discharged: '#64748b', // slate-500
};

const PatientReport: React.FC<PatientReportProps> = ({ patients }) => {
    
    const patientStats = useMemo(() => {
        const statusCounts = { Active: 0, Inactive: 0, Discharged: 0 };
        const newThisMonth = patients.filter(p => new Date(p.registrationDate) >= new Date(new Date().setDate(1))).length;
        
        patients.forEach(p => {
            if (Object.prototype.hasOwnProperty.call(statusCounts, p.status)) {
                statusCounts[p.status as keyof typeof statusCounts]++;
            }
        });
        
        return {
            total: patients.length,
            newThisMonth,
            ...statusCounts,
        };
    }, [patients]);
    
    const newPatientsByMonth = useMemo(() => {
        const monthMap = new Map<string, number>();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        for (let i = 0; i < 6; i++) {
            const date = new Date(sixMonthsAgo);
            date.setMonth(date.getMonth() + i);
            const monthString = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            monthMap.set(monthString, 0);
        }

        patients.forEach(p => {
            const regDate = new Date(p.registrationDate);
            if (regDate >= sixMonthsAgo) {
                const monthString = regDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                if (monthMap.has(monthString)) {
                    monthMap.set(monthString, monthMap.get(monthString)! + 1);
                }
            }
        });

        return Array.from(monthMap.entries()).map(([name, value]) => ({ name, 'Novos Pacientes': value }));

    }, [patients]);
    
    const statusDistributionData = Object.entries(patientStats)
        .filter(([key]) => ['Active', 'Inactive', 'Discharged'].includes(key))
        .map(([name, value]) => ({ name, value }));

    const statCards = [
        { title: 'Total de Pacientes', value: patientStats.total.toString(), icon: <Users /> },
        { title: 'Pacientes Ativos', value: patientStats.Active.toString(), icon: <UserCheck /> },
        { title: 'Novos no Mês', value: patientStats.newThisMonth.toString(), icon: <UserPlus /> },
        { title: 'Inativos/Alta', value: (patientStats.Inactive + patientStats.Discharged).toString(), icon: <UserX /> },
    ];

    return (
        <div className="space-y-6 animate-fade-in-fast">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map(stat => <StatCard key={stat.title} {...stat} />)}
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Novos Pacientes (Últimos 6 meses)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={newPatientsByMonth} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="Novos Pacientes" fill="#14b8a6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Distribuição por Status</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {statusDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name]}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            <style>{`.animate-fade-in-fast { animation: fade-in-fast 0.5s ease-out forwards; } @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};

export default PatientReport;
