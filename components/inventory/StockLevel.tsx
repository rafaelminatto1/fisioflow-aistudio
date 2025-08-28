// components/inventory/StockLevel.tsx
import React from 'react';

interface StockLevelProps {
  current: number;
  min: number;
  max: number;
  unit: string;
}

const StockLevel: React.FC<StockLevelProps> = ({ current, min, max, unit }) => {
  const percentage = max > 0 ? (current / max) * 100 : 0;

  let colorClass = 'bg-green-500';
  if (current <= min) {
    colorClass = 'bg-red-500';
  } else if (current <= min * 1.25) {
    // within 25% of min stock
    colorClass = 'bg-yellow-500';
  }

  return (
    <div>
      <div className='flex justify-between items-baseline mb-1'>
        <span className='text-lg font-bold text-slate-800'>
          {current}{' '}
          <span className='text-sm font-normal text-slate-500'>{unit}(s)</span>
        </span>
        <span className='text-xs text-slate-500'>Mín: {min}</span>
      </div>
      <div className='w-full bg-slate-200 rounded-full h-2.5'>
        <div
          className={`${colorClass} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StockLevel;
