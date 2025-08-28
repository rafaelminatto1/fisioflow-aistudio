// components/MetricTrackerCard.tsx
import React, { useState } from 'react';
import { TrackedMetric } from '../types';
import { BarChart, Plus, Trash2, Power, PowerOff } from 'lucide-react';
import InfoCard from './ui/InfoCard';

interface MetricTrackerCardProps {
  metrics: TrackedMetric[];
  onUpdateMetrics: (newMetrics: TrackedMetric[]) => void;
}

const MetricTrackerCard: React.FC<MetricTrackerCardProps> = ({
  metrics,
  onUpdateMetrics,
}) => {
  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricUnit, setNewMetricUnit] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddMetric = () => {
    if (!newMetricName.trim()) return;
    const newMetric: TrackedMetric = {
      id: `metric_${Date.now()}`,
      name: newMetricName,
      unit: newMetricUnit,
      isActive: true,
    };
    onUpdateMetrics([...metrics, newMetric]);
    setNewMetricName('');
    setNewMetricUnit('');
    setIsAdding(false);
  };

  const handleToggleMetric = (metricId: string) => {
    const updatedMetrics = metrics.map(m =>
      m.id === metricId ? { ...m, isActive: !m.isActive } : m
    );
    onUpdateMetrics(updatedMetrics);
  };

  return (
    <InfoCard title='Métricas de Acompanhamento'>
      <div className='space-y-3'>
        {metrics.length > 0 ? (
          metrics.map(metric => (
            <div
              key={metric.id}
              className={`flex items-center justify-between p-2 rounded-lg ${metric.isActive ? 'bg-slate-50' : 'bg-slate-100 opacity-60'}`}
            >
              <div>
                <p className='font-semibold text-slate-800 text-sm'>
                  {metric.name}
                </p>
                <p className='text-xs text-slate-500'>
                  Unidade: {metric.unit || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => handleToggleMetric(metric.id)}
                title={metric.isActive ? 'Desativar' : 'Reativar'}
                className={`p-2 rounded-full ${metric.isActive ? 'text-slate-500 hover:bg-red-100 hover:text-red-600' : 'text-slate-500 hover:bg-green-100 hover:text-green-600'}`}
              >
                {metric.isActive ? <PowerOff size={16} /> : <Power size={16} />}
              </button>
            </div>
          ))
        ) : (
          <p className='text-sm text-slate-500 text-center py-4'>
            Nenhuma métrica definida.
          </p>
        )}

        {isAdding ? (
          <div className='p-2 border-t mt-4 pt-4 space-y-2'>
            <input
              type='text'
              value={newMetricName}
              onChange={e => setNewMetricName(e.target.value)}
              placeholder='Nome da métrica (Ex: ADM de Flexão)'
              className='w-full p-2 border border-slate-300 rounded-lg text-sm'
            />
            <input
              type='text'
              value={newMetricUnit}
              onChange={e => setNewMetricUnit(e.target.value)}
              placeholder='Unidade (Ex: graus, cm)'
              className='w-full p-2 border border-slate-300 rounded-lg text-sm'
            />
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setIsAdding(false)}
                className='px-3 py-1 text-sm bg-slate-100 rounded-md hover:bg-slate-200'
              >
                Cancelar
              </button>
              <button
                onClick={handleAddMetric}
                className='px-3 py-1 text-sm bg-sky-500 text-white rounded-md hover:bg-sky-600'
              >
                Salvar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className='w-full mt-2 flex items-center justify-center p-2 text-sm text-sky-600 font-semibold bg-sky-50 rounded-lg hover:bg-sky-100'
          >
            <Plus size={16} className='mr-2' /> Adicionar Métrica
          </button>
        )}
      </div>
    </InfoCard>
  );
};

export default MetricTrackerCard;
