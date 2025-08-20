// components/patient-portal/PatientMetricChart.tsx
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SoapNote, TrackedMetric } from '../../types';
import InfoCard from '../../components/ui/InfoCard';
import { LineChart as LineChartIcon } from 'lucide-react';

interface PatientMetricChartProps {
    metric: TrackedMetric;
    notes: SoapNote[];
}

const PatientMetricChart: React.FC<PatientMetricChartProps> = ({ metric, notes }) => {
    const chartData = useMemo(() => {
        return notes
            .filter(note => note.metricResults?.some(r => r.metricId === metric.id))
            .map(note => ({
                date: note.date,
                value: note.metricResults!.find(r => r.metricId === metric.id)!.value,
            }))
            .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());
    }, [metric.id, notes]);

    if (chartData.length < 2) {
        return null; // Don't render if not enough data
    }

    return (
        <InfoCard title={`Sua Evolução: ${metric.name}`} icon={<LineChartIcon />}>
            <div className="h-64 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} unit={metric.unit ? ` ${metric.unit}` : ''} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                            labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                            formatter={(value: number) => [`${value} ${metric.unit || ''}`, metric.name]}
                        />
                        <Line type="monotone" dataKey="value" name="Seu Resultado" stroke="#14b8a6" strokeWidth={2} dot={{ r: 4, fill: '#14b8a6' }} activeDot={{ r: 8, stroke: '#14b8a6', fill: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </InfoCard>
    );
};

export default PatientMetricChart;
