import React from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Activity, CheckCircle } from 'lucide-react';

const StatCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
            </div>
            <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full">
                {icon}
            </div>
        </div>
    </div>
);

const EducatorDashboardPage: React.FC = () => {
    const { user } = useAuth();

    return (
        <>
            <PageHeader
                title={`Boas-vindas, ${user?.name.split(' ')[0]}!`}
                subtitle="Acompanhe os pacientes encaminhados e seus progressos."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Pacientes Ativos" value="5" icon={<Users />} />
                <StatCard title="Planos de Treino Criados" value="12" icon={<Activity />} />
                <StatCard title="Treinos Concluídos (Mês)" value="38" icon={<CheckCircle />} />
            </div>

            <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Pacientes Recentes</h3>
                <p className="text-slate-500">A funcionalidade para visualizar e gerenciar os pacientes encaminhados estará disponível em breve.</p>
            </div>
        </>
    );
};

export default EducatorDashboardPage;
