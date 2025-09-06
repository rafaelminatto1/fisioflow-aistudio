// components/MetricCard.tsx
import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value }) => {
  return (
    <div className='bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300'>
      <h3 className='text-sm font-medium text-slate-500 truncate'>{title}</h3>
      <p className='text-2xl font-bold text-slate-800 mt-1'>{value}</p>
    </div>
  );
};

export default MetricCard;
