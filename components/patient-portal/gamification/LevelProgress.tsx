
// components/patient-portal/gamification/LevelProgress.tsx
import React from 'react';
import { Award } from 'lucide-react';

interface LevelProgressProps {
    level: number;
    currentXp: number;
    xpForNextLevel: number;
}

const LevelProgress: React.FC<LevelProgressProps> = ({ level, currentXp, xpForNextLevel }) => {
    const progressPercentage = Math.min(100, (currentXp / xpForNextLevel) * 100);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center">
            <div className="bg-teal-100 text-teal-600 p-4 rounded-full mr-4">
                <Award className="w-8 h-8" />
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-lg font-bold text-slate-800">Nível {level}</h3>
                    <p className="text-sm font-medium text-slate-500">{currentXp} / {xpForNextLevel} XP</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4">
                    <div
                        className="bg-teal-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
                 <p className="text-xs text-slate-500 text-right mt-1">
                    Faltam {xpForNextLevel - currentXp} XP para o próximo nível.
                </p>
            </div>
        </div>
    );
};

export default LevelProgress;