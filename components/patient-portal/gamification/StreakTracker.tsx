// components/patient-portal/gamification/StreakTracker.tsx
import React from 'react';
import { Flame } from 'lucide-react';

interface StreakTrackerProps {
  streak: number;
}

const StreakTracker: React.FC<StreakTrackerProps> = ({ streak }) => {
  return (
    <div className='bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center'>
      <h3 className='text-lg font-semibold text-slate-800'>
        Sequência de Atividades
      </h3>
      <div className='my-2 flex items-center text-amber-500'>
        <Flame className='w-12 h-12' strokeWidth={1.5} />
        <span className='text-6xl font-bold ml-2'>{streak}</span>
      </div>
      <p className='text-sm text-slate-500'>
        {streak > 0
          ? `Dias consecutivos de atividades! Continue assim!`
          : 'Faça uma atividade hoje para começar!'}
      </p>
    </div>
  );
};

export default StreakTracker;
