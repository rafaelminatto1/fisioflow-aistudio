
// pages/patient-portal/MyAppointmentsPage.tsx
import React, { useMemo } from 'react';
import PageHeader from '../../components/PageHeader';
import { Appointment, Therapist } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import Skeleton from '../../components/ui/Skeleton';
import { Calendar } from 'lucide-react';
import AppointmentCard from '../../components/patient-portal/AppointmentCard';
import { useData } from '../../contexts/DataContext';

const MyAppointmentsPage: React.FC = () => {
    const { user } = useAuth();
    const { appointments: allAppointments, therapists, isLoading } = useData();

    const appointments = useMemo(() => {
        if (!user?.patientId) return [];
        return allAppointments.filter(app => app.patientId === user.patientId);
    }, [allAppointments, user?.patientId]);

    const { upcoming, past } = useMemo(() => {
        const now = new Date();
        const upcoming = appointments
            .filter(a => a.startTime >= now)
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        const past = appointments
            .filter(a => a.startTime < now)
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
        return { upcoming, past };
    }, [appointments]);

    const renderList = (apps: Appointment[]) => (
        <div className="space-y-4">
            {apps.map(app => (
                <AppointmentCard 
                    key={app.id} 
                    appointment={app} 
                    therapistName={therapists.find(t => t.id === app.therapistId)?.name || 'N/A'} 
                />
            ))}
        </div>
    );

    return (
        <>
            <PageHeader
                title="Meus Agendamentos"
                subtitle="Acompanhe suas próximas consultas e seu histórico de atendimentos."
            />
            {isLoading ? (
                <Skeleton className="h-96 w-full rounded-2xl" />
            ) : appointments.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-2xl shadow-sm">
                    <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">Nenhum agendamento encontrado</h3>
                    <p className="text-slate-500 mt-1">Você ainda não possui consultas agendadas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Próximas Consultas</h2>
                        {upcoming.length > 0 ? renderList(upcoming) : <p className="text-slate-500">Nenhuma consulta futura.</p>}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Histórico de Consultas</h2>
                        {past.length > 0 ? renderList(past) : <p className="text-slate-500">Nenhum histórico ainda.</p>}
                    </div>
                </div>
            )}
        </>
    );
};

export default MyAppointmentsPage;