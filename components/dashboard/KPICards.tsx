// components/dashboard/KPICards.tsx
import React from 'react';
import { DollarSign, Users, BarChart3, Star } from 'lucide-react';
import StatCard from './StatCard';
import Skeleton from '../ui/Skeleton';
import { DashboardStats } from '../../hooks/useDashboardStats';

interface KPICardsProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

const KPICards: React.FC<KPICardsProps> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-32 rounded-2xl' />
        ))}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
      <StatCard
        title='Faturamento do Mês'
        value={stats.monthlyRevenue.value}
        icon={<DollarSign />}
        {...(stats.monthlyRevenue.change && { change: stats.monthlyRevenue.change })}
        {...(stats.monthlyRevenue.changeType && { changeType: stats.monthlyRevenue.changeType })}
      />
      <StatCard
        title='Pacientes Ativos'
        value={stats.activePatients.value}
        icon={<Users />}
        subtitle={stats.activePatients.subtitle}
      />
      <StatCard
        title='Novos Pacientes (Mês)'
        value={stats.newPatientsThisMonth.value}
        icon={<BarChart3 />}
        {...(stats.newPatientsThisMonth.change && { change: stats.newPatientsThisMonth.change })}
        {...(stats.newPatientsThisMonth.changeType && { changeType: stats.newPatientsThisMonth.changeType })}
      />
      <StatCard
        title='Satisfação (NPS)'
        value={stats.avgSatisfaction.value}
        icon={<Star />}
        subtitle={stats.avgSatisfaction.subtitle}
      />
    </div>
  );
};

export default KPICards;
