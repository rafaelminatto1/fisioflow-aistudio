import React, { useMemo } from 'react';
import {
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

interface TeamProductivityChartProps {
  appointments: Appointment[];
  therapists: Therapist[];
}

// A simple map to convert color names to hex for the chart
const getColorHex = (colorName: string) => {
  switch (colorName) {
    case 'teal':
      return '0ea5e9'; // Mapped to new sky blue
    case 'sky':
      return '38bdf8';
    case 'indigo':
      return '6366f1';
    default:
      return '64748b'; // slate
  }
};

const TeamProductivityChart: React.FC<TeamProductivityChartProps> = ({
  appointments,
  therapists,
}) => {
  const productivityData = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const appointmentsThisMonth = appointments.filter(
      app =>
        app.status === AppointmentStatus.Completed &&
        app.startTime >= startOfMonth
    );

    const dataMap = new Map<
      string,
      { name: string; atendimentos: number; color: string }
    >();

    therapists.forEach(t => {
      dataMap.set(t.id, {
        name: t.name,
        atendimentos: 0,
        color: `#${getColorHex(t.color)}`,
      });
    });

    appointmentsThisMonth.forEach(app => {
      if (dataMap.has(app.therapistId)) {
        const current = dataMap.get(app.therapistId)!;
        current.atendimentos += 1;
      }
    });

    return Array.from(dataMap.values());
  }, [appointments, therapists]);

  return (
    <div className='h-64 mt-4'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={productivityData}
          layout='vertical'
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
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
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type='category'
            dataKey='name'
            stroke='#64748b'
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
            }}
          />
          <Bar dataKey='atendimentos' barSize={20}>
            {productivityData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TeamProductivityChart;
