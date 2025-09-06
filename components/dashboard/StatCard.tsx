// components/dashboard/StatCard.tsx
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'increase' | 'decrease';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  changeType,
  subtitle,
}) => {
  const isIncrease = changeType === 'increase';
  const changeColor = isIncrease ? 'text-green-600' : 'text-red-600';

  return (
    <div className='bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300'>
      <div className='flex items-center justify-between'>
        <div className={`bg-sky-100 text-sky-600 p-3 rounded-full`}>{icon}</div>
        {change && (
          <div
            className={`flex items-center text-sm font-semibold ${changeColor}`}
          >
            {isIncrease ? (
              <ArrowUp className='w-4 h-4' />
            ) : (
              <ArrowDown className='w-4 h-4' />
            )}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className='mt-4'>
        <p className='text-3xl font-bold text-slate-800'>{value}</p>
        <p className='text-sm font-medium text-slate-500 truncate'>{title}</p>
        {subtitle && <p className='text-xs text-slate-400 mt-1'>{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
