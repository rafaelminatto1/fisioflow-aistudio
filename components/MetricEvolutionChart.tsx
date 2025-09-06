// components/MetricEvolutionChart.tsx
import React, { useMemo } from 'react';
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
import { SoapNote, TrackedMetric } from '../types';
import InfoCard from './ui/InfoCard';
import { LineChart as LineChartIcon } from 'lucide-react';

interface MetricEvolutionChartProps {
  metric: TrackedMetric;
  notes: SoapNote[];
}

const MetricEvolutionChart: React.FC<MetricEvolutionChartProps> = ({
  metric,
  notes,
}) => {
  const chartData = useMemo(() => {
    return notes
      .filter(note => note.metricResults?.some(r => r.metricId === metric.id))
      .map(note => ({
        date: note.date,
        value: note.metricResults!.find(r => r.metricId === metric.id)!.value,
      }))
      .sort(
        (a, b) =>
          new Date(a.date.split('/').reverse().join('-')).getTime() -
          new Date(b.date.split('/').reverse().join('-')).getTime()
      );
  }, [metric.id, notes]);

  if (chartData.length < 2) {
    return (
      <InfoCard title={`Evolução: ${metric.name}`}>
        <p className='text-sm text-center text-slate-500 py-8'>
          Dados insuficientes para gerar o gráfico. É necessário registrar esta
          métrica em pelo menos duas sessões.
        </p>
      </InfoCard>
    );
  }

  return (
    <InfoCard title={`Evolução: ${metric.name}`}>
      <div className='h-64 -ml-4'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
            <XAxis
              dataKey='date'
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
              domain={['dataMin - 1', 'dataMax + 1']}
              unit={metric.unit ? ` ${metric.unit}` : ''}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
              formatter={(value: number) => [
                `${value} ${metric.unit || ''}`,
                metric.name,
              ]}
            />
            <Line
              type='monotone'
              dataKey='value'
              name={metric.name}
              stroke='#0ea5e9'
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </InfoCard>
  );
};

export default MetricEvolutionChart;
