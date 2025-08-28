import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Appointment, AppointmentStatus } from '../../types';
import { Activity } from 'lucide-react';

interface RevenueChartProps {
  appointments: Appointment[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ appointments }) => {
  const revenueData = useMemo(() => {
    const dataMap = new Map<string, number>();
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const completedAppointments = appointments.filter(
      app =>
        app.status === AppointmentStatus.Completed &&
        app.startTime >= thirtyDaysAgo
    );

    for (let i = 0; i <= 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
      dataMap.set(dateString, 0);
    }

    completedAppointments.forEach(app => {
      const dateString = app.startTime.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
      const currentRevenue = dataMap.get(dateString) || 0;
      dataMap.set(dateString, currentRevenue + app.value);
    });

    return Array.from(dataMap.entries())
      .map(([name, revenue]) => ({ name, Faturamento: revenue }))
      .reverse();
  }, [appointments]);

  return (
    <div className='bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 h-80'>
      <h3 className='text-lg font-semibold text-slate-800 mb-4 flex items-center'>
        <Activity className='w-5 h-5 mr-2 text-sky-500' /> Faturamento dos
        Últimos 30 Dias
      </h3>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart
          data={revenueData}
          margin={{ top: 5, right: 20, left: -10, bottom: -15 }}
        >
          <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
          <XAxis
            dataKey='name'
            stroke='#64748b'
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke='#64748b'
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `R$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
            }}
            labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
            formatter={(value: number) => [
              `R$${value.toFixed(2)}`,
              'Faturamento',
            ]}
          />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Line
            type='monotone'
            dataKey='Faturamento'
            stroke='#0ea5e9'
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
