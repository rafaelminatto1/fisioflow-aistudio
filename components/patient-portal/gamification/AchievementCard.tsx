// components/patient-portal/gamification/AchievementCard.tsx
import React from 'react';
import { Achievement } from '../../../types';
import { Lock, CheckCircle } from 'lucide-react';

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const { name, description, icon: Icon, unlocked } = achievement;

  return (
    <div
      className={`p-4 rounded-xl border-2 flex flex-col items-center text-center transition-all duration-300 ${unlocked ? 'border-teal-400 bg-teal-50 shadow-md' : 'border-slate-200 bg-slate-100'}`}
    >
      <div
        className={`relative w-20 h-20 rounded-full flex items-center justify-center mb-3 ${unlocked ? 'bg-teal-100 text-teal-500' : 'bg-slate-200 text-slate-400'}`}
      >
        <Icon className='w-10 h-10' />
        {!unlocked && (
          <div className='absolute inset-0 bg-slate-200/60 rounded-full flex items-center justify-center'>
            <Lock className='w-6 h-6 text-slate-500' />
          </div>
        )}
        {unlocked && (
          <div className='absolute -bottom-1 -right-1 bg-white rounded-full p-0.5'>
            <CheckCircle className='w-5 h-5 text-green-500 fill-white' />
          </div>
        )}
      </div>
      <h4
        className={`font-bold ${unlocked ? 'text-teal-800' : 'text-slate-600'}`}
      >
        {name}
      </h4>
      <p
        className={`text-xs mt-1 ${unlocked ? 'text-teal-700' : 'text-slate-500'}`}
      >
        {description}
      </p>
    </div>
  );
};

export default AchievementCard;
