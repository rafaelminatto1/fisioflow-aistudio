// components/analytics/ClinicalAnalyticsDashboard.tsx
import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import useClinicalAnalytics from '../../hooks/useClinicalAnalytics';
import MetricCard from './MetricCard';
import { HeartPulse, TrendingUp, Smile } from 'lucide-react';
import Skeleton from '../ui/Skeleton';

const ClinicalAnalyticsDashboard: React.FC = () => {
  const { kpis, painEvolution, successByPathology, isLoading } =
    useClinicalAnalytics();

  if (isLoading) {
    return (
      <div className='space-y-8'>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
          <Skeleton className='h-24 rounded-2xl' />
          <Skeleton className='h-24 rounded-2xl' />
          <Skeleton className='h-24 rounded-2xl' />
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-5 gap-8'>
          <Skeleton className='lg:col-span-3 h-96 rounded-2xl' />
          <Skeleton className='lg:col-span-2 h-96 rounded-2xl' />
        </div>
      </div>
    );
  }

  const COLORS = ['#14b8a6', '#38bdf8', '#fbbf24', '#f87171', '#8b5cf6'];

  return (
    <div className='space-y-8'>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
        <MetricCard
          title='Taxa de Alta (90d)'
          value={`${kpis?.dischargeRate}%`}
          icon={<TrendingUp />}
        />
        <MetricCard
          title='Média de Sessões / Tratamento'
          value={kpis?.avgSessions.toString() || 'N/A'}
          icon={<HeartPulse />}
        />
        <MetricCard
          title='NPS (Satisfação)'
          value={kpis?.npsScore.toString() || 'N/A'}
          icon={<Smile />}
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-5 gap-8'>
        <div className='lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm'>
          <h2 className='text-lg font-semibold mb-4 text-slate-800'>
            Evolução Média da Dor (EVA) por Sessão
          </h2>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart
                data={painEvolution}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
                <XAxis dataKey='session' stroke='#64748b' fontSize={12} />
                <YAxis
                  stroke='#64748b'
                  fontSize={12}
                  label={{
                    value: 'Nível de Dor',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748b',
                  }}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '14px' }} />
                <Line
                  type='monotone'
                  dataKey='avgPain'
                  name='Dor Média'
                  stroke='#ef4444'
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className='lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm'>
          <h2 className='text-lg font-semibold mb-4 text-slate-800'>
            Taxa de Sucesso por Patologia (%)
          </h2>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={successByPathology}
                layout='vertical'
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  horizontal={false}
                  stroke='#e2e8f0'
                />
                <XAxis type='number' stroke='#64748b' fontSize={12} unit='%' />
                <YAxis
                  type='category'
                  dataKey='name'
                  width={120}
                  stroke='#64748b'
                  fontSize={12}
                  interval={0}
                />
                <Tooltip formatter={value => `${value}%`} />
                <Bar dataKey='successRate' name='Taxa de Sucesso' barSize={15}>
                  {successByPathology.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalAnalyticsDashboard;
