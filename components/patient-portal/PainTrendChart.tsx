import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PainPoint } from '../../types';

interface PainTrendChartProps {
  painLogs: PainPoint[];
}

const PainTrendChart: React.FC<PainTrendChartProps> = ({ painLogs }) => {
  const chartData = painLogs
    .map(log => ({
      name: new Date(log.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      'Nível de Dor': log.intensity,
      notes: log.description,
    }))
    .sort(
      (a, b) =>
        new Date(a.name.split('/').reverse().join('-')).getTime() -
        new Date(b.name.split('/').reverse().join('-')).getTime()
    ); // Show oldest to newest

  return (
    <div className='h-64'>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
          <XAxis dataKey='name' stroke='#64748b' fontSize={12} />
          <YAxis domain={[0, 10]} stroke='#64748b' fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
            }}
            labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line
            type='monotone'
            dataKey='Nível de Dor'
            stroke='#ef4444'
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PainTrendChart;
