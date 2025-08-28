import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Appointment, Therapist, AppointmentStatus } from '../../types';
import StatCard from '../dashboard/StatCard';
import { DollarSign, BarChart2, CheckCircle, Clock } from 'lucide-react';

interface FinancialReportProps {
  appointments: Appointment[];
  therapists: Therapist[];
}

const FinancialReport: React.FC<FinancialReportProps> = ({
  appointments,
  therapists,
}) => {
  const financialStats = useMemo(() => {
    const completedAppointments = appointments.filter(
      a => a.status === 'Realizado'
    );
    const totalRevenue = completedAppointments.reduce(
      (sum, a) => sum + a.value,
      0
    );
    const avgTicket =
      completedAppointments.length > 0
        ? totalRevenue / completedAppointments.length
        : 0;
    const accountsReceivable = appointments
      .filter(a => a.status !== 'Cancelado' && a.paymentStatus === 'pending')
      .reduce((sum, a) => sum + a.value, 0);

    return {
      totalRevenue,
      avgTicket,
      completedCount: completedAppointments.length,
      accountsReceivable,
    };
  }, [appointments]);

  const revenueByDay = useMemo(() => {
    const dataMap = new Map<string, number>();
    const today = new Date();
    const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));

    appointments
      .filter(a => a.status === 'Realizado' && a.startTime >= thirtyDaysAgo)
      .forEach(app => {
        const dateString = app.startTime.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        });
        dataMap.set(dateString, (dataMap.get(dateString) || 0) + app.value);
      });

    return Array.from(dataMap.entries())
      .map(([name, Faturamento]) => ({ name, Faturamento }))
      .sort(
        (a, b) =>
          new Date(a.name.split('/').reverse().join('-')).getTime() -
          new Date(b.name.split('/').reverse().join('-')).getTime()
      );
  }, [appointments]);

  const revenueByTherapist = useMemo(() => {
    const dataMap = new Map<
      string,
      { name: string; Faturamento: number; color: string }
    >();
    therapists.forEach(t =>
      dataMap.set(t.id, { name: t.name, Faturamento: 0, color: t.color })
    );

    appointments
      .filter(a => a.status === 'Realizado')
      .forEach(app => {
        if (dataMap.has(app.therapistId)) {
          const therapistData = dataMap.get(app.therapistId)!;
          therapistData.Faturamento += app.value;
        }
      });

    return Array.from(dataMap.values());
  }, [appointments, therapists]);

  const formatCurrency = (value: number) =>
    `R$ ${value.toFixed(2).replace('.', ',')}`;

  const statCards = [
    {
      title: 'Faturamento Total',
      value: formatCurrency(financialStats.totalRevenue),
      icon: <DollarSign />,
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(financialStats.avgTicket),
      icon: <BarChart2 />,
    },
    {
      title: 'Consultas Realizadas',
      value: financialStats.completedCount.toString(),
      icon: <CheckCircle />,
    },
    {
      title: 'Contas a Receber',
      value: formatCurrency(financialStats.accountsReceivable),
      icon: <Clock />,
    },
  ];

  return (
    <div className='space-y-6 animate-fade-in-fast'>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {statCards.map(stat => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
        <div className='lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm'>
          <h3 className='text-lg font-semibold text-slate-800 mb-4'>
            Faturamento (Últimos 30 dias)
          </h3>
          <div className='h-72'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart
                data={revenueByDay}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
                <XAxis dataKey='name' stroke='#64748b' fontSize={12} />
                <YAxis
                  stroke='#64748b'
                  fontSize={12}
                  tickFormatter={(val: number) => formatCurrency(val)}
                />
                <Tooltip
                  formatter={(val: number) => [
                    formatCurrency(val),
                    'Faturamento',
                  ]}
                />
                <Line
                  type='monotone'
                  dataKey='Faturamento'
                  stroke='#14b8a6'
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className='lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm'>
          <h3 className='text-lg font-semibold text-slate-800 mb-4'>
            Faturamento por Fisioterapeuta
          </h3>
          <div className='h-72'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={revenueByTherapist}
                layout='vertical'
                margin={{ left: 20 }}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  horizontal={false}
                  stroke='#e2e8f0'
                />
                <XAxis
                  type='number'
                  stroke='#64748b'
                  fontSize={12}
                  tickFormatter={(val: number) => `R$${val / 1000}k`}
                />
                <YAxis
                  type='category'
                  dataKey='name'
                  stroke='#64748b'
                  fontSize={12}
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                <Bar dataKey='Faturamento' barSize={20}>
                  {revenueByTherapist.map(entry => (
                    <Cell
                      key={entry.name}
                      fill={`#${{ teal: '14b8a6', sky: '38bdf8', indigo: '6366f1' }[entry.color] || '64748b'}`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className='bg-white p-6 rounded-2xl shadow-sm'>
        <h3 className='text-lg font-semibold text-slate-800 mb-4'>
          Últimas Transações
        </h3>
        <div className='overflow-x-auto'>
          <table className='min-w-full'>
            <thead className='bg-slate-50'>
              <tr>
                <th className='p-3 text-left text-xs font-medium text-slate-500 uppercase'>
                  Paciente
                </th>
                <th className='p-3 text-left text-xs font-medium text-slate-500 uppercase'>
                  Data
                </th>
                <th className='p-3 text-left text-xs font-medium text-slate-500 uppercase'>
                  Tipo
                </th>
                <th className='p-3 text-right text-xs font-medium text-slate-500 uppercase'>
                  Valor
                </th>
                <th className='p-3 text-center text-xs font-medium text-slate-500 uppercase'>
                  Status Pag.
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-200'>
              {appointments
                .filter(a => a.status === 'Realizado')
                .slice(0, 10)
                .map(app => (
                  <tr key={app.id}>
                    <td className='p-3 text-sm font-medium text-slate-800'>
                      {app.patientName}
                    </td>
                    <td className='p-3 text-sm text-slate-500'>
                      {app.startTime.toLocaleDateString('pt-BR')}
                    </td>
                    <td className='p-3 text-sm text-slate-500'>{app.type}</td>
                    <td className='p-3 text-sm text-slate-800 font-semibold text-right'>
                      {formatCurrency(app.value)}
                    </td>
                    <td className='p-3 text-center'>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${app.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                      >
                        {app.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`.animate-fade-in-fast { animation: fade-in-fast 0.5s ease-out forwards; } @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default FinancialReport;
