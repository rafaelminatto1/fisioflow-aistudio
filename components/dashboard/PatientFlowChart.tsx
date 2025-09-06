// components/dashboard/PatientFlowChart.tsx
import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Patient } from '../../types';
import { TrendingUp } from 'lucide-react';

interface PatientFlowChartProps {
  patients: Patient[];
}

const PatientFlowChart: React.FC<PatientFlowChartProps> = ({ patients }) => {
  const patientFlowData = useMemo(() => {
    const monthMap = new Map<
      string,
      { name: string; 'Novos Pacientes': number; 'Pacientes de Alta': number }
    >();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    for (let i = 0; i < 6; i++) {
      const date = new Date(sixMonthsAgo);
      date.setMonth(date.getMonth() + i);
      const monthString = date.toLocaleDateString('pt-BR', { month: 'short' });
      monthMap.set(monthString, {
        name: monthString,
        'Novos Pacientes': 0,
        'Pacientes de Alta': 0,
      });
    }

    patients.forEach(p => {
      const regDate = new Date(p.registrationDate);
      if (regDate >= sixMonthsAgo) {
        const monthString = regDate.toLocaleDateString('pt-BR', {
          month: 'short',
        });
        if (monthMap.has(monthString)) {
          monthMap.get(monthString)!['Novos Pacientes']++;
        }
      }
      if (p.status === 'Discharged') {
        const lastVisitDate = new Date(p.lastVisit);
        if (lastVisitDate >= sixMonthsAgo) {
          const monthString = lastVisitDate.toLocaleDateString('pt-BR', {
            month: 'short',
          });
          if (monthMap.has(monthString)) {
            monthMap.get(monthString)!['Pacientes de Alta']++;
          }
        }
      }
    });

    return Array.from(monthMap.values());
  }, [patients]);

  return (
    <div className='bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 h-80'>
      <h3 className='text-lg font-semibold text-slate-800 mb-4 flex items-center'>
        <TrendingUp className='w-5 h-5 mr-2 text-sky-500' /> Fluxo de Pacientes
        (Últimos 6 meses)
      </h3>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={patientFlowData}
          margin={{ top: 5, right: 20, left: -10, bottom: -15 }}
        >
          <CartesianGrid
            strokeDasharray='3 3'
            vertical={false}
            stroke='#e2e8f0'
          />
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
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Bar dataKey='Novos Pacientes' fill='#0ea5e9' />
          <Bar dataKey='Pacientes de Alta' fill='#64748b' />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PatientFlowChart;
